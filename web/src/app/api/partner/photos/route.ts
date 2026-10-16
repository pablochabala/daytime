import { NextResponse } from "next/server";
import { store } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";
import { MAX_PHOTOS, MIN_PHOTOS, deletePhoto, savePhotos } from "@/lib/server/listings";

/** Add photos to the signed-in partner's listing. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const current = await store.listingByOwner(u.id);
  if (!current) return NextResponse.json({ error: "No listing found" }, { status: 404 });
  const form = await req.formData();
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (current.photos.length + files.length > MAX_PHOTOS) return NextResponse.json({ error: `You can have up to ${MAX_PHOTOS} photos` }, { status: 400 });
  const saved = await savePhotos(files);
  const listing = saved.ids.length ? await store.updateListing(current.id, { photos: [...current.photos, ...saved.ids], updatedAt: new Date().toISOString() }) : current;
  return NextResponse.json({ listing, errors: saved.errors });
}

/** Reorder (first = cover) or remove photos. Body: { photos: string[] }, a subset of the current ones. */
export async function PUT(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { photos } = (await req.json().catch(() => ({}))) as { photos?: string[] };
  const current = await store.listingByOwner(u.id);
  if (!current || !Array.isArray(photos)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const next = photos.filter((p, i) => current.photos.includes(p) && photos.indexOf(p) === i);
  if (next.length < MIN_PHOTOS) return NextResponse.json({ error: `Keep at least ${MIN_PHOTOS} photos` }, { status: 400 });
  const removed = current.photos.filter((p) => !next.includes(p));
  const listing = await store.updateListing(current.id, { photos: next, updatedAt: new Date().toISOString() });
  await Promise.all(removed.map(deletePhoto));
  return NextResponse.json({ listing });
}
