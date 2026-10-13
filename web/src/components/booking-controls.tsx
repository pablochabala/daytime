"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CaretLeftIcon, CaretRightIcon, CheckIcon, MinusIcon, PlusIcon, SunIcon, LightningIcon } from "./icons";
import { cx } from "./ui";
import type { Availability } from "@/lib/types";
import { addDays, addHours, formatDateLong, isoDate, parseIsoDate, relativeDayLabel, todayIso, toMinutes } from "@/lib/time";
import { validStarts } from "@/lib/availability";

/* =========================================================
 * Calendar: ARIA grid month view
 * ======================================================= */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function Calendar({
  value,
  onChange,
  min = todayIso(),
  max = addDays(todayIso(), 120),
  isDisabled,
  describeDay,
}: {
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  isDisabled?: (iso: string) => boolean;
  describeDay?: (iso: string) => string;
}) {
  const [view, setView] = useState(() => {
    const d = parseIsoDate(value || min);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [focus, setFocus] = useState(value || min);
  const gridRef = useRef<HTMLTableElement>(null);
  const shouldFocus = useRef(false);

  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return isoDate(d);
    });
  }, [view]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focus}"]`)?.focus();
    shouldFocus.current = false;
  }, [focus, view]);

  const disabled = (iso: string) => iso < min || iso > max || !!isDisabled?.(iso);

  const move = (iso: string) => {
    if (iso < min || iso > max) return;
    const d = parseIsoDate(iso);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(new Date(d.getFullYear(), d.getMonth(), 1));
    shouldFocus.current = true;
    setFocus(iso);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const d = parseIsoDate(focus);
    if (map[e.key] != null) {
      e.preventDefault();
      move(addDays(focus, map[e.key]));
    } else if (e.key === "Home") {
      e.preventDefault();
      move(addDays(focus, -((d.getDay() + 6) % 7)));
    } else if (e.key === "End") {
      e.preventDefault();
      move(addDays(focus, 6 - ((d.getDay() + 6) % 7)));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const n = new Date(d);
      n.setMonth(d.getMonth() + (e.key === "PageUp" ? -1 : 1));
      move(isoDate(n));
    }
  };

  const monthLabel = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const prevDisabled = isoDate(new Date(view.getFullYear(), view.getMonth(), 0)) < min;
  const nextDisabled = isoDate(new Date(view.getFullYear(), view.getMonth() + 1, 1)) > max;
  const labelId = useId();

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full hover:bg-surface-muted disabled:opacity-30"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={prevDisabled}
          aria-label="Previous month"
        >
          <CaretLeftIcon weight="bold" className="size-5" aria-hidden />
        </button>
        <p id={labelId} className="font-display text-lg font-semibold" aria-live="polite">
          {monthLabel}
        </p>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full hover:bg-surface-muted disabled:opacity-30"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={nextDisabled}
          aria-label="Next month"
        >
          <CaretRightIcon weight="bold" className="size-5" aria-hidden />
        </button>
      </div>
      <table ref={gridRef} role="grid" aria-labelledby={labelId} className="w-full border-collapse" onKeyDown={onKey}>
        <thead>
          <tr>
            {WEEKDAYS.map((w) => (
              <th key={w} scope="col" className="pb-1 text-center text-xs font-semibold text-text-muted">
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, r) => (
            <tr key={r}>
              {days.slice(r * 7, r * 7 + 7).map((iso) => {
                const inMonth = parseIsoDate(iso).getMonth() === view.getMonth();
                const dis = disabled(iso);
                const sel = iso === value;
                const isToday = iso === todayIso();
                return (
                  <td key={iso} className="p-0.5 text-center" role="gridcell" aria-selected={sel}>
                    <button
                      type="button"
                      data-iso={iso}
                      tabIndex={iso === focus ? 0 : -1}
                      disabled={dis}
                      onClick={() => {
                        setFocus(iso);
                        onChange(iso);
                      }}
                      aria-label={`${formatDateLong(iso)}${isToday ? ", today" : ""}${describeDay ? `, ${describeDay(iso)}` : ""}${dis ? ", unavailable" : ""}`}
                      className={cx(
                        "mx-auto grid size-11 place-items-center rounded-full text-sm tabular transition-colors",
                        !inMonth && "opacity-40",
                        sel && "bg-primary font-bold text-on-primary",
                        !sel && !dis && "hover:bg-primary-soft",
                        !sel && isToday && "font-bold text-primary ring-1 ring-primary",
                        dis && "cursor-not-allowed text-disabled line-through",
                      )}
                    >
                      {parseIsoDate(iso).getDate()}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
 * DateStrip: horizontal quick-pick (mobile-friendly)
 * ======================================================= */
export function DateStrip({ value, onChange, onMore, days = 14 }: { value: string; onChange: (iso: string) => void; onMore?: () => void; days?: number }) {
  const list = Array.from({ length: days }, (_, i) => addDays(todayIso(), i));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [value]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = list[Math.min(list.length - 1, Math.max(0, i + d))];
    onChange(n);
    ref.current?.querySelector<HTMLElement>(`[data-iso="${n}"]`)?.focus();
  };
  return (
    <div className="flex items-stretch gap-2">
      <div ref={ref} role="radiogroup" aria-label="Date" className="no-scrollbar -mx-1 flex flex-1 snap-x gap-2 overflow-x-auto px-1 py-1">
        {list.map((iso, i) => {
          const d = parseIsoDate(iso);
          const sel = iso === value;
          return (
            <button
              key={iso}
              type="button"
              role="radio"
              aria-checked={sel}
              data-iso={iso}
              tabIndex={sel ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onChange(iso)}
              aria-label={formatDateLong(iso)}
              className={cx(
                "flex min-h-16 w-16 shrink-0 snap-start flex-col items-center justify-center rounded-xl border text-sm transition-colors duration-150",
                sel ? "border-primary bg-primary text-on-primary" : "border-border bg-surface hover:border-primary",
              )}
            >
              <span className={cx("text-xs font-semibold", !sel && "text-text-muted")}>{relativeDayLabel(iso) ?? d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <span className="font-display text-lg font-bold leading-tight tabular">{d.getDate()}</span>
              <span className={cx("text-[11px]", !sel && "text-text-muted")}>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
            </button>
          );
        })}
      </div>
      {onMore && (
        <button type="button" onClick={onMore} className="shrink-0 rounded-xl border border-border px-3 text-sm font-semibold text-secondary hover:border-secondary">
          More
          <br />
          dates
        </button>
      )}
    </div>
  );
}

/* =========================================================
 * DurationSelector: 2h · 3h · 4h · 6h · Day pass
 * ======================================================= */
export const DURATIONS = [2, 3, 4, 6] as const;
export type DurationValue = (typeof DURATIONS)[number] | "daypass";

export function DurationSelector({
  value,
  onChange,
  minHours = 2,
  maxHours = 12,
  showDayPass = true,
  label = "Duration",
}: {
  value: DurationValue;
  onChange: (v: DurationValue) => void;
  minHours?: number;
  maxHours?: number;
  showDayPass?: boolean;
  label?: string;
}) {
  const options: DurationValue[] = [...DURATIONS.filter((d) => d >= minHours && d <= maxHours), ...(showDayPass ? (["daypass"] as const) : [])];
  const groupRef = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    onChange(options[n]);
    groupRef.current?.querySelectorAll<HTMLElement>('[role="radio"]')[n]?.focus();
  };
  return (
    <div>
      <div ref={groupRef} role="radiogroup" aria-label={label} className="flex rounded-[10px] border border-border-strong bg-surface p-1">
        {options.map((o, i) => {
          const sel = o === value;
          const dp = o === "daypass";
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={sel}
              tabIndex={sel ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => onChange(o)}
              className={cx(
                "flex min-h-11 items-center justify-center gap-1 rounded-[7px] px-2 text-sm font-semibold transition-colors duration-150",
                dp ? "flex-[1.6]" : "flex-1",
                sel ? (dp ? "bg-accent text-[#422006]" : "bg-secondary text-bg") : dp ? "bg-accent-soft text-on-accent hover:brightness-95" : "hover:bg-surface-muted",
              )}
            >
              {dp && <SunIcon weight="fill" className="size-4" aria-hidden />}
              {dp ? "Day pass" : `${o}h`}
              {!dp && <span className="sr-only"> hours</span>}
            </button>
          );
        })}
      </div>
      {minHours > 2 && <p className="mt-1.5 text-xs text-text-muted">Minimum booking at this property: {minHours} hours</p>}
    </div>
  );
}

/* =========================================================
 * GuestStepper
 * ======================================================= */
export function Stepper({ label, sub, value, min, max, onChange }: { label: string; sub?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p id={id} className="font-semibold">
          {label}
        </p>
        {sub && <p className="text-sm text-text-muted">{sub}</p>}
      </div>
      <div className="flex items-center gap-3" role="group" aria-labelledby={id}>
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Remove ${label.toLowerCase().replace(/s$/, "")}`}
          className="grid size-11 place-items-center rounded-full border border-border-strong hover:border-secondary disabled:opacity-35"
        >
          <MinusIcon weight="bold" className="size-4" aria-hidden />
        </button>
        <output className="w-6 text-center text-lg font-bold tabular" aria-live="polite" aria-label={`${value} ${label.toLowerCase()}`}>
          {value}
        </output>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`Add ${label.toLowerCase().replace(/s$/, "")}`}
          className="grid size-11 place-items-center rounded-full border border-border-strong hover:border-secondary disabled:opacity-35"
        >
          <PlusIcon weight="bold" className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function GuestSelector({
  adults,
  childCount,
  onChange,
  max = 6,
}: {
  adults: number;
  childCount: number;
  onChange: (a: number, c: number) => void;
  max?: number;
}) {
  return (
    <div className="divide-y divide-border">
      <Stepper label="Adults" sub="Age 13+" value={adults} min={1} max={max - childCount} onChange={(n) => onChange(n, childCount)} />
      <Stepper label="Children" sub="Age 0–12" value={childCount} min={0} max={max - adults} onChange={(n) => onChange(adults, n)} />
      <p className="pt-3 text-sm text-text-muted">This stay allows up to {max} guests.</p>
    </div>
  );
}

/* =========================================================
 * TimeSlotPicker: the core interaction
 * ======================================================= */
const GROUPS = [
  { label: "Morning", from: 0, to: 12 * 60 },
  { label: "Midday", from: 12 * 60, to: 14 * 60 },
  { label: "Afternoon", from: 14 * 60, to: 24 * 60 },
];

export function TimeSlotPicker({
  availability,
  hours,
  value,
  onChange,
}: {
  availability: Availability | null;
  hours: number;
  value: string | null;
  onChange: (time: string) => void;
}) {
  const valid = useMemo(() => (availability ? validStarts(availability, hours) : new Set<number>()), [availability, hours]);
  const ref = useRef<HTMLDivElement>(null);
  const starts = availability?.slots ?? [];
  const firstValid = starts.find((s) => valid.has(s.minutes))?.time ?? null;
  const validList = starts.filter((s) => valid.has(s.minutes));

  const onKey = (e: React.KeyboardEvent, time: string) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (keys[e.key] == null) return;
    e.preventDefault();
    const i = validList.findIndex((s) => s.time === time);
    const n = validList[(i + keys[e.key] + validList.length) % validList.length];
    if (!n) return;
    onChange(n.time);
    ref.current?.querySelector<HTMLElement>(`[data-time="${n.time}"]`)?.focus();
  };

  if (!availability) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true" aria-label="Loading time slots">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="skeleton h-11 rounded-full" />
        ))}
      </div>
    );
  }

  if (!validList.length) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong p-4 text-center">
        <p className="font-semibold">No {hours}-hour slots left on this date</p>
        <p className="mt-1 text-sm text-text-muted">Try a shorter duration or another date.</p>
      </div>
    );
  }

  const focusTarget = value && valid.has(toMinutes(value)) ? value : firstValid;

  return (
    <div ref={ref} role="radiogroup" aria-label={`Check-in time for ${hours} hours`} className="space-y-4">
      {GROUPS.map((g) => {
        const items = starts.filter((s) => s.minutes >= g.from && s.minutes < g.to);
        if (!items.length) return null;
        return (
          <div key={g.label}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted" aria-hidden>
              {g.label}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {items.map((s) => {
                const ok = valid.has(s.minutes);
                const sel = s.time === value;
                const isNext = s.time === firstValid && !value;
                return (
                  <button
                    key={s.time}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    aria-disabled={!ok || undefined}
                    data-time={s.time}
                    tabIndex={ok && s.time === focusTarget ? 0 : -1}
                    disabled={!ok}
                    onClick={() => ok && onChange(s.time)}
                    onKeyDown={(e) => onKey(e, s.time)}
                    aria-label={`Check in ${s.time}, ${ok ? `check out ${addHours(s.time, hours)}` : s.free ? "not enough time free after this" : "booked"}`}
                    className={cx(
                      "relative flex h-11 items-center justify-center gap-1 rounded-full text-sm font-semibold tabular transition-[background-color,color,transform] duration-150",
                      sel && "bg-primary text-on-primary shadow-sm",
                      !sel && ok && "border border-border-strong bg-surface hover:border-primary hover:bg-primary-soft active:scale-95",
                      !ok && "cursor-not-allowed bg-surface-muted text-disabled line-through",
                      isNext && "ring-2 ring-pool ring-offset-1 ring-offset-surface",
                    )}
                  >
                    {sel && <CheckIcon weight="bold" className="size-3.5" aria-hidden />}
                    {s.time}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full border border-border-strong bg-surface" aria-hidden /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-surface-muted" aria-hidden /> <span className="line-through">Booked</span>
        </span>
        {!value && firstValid && (
          <span className="inline-flex items-center gap-1.5 font-semibold text-pool">
            <LightningIcon weight="fill" className="size-3.5" aria-hidden /> Next available: {firstValid}
          </span>
        )}
      </p>
    </div>
  );
}
