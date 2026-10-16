import { NextResponse } from "next/server";
import { publicUser, store } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";

/** Block / unblock a partner account. Blocking signs them out everywhere and hides their listing. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const { blocked } = (await req.json().catch(() => ({}))) as { blocked?: boolean };
  if (typeof blocked !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const u = await store.findUserById(id);
  if (!u || u.role !== "partner") return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const user = await store.updateUser(id, {
    blocked,
    blockedAt: blocked ? new Date().toISOString() : undefined,
    // Revoke existing sessions when blocking.
    sessionVersion: blocked ? u.sessionVersion + 1 : u.sessionVersion,
  });
  return NextResponse.json({ user: user && publicUser(user) });
}
