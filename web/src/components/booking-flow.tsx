"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckIcon,
  CheckCircleIcon,
  CreditCardIcon,
  DeviceMobileIcon,
  LockKeyIcon,
  MapPinIcon,
  NavigationArrowIcon,
  CalendarPlusIcon,
  CopyIcon,
  ArrowRightIcon,
  WarningCircleIcon,
  CaretDownIcon,
  ArrowCounterClockwiseIcon,
} from "./icons";
import { Button, ButtonLink, Field, Photo, SavingsBadge, cx } from "./ui";
import { AppButtons } from "./site-chrome";
import { useApp } from "./providers";
import { useCatalog } from "./use-catalog";
import { buildAvailability, canStartAt, dayPassStart } from "@/lib/availability";
import { quote, type Quote } from "@/lib/pricing";
import { addHours, formatDateLong, toMinutes } from "@/lib/time";
import type { Booking, Property, Unit } from "@/lib/types";
import { SITE } from "@/lib/config";

const STEPS = ["Your details", "Payment", "Confirmation"];

/* ---------------- Summary ---------------- */
function Summary({ p, unit, q, date, guests, compact }: { p: Property; unit?: Unit; q: Quote; date: string; guests: number; compact?: boolean }) {
  const { money } = useApp();
  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            <Photo src={p.photos[0].src} alt="" sizes="80px" />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-snug">{p.name}</p>
            <p className="text-sm text-text-muted">{unit?.name}</p>
            <p className="text-sm text-text-muted">{p.city}</p>
          </div>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface-muted p-4 text-sm">
        <div className="col-span-2">
          <dt className="text-text-muted">Date</dt>
          <dd className="font-semibold">{formatDateLong(date)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Check-in</dt>
          <dd className="font-display text-xl font-bold tabular">{q.checkIn}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Check-out</dt>
          <dd className="font-display text-xl font-bold tabular">{q.checkOut}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Duration</dt>
          <dd className="font-semibold">{q.mode === "daypass" ? `Day pass (${q.hours} hours)` : `${q.hours} hours`}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Guests</dt>
          <dd className="font-semibold">{guests}</dd>
        </div>
      </dl>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-text-muted">{q.mode === "daypass" ? "Day pass" : `${money(Math.round(q.total / q.hours))} × ${q.hours} hours`}</dt>
          <dd className="tabular">{money(q.total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Taxes and fees</dt>
          <dd>Included</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Booking fee</dt>
          <dd>K 0</dd>
        </div>
        <div className="flex justify-between text-text-subtle">
          <dt>Overnight rate</dt>
          <dd>
            <s className="tabular">{money(q.overnight)}</s>
          </dd>
        </div>
      </dl>
      <div className="flex items-end justify-between border-t border-border pt-3">
        <div>
          <p className="font-bold">Total to pay</p>
          <p className="text-sm font-bold text-savings">You save {money(q.saving)}</p>
        </div>
        <p className="font-display text-3xl font-bold tabular">{money(q.total)}</p>
      </div>
      <p className="flex items-center gap-2 text-sm text-text-muted">
        <ArrowCounterClockwiseIcon className="size-4 text-success" aria-hidden />
        Free cancellation until {addHours(q.checkIn, -SITE.freeCancellationHours)} on the day
      </p>
    </div>
  );
}

/* ---------------- Progress ---------------- */
function Progress({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Booking progress">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const cur = n === step;
        return (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={cur ? "step" : undefined}>
            <span
              className={cx(
                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                done && "bg-success text-white",
                cur && "bg-primary text-on-primary",
                !done && !cur && "border-2 border-border-strong text-text-muted",
              )}
            >
              {done ? <CheckIcon weight="bold" className="size-4" aria-hidden /> : n}
            </span>
            <span className={cx("text-sm font-semibold", cur ? "text-text" : "hidden text-text-muted sm:inline")}>
              {s}
              <span className="sr-only">{done ? " (completed)" : cur ? " (current step)" : ""}</span>
            </span>
            {n < STEPS.length && <span className={cx("h-0.5 flex-1 rounded-full", done ? "bg-success" : "bg-border")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Validation ---------------- */
type Errors = Record<string, string | undefined>;
const validators: Record<string, (v: string) => string | undefined> = {
  firstName: (v) => (!v.trim() ? "Enter your first name" : undefined),
  lastName: (v) => (!v.trim() ? "Enter your last name" : undefined),
  email: (v) => (!v.trim() ? "Enter your email address" : !/^\S+@\S+\.\S+$/.test(v) ? "Enter an email like name@example.com" : undefined),
  phone: (v) => (!v.trim() ? "Enter your mobile number" : v.replace(/\D/g, "").length < 9 ? "Enter a full mobile number, e.g. 097 123 4567" : undefined),
  cardName: (v) => (!v.trim() ? "Enter the name on the card" : undefined),
  cardNumber: (v) => {
    const d = v.replace(/\s/g, "");
    if (!d) return "Enter your card number";
    if (!/^\d{13,19}$/.test(d)) return "Card number should be 13–19 digits";
    let sum = 0;
    for (let i = 0; i < d.length; i++) {
      let n = Number(d[d.length - 1 - i]);
      if (i % 2) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
    }
    return sum % 10 ? "Check the card number. It doesn't look right." : undefined;
  },
  expiry: (v) => {
    const m = v.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!m) return "Enter expiry as MM/YY";
    const mm = Number(m[1]);
    const yy = 2000 + Number(m[2]);
    if (mm < 1 || mm > 12) return "Month must be 01–12";
    const now = new Date();
    if (yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) return "This card has expired";
    return undefined;
  },
  cvc: (v) => (!/^\d{3,4}$/.test(v) ? "Enter the 3 or 4 digit security code" : undefined),
  momoNumber: (v) => (v.replace(/\D/g, "").length < 9 ? "Enter the mobile money number to charge" : undefined),
};

function ErrorSummary({ errors, labels }: { errors: Errors; labels: Record<string, string> }) {
  const ref = useRef<HTMLDivElement>(null);
  const list = Object.entries(errors).filter(([, v]) => v);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div ref={ref} tabIndex={-1} role="alert" aria-labelledby="err-title" className="rounded-xl border-2 border-error bg-surface p-4">
      <p id="err-title" className="flex items-center gap-2 font-bold text-error">
        <WarningCircleIcon weight="fill" className="size-5" aria-hidden /> Please fix {list.length} thing{list.length > 1 ? "s" : ""} to continue
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
        {list.map(([k, v]) => (
          <li key={k}>
            <a href={`#f-${k}`} className="font-semibold text-error underline">
              {labels[k]}: {v}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Flow ---------------- */
export function BookingFlow() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { money, user, addBooking, bookings } = useApp();
  const { find, loaded } = useCatalog();
  const p = find(sp.get("property") ?? "");
  const unit = p?.units.find((u) => u.id === sp.get("unit")) ?? p?.units[0];
  const date = sp.get("date") ?? "";
  const mode = sp.get("mode") === "daypass" ? "daypass" : "hourly";
  const checkIn = sp.get("checkIn") ?? "";
  const hours = Number(sp.get("hours") ?? 0);
  const adults = Number(sp.get("adults") ?? 2);
  const children = Number(sp.get("children") ?? 0);
  const step = Math.min(3, Math.max(1, Number(sp.get("step") ?? 1)));
  const refParam = sp.get("ref");

  const q = useMemo(() => (p ? quote(p, unit, mode, checkIn, hours) : null), [p, unit, mode, checkIn, hours]);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", requests: "", pay: "card" as "card" | "mobile-money", cardName: "", cardNumber: "", expiry: "", cvc: "", momoProvider: "airtel", momoNumber: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showSummary, setShowSummary] = useState(false);
  const [paying, setPaying] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const draftKey = "dt.bookingDraft";

  // Restore draft (survives refresh / back) and prefill from account.
  useEffect(() => {
    try {
      const d = sessionStorage.getItem(draftKey);
      if (d) setForm((f) => ({ ...f, ...JSON.parse(d), cardNumber: "", cvc: "", expiry: "" }));
      else if (user) setForm((f) => ({ ...f, ...user }));
    } catch {
      if (user) setForm((f) => ({ ...f, ...user }));
    }
  }, [user]);
  useEffect(() => {
    try {
      const { firstName, lastName, email, phone, requests, pay, momoProvider, momoNumber, cardName } = form;
      sessionStorage.setItem(draftKey, JSON.stringify({ firstName, lastName, email, phone, requests, pay, momoProvider, momoNumber, cardName }));
    } catch {
      /* ignore */
    }
  }, [form]);

  useEffect(() => {
    document.getElementById("main")?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  if (!p && !loaded) {
    return (
      <div className="mx-auto h-96 max-w-[1100px] px-4 py-10" aria-busy="true">
        <div className="skeleton h-full rounded-2xl" />
      </div>
    );
  }

  if (p && p.status !== "available" && step < 3) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">{p.name} isn&apos;t taking bookings right now</h1>
        <p className="mt-2 text-text-muted">Nothing has been charged. Choose another stay nearby.</p>
        <ButtonLink href={`/search?location=${encodeURIComponent(p.city)}`} className="mt-6">
          See stays in {p.city}
        </ButtonLink>
      </div>
    );
  }

  if (!p || !q || !date || (mode === "hourly" && (!checkIn || !hours))) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold">Let&apos;s pick a stay first</h1>
        <p className="mt-2 text-text-muted">Your booking details are missing. Choose a property, date and time to start booking.</p>
        <ButtonLink href="/search" className="mt-6">
          Find a stay
        </ButtonLink>
      </div>
    );
  }

  // Re-check the slot is still free before taking payment (a real API would do this server-side).
  const stillFree = (() => {
    if (step === 3) return true;
    const av = buildAvailability(p, unit!.id, date);
    return q.mode === "daypass" ? !!dayPassStart(av) : canStartAt(av, toMinutes(q.checkIn), q.hours);
  })();
  if (!stillFree) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <WarningCircleIcon weight="fill" className="mx-auto size-12 text-warning" aria-hidden />
        <h1 className="mt-3 text-3xl font-semibold">That time is no longer available</h1>
        <p className="mt-2 text-text-muted">
          {q.checkIn}–{q.checkOut} on {formatDateLong(date)} has just been booked. Pick another time. Nothing has been charged.
        </p>
        <ButtonLink href={`/property/${p.slug}?date=${date}`} className="mt-6">
          Choose another time
        </ButtonLink>
      </div>
    );
  }

  const guests = adults + children;
  const goto = (n: number, extra?: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    next.set("step", String(n));
    if (extra) for (const [k, v] of Object.entries(extra)) next.set(k, v);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: validators[k]?.(v) }));
  };
  const blur = (k: string) => setErrors((e) => ({ ...e, [k]: validators[k]?.((form as Record<string, string>)[k]) }));

  const validate = (keys: string[]) => {
    const e: Errors = {};
    for (const k of keys) e[k] = validators[k]?.((form as Record<string, string>)[k]);
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };
  const LABELS: Record<string, string> = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Mobile number",
    cardName: "Name on card",
    cardNumber: "Card number",
    expiry: "Expiry date",
    cvc: "Security code",
    momoNumber: "Mobile money number",
  };

  const existing = refParam ? bookings.find((b) => b.ref === refParam) : undefined;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    const keys = form.pay === "card" ? ["cardName", "cardNumber", "expiry", "cvc"] : ["momoNumber"];
    setSubmitted((n) => n + 1);
    if (!validate(keys)) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1400));
    const ref = `DT-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Date.now().toString().slice(-4)}`;
    const booking: Booking = {
      ref,
      createdAt: new Date().toISOString(),
      status: "upcoming",
      propertyId: p.id,
      unitId: unit!.id,
      date,
      mode: q.mode,
      checkIn: q.checkIn,
      checkOut: q.checkOut,
      hours: q.hours,
      guests: { adults, children },
      total: q.total,
      overnightRate: q.overnight,
      guest: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
      paymentMethod: form.pay,
    };
    addBooking(booking);
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      /* ignore */
    }
    setPaying(false);
    goto(3, { ref });
  };

  const summary = <Summary p={p} unit={unit} q={q} date={date} guests={guests} />;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-8">
        <Progress step={step} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Mobile summary (always visible, collapsible details) */}
          {step < 3 && (
            <div className="mb-6 rounded-2xl border border-border bg-surface lg:hidden">
              <button type="button" className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={showSummary} onClick={() => setShowSummary((s) => !s)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{p.name}</span>
                  <span className="block text-sm text-text-muted tabular">
                    {formatDateLong(date).split(",")[0]}, {q.checkIn}–{q.checkOut} · {money(q.total)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-secondary">{showSummary ? "Hide" : "Details"}</span>
                <CaretDownIcon className={cx("size-4 transition-transform", showSummary && "rotate-180")} aria-hidden />
              </button>
              {showSummary && <div className="border-t border-border p-4">{summary}</div>}
            </div>
          )}

          {step === 1 && (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted((n) => n + 1);
                if (validate(["firstName", "lastName", "email", "phone"])) goto(2);
              }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-3xl font-semibold text-secondary">Your details</h1>
                <p className="mt-1 text-text-muted">
                  We&apos;ll send your confirmation and check-in details here.{" "}
                  {!user && (
                    <>
                      <Link href={`/account?next=${encodeURIComponent(`${pathname}?${sp.toString()}`)}`} className="font-semibold text-secondary underline">
                        Sign in
                      </Link>{" "}
                      to fill this in faster, or continue as a guest.
                    </>
                  )}
                </p>
              </div>
              {submitted > 0 && Object.values(errors).some(Boolean) && <ErrorSummary key={submitted} errors={errors} labels={LABELS} />}
              <fieldset className="grid gap-4 sm:grid-cols-2">
                <legend className="sr-only">Lead guest</legend>
                <Field id="f-firstName" label="First name" required autoComplete="given-name" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={() => blur("firstName")} error={errors.firstName} />
                <Field id="f-lastName" label="Last name" required autoComplete="family-name" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} onBlur={() => blur("lastName")} error={errors.lastName} />
                <Field id="f-email" label="Email" type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} error={errors.email} placeholder="name@example.com" />
                <Field
                  id="f-phone"
                  label="Mobile number"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  onBlur={() => blur("phone")}
                  error={errors.phone}
                  placeholder="097 123 4567"
                  hint="The property may call if you're running late."
                />
              </fieldset>
              <div>
                <label htmlFor="f-requests" className="mb-1.5 block text-sm font-semibold">
                  Requests for the property <span className="font-normal text-text-muted">(optional)</span>
                </label>
                <textarea
                  id="f-requests"
                  rows={3}
                  value={form.requests}
                  onChange={(e) => set("requests", e.target.value)}
                  className="w-full rounded-[10px] border border-border-strong bg-surface px-3.5 py-3 text-base hover:border-secondary"
                  placeholder="E.g. quiet room, early towels, a desk lamp"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/property/${p.slug}?date=${date}`} className="inline-flex min-h-11 items-center font-semibold text-secondary hover:underline">
                  ← Change time or date
                </Link>
                <Button type="submit" size="lg">
                  Continue to payment <ArrowRightIcon weight="bold" className="size-5" aria-hidden />
                </Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form noValidate onSubmit={pay} className="space-y-6" aria-busy={paying}>
              <div>
                <h1 className="text-3xl font-semibold text-secondary">Payment</h1>
                <p className="mt-1 flex items-center gap-2 text-text-muted">
                  <LockKeyIcon className="size-4 text-success" aria-hidden /> Secure payment on Daytime. You pay {money(q.total)}, with nothing extra at the property.
                </p>
              </div>
              {submitted > 0 && Object.values(errors).some(Boolean) && <ErrorSummary key={submitted} errors={errors} labels={LABELS} />}

              <fieldset>
                <legend className="mb-3 font-bold">How would you like to pay?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["card", "Debit or credit card", "Visa, Mastercard", CreditCardIcon],
                      ["mobile-money", "Mobile money", "Airtel Money, MTN MoMo, Zamtel", DeviceMobileIcon],
                    ] as const
                  ).map(([v, l, sub, Icon]) => (
                    <label
                      key={v}
                      className={cx(
                        "flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-colors",
                        form.pay === v ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong",
                      )}
                    >
                      <input type="radio" name="pay" value={v} checked={form.pay === v} onChange={() => setForm((f) => ({ ...f, pay: v }))} className="size-5 accent-[var(--color-primary)]" />
                      <Icon className="size-6 text-secondary" aria-hidden />
                      <span>
                        <span className="block font-semibold">{l}</span>
                        <span className="block text-sm text-text-muted">{sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {form.pay === "card" ? (
                <fieldset className="grid gap-4 sm:grid-cols-2">
                  <legend className="sr-only">Card details</legend>
                  <Field id="f-cardName" className="sm:col-span-2" label="Name on card" required autoComplete="cc-name" value={form.cardName} onChange={(e) => set("cardName", e.target.value)} onBlur={() => blur("cardName")} error={errors.cardName} />
                  <Field
                    id="f-cardNumber"
                    className="sm:col-span-2"
                    label="Card number"
                    required
                    autoComplete="cc-number"
                    inputMode="numeric"
                    value={form.cardNumber}
                    onChange={(e) => set("cardNumber", e.target.value.replace(/[^\d ]/g, "").slice(0, 23))}
                    onBlur={() => blur("cardNumber")}
                    error={errors.cardNumber}
                    placeholder="1234 5678 9012 3456"
                  />
                  <Field id="f-expiry" label="Expiry date" required autoComplete="cc-exp" inputMode="numeric" value={form.expiry} onChange={(e) => set("expiry", e.target.value.slice(0, 7))} onBlur={() => blur("expiry")} error={errors.expiry} placeholder="MM/YY" />
                  <Field id="f-cvc" label="Security code" required autoComplete="cc-csc" inputMode="numeric" value={form.cvc} onChange={(e) => set("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))} onBlur={() => blur("cvc")} error={errors.cvc} hint="3 digits on the back of your card" />
                </fieldset>
              ) : (
                <fieldset className="grid gap-4 sm:grid-cols-2">
                  <legend className="sr-only">Mobile money details</legend>
                  <div>
                    <label htmlFor="f-momoProvider" className="mb-1.5 block text-sm font-semibold">
                      Provider
                    </label>
                    <select id="f-momoProvider" value={form.momoProvider} onChange={(e) => set("momoProvider", e.target.value)} className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3">
                      <option value="airtel">Airtel Money</option>
                      <option value="mtn">MTN MoMo</option>
                      <option value="zamtel">Zamtel Kwacha</option>
                    </select>
                  </div>
                  <Field
                    id="f-momoNumber"
                    label="Mobile money number"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.momoNumber}
                    onChange={(e) => set("momoNumber", e.target.value)}
                    onBlur={() => blur("momoNumber")}
                    error={errors.momoNumber}
                    placeholder="097 123 4567"
                    hint="You'll get a prompt on your phone to approve the payment."
                  />
                </fieldset>
              )}

              <div className="rounded-xl bg-surface-muted p-4 text-sm">
                <p className="font-semibold">Prefer the app?</p>
                <p className="mt-0.5 text-text-muted">You can also complete this booking and pay in the Daytime app.</p>
                <AppButtons className="mt-3" />
              </div>

              <p className="text-xs text-text-muted">Prototype: no real payment is taken. Booking data is stored only in this browser.</p>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => router.back()} className="inline-flex min-h-11 items-center font-semibold text-secondary hover:underline">
                  ← Back to your details
                </button>
                <Button type="submit" size="lg" loading={paying}>
                  <LockKeyIcon weight="bold" className="size-5" aria-hidden /> {paying ? "Processing…" : `Pay ${money(q.total)}`}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <Confirmation p={p} q={q} date={date} booking={existing} refId={refParam ?? ""} email={existing?.guest.email ?? form.email} />
          )}
        </div>

        <aside className="hidden lg:block" aria-label="Booking summary">
          <div className="sticky top-24 rounded-[24px] border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-lg font-bold">Your booking</h2>
              <SavingsBadge pct={q.savingPct} />
            </div>
            {summary}
          </div>
        </aside>
      </div>
    </div>
  );
}

function icsFor(p: Property, q: Quote, date: string, ref: string) {
  const d = date.replace(/-/g, "");
  const t = (hhmm: string) => hhmm.replace(":", "") + "00";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Daytime//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${ref}@daytime`,
    `DTSTART:${d}T${t(q.checkIn)}`,
    `DTEND:${d}T${t(q.checkOut)}`,
    `SUMMARY:Daytime stay: ${p.name}`,
    `LOCATION:${p.address}`,
    `DESCRIPTION:Booking ${ref}. Check-in ${q.checkIn}, check-out ${q.checkOut}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function Confirmation({ p, q, date, booking, refId, email }: { p: Property; q: Quote; date: string; booking?: Booking; refId: string; email: string }) {
  const { money, toast } = useApp();
  const ics = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsFor(p, q, date, refId))}`;
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] bg-savings-soft p-6 text-savings-ink">
        <CheckCircleIcon weight="fill" className="size-12" aria-hidden />
        <h1 className="mt-2 text-3xl font-semibold">You&apos;re booked!</h1>
        <p className="mt-1">
          We&apos;ve sent your confirmation{email ? ` to ${email}` : ""}. Show your booking reference at reception.
        </p>
      </div>

      <div className="rounded-[24px] border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text-muted">Booking reference</p>
            <p className="font-display text-3xl font-bold tracking-wider">{refId}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(refId).then(
                () => toast({ message: "Booking reference copied" }),
                () => toast({ message: "Couldn't copy. Select the reference to copy it." }),
              );
            }}
          >
            <CopyIcon className="size-4" aria-hidden /> Copy
          </Button>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-muted p-4">
            <dt className="text-sm text-text-muted">Date</dt>
            <dd className="font-semibold">{formatDateLong(date)}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted p-4">
            <dt className="text-sm text-text-muted">Check-in</dt>
            <dd className="font-display text-2xl font-bold tabular">{q.checkIn}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted p-4">
            <dt className="text-sm text-text-muted">Check-out</dt>
            <dd className="font-display text-2xl font-bold tabular">{q.checkOut}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-start gap-3">
          <MapPinIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-bold">{p.name}</p>
            <p className="text-text-muted">{p.address}</p>
          </div>
        </div>

        <p className="mt-4 text-sm">
          Paid <strong>{money(booking?.total ?? q.total)}</strong>
          {booking && ` by ${booking.paymentMethod === "card" ? "card" : "mobile money"}`} · You saved <strong className="text-savings">{money(q.saving)}</strong>
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover">
            <NavigationArrowIcon weight="bold" className="size-5" aria-hidden /> Get directions
          </a>
          <a href={ics} download={`daytime-${refId}.ics`} className="inline-flex h-12 items-center gap-2 rounded-[10px] border-[1.5px] border-secondary px-5 font-semibold text-secondary hover:bg-secondary-soft">
            <CalendarPlusIcon className="size-5" aria-hidden /> Add to calendar
          </a>
          <ButtonLink href="/account" variant="ghost">
            View my bookings
          </ButtonLink>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-text-muted">
        <li>• Bring a valid photo ID (NRC or passport) to check in.</li>
        <li>
          • Free cancellation until {addHours(q.checkIn, -SITE.freeCancellationHours)} on the day, from <Link href="/account" className="font-semibold text-secondary underline">My bookings</Link>.
        </li>
        <li>• Need more time? You can extend your stay from My bookings if the next hours are free.</li>
      </ul>
    </div>
  );
}
