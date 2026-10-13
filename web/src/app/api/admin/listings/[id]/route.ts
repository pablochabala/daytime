import { NextResponse } from "next/server";
import { write } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";
import { SEED } from "@/lib/catalog";
import type { ListingStatus } from "@/lib/types";

const STATUSES: ListingStatus[] = ["available", "unavailable", "coming-soon"];

/** Set the label shown on a profile: available / unavailable / coming soon. Works for partner and built-in listings. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: ListingStatus };
  if (!status || !STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const ok = write((db) => {
    const l = db.listings.find((x) => x.id === id);
    if (l) {
      l.status = status;
      l.updatedAt = new Date().toISOString();
      return true;
    }
    if (SEED.some((p) => p.id === id)) {
      db.seedStatuses[id] = status;
      return true;
    }
    return false;
  });
  if (!ok) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  return NextResponse.json({ id, status });
}
