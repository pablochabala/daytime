import { NextResponse } from "next/server";
import { read, write } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";
import { parseListing } from "@/lib/server/listings";

export const dynamic = "force-dynamic";

/** The signed-in partner's own listing. Nobody else's is ever returned. */
export async function GET() {
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return NextResponse.json({ listing: read().listings.find((l) => l.ownerId === u.id) ?? null });
}

/** Partners can edit details and rates. Status is admin-only and ignored here. */
export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const u = await requireRole("partner");
  if (!u) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { value, errors } = parseListing(body);
  if (!value) return NextResponse.json({ errors }, { status: 400 });
  const listing = write((db) => {
    const l = db.listings.find((x) => x.ownerId === u.id);
    if (!l) return null;
    Object.assign(l, value, { updatedAt: new Date().toISOString() });
    return l;
  });
  if (!listing) return NextResponse.json({ error: "No listing found" }, { status: 404 });
  return NextResponse.json({ listing });
}
