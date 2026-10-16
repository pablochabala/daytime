import { NextResponse } from "next/server";
import { store } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";
import { parseListing } from "@/lib/server/listings";

export const dynamic = "force-dynamic";

/** The signed-in partner's own listing. Nobody else's is ever returned. */
export async function GET() {
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json({ listing: await store.listingByOwner(u.id) });
}

/** Partners can edit details and rates. Status is admin-only and ignored here. */
export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { value, errors } = parseListing(body);
  if (!value) return NextResponse.json({ errors }, { status: 400 });
  const current = await store.listingByOwner(u.id);
  if (!current) return NextResponse.json({ error: "No listing found" }, { status: 404 });
  const listing = await store.updateListing(current.id, { ...value, updatedAt: new Date().toISOString() });
  return NextResponse.json({ listing });
}
