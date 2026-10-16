import type { ListingStatus, PartnerListing } from "@/lib/types";

export type Role = "admin" | "partner";

export interface UserRecord {
  id: string;
  role: Role;
  email: string;
  name: string;
  phone: string;
  /** scrypt, "salt:hash" hex */
  passwordHash: string;
  blocked: boolean;
  blockedAt?: string;
  /** Bumped on block / password change so old sessions stop working. */
  sessionVersion: number;
  createdAt: string;
  lastLoginAt?: string;
}

/** Thrown when a unique rule is broken (duplicate email, second master account, slug clash). */
export class ConflictError extends Error {}

/** Thrown when saving is attempted on a host with no database connected (e.g. Vercel before Supabase is set up). */
export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Partner accounts aren't switched on yet: the site's database hasn't been connected. Please try again later.");
  }
}

/**
 * Everything the server needs from storage. Two implementations:
 * - file: web/.data (local development, no setup)
 * - supabase: Postgres tables + Storage bucket (see web/supabase/schema.sql)
 */
export interface Store {
  kind: "file" | "supabase" | "none";

  hasAdmin(): Promise<boolean>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserById(id: string): Promise<UserRecord | null>;
  listPartners(): Promise<UserRecord[]>;
  /** Creates an admin. Throws ConflictError if one already exists or the email is taken. */
  createAdmin(u: UserRecord): Promise<void>;
  updateUser(id: string, patch: Partial<UserRecord>): Promise<UserRecord | null>;

  /** Creates a partner account and their listing together (rolls back the account if the listing fails). */
  createPartner(u: UserRecord, l: PartnerListing): Promise<void>;
  listingByOwner(ownerId: string): Promise<PartnerListing | null>;
  listingById(id: string): Promise<PartnerListing | null>;
  listListings(): Promise<PartnerListing[]>;
  slugTaken(slug: string): Promise<boolean>;
  updateListing(id: string, patch: Partial<PartnerListing>): Promise<PartnerListing | null>;

  seedStatuses(): Promise<Record<string, ListingStatus>>;
  setSeedStatus(propertyId: string, status: ListingStatus): Promise<void>;

  putPhoto(id: string, bytes: Buffer, contentType: string): Promise<void>;
  /** Bytes for the file store; a public URL for Supabase Storage. */
  getPhoto(id: string): Promise<{ bytes: Buffer } | { url: string } | null>;
  deletePhoto(id: string): Promise<void>;

  /** Signing secret used when SESSION_SECRET isn't set (file store only). */
  fallbackSecret(): Promise<string | null>;
}
