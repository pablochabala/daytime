import { NextResponse } from "next/server";
import { publicUser, write } from "@/lib/server/db";
import { requireRole, sameOrigin } from "@/lib/server/auth";

/** Block / unblock a partner account. Blocking signs them out everywhere and hides their listing. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (!(await requireRole("admin"))) return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const { id } = await params;
  const { blocked } = (await req.json().catch(() => ({}))) as { blocked?: boolean };
  if (typeof blocked !== "boolean") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const user = write((db) => {
    const u = db.users.find((x) => x.id === id && x.role === "partner");
    if (!u) return null;
    u.blocked = blocked;
    u.blockedAt = blocked ? new Date().toISOString() : undefined;
    if (blocked) u.sessionVersion += 1; // revoke existing sessions
    return u;
  });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return NextResponse.json({ user: publicUser(user) });
}
