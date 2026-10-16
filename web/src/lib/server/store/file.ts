import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { ListingStatus, PartnerListing } from "@/lib/types";
import { ConflictError, type Store, type UserRecord } from "./types";

/** Local JSON-file store in web/.data. For development only. */

interface DB {
  users: UserRecord[];
  listings: PartnerListing[];
  seedStatuses: Record<string, ListingStatus>;
  secret: string;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");

function read(): DB {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const fresh: DB = { users: [], listings: [], seedStatuses: {}, secret: crypto.randomBytes(32).toString("hex") };
    fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
}

function write<T>(fn: (db: DB) => T): T {
  const db = read();
  const out = fn(db);
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
  return out;
}

export const fileStore: Store = {
  kind: "file",
  async hasAdmin() {
    return read().users.some((u) => u.role === "admin");
  },
  async findUserByEmail(email) {
    return read().users.find((u) => u.email === email) ?? null;
  },
  async findUserById(id) {
    return read().users.find((u) => u.id === id) ?? null;
  },
  async listPartners() {
    return read().users.filter((u) => u.role === "partner");
  },
  async createAdmin(u) {
    write((db) => {
      if (db.users.some((x) => x.role === "admin")) throw new ConflictError("The master account already exists.");
      if (db.users.some((x) => x.email === u.email)) throw new ConflictError("That email is already used by another account");
      db.users.push(u);
    });
  },
  async updateUser(id, patch) {
    return write((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) return null;
      Object.assign(u, patch);
      return u;
    });
  },
  async createPartner(u, l) {
    write((db) => {
      if (db.users.some((x) => x.email === u.email)) throw new ConflictError("An account with this email already exists. Sign in instead.");
      if (db.listings.some((x) => x.slug === l.slug)) throw new ConflictError("slug");
      db.users.push(u);
      db.listings.push(l);
    });
  },
  async listingByOwner(ownerId) {
    return read().listings.find((l) => l.ownerId === ownerId) ?? null;
  },
  async listingById(id) {
    return read().listings.find((l) => l.id === id) ?? null;
  },
  async listListings() {
    return read().listings;
  },
  async slugTaken(slug) {
    return read().listings.some((l) => l.slug === slug);
  },
  async updateListing(id, patch) {
    return write((db) => {
      const l = db.listings.find((x) => x.id === id);
      if (!l) return null;
      Object.assign(l, patch);
      return l;
    });
  },
  async seedStatuses() {
    return read().seedStatuses;
  },
  async setSeedStatus(propertyId, status) {
    write((db) => {
      db.seedStatuses[propertyId] = status;
    });
  },
  async putPhoto(id, bytes) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, id), bytes);
  },
  async getPhoto(id) {
    const f = path.join(UPLOAD_DIR, id);
    return fs.existsSync(f) ? { bytes: fs.readFileSync(f) } : null;
  },
  async deletePhoto(id) {
    fs.rmSync(path.join(UPLOAD_DIR, id), { force: true });
  },
  async fallbackSecret() {
    return read().secret;
  },
};
