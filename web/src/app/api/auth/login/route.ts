import { NextResponse } from "next/server";
import { read, write } from "@/lib/server/db";
import { clearThrottle, sameOrigin, startSession, throttle, verifyPassword } from "@/lib/server/auth";

export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) return NextResponse.json({ error: "Enter your email and password" }, { status: 400 });
  if (!(await throttle(email))) return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });

  const u = read().users.find((x) => x.email === email);
  // Same message whether the email or the password is wrong.
  if (!u || !verifyPassword(password, u.passwordHash)) return NextResponse.json({ error: "That email and password don't match" }, { status: 401 });
  if (u.blocked) return NextResponse.json({ error: "This account has been blocked. Contact Daytime support if you think this is a mistake." }, { status: 403 });

  await clearThrottle(email);
  write((db) => {
    const x = db.users.find((y) => y.id === u.id);
    if (x) x.lastLoginAt = new Date().toISOString();
  });
  await startSession(u);
  return NextResponse.json({ role: u.role, redirect: u.role === "admin" ? "/admin" : "/partner/dashboard" });
}
