import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { read, type Role, type UserRecord } from "./db";

const COOKIE = "dt_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ---------------- Passwords (scrypt, built into Node) ---------------- */
export function hashPassword(pw: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return "Use at least 10 characters";
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return "Use letters and at least one number";
  return null;
}

/* ---------------- Sessions: signed, httpOnly cookie ---------------- */
function secret() {
  return process.env.SESSION_SECRET || read().secret;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startSession(u: UserRecord) {
  const payload = Buffer.from(JSON.stringify({ uid: u.id, v: u.sessionVersion, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Current signed-in user, or null. Blocked users and revoked sessions return null. */
export async function currentUser(): Promise<UserRecord | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { uid, v, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; v: number; exp: number };
    if (Date.now() > exp) return null;
    const u = read().users.find((x) => x.id === uid);
    if (!u || u.blocked || u.sessionVersion !== v) return null;
    return u;
  } catch {
    return null;
  }
}

export async function requireRole(role: Role): Promise<UserRecord | null> {
  const u = await currentUser();
  return u && u.role === role ? u : null;
}

/* ---------------- Request guards ---------------- */

/** Reject cross-site form posts (defence in depth on top of SameSite cookies). */
export async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return true; // same-origin fetch from older browsers
  const host = h.get("x-forwarded-host") ?? h.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Simple in-memory login throttle: 8 attempts per 15 minutes per email+IP. */
const attempts = new Map<string, { n: number; until: number }>();
export async function throttle(key: string): Promise<boolean> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  const k = `${key}|${ip}`;
  const now = Date.now();
  const a = attempts.get(k);
  if (!a || now > a.until) {
    attempts.set(k, { n: 1, until: now + 15 * 60 * 1000 });
    return true;
  }
  a.n += 1;
  return a.n <= 8;
}
export async function clearThrottle(key: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  attempts.delete(`${key}|${ip}`);
}
