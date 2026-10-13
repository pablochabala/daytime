"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeIcon, EyeSlashIcon, HeartIcon, CalendarBlankIcon, UserIcon, SignOutIcon, TimerIcon, MapPinIcon, XCircleIcon, ArrowRightIcon, ReceiptIcon } from "./icons";
import { Button, ButtonLink, Dialog, Field, Photo, cx } from "./ui";
import { useApp } from "./providers";
import { PropertyCard } from "./property-card";
import { getPropertySync, getPropertiesSync } from "@/lib/api";
import { useCatalog } from "./use-catalog";
import { buildAvailability, canStartAt } from "@/lib/availability";
import { unitRates } from "@/lib/pricing";
import { addHours, formatDateLong, nowMinutesRounded, todayIso, toMinutes } from "@/lib/time";
import type { Booking } from "@/lib/types";
import { SITE } from "@/lib/config";

type Tab = "upcoming" | "past" | "cancelled" | "wishlist" | "profile";
const TABS: { id: Tab; label: string; icon: typeof HeartIcon }[] = [
  { id: "upcoming", label: "Upcoming", icon: CalendarBlankIcon },
  { id: "past", label: "Past", icon: ReceiptIcon },
  { id: "cancelled", label: "Cancelled", icon: XCircleIcon },
  { id: "wishlist", label: "Wishlist", icon: HeartIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
];

/* ---------------- Auth ---------------- */
function AuthForm() {
  const { signIn } = useApp();
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string | undefined> = {
      email: !/^\S+@\S+\.\S+$/.test(f.email) ? "Enter an email like name@example.com" : undefined,
      password: f.password.length < 8 ? "Use at least 8 characters" : undefined,
    };
    if (mode === "signup") {
      e.firstName = !f.firstName.trim() ? "Enter your first name" : undefined;
      e.lastName = !f.lastName.trim() ? "Enter your last name" : undefined;
    }
    setErrors(e);
    const first = Object.keys(e).find((k) => e[k]);
    if (first) document.getElementById(`a-${first}`)?.focus();
    return !first;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const name = f.email.split("@")[0].split(/[._-]/)[0];
    signIn({
      firstName: f.firstName || name.charAt(0).toUpperCase() + name.slice(1),
      lastName: f.lastName,
      email: f.email,
      phone: f.phone,
    });
    setLoading(false);
    const next = sp.get("next");
    if (next && next.startsWith("/")) router.push(next);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-semibold text-secondary">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-1 text-text-muted">{mode === "signin" ? "Sign in to see your bookings, extend a stay and save favourites." : "Book faster, keep your bookings in one place and get member-only deals."}</p>
      <div role="tablist" aria-label="Account" className="mt-6 grid grid-cols-2 rounded-[10px] border border-border-strong bg-surface p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            type="button"
            onClick={() => {
              setMode(m);
              setErrors({});
            }}
            className={cx("min-h-11 rounded-[7px] text-sm font-semibold", mode === m ? "bg-secondary text-bg" : "hover:bg-surface-muted")}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>
      <form noValidate onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="a-firstName" label="First name" required autoComplete="given-name" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} error={errors.firstName} />
            <Field id="a-lastName" label="Last name" required autoComplete="family-name" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} error={errors.lastName} />
          </div>
        )}
        <Field id="a-email" label="Email" type="email" required autoComplete="email" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} error={errors.email} />
        {mode === "signup" && <Field id="a-phone" label="Mobile number" optional type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}
        <div className="relative">
          <Field
            id="a-password"
            label="Password"
            required
            type={show ? "text" : "password"}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={f.password}
            onChange={(e) => setF({ ...f, password: e.target.value })}
            error={errors.password}
            hint={mode === "signup" ? "At least 8 characters" : undefined}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-[30px] grid size-11 place-items-center rounded-md text-text-muted hover:text-text"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeSlashIcon className="size-5" aria-hidden /> : <EyeIcon className="size-5" aria-hidden />}
          </button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <p className="text-center text-xs text-text-muted">Prototype: accounts are stored only in this browser.</p>
      </form>
    </div>
  );
}

/* ---------------- Booking card ---------------- */
function BookingCard({ b, onExtend, onCancel }: { b: Booking; onExtend?: () => void; onCancel?: () => void }) {
  const { money } = useApp();
  const p = getPropertySync(b.propertyId);
  if (!p) return null;
  const unit = p.units.find((u) => u.id === b.unitId);
  const isToday = b.date === todayIso();
  const active = isToday && b.status === "upcoming" && nowMinutesRounded() >= toMinutes(b.checkIn) && nowMinutesRounded() < toMinutes(b.checkOut);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:flex-row">
      <div className="relative aspect-[16/9] bg-surface-muted sm:aspect-auto sm:w-56">
        <Photo src={p.photos[0].src} alt={p.photos[0].alt} sizes="(min-width: 640px) 224px, 100vw" />
        {active && <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white">Happening now</span>}
        {b.status === "cancelled" && <span className="absolute left-3 top-3 rounded-full bg-text px-2.5 py-1 text-xs font-bold text-bg">Cancelled</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-sans text-lg font-bold">
              <Link href={`/property/${p.slug}`} className="hover:underline">
                {p.name}
              </Link>
            </h3>
            <p className="text-sm text-text-muted">
              {unit?.name} · Ref <span className="font-semibold text-text">{b.ref}</span>
            </p>
          </div>
          <p className="font-display text-xl font-bold tabular">{money(b.total)}</p>
        </div>
        <p className="font-semibold">
          {formatDateLong(b.date)} · <span className="tabular">{b.checkIn} → {b.checkOut}</span> <span className="font-normal text-text-muted">({b.hours} hours)</span>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-text-muted">
          <MapPinIcon className="size-4" aria-hidden /> {p.address}
        </p>
        <p className="text-sm font-semibold text-savings">Saved {money(Math.max(0, b.overnightRate - b.total))} vs the overnight rate</p>
        {b.status === "upcoming" && (
          <div className="mt-2 flex flex-wrap gap-2">
            {onExtend && b.mode === "hourly" && (
              <Button size="sm" onClick={onExtend}>
                <TimerIcon className="size-4" aria-hidden /> Extend stay
              </Button>
            )}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-[10px] px-4 text-sm font-semibold text-secondary hover:bg-secondary-soft">
              Directions
            </a>
            {onCancel && (
              <Button size="sm" variant="ghost" className="text-error hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]" onClick={onCancel}>
                Cancel booking
              </Button>
            )}
          </div>
        )}
        {b.status === "past" && (
          <ButtonLink href={`/property/${p.slug}`} size="sm" variant="secondary" className="mt-2 self-start">
            Book again
          </ButtonLink>
        )}
      </div>
    </article>
  );
}

/* ---------------- Extend dialog ---------------- */
function ExtendDialog({ b, onClose }: { b: Booking; onClose: () => void }) {
  const { money, updateBooking, toast } = useApp();
  const p = getPropertySync(b.propertyId)!;
  const unit = p.units.find((u) => u.id === b.unitId);
  const rate = unitRates(p, unit).hourly;
  const av = useMemo(() => buildAvailability(p, b.unitId, b.date), [p, b.unitId, b.date]);
  const options = [1, 2, 3].map((h) => ({
    h,
    ok: canStartAt(av, toMinutes(b.checkOut), h),
    until: addHours(b.checkOut, h),
  }));
  const [pick, setPick] = useState<number | null>(options.find((o) => o.ok)?.h ?? null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!pick) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    updateBooking(b.ref, { checkOut: addHours(b.checkOut, pick), hours: b.hours + pick, total: b.total + rate * pick });
    toast({ message: `Extended until ${addHours(b.checkOut, pick)}. ${money(rate * pick)} charged.`, tone: "success" });
    onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Extend your stay"
      footer={
        <Button className="w-full" size="lg" disabled={!pick} loading={saving} onClick={confirm}>
          {pick ? `Extend to ${addHours(b.checkOut, pick)} · ${money(rate * pick)}` : "No extra hours available"}
        </Button>
      }
    >
      <p className="text-text-muted">
        Currently checking out at <strong className="text-text">{b.checkOut}</strong>. Add more time if the room is free. You&apos;ll pay {money(rate)} per extra hour.
      </p>
      <div role="radiogroup" aria-label="Extra hours" className="mt-4 grid gap-2">
        {options.map((o) => (
          <button
            key={o.h}
            type="button"
            role="radio"
            aria-checked={pick === o.h}
            disabled={!o.ok}
            onClick={() => setPick(o.h)}
            className={cx(
              "flex min-h-14 items-center justify-between rounded-xl border-2 px-4 text-left",
              pick === o.h ? "border-primary bg-primary-soft" : "border-border",
              !o.ok && "cursor-not-allowed opacity-50",
            )}
          >
            <span>
              <span className="block font-semibold">+{o.h} hour{o.h > 1 ? "s" : ""}</span>
              <span className="block text-sm text-text-muted tabular">{o.ok ? `New check-out ${o.until}` : `Not available: the room is booked or the property closes at ${p.window.close}`}</span>
            </span>
            <span className="font-bold tabular">{money(rate * o.h)}</span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}

/* ---------------- Main ---------------- */
export function AccountView() {
  const { user, hydrated, bookings, wishlist, signOut, updateBooking, updateUser, toast, money } = useApp();
  useCatalog(); // re-render once partner listings load so their bookings and wishlist entries show
  const sp = useSearchParams();
  const router = useRouter();
  const tab = (sp.get("tab") as Tab) || "upcoming";
  const [extend, setExtend] = useState<Booking | null>(null);
  const [cancel, setCancel] = useState<Booking | null>(null);
  const [profile, setProfile] = useState(user);
  useEffect(() => setProfile(user), [user]);

  if (!hydrated) return <div className="mx-auto h-96 max-w-[1100px] px-4 py-10"><div className="skeleton h-full rounded-2xl" /></div>;
  if (!user) return <AuthForm />;

  const list = (s: Booking["status"]) => bookings.filter((b) => b.status === s).sort((a, b) => (a.date + a.checkIn).localeCompare(b.date + b.checkIn) * (s === "upcoming" ? 1 : -1));
  const saved = getPropertiesSync().filter((p) => wishlist.includes(p.id));
  const totalSaved = bookings.filter((b) => b.status !== "cancelled").reduce((s, b) => s + Math.max(0, b.overnightRate - b.total), 0);

  const lateCancel = cancel && cancel.date === todayIso() && nowMinutesRounded() > toMinutes(cancel.checkIn) - SITE.freeCancellationHours * 60;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-secondary md:text-4xl">Hi, {user.firstName}</h1>
          {totalSaved > 0 && <p className="mt-1 font-semibold text-savings">You&apos;ve saved {money(totalSaved)} with Daytime so far</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <SignOutIcon className="size-4" aria-hidden /> Sign out
        </Button>
      </div>

      <nav aria-label="Account sections" className="no-scrollbar -mx-4 mt-6 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-2 border-b border-border">
          {TABS.map((t) => {
            const count = t.id === "wishlist" ? wishlist.length : t.id === "profile" ? null : bookings.filter((b) => b.status === t.id).length;
            return (
              <li key={t.id}>
                <Link
                  href={`/account?tab=${t.id}`}
                  scroll={false}
                  aria-current={tab === t.id ? "page" : undefined}
                  className={cx("-mb-px flex min-h-12 items-center gap-2 border-b-2 px-3 text-sm font-semibold", tab === t.id ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text")}
                >
                  <t.icon className="size-4" aria-hidden /> {t.label}
                  {count != null && count > 0 && <span className="rounded-full bg-surface-muted px-2 text-xs text-text">{count}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6">
        {(tab === "upcoming" || tab === "past" || tab === "cancelled") &&
          (list(tab).length ? (
            <ul className="space-y-4">
              {list(tab).map((b) => (
                <li key={b.ref}>
                  <BookingCard b={b} onExtend={() => setExtend(b)} onCancel={() => setCancel(b)} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              title={tab === "upcoming" ? "No upcoming stays" : tab === "past" ? "No past stays yet" : "No cancelled bookings"}
              text={tab === "upcoming" ? "Find a quiet room for a few hours or a day pass with a pool." : "Your completed daytime stays will appear here."}
            />
          ))}

        {tab === "wishlist" &&
          (saved.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {saved.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Save stays you love" text="Tap the heart on any stay to keep it here for later." />
          ))}

        {tab === "profile" && profile && (
          <form
            className="max-w-xl space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateUser(profile);
              toast({ message: "Profile saved", tone: "success" });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" autoComplete="given-name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
              <Field label="Last name" autoComplete="family-name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
            </div>
            <Field label="Email" type="email" autoComplete="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            <Field label="Mobile number" type="tel" autoComplete="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} hint="Used to prefill bookings and for check-in contact" />
            <Button type="submit">Save changes</Button>
          </form>
        )}
      </div>

      {extend && <ExtendDialog b={extend} onClose={() => setExtend(null)} />}
      {cancel && (
        <Dialog
          open
          onClose={() => setCancel(null)}
          title="Cancel this booking?"
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setCancel(null)}>
                Keep booking
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  updateBooking(cancel.ref, { status: "cancelled" });
                  toast({ message: `Booking ${cancel.ref} cancelled`, action: { label: "Undo", onClick: () => updateBooking(cancel.ref, { status: "upcoming" }) } });
                  setCancel(null);
                  router.replace("/account?tab=cancelled", { scroll: false });
                }}
              >
                Cancel booking
              </Button>
            </div>
          }
        >
          <p>
            {getPropertySync(cancel.propertyId)?.name}, {formatDateLong(cancel.date)}, {cancel.checkIn}–{cancel.checkOut}.
          </p>
          <p className={cx("mt-3 rounded-xl p-3 text-sm font-semibold", lateCancel ? "bg-[color-mix(in_srgb,var(--color-warning)_14%,transparent)] text-warning" : "bg-savings-soft text-savings-ink")}>
            {lateCancel
              ? `It's less than ${SITE.freeCancellationHours} hours before check-in, so this booking is non-refundable.`
              : `Free cancellation: you'll get a full refund of ${money(cancel.total)}.`}
          </p>
        </Dialog>
      )}
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-10 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-text-muted">{text}</p>
      <ButtonLink href="/search" className="mt-6">
        Find a stay <ArrowRightIcon weight="bold" className="size-4" aria-hidden />
      </ButtonLink>
    </div>
  );
}
