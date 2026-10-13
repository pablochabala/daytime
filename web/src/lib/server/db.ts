import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ListingStatus, PartnerListing } from "@/lib/types";

/**
 * Minimal server-side store: one JSON file in web/.data (git-ignored).
 * Good for development and a single small server. Swap for a real database
 * (Postgres, Supabase…) before production; every read/write goes through this module.
 */

export type Role = "admin" | "partner";

export interface UserRecord {
  id: string;
  role: Role;
  email: string;
  name: string;
  phone: string;
  passwordHash: string; // scrypt, "salt:hash" hex
  blocked: boolean;
  blockedAt?: string;
  /** Bumped on block / password change so old sessions stop working. */
  sessionVersion: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface DB {
  users: UserRecord[];
  listings: PartnerListing[];
  /** Admin-set statuses for the built-in catalogue (seed properties). */
  seedStatuses: Record<string, ListingStatus>;
  secret: string;
}

export const DATA_DIR = path.join(process.cwd(), ".data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

function ensure() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const fresh: DB = { users: [], listings: [], seedStatuses: {}, secret: crypto.randomBytes(32).toString("hex") };
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
  }
}

export function read(): DB {
  ensure();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
}

/** Read-modify-write with an atomic rename so a crash can't leave a half-written file. */
export function write<T>(fn: (db: DB) => T): T {
  const db = read();
  const out = fn(db);
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
  return out;
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

/** Strip secrets before sending a user to the browser. */
export function publicUser(u: UserRecord) {
  return { id: u.id, role: u.role, email: u.email, name: u.name, phone: u.phone, blocked: u.blocked, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt };
}
export type PublicUser = ReturnType<typeof publicUser>;
