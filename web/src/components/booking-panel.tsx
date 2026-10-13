"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CalendarBlankIcon, ClockIcon, LockKeyIcon, UsersIcon, ArrowCounterClockwiseIcon, SunIcon, InfoIcon } from "./icons";
import { Button, Dialog, SavingsBadge, cx } from "./ui";
import { Calendar, DateStrip, DurationSelector, GuestSelector, TimeSlotPicker, type DurationValue } from "./booking-controls";
import { useApp } from "./providers";
import type { Availability, Property } from "@/lib/types";
import { getAvailability } from "@/lib/api";
import { dayPassStart, canStartAt } from "@/lib/availability";
import { quote } from "@/lib/pricing";
import { addHours, formatDateLong, formatDateShort, todayIso, toMinutes, windowHours } from "@/lib/time";
import { SITE } from "@/lib/config";

export interface BookingState {
  unitId: string;
  date: string;
  duration: DurationValue;
  checkIn: string | null;
  adults: number;
  children: number;
}

export function useBookingState(p: Property, init: { date?: string; duration?: string; checkIn?: string }) {
  const initDuration: DurationValue =
    init.duration === "daypass" ? "daypass" : init.duration && Number(init.duration) >= p.minHours ? (Number(init.duration) as DurationValue) : (Math.max(p.minHours, 3) as DurationValue);
  const [s, setS] = useState<BookingState>({
    unitId: p.units[0].id,
    date: init.date && init.date >= todayIso() ? init.date : todayIso(),
    duration: [2, 3, 4, 6, "daypass"].includes(initDuration) ? initDuration : 4,
    checkIn: init.checkIn ?? null,
    adults: 2,
    children: 0,
  });
  const [av, setAv] = useState<Availability | null>(null);

  useEffect(() => {
    let alive = true;
    setAv(null);
    getAvailability(p.id, s.unitId, s.date).then((a) => alive && setAv(a));
    return () => {
      alive = false;
    };
  }, [p.id, s.unitId, s.date]);

  const hours = s.duration === "daypass" ? 0 : s.duration;
  const dpStart = av ? dayPassStart(av) : null;
  // Drop a check-in that is no longer valid for the chosen duration/date.
  const validCheckIn = av && s.checkIn && hours ? (canStartAt(av, toMinutes(s.checkIn), hours) ? s.checkIn : null) : s.checkIn;
  const unit = p.units.find((u) => u.id === s.unitId);
  const q =
    s.duration === "daypass"
      ? dpStart
        ? quote(p, unit, "daypass", dpStart, 0)
        : null
      : validCheckIn
        ? quote(p, unit, "hourly", validCheckIn, hours)
        : null;
  // Indicative price before a slot is chosen.
  const indicative = quote(p, unit, s.duration === "daypass" ? "daypass" : "hourly", p.window.open, hours || p.minHours);

  return { s, setS, av, hours, dpStart, validCheckIn, unit, q, indicative };
}

type BS = ReturnType<typeof useBookingState>;

function AnimatedPrice({ value }: { value: string }) {
  return (
    <span key={value} className="animate-price inline-block tabular">
      {value}
    </span>
  );
}

export function BookingPanel({ property: p, state, onBooked, inSheet }: { property: Property; state: BS; onBooked?: () => void; inSheet?: boolean }) {
  const { s, setS, av, hours, dpStart, validCheckIn, q, indicative, unit } = state;
  const { money } = useApp();
  const router = useRouter();
  const [calOpen, setCalOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guests = s.adults + s.children;
  const maxGuests = unit?.maxGuests ?? p.maxGuests;

  const book = () => {
    if (!q) {
      setError(s.duration === "daypass" ? "The day pass isn't available on this date. Pick another date or choose hours." : "Choose a check-in time to continue.");
      document.getElementById(`slots-${inSheet ? "sheet" : "panel"}`)?.focus();
      return;
    }
    const params = new URLSearchParams({
      property: p.slug,
      unit: s.unitId,
      date: s.date,
      mode: q.mode,
      checkIn: q.checkIn,
      hours: String(q.hours),
      adults: String(s.adults),
      children: String(s.children),
    });
    onBooked?.();
    router.push(`/book?${params.toString()}`);
  };

  useEffect(() => setError(null), [s.checkIn, s.duration, s.date]);

  return (
    <div className="space-y-5">
      {/* Price headline */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-text-subtle">
            <span className="sr-only">Overnight price </span>
            <s className="tabular">{money(indicative.overnight)}</s> per night
          </p>
          <p className="font-display text-2xl font-bold">
            {money(p.hourlyRate * (unit?.priceFactor ?? 1))}
            <span className="font-sans text-base font-semibold text-text-muted">/hour</span>
            <span className="mx-1.5 text-text-muted">·</span>
            <span className="text-xl">{money(indicative.dayPassTotal)}</span>
            <span className="font-sans text-base font-semibold text-text-muted"> day pass</span>
          </p>
        </div>
        <SavingsBadge pct={p.discountPct} size="lg" />
      </div>

      {/* Unit */}
      {p.units.length > 1 && (
        <div>
          <label htmlFor={`unit-${inSheet ? "s" : "p"}`} className="mb-1.5 block text-sm font-bold">
            {p.type === "lodge" ? "Day package" : "Room type"}
          </label>
          <select
            id={`unit-${inSheet ? "s" : "p"}`}
            value={s.unitId}
            onChange={(e) => setS((x) => ({ ...x, unitId: e.target.value, checkIn: null }))}
            className="h-12 w-full rounded-[10px] border border-border-strong bg-surface px-3 font-semibold"
          >
            {p.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} (from {money(Math.round((p.hourlyRate * u.priceFactor) / 10) * 10)}/h)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Date */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <CalendarBlankIcon className="size-4 text-primary" aria-hidden /> Date
          </p>
          <span className="text-sm text-text-muted">{formatDateLong(s.date)}</span>
        </div>
        <DateStrip value={s.date} onChange={(d) => setS((x) => ({ ...x, date: d, checkIn: null }))} onMore={() => setCalOpen(true)} />
        <Dialog open={calOpen} onClose={() => setCalOpen(false)} title="Choose a date">
          <Calendar
            value={s.date}
            onChange={(d) => {
              setS((x) => ({ ...x, date: d, checkIn: null }));
              setCalOpen(false);
            }}
          />
        </Dialog>
      </div>

      {/* Duration */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold">
          <ClockIcon className="size-4 text-primary" aria-hidden /> How long?
        </p>
        <DurationSelector
          value={s.duration}
          minHours={p.minHours}
          maxHours={windowHours(p.window.open, p.window.close)}
          onChange={(d) => setS((x) => ({ ...x, duration: d }))}
        />
      </div>

      {/* Time slots */}
      <div>
        <p id={`slots-${inSheet ? "sheet" : "panel"}-label`} className="mb-2 flex items-center justify-between gap-1.5 text-sm font-bold">
          <span className="flex items-center gap-1.5">
            <ClockIcon weight="fill" className="size-4 text-primary" aria-hidden /> {s.duration === "daypass" ? "Your day pass" : "Check-in time"}
          </span>
          <span className="font-normal text-text-muted">
            Open {p.window.open}–{p.window.close}
          </span>
        </p>
        <div id={`slots-${inSheet ? "sheet" : "panel"}`} tabIndex={-1} className="rounded-xl outline-none">
          {s.duration === "daypass" ? (
            !av ? (
              <div className="skeleton h-20 rounded-xl" />
            ) : dpStart ? (
              <div className="flex items-center gap-3 rounded-xl border border-accent bg-accent-soft p-4 text-on-accent">
                <SunIcon weight="fill" className="size-7 shrink-0" aria-hidden />
                <p>
                  <strong className="block">Full daytime window</strong>
                  Check in {dpStart} · Check out {p.window.close} ({windowHours(dpStart, p.window.close)} hours)
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong p-4">
                <p className="font-semibold">Day pass not available on {formatDateShort(s.date)}</p>
                <p className="mt-1 text-sm text-text-muted">Some hours are already booked. Choose a number of hours instead, or try another date.</p>
              </div>
            )
          ) : (
            <TimeSlotPicker availability={av} hours={hours} value={validCheckIn} onChange={(t) => setS((x) => ({ ...x, checkIn: t }))} />
          )}
        </div>
      </div>

      {/* Guests */}
      <div>
        <button
          type="button"
          onClick={() => setGuestsOpen(true)}
          className="flex min-h-12 w-full items-center gap-3 rounded-[10px] border border-border-strong px-3 text-left hover:border-secondary"
          aria-haspopup="dialog"
        >
          <UsersIcon className="size-5 text-primary" aria-hidden />
          <span className="flex-1 font-semibold">
            {guests} guest{guests > 1 ? "s" : ""}
          </span>
          <span className="text-sm font-semibold text-secondary">Change</span>
        </button>
        <Dialog open={guestsOpen} onClose={() => setGuestsOpen(false)} title="Guests" footer={<Button className="w-full" onClick={() => setGuestsOpen(false)}>Done</Button>}>
          <GuestSelector adults={s.adults} childCount={s.children} max={maxGuests} onChange={(a, c) => setS((x) => ({ ...x, adults: a, children: c }))} />
        </Dialog>
      </div>

      {/* Summary */}
      <div className="rounded-2xl bg-surface-muted p-4" aria-live="polite">
        {q ? (
          <>
            <p className="flex flex-wrap items-center gap-x-2 font-semibold">
              <span>Check-in {q.checkIn}</span>
              <ArrowRightIcon weight="bold" className="size-4 text-text-muted" aria-hidden />
              <span>Check-out {q.checkOut}</span>
              <span className="text-text-muted">· {q.hours} hours</span>
            </p>
            <p className="text-sm text-text-muted">{formatDateLong(s.date)}</p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">{q.mode === "daypass" ? "Day pass" : `${money(Math.round(q.total / q.hours))} × ${q.hours} hours`}</dt>
                <dd className="tabular">{money(q.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Taxes and fees</dt>
                <dd>Included</dd>
              </div>
              <div className="flex justify-between text-text-subtle">
                <dt>Overnight rate</dt>
                <dd>
                  <s className="tabular">{money(q.overnight)}</s>
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex items-end justify-between border-t border-border pt-3">
              <div>
                <p className="text-sm font-semibold">Total</p>
                <p className="text-sm font-bold text-savings">
                  You save <AnimatedPrice value={money(q.saving)} /> ({q.savingPct}%)
                </p>
              </div>
              <p className="font-display text-3xl font-bold">
                <AnimatedPrice value={money(q.total)} />
              </p>
            </div>
            {q.dayPassCheaper && dpStart && (
              <button
                type="button"
                onClick={() => setS((x) => ({ ...x, duration: "daypass" }))}
                className="mt-3 flex w-full items-start gap-2 rounded-xl bg-accent-soft p-3 text-left text-sm text-on-accent"
              >
                <InfoIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  The day pass is {money(q.total - q.dayPassTotal)} cheaper and gives you longer. <strong className="underline">Switch to day pass</strong>
                </span>
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-text-muted">
            {s.duration === "daypass" ? "Day pass" : `${hours} hours`} from <strong className="text-text">{money(indicative.total)}</strong>. {s.duration !== "daypass" && "Pick a check-in time to see your exact check-out time and total."}
          </p>
        )}
      </div>

      <div className={cx(inSheet && "sticky -bottom-5 -mx-5 border-t border-border bg-surface px-5 pb-5 pt-3 sm:-mx-6 sm:px-6")}>
        {error && (
          <p role="alert" className="mb-2 text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <Button size="lg" className="w-full" onClick={book}>
          {q ? `Book now · ${money(q.total)}` : "Book now"}
        </Button>
      </div>
      <ul className="space-y-1.5 text-sm text-text-muted">
        <li className="flex items-center gap-2">
          <ArrowCounterClockwiseIcon className="size-4 text-success" aria-hidden /> Free cancellation until {q ? addHours(q.checkIn, -SITE.freeCancellationHours) : `${SITE.freeCancellationHours} hours before check-in`}
        </li>
        <li className="flex items-center gap-2">
          <LockKeyIcon className="size-4 text-success" aria-hidden /> Pay securely on Daytime. You won&apos;t be charged yet.
        </li>
      </ul>
    </div>
  );
}

/** Mobile: sticky bottom bar that opens the panel in a bottom sheet. */
export function MobileBookingBar({ property: p, state }: { property: Property; state: BS }) {
  const [open, setOpen] = useState(false);
  const { money } = useApp();
  const { q, indicative } = state;
  const bar = useMemo(
    () => (q ? `${q.checkIn}–${q.checkOut} · ${money(q.total)}` : `From ${money(p.hourlyRate)}/h · ${money(indicative.dayPassTotal)} day pass`),
    [q, money, p.hourlyRate, indicative.dayPassTotal],
  );
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold tabular">{bar}</p>
            <p className="flex items-center gap-1.5 text-sm">
              <span className="font-semibold text-savings">Save {p.discountPct}%</span>
              <span className="text-text-muted">· taxes included</span>
            </p>
          </div>
          <Button onClick={() => setOpen(true)} className={cx("shrink-0")}>
            {q ? "Review" : "Choose time"}
          </Button>
        </div>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Book your daytime stay" size="md">
        <BookingPanel property={p} state={state} inSheet onBooked={() => setOpen(false)} />
      </Dialog>
    </>
  );
}
