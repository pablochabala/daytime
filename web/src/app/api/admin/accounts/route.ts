import { NextResponse } from "next/server";
import { publicUser, store } from "@/lib/server/db";
import { requireRole } from "@/lib/server/auth";
import { SEED } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Everything the master control dashboard needs. Admin only. */
export async function GET() {
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const [users, listings, statuses] = await Promise.all([store.listPartners(), store.listListings(), store.seedStatuses()]);
  const partners = users
    .map((u) => ({ user: publicUser(u), listing: listings.find((l) => l.ownerId === u.id) ?? null }))
    .sort((a, b) => b.user.createdAt.localeCompare(a.user.createdAt));
  const catalogue = SEED.map((p) => ({ id: p.id, slug: p.slug, name: p.name, type: p.type, city: p.city, status: statuses[p.id] ?? "available" }));
  return NextResponse.json({ partners, catalogue }, { headers: { "Cache-Control": "no-store" } });
}
