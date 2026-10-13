import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Amenity, PropertyType } from "@/lib/types";
import { UPLOAD_DIR } from "./db";

export const MAX_PHOTOS = 20;
export const MIN_PHOTOS = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const AMENITIES: Amenity[] = ["wifi", "pool", "gym", "spa", "workspace", "parking", "shower", "kitchen", "restaurant", "airport-shuttle", "garden", "bar"];
const TIME = /^([01]\d|2[0-3]):(00|30)$/;

export interface ListingInput {
  propertyName: string;
  type: PropertyType;
  city: string;
  address?: string;
  summary?: string;
  units: number;
  overnightRate: number;
  dayPassRate: number;
  hourlyRate: number;
  window: { open: string; close: string };
  minHours: number;
  amenities: Amenity[];
}

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN);

/** Validate everything the partner controls. Returns field errors (same wording as the form). */
export function parseListing(body: Record<string, unknown>): { value?: ListingInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const type = str(body.type) as PropertyType;
  const open = str(body.open || (body.window as { open?: string })?.open);
  const close = str(body.close || (body.window as { close?: string })?.close);
  const overnightRate = num(body.overnightRate ?? body.overnight);
  const dayPassRate = num(body.dayPassRate ?? body.dayPass);
  const hourlyRate = num(body.hourlyRate ?? body.hourly);
  const minHours = num(body.minHours);
  const units = num(body.units);
  let amenities = body.amenities;
  if (typeof amenities === "string") amenities = amenities ? amenities.split(",") : [];
  const value: ListingInput = {
    propertyName: str(body.propertyName, 120),
    type,
    city: str(body.city, 60),
    address: str(body.address, 160) || undefined,
    summary: str(body.summary, 600) || undefined,
    units: Number.isFinite(units) && units > 0 ? Math.min(500, Math.round(units)) : 1,
    overnightRate: Math.round(overnightRate),
    dayPassRate: Math.round(dayPassRate),
    hourlyRate: Math.round(hourlyRate),
    window: { open, close },
    minHours: [2, 3, 4].includes(minHours) ? minHours : 2,
    amenities: Array.isArray(amenities) ? (amenities.filter((a) => AMENITIES.includes(a as Amenity)) as Amenity[]) : [],
  };
  if (!value.propertyName) errors.propertyName = "Enter your property's name";
  if (!["hotel", "lodge", "apartment"].includes(type)) errors.type = "Choose hotel, lodge or apartment";
  if (!value.city) errors.city = "Enter the town or city";
  if (!(overnightRate >= 100 && overnightRate <= 1_000_000)) errors.overnight = "Enter your standard overnight rate in ZMW";
  const off = overnightRate ? Math.round((1 - dayPassRate / overnightRate) * 100) : 0;
  if (!(dayPassRate > 0)) errors.dayPass = "Enter a day-pass rate";
  else if (off < 50 || off > 70) errors.dayPass = `The day pass must be 50–70% below the overnight rate (currently ${off}% off)`;
  if (!(hourlyRate > 0)) errors.hourly = "Enter an hourly rate";
  else if (hourlyRate * value.minHours > dayPassRate) errors.hourly = "Hourly rate × minimum hours shouldn't cost more than the day pass";
  if (!TIME.test(open) || !TIME.test(close)) errors.close = "Choose valid opening and closing times";
  else {
    const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    if (mins(close) - mins(open) < 240) errors.close = "The daytime window should be at least 4 hours";
  }
  return Object.keys(errors).length ? { errors } : { value, errors };
}

function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

/** Save uploaded images under random names. Checks real file bytes, not just the extension. */
export async function savePhotos(files: File[]): Promise<{ ids: string[]; errors: string[] }> {
  const ids: string[] = [];
  const errors: string[] = [];
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      errors.push(`${f.name}: larger than 10 MB`);
      continue;
    }
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = sniff(buf);
    if (!ext) {
      errors.push(`${f.name}: use JPG, PNG or WebP`);
      continue;
    }
    const id = `${crypto.randomBytes(12).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, id), buf);
    ids.push(id);
  }
  return { ids, errors };
}

export function deletePhoto(id: string) {
  if (!/^[a-f0-9]{24}\.(jpg|png|webp)$/.test(id)) return;
  fs.rmSync(path.join(UPLOAD_DIR, id), { force: true });
}
