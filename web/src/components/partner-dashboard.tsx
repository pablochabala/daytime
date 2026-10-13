"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CameraIcon, CheckCircleIcon, ClockIcon, StarIcon, TrashIcon, UploadSimpleIcon, WarningCircleIcon, XCircleIcon } from "./icons";
import { Button, Field, FilterChip, cx } from "./ui";
import { SignOutButton } from "./auth-forms";
import { useApp } from "./providers";
import { AMENITY_LABEL } from "@/lib/config";
import { STATUS_LABEL } from "@/lib/catalog";
import { toHHMM } from "@/lib/time";
import type { Amenity, ListingStatus, PartnerListing, PropertyType } from "@/lib/types";

const TIMES = Array.from({ length: 33 }, (_, i) => toHHMM(5 * 60 + i * 30));
const AMENITIES: Amenity[] = ["wifi", "pool", "gym", "spa", "workspace", "parking", "shower", "kitchen", "restaurant", "airport-shuttle", "garden", "bar"];
const MIN_PHOTOS = 3;

const STATUS_INFO: Record<ListingStatus, { icon: typeof ClockIcon; tone: string; text: string }> = {
  "coming-soon": {
    icon: ClockIcon,
    tone: "bg-accent-soft text-on-accent",
    text: "Our team is reviewing your listing. Guests can see it with a “Coming soon” label but can't book yet. We'll switch it to Available once it's verified.",
  },
  available: { icon: CheckCircleIcon, tone: "bg-savings-soft text-savings-ink", text: "Your listing is live and guests can book it." },
  unavailable: {
    icon: XCircleIcon,
    tone: "bg-surface-muted text-text",
    text: "Your listing is visible but marked Unavailable, so guests can't book it. Contact Daytime support if you think this is a mistake.",
  },
};

export function PartnerDashboard({ name, email, initial }: { name: string; email: string; initial: PartnerListing }) {
  const router = useRouter();
  const { toast, money } = useApp();
  const [listing, setListing] = useState(initial);
  const [f, setF] = useState({
    propertyName: initial.propertyName,
    type: initial.type,
    city: initial.city,
    address: initial.address ?? "",
    summary: initial.summary ?? "",
    units: String(initial.units),
    overnight: String(initial.overnightRate),
    dayPass: String(initial.dayPassRate),
    hourly: String(initial.hourlyRate),
    open: initial.window.open,
    close: initial.window.close,
    minHours: String(initial.minHours),
    amenities: initial.amenities,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const info = STATUS_INFO[listing.status];
  const off = Number(f.overnight) ? Math.round((1 - Number(f.dayPass) / Number(f.overnight)) * 100) : 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const res = await fetch("/api/partner/listing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, overnightRate: f.overnight, dayPassRate: f.dayPass, hourlyRate: f.hourly }),
    }).catch(() => null);
    setSaving(false);
    if (!res) return toast({ message: "Couldn't reach Daytime. Try again." });
    if (res.status === 401) return router.push("/partner/login");
    const data = await res.json();
    if (!res.ok) {
      setErrors(data.errors ?? {});
      const first = Object.keys(data.errors ?? {})[0];
      if (first) document.getElementById(`d-${first}`)?.focus();
      return;
    }
    setListing(data.listing);
    toast({ message: "Listing saved" });
    router.refresh();
  };

  const uploadPhotos = async (files: FileList) => {
    setPhotoBusy(true);
    setPhotoError(null);
    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append("photos", file, file.name));
    const res = await fetch("/api/partner/photos", { method: "POST", body: fd }).catch(() => null);
    setPhotoBusy(false);
    if (!res) return setPhotoError("Couldn't upload. Check your connection.");
    const data = await res.json();
    if (!res.ok) return setPhotoError(data.error ?? "Upload failed");
    setListing(data.listing);
    if (data.errors?.length) setPhotoError(data.errors.join(". "));
    else toast({ message: `${files.length} photo${files.length > 1 ? "s" : ""} added` });
  };

  const setPhotos = async (photos: string[]) => {
    setPhotoBusy(true);
    setPhotoError(null);
    const res = await fetch("/api/partner/photos", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photos }) }).catch(() => null);
    setPhotoBusy(false);
    if (!res) return setPhotoError("Couldn't save. Check your connection.");
    const data = await res.json();
    if (!res.ok) return setPhotoError(data.error ?? "Couldn't update photos");
    setListing(data.listing);
  };

  const err = (k: string) => errors[k];

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-16 pt-8 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Partner dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-secondary md:text-4xl">{listing.propertyName}</h1>
          <p className="mt-1 text-text-muted">
            Signed in as {name} ({email})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/property/${listing.slug}`} className="inline-flex h-11 items-center gap-1.5 rounded-[10px] border-[1.5px] border-secondary px-4 text-sm font-semibold text-secondary hover:bg-secondary-soft">
            View public page <ArrowRightIcon weight="bold" className="size-4" aria-hidden />
          </Link>
          <SignOutButton />
        </div>
      </div>

      <section aria-labelledby="status-h" className={cx("mt-6 flex items-start gap-3 rounded-2xl p-5", info.tone)}>
        <info.icon weight="fill" className="mt-0.5 size-6 shrink-0" aria-hidden />
        <div>
          <h2 id="status-h" className="font-sans text-lg font-bold">
            Status: {STATUS_LABEL[listing.status]}
          </h2>
          <p className="mt-0.5">{info.text}</p>
        </div>
      </section>

      {/* Photos */}
      <section aria-labelledby="photos-h" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="photos-h" className="text-2xl font-semibold text-secondary">
              Photos
            </h2>
            <p className="text-sm text-text-muted">
              {listing.photos.length} of 20. The first photo is your cover. Keep at least {MIN_PHOTOS}.
            </p>
          </div>
          <Button variant="secondary" size="sm" loading={photoBusy} disabled={listing.photos.length >= 20} onClick={() => fileRef.current?.click()}>
            <UploadSimpleIcon weight="bold" className="size-4" aria-hidden /> Upload photos
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              if (e.target.files?.length) uploadPhotos(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {photoError && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden /> {photoError}
          </p>
        )}
        {listing.photos.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-border-strong p-8 text-center">
            <CameraIcon className="size-8 text-primary" aria-hidden />
            <p className="mt-2 font-semibold">No photos yet</p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {listing.photos.map((id, i) => (
              <li key={id} className="relative overflow-hidden rounded-xl border border-border bg-surface">
                <div className="aspect-[4/3] bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element -- partner upload served by our API */}
                  <img src={`/api/uploads/${id}`} alt={`${listing.propertyName}: photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </div>
                {i === 0 && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-[#422006]">
                    <StarIcon weight="fill" className="size-3" aria-hidden /> Cover
                  </span>
                )}
                <div className="flex items-center justify-between p-1.5">
                  {i > 0 ? (
                    <button type="button" disabled={photoBusy} onClick={() => setPhotos([id, ...listing.photos.filter((x) => x !== id)])} className="min-h-9 rounded-md px-2 text-xs font-semibold text-secondary hover:bg-secondary-soft">
                      Make cover
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    disabled={photoBusy || listing.photos.length <= MIN_PHOTOS}
                    onClick={() => setPhotos(listing.photos.filter((x) => x !== id))}
                    className="grid size-9 place-items-center rounded-md text-error hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] disabled:opacity-35"
                    aria-label={listing.photos.length <= MIN_PHOTOS ? `Can't remove photo ${i + 1}: keep at least ${MIN_PHOTOS}` : `Remove photo ${i + 1}`}
                  >
                    <TrashIcon className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Details */}
      <form noValidate onSubmit={save} className="mt-10 space-y-8 rounded-[24px] border border-border bg-surface p-6 md:p-8" aria-labelledby="details-h">
        <h2 id="details-h" className="text-2xl font-semibold text-secondary">
          Listing details
        </h2>
        <fieldset className="space-y-4">
          <legend className="sr-only">About the property</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Property type">
            {(["hotel", "lodge", "apartment"] as PropertyType[]).map((t) => (
              <FilterChip key={t} selected={f.type === t} onClick={() => setF({ ...f, type: t })}>
                <span className="capitalize">{t}</span>
              </FilterChip>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="d-propertyName" label="Property name" required value={f.propertyName} onChange={(e) => setF({ ...f, propertyName: e.target.value })} error={err("propertyName")} />
            <Field id="d-city" label="Town or city" required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} error={err("city")} />
            <Field id="d-address" label="Street address" optional value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            <Field id="d-units" label="Rooms or units available by day" type="number" inputMode="numeric" min={1} value={f.units} onChange={(e) => setF({ ...f, units: e.target.value })} />
          </div>
          <div>
            <label htmlFor="d-summary" className="mb-1.5 block text-sm font-semibold">
              Short description <span className="font-normal text-text-muted">(optional)</span>
            </label>
            <textarea
              id="d-summary"
              rows={3}
              maxLength={600}
              value={f.summary}
              onChange={(e) => setF({ ...f, summary: e.target.value })}
              className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-base"
              placeholder="What makes a daytime stay with you special?"
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-sans text-lg font-bold">Daytime window</legend>
          {(
            [
              ["open", "Earliest check-in"],
              ["close", "Latest check-out"],
            ] as const
          ).map(([k, l]) => (
            <div key={k}>
              <label htmlFor={`d-${k}`} className="mb-1.5 block text-sm font-semibold">
                {l}
              </label>
              <select id={`d-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3 tabular">
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label htmlFor="d-minHours" className="mb-1.5 block text-sm font-semibold">
              Minimum booking
            </label>
            <select id="d-minHours" value={f.minHours} onChange={(e) => setF({ ...f, minHours: e.target.value })} className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3">
              {[2, 3, 4].map((h) => (
                <option key={h} value={h}>
                  {h} hours
                </option>
              ))}
            </select>
          </div>
          {err("close") && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-error sm:col-span-3">
              <WarningCircleIcon weight="fill" className="size-4" aria-hidden /> {err("close")}
            </p>
          )}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 font-sans text-lg font-bold">Rates (ZMW, taxes included)</legend>
          <Field id="d-overnight" label="Overnight rate" type="number" inputMode="numeric" value={f.overnight} onChange={(e) => setF({ ...f, overnight: e.target.value })} error={err("overnight")} />
          <Field
            id="d-dayPass"
            label="Day pass"
            type="number"
            inputMode="numeric"
            value={f.dayPass}
            onChange={(e) => setF({ ...f, dayPass: e.target.value })}
            error={err("dayPass")}
            hint={`${off}% off overnight (must be 50–70%)`}
          />
          <Field id="d-hourly" label="Hourly rate" type="number" inputMode="numeric" value={f.hourly} onChange={(e) => setF({ ...f, hourly: e.target.value })} error={err("hourly")} hint={Number(f.hourly) ? `${money(Number(f.hourly))} per hour` : undefined} />
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-sans text-lg font-bold">What guests can use</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <FilterChip key={a} selected={f.amenities.includes(a)} onClick={() => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] })}>
                {AMENITY_LABEL[a]}
              </FilterChip>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" size="lg" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
