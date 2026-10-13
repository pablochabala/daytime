import { NextResponse } from "next/server";
import { newId, read, write, type UserRecord } from "@/lib/server/db";
import { hashPassword, passwordProblem, sameOrigin, startSession } from "@/lib/server/auth";
import { MAX_PHOTOS, MIN_PHOTOS, parseListing, savePhotos } from "@/lib/server/listings";
import { slugify } from "@/lib/catalog";
import type { PartnerListing } from "@/lib/types";

/** Partner listing form: creates the partner's private account + their listing (status "coming soon"). */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });

  const fields = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const { value, errors } = parseListing({ ...fields, amenities: fields.amenities });

  const email = (fields.email ?? "").trim().toLowerCase();
  const contactName = (fields.contactName ?? "").trim().slice(0, 100);
  const phone = (fields.phone ?? "").trim().slice(0, 30);
  const password = fields.password ?? "";
  if (!contactName) errors.contactName = "Enter a contact name";
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter an email like name@example.com";
  if (phone.replace(/\D/g, "").length < 9) errors.phone = "Enter a full phone number";
  const pwErr = passwordProblem(password);
  if (pwErr) errors.password = pwErr;
  if (read().users.some((u) => u.email === email)) errors.email = "An account with this email already exists. Sign in instead.";

  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length < MIN_PHOTOS) errors.photos = `Add at least ${MIN_PHOTOS} photos (${files.length} added so far)`;
  if (files.length > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos`;

  if (Object.keys(errors).length || !value) return NextResponse.json({ errors }, { status: 400 });

  const saved = await savePhotos(files);
  if (saved.ids.length < MIN_PHOTOS) return NextResponse.json({ errors: { photos: saved.errors.join(". ") || `Add at least ${MIN_PHOTOS} photos` } }, { status: 400 });

  const now = new Date().toISOString();
  const user: UserRecord = {
    id: newId("usr"),
    role: "partner",
    email,
    name: contactName,
    phone,
    passwordHash: hashPassword(password),
    blocked: false,
    sessionVersion: 1,
    createdAt: now,
    lastLoginAt: now,
  };
  const listing = write((db) => {
    let slug = slugify(`${value.propertyName} ${value.city}`) || "listing";
    while (db.listings.some((l) => l.slug === slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    const l: PartnerListing = { ...value, id: newId("lst"), ownerId: user.id, slug, photos: saved.ids, status: "coming-soon", createdAt: now, updatedAt: now };
    db.users.push(user);
    db.listings.push(l);
    return l;
  });
  await startSession(user);
  return NextResponse.json({ ok: true, slug: listing.slug, redirect: "/partner/dashboard" });
}
