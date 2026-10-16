import { NextResponse } from "next/server";
import { ConflictError, newId, store } from "@/lib/server/db";
import { hashPassword, passwordProblem, sameOrigin, startSession } from "@/lib/server/auth";

/** One-time creation of the master control account. Locked once an admin exists (also enforced by the database). */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (store.kind === "none") return NextResponse.json({ error: "Connect Supabase first: add SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SESSION_SECRET in your hosting settings, then redeploy." }, { status: 503 });
  if (await store.hasAdmin()) return NextResponse.json({ error: "The master account already exists. Sign in instead." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const name = String(body.name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter an email like name@example.com";
  const pw = password.length < 12 ? "Use at least 12 characters for the master account" : passwordProblem(password);
  if (pw) errors.password = pw;
  if (!errors.email && (await store.findUserByEmail(email))) errors.email = "That email is already used by a partner account";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const now = new Date().toISOString();
  const admin = { id: newId("adm"), role: "admin" as const, email, name, phone: "", passwordHash: hashPassword(password), blocked: false, sessionVersion: 1, createdAt: now, lastLoginAt: now };
  try {
    await store.createAdmin(admin);
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: "The master account already exists." }, { status: 403 });
    throw e;
  }
  await startSession(admin);
  return NextResponse.json({ ok: true, redirect: "/admin" });
}
