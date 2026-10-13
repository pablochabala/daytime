"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon, LockKeyIcon, WarningCircleIcon } from "./icons";
import { Button, Field, FilterChip, cx } from "./ui";
import { useApp } from "./providers";
import { MIN_PHOTOS, PhotoUploader, type UploadedPhoto } from "./photo-uploader";
import { suggestRates } from "@/lib/pricing";
import { toHHMM, toMinutes } from "@/lib/time";
import { AMENITY_LABEL } from "@/lib/config";
import type { Amenity, PropertyType } from "@/lib/types";

const COMMISSION = 0.15;
const TIMES = Array.from({ length: 33 }, (_, i) => toHHMM(5 * 60 + i * 30)); // 05:00–21:00

export function RevenueCalculator() {
  const { money } = useApp();
  const [rooms, setRooms] = useState(10);
  const [rate, setRate] = useState(2500);
  const [discount, setDiscount] = useState(60);
  const [occ, setOcc] = useState(25);
  const dayPass = Math.round((rate * (1 - discount / 100)) / 10) * 10;
  const monthly = Math.round(rooms * (occ / 100) * 30 * dayPass * (1 - COMMISSION));
  return (
    <div className="grid gap-6 rounded-[24px] border border-border bg-surface p-6 md:grid-cols-2 md:p-8">
      <div className="space-y-5">
        <h3 className="font-sans text-xl font-bold">Estimate your extra revenue</h3>
        <Slider label="Rooms or units free during the day" value={rooms} min={1} max={100} onChange={setRooms} display={`${rooms}`} />
        <Slider label="Your overnight rate" value={rate} min={500} max={10000} step={100} onChange={setRate} display={money(rate)} />
        <Slider label="Daytime discount" value={discount} min={50} max={70} onChange={setDiscount} display={`${discount}% off`} />
        <Slider label="Daytime occupancy" value={occ} min={5} max={80} step={5} onChange={setOcc} display={`${occ}% of days`} />
      </div>
      <div className="flex flex-col justify-center rounded-2xl bg-secondary p-6 text-bg" aria-live="polite">
        <p className="text-sm font-semibold opacity-85">Estimated extra revenue per month</p>
        <p className="mt-1 font-display text-5xl font-bold tabular">
          <span key={monthly} className="animate-price inline-block">
            {money(monthly)}
          </span>
        </p>
        <p className="mt-3 text-sm opacity-85">
          Based on a day pass of {money(dayPass)} after Daytime&apos;s {COMMISSION * 100}% commission. Rooms are still free for your overnight guests.
        </p>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, onChange, display }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void; display: string }) {
  const id = label.replace(/\W+/g, "-").toLowerCase();
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <output htmlFor={id} className="font-bold tabular">
          {display}
        </output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-11 w-full accent-[var(--color-primary)]" />
    </div>
  );
}

const FORM_AMENITIES: Amenity[] = ["wifi", "pool", "gym", "spa", "workspace", "parking", "shower", "kitchen", "restaurant", "airport-shuttle"];

export function PartnerForm() {
  const { money } = useApp();
  const [f, setF] = useState({
    propertyName: "",
    type: "hotel" as PropertyType,
    city: "",
    contactName: "",
    email: "",
    phone: "",
    units: "5",
    overnight: "",
    discount: 60,
    dayPass: "",
    hourly: "",
    open: "08:00",
    close: "18:00",
    minHours: "2",
    amenities: [] as Amenity[],
    agree: false,
    photos: [] as UploadedPhoto[],
    password: "",
    confirm: "",
  });
  const [touchedRates, setTouchedRates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const windowHrs = (toMinutes(f.close) - toMinutes(f.open)) / 60;
  const overnight = Number(f.overnight) || 0;
  const suggested = useMemo(() => suggestRates(overnight, f.discount, windowHrs), [overnight, f.discount, windowHrs]);

  // Keep rates in sync with the discount until the partner edits them by hand.
  useEffect(() => {
    if (!touchedRates && overnight) setF((x) => ({ ...x, dayPass: String(suggested.dayPass), hourly: String(suggested.hourly) }));
  }, [suggested, touchedRates, overnight]);

  const dp = Number(f.dayPass) || 0;
  const actualDiscount = overnight ? Math.round((1 - dp / overnight) * 100) : 0;

  const check = (): Record<string, string | undefined> => ({
    propertyName: !f.propertyName.trim() ? "Enter your property's name" : undefined,
    city: !f.city.trim() ? "Enter the town or city" : undefined,
    contactName: !f.contactName.trim() ? "Enter a contact name" : undefined,
    email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter an email like name@example.com" : undefined,
    phone: f.phone.replace(/\D/g, "").length < 9 ? "Enter a full phone number" : undefined,
    overnight: overnight < 100 ? "Enter your standard overnight rate in ZMW" : undefined,
    dayPass: !dp ? "Enter a day-pass rate" : actualDiscount < 50 || actualDiscount > 70 ? `The day pass must be 50–70% below the overnight rate (currently ${actualDiscount}% off)` : undefined,
    hourly: !Number(f.hourly) ? "Enter an hourly rate" : Number(f.hourly) * Number(f.minHours) > dp ? "Hourly rate × minimum hours shouldn't cost more than the day pass" : undefined,
    close: windowHrs < 4 ? "The daytime window should be at least 4 hours" : undefined,
    photos: f.photos.length < MIN_PHOTOS ? `Add at least ${MIN_PHOTOS} photos (${f.photos.length} added so far)` : undefined,
    password: f.password.length < 10 ? "Use at least 10 characters" : !/[a-zA-Z]/.test(f.password) || !/\d/.test(f.password) ? "Use letters and at least one number" : undefined,
    confirm: f.confirm !== f.password ? "Passwords don't match" : undefined,
    agree: !f.agree ? "Please confirm you agree to be contacted" : undefined,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = check();
    setErrors(errs);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) {
      document.getElementById(`pf-${first}`)?.focus();
      return;
    }
    setLoading(true);
    setServerError(null);
    const fd = new FormData();
    const fields: Record<string, string> = {
      propertyName: f.propertyName,
      type: f.type,
      city: f.city,
      units: f.units,
      overnight: f.overnight,
      dayPass: f.dayPass,
      hourly: f.hourly,
      open: f.open,
      close: f.close,
      minHours: f.minHours,
      amenities: f.amenities.join(","),
      contactName: f.contactName,
      email: f.email,
      phone: f.phone,
      password: f.password,
    };
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    f.photos.forEach((p) => fd.append("photos", p.file, p.file.name));
    try {
      const res = await fetch("/api/partner/signup", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          const firstErr = Object.keys(data.errors)[0];
          document.getElementById(`pf-${firstErr}`)?.focus();
        } else setServerError(data.error ?? "Something went wrong. Try again.");
        setLoading(false);
        return;
      }
      router.push(data.redirect);
      router.refresh();
    } catch {
      setServerError("We couldn't reach Daytime. Check your connection and try again.");
      setLoading(false);
    }
  };

  const blur = (k: string) => setErrors((e) => ({ ...e, [k]: check()[k] }));
  const err = (k: string) => errors[k];

  return (
    <form noValidate onSubmit={submit} className="space-y-8 rounded-[24px] border border-border bg-surface p-6 md:p-8">
      <fieldset className="space-y-4">
        <legend className="mb-2 font-sans text-xl font-bold">About your property</legend>
        <div>
          <p className="mb-2 text-sm font-semibold" id="pf-type-label">
            Property type
          </p>
          <div role="radiogroup" aria-labelledby="pf-type-label" className="flex flex-wrap gap-2">
            {(["hotel", "lodge", "apartment"] as const).map((t) => (
              <FilterChip key={t} selected={f.type === t} onClick={() => setF({ ...f, type: t })}>
                <span className="capitalize">{t}</span>
              </FilterChip>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pf-propertyName" label="Property name" required value={f.propertyName} onChange={(e) => setF({ ...f, propertyName: e.target.value })} onBlur={() => blur("propertyName")} error={err("propertyName")} />
          <Field id="pf-city" label="Town or city" required autoComplete="address-level2" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} onBlur={() => blur("city")} error={err("city")} placeholder="Lusaka" />
          <Field id="pf-units" label={f.type === "apartment" ? "Number of apartments" : "Rooms or units available by day"} type="number" inputMode="numeric" min={1} value={f.units} onChange={(e) => setF({ ...f, units: e.target.value })} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-sans text-xl font-bold">Daytime window</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["open", "Earliest check-in"],
              ["close", "Latest check-out"],
            ] as const
          ).map(([k, l]) => (
            <div key={k}>
              <label htmlFor={`pf-${k}`} className="mb-1.5 block text-sm font-semibold">
                {l}
              </label>
              <select
                id={`pf-${k}`}
                value={f[k]}
                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                aria-invalid={k === "close" && !!err("close")}
                aria-describedby={k === "close" && err("close") ? "pf-close-err" : undefined}
                className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3 tabular"
              >
                {TIMES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label htmlFor="pf-minHours" className="mb-1.5 block text-sm font-semibold">
              Minimum booking
            </label>
            <select id="pf-minHours" value={f.minHours} onChange={(e) => setF({ ...f, minHours: e.target.value })} className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3">
              {[2, 3, 4].map((h) => (
                <option key={h} value={h}>
                  {h} hours
                </option>
              ))}
            </select>
          </div>
        </div>
        {err("close") ? (
          <p id="pf-close-err" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircleIcon weight="fill" className="size-4" aria-hidden /> {err("close")}
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            Guests can book any time between {f.open} and {f.close} ({windowHrs > 0 ? windowHrs : 0} hours). Check-in and check-out are always on the same day.
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-sans text-xl font-bold">Rates (ZMW, including taxes and fees)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="pf-overnight"
            label="Standard overnight rate"
            required
            type="number"
            inputMode="numeric"
            min={0}
            value={f.overnight}
            onChange={(e) => setF({ ...f, overnight: e.target.value })}
            onBlur={() => blur("overnight")}
            error={err("overnight")}
            hint="Your usual price for 1 night, 2 adults"
          />
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <label htmlFor="pf-discount" className="font-semibold">
                Daytime discount
              </label>
              <output htmlFor="pf-discount" className="font-bold text-savings tabular">
                {f.discount}% off
              </output>
            </div>
            <input
              id="pf-discount"
              type="range"
              min={50}
              max={70}
              value={f.discount}
              onChange={(e) => {
                setTouchedRates(false);
                setF({ ...f, discount: Number(e.target.value) });
              }}
              className="h-12 w-full accent-[var(--color-primary)]"
              aria-describedby="pf-discount-hint"
            />
            <p id="pf-discount-hint" className="text-sm text-text-muted">
              Daytime stays are priced 50–70% below your overnight rate.
            </p>
          </div>
          <Field
            id="pf-dayPass"
            label="Day-pass rate (full window)"
            required
            type="number"
            inputMode="numeric"
            value={f.dayPass}
            onChange={(e) => {
              setTouchedRates(true);
              setF({ ...f, dayPass: e.target.value });
            }}
            onBlur={() => blur("dayPass")}
            error={err("dayPass")}
            hint={overnight ? `Suggested ${money(suggested.dayPass)}, which is ${actualDiscount}% off right now` : "Enter your overnight rate to get a suggestion"}
          />
          <Field
            id="pf-hourly"
            label="Hourly rate"
            required
            type="number"
            inputMode="numeric"
            value={f.hourly}
            onChange={(e) => {
              setTouchedRates(true);
              setF({ ...f, hourly: e.target.value });
            }}
            onBlur={() => blur("hourly")}
            error={err("hourly")}
            hint={overnight ? `Suggested ${money(suggested.hourly)}/hour` : undefined}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-sans text-xl font-bold">What guests can use</legend>
        <div className="flex flex-wrap gap-2">
          {FORM_AMENITIES.map((a) => (
            <FilterChip key={a} selected={f.amenities.includes(a)} onClick={() => setF({ ...f, amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a] })}>
              {AMENITY_LABEL[a]}
            </FilterChip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-sans text-xl font-bold">Photos</legend>
        <PhotoUploader
          photos={f.photos}
          onChange={(photos) => {
            setF((x) => ({ ...x, photos }));
            if (errors.photos && photos.length >= MIN_PHOTOS) setErrors((e) => ({ ...e, photos: undefined }));
          }}
          error={err("photos")}
        />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-2 font-sans text-xl font-bold">Contact</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="pf-contactName" label="Your name" required autoComplete="name" value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} onBlur={() => blur("contactName")} error={err("contactName")} />
          <Field id="pf-email" label="Work email" required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onBlur={() => blur("email")} error={err("email")} />
          <Field id="pf-phone" label="Phone" required type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} onBlur={() => blur("phone")} error={err("phone")} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-sans text-xl font-bold">Your partner account</legend>
        <p className="flex items-start gap-2 text-sm text-text-muted">
          <LockKeyIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          Create a password to manage this listing. Only you can sign in to it, using your work email above.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative">
            <Field
              id="pf-password"
              label="Password"
              required
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
              onBlur={() => blur("password")}
              error={err("password")}
              hint="At least 10 characters, with letters and a number"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-1 top-[30px] grid size-11 place-items-center rounded-md text-text-muted hover:text-text"
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
            >
              {showPw ? <EyeSlashIcon className="size-5" aria-hidden /> : <EyeIcon className="size-5" aria-hidden />}
            </button>
          </div>
          <Field
            id="pf-confirm"
            label="Confirm password"
            required
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={f.confirm}
            onChange={(e) => setF({ ...f, confirm: e.target.value })}
            onBlur={() => blur("confirm")}
            error={err("confirm")}
          />
        </div>
        <label className="flex items-start gap-3">
          <input
            id="pf-agree"
            type="checkbox"
            checked={f.agree}
            onChange={(e) => setF({ ...f, agree: e.target.checked })}
            className="mt-0.5 size-5 accent-[var(--color-primary)]"
            aria-invalid={!!err("agree")}
            aria-describedby={err("agree") ? "pf-agree-err" : undefined}
          />
          <span className="text-sm">I agree that Daytime may contact me about listing this property.</span>
        </label>
        {err("agree") && (
          <p id="pf-agree-err" className="flex items-center gap-1.5 text-sm font-medium text-error">
            <WarningCircleIcon weight="fill" className="size-4" aria-hidden /> {err("agree")}
          </p>
        )}
      </fieldset>

      {serverError && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border-2 border-error p-3 text-sm font-semibold text-error">
          <WarningCircleIcon weight="fill" className="size-5 shrink-0" aria-hidden /> {serverError}
        </p>
      )}
      <div className={cx("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="text-sm text-text-muted">
          Free to list. Daytime takes {COMMISSION * 100}% commission only on completed bookings.{" "}
          <Link href="/partner/login" className="font-semibold text-secondary underline">
            Already listed? Sign in
          </Link>
        </p>
        <Button type="submit" size="lg" loading={loading}>
          Submit my property
        </Button>
      </div>
    </form>
  );
}
