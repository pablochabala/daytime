import { NextResponse } from "next/server";
import { newId, read, write } from "@/lib/server/db";
import { hashPassword, passwordProblem, sameOrigin, startSession } from "@/lib/server/auth";

/** One-time creation of the master control account. Locked once an admin exists. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  if (read().users.some((u) => u.role === "admin")) return NextResponse.json({ error: "The master account already exists. Sign in instead." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string };
  const name = String(body.name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter an email like name@example.com";
  const pw = password.length < 12 ? "Use at least 12 characters for the master account" : passwordProblem(password);
  if (pw) errors.password = pw;
  if (read().users.some((u) => u.email === email)) errors.email = "That email is already used by a partner account";
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const now = new Date().toISOString();
  const admin = write((db) => {
    // Re-check inside the write in case two requests race.
    if (db.users.some((u) => u.role === "admin")) return null;
    const u = { id: newId("adm"), role: "admin" as const, email, name, phone: "", passwordHash: hashPassword(password), blocked: false, sessionVersion: 1, createdAt: now, lastLoginAt: now };
    db.users.push(u);
    return u;
  });
  if (!admin) return NextResponse.json({ error: "The master account already exists." }, { status: 403 });
  await startSession(admin);
  return NextResponse.json({ ok: true, redirect: "/admin" });
}
