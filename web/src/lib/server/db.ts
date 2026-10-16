import "server-only";
import crypto from "node:crypto";
import type { UserRecord } from "./store";

export { store, ConflictError, StoreNotConfiguredError, type Role, type UserRecord } from "./store";

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

/** Strip secrets before sending a user to the browser. */
export function publicUser(u: UserRecord) {
  return { id: u.id, role: u.role, email: u.email, name: u.name, phone: u.phone, blocked: u.blocked, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt };
}
export type PublicUser = ReturnType<typeof publicUser>;
