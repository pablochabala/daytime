import "server-only";
import type { ListingStatus, PartnerListing } from "@/lib/types";
import { ConflictError, type Store, type UserRecord } from "./types";

/**
 * Supabase store: Postgres via the REST API (PostgREST) and Supabase Storage.
 * Uses the service-role key, which must only ever exist on the server.
 * Tables have Row Level Security on with no policies, so the public anon key can't read them.
 */

const URL_ = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const BUCKET = process.env.SUPABASE_PHOTO_BUCKET ?? "listing-photos";

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: init.prefer ?? "return=representation",
      ...init.headers,
    },
  });
  if (res.status === 409) throw new ConflictError(await res.text());
  if (!res.ok) throw new Error(`Supabase ${init.method ?? "GET"} ${path.split("?")[0]} failed: ${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const eq = (v: string) => `eq.${encodeURIComponent(v)}`;

/* ---------- row mapping (snake_case in Postgres, camelCase in the app) ---------- */
interface AccountRow {
  id: string;
  role: "admin" | "partner";
  email: string;
  name: string;
  phone: string;
  password_hash: string;
  blocked: boolean;
  blocked_at: string | null;
  session_version: number;
  created_at: string;
  last_login_at: string | null;
}
const toUser = (r: AccountRow): UserRecord => ({
  id: r.id,
  role: r.role,
  email: r.email,
  name: r.name,
  phone: r.phone,
  passwordHash: r.password_hash,
  blocked: r.blocked,
  blockedAt: r.blocked_at ?? undefined,
  sessionVersion: r.session_version,
  createdAt: r.created_at,
  lastLoginAt: r.last_login_at ?? undefined,
});
const fromUser = (u: Partial<UserRecord>) => {
  const r: Partial<AccountRow> = {};
  if (u.id !== undefined) r.id = u.id;
  if (u.role !== undefined) r.role = u.role;
  if (u.email !== undefined) r.email = u.email;
  if (u.name !== undefined) r.name = u.name;
  if (u.phone !== undefined) r.phone = u.phone;
  if (u.passwordHash !== undefined) r.password_hash = u.passwordHash;
  if (u.blocked !== undefined) r.blocked = u.blocked;
  if ("blockedAt" in u) r.blocked_at = u.blockedAt ?? null;
  if (u.sessionVersion !== undefined) r.session_version = u.sessionVersion;
  if (u.createdAt !== undefined) r.created_at = u.createdAt;
  if ("lastLoginAt" in u) r.last_login_at = u.lastLoginAt ?? null;
  return r;
};

interface ListingRow {
  id: string;
  owner_id: string;
  slug: string;
  property_name: string;
  type: PartnerListing["type"];
  city: string;
  address: string | null;
  summary: string | null;
  units: number;
  overnight_rate: number;
  day_pass_rate: number;
  hourly_rate: number;
  window_open: string;
  window_close: string;
  min_hours: number;
  amenities: PartnerListing["amenities"];
  photos: string[];
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}
const toListing = (r: ListingRow): PartnerListing => ({
  id: r.id,
  ownerId: r.owner_id,
  slug: r.slug,
  propertyName: r.property_name,
  type: r.type,
  city: r.city,
  address: r.address ?? undefined,
  summary: r.summary ?? undefined,
  units: r.units,
  overnightRate: r.overnight_rate,
  dayPassRate: r.day_pass_rate,
  hourlyRate: r.hourly_rate,
  window: { open: r.window_open, close: r.window_close },
  minHours: r.min_hours,
  amenities: r.amenities ?? [],
  photos: r.photos ?? [],
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const fromListing = (l: Partial<PartnerListing>) => {
  const r: Partial<ListingRow> = {};
  if (l.id !== undefined) r.id = l.id;
  if (l.ownerId !== undefined) r.owner_id = l.ownerId;
  if (l.slug !== undefined) r.slug = l.slug;
  if (l.propertyName !== undefined) r.property_name = l.propertyName;
  if (l.type !== undefined) r.type = l.type;
  if (l.city !== undefined) r.city = l.city;
  if ("address" in l) r.address = l.address ?? null;
  if ("summary" in l) r.summary = l.summary ?? null;
  if (l.units !== undefined) r.units = l.units;
  if (l.overnightRate !== undefined) r.overnight_rate = l.overnightRate;
  if (l.dayPassRate !== undefined) r.day_pass_rate = l.dayPassRate;
  if (l.hourlyRate !== undefined) r.hourly_rate = l.hourlyRate;
  if (l.window !== undefined) {
    r.window_open = l.window.open;
    r.window_close = l.window.close;
  }
  if (l.minHours !== undefined) r.min_hours = l.minHours;
  if (l.amenities !== undefined) r.amenities = l.amenities;
  if (l.photos !== undefined) r.photos = l.photos;
  if (l.status !== undefined) r.status = l.status;
  if (l.createdAt !== undefined) r.created_at = l.createdAt;
  if (l.updatedAt !== undefined) r.updated_at = l.updatedAt;
  return r;
};

export const supabaseStore: Store = {
  kind: "supabase",
  async hasAdmin() {
    const rows = await rest<{ id: string }[]>("accounts?role=eq.admin&select=id&limit=1");
    return rows.length > 0;
  },
  async findUserByEmail(email) {
    const rows = await rest<AccountRow[]>(`accounts?email=${eq(email)}&select=*&limit=1`);
    return rows[0] ? toUser(rows[0]) : null;
  },
  async findUserById(id) {
    const rows = await rest<AccountRow[]>(`accounts?id=${eq(id)}&select=*&limit=1`);
    return rows[0] ? toUser(rows[0]) : null;
  },
  async listPartners() {
    const rows = await rest<AccountRow[]>("accounts?role=eq.partner&select=*&order=created_at.desc");
    return rows.map(toUser);
  },
  async createAdmin(u) {
    // The one_admin unique index in the schema guarantees a single master account.
    await rest("accounts", { method: "POST", body: JSON.stringify(fromUser(u)), prefer: "return=minimal" });
  },
  async updateUser(id, patch) {
    const rows = await rest<AccountRow[]>(`accounts?id=${eq(id)}`, { method: "PATCH", body: JSON.stringify(fromUser(patch)) });
    return rows[0] ? toUser(rows[0]) : null;
  },
  async createPartner(u, l) {
    await rest("accounts", { method: "POST", body: JSON.stringify(fromUser(u)), prefer: "return=minimal" });
    try {
      await rest("listings", { method: "POST", body: JSON.stringify(fromListing(l)), prefer: "return=minimal" });
    } catch (e) {
      await rest(`accounts?id=${eq(u.id)}`, { method: "DELETE", prefer: "return=minimal" }).catch(() => {});
      throw e;
    }
  },
  async listingByOwner(ownerId) {
    const rows = await rest<ListingRow[]>(`listings?owner_id=${eq(ownerId)}&select=*&limit=1`);
    return rows[0] ? toListing(rows[0]) : null;
  },
  async listingById(id) {
    const rows = await rest<ListingRow[]>(`listings?id=${eq(id)}&select=*&limit=1`);
    return rows[0] ? toListing(rows[0]) : null;
  },
  async listListings() {
    const rows = await rest<ListingRow[]>("listings?select=*&order=created_at.desc");
    return rows.map(toListing);
  },
  async slugTaken(slug) {
    const rows = await rest<{ id: string }[]>(`listings?slug=${eq(slug)}&select=id&limit=1`);
    return rows.length > 0;
  },
  async updateListing(id, patch) {
    const rows = await rest<ListingRow[]>(`listings?id=${eq(id)}`, { method: "PATCH", body: JSON.stringify(fromListing(patch)) });
    return rows[0] ? toListing(rows[0]) : null;
  },
  async seedStatuses() {
    const rows = await rest<{ property_id: string; status: ListingStatus }[]>("seed_statuses?select=property_id,status");
    return Object.fromEntries(rows.map((r) => [r.property_id, r.status]));
  },
  async setSeedStatus(propertyId, status) {
    await rest("seed_statuses?on_conflict=property_id", {
      method: "POST",
      body: JSON.stringify({ property_id: propertyId, status, updated_at: new Date().toISOString() }),
      prefer: "resolution=merge-duplicates,return=minimal",
    });
  },
  async putPhoto(id, bytes, contentType) {
    const res = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${id}`, {
      method: "POST",
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": contentType, "Cache-Control": "31536000", "x-upsert": "false" },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) throw new Error(`Photo upload failed: ${res.status} ${await res.text()}`);
  },
  async getPhoto(id) {
    return { url: `${URL_}/storage/v1/object/public/${BUCKET}/${id}` };
  },
  async deletePhoto(id) {
    await fetch(`${URL_}/storage/v1/object/${BUCKET}/${id}`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).catch(() => {});
  },
  async fallbackSecret() {
    return null;
  },
};
