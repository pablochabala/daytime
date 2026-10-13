"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPinIcon, CalendarBlankIcon, ClockIcon, UsersIcon, MagnifyingGlassIcon, AirplaneTiltIcon, BuildingsIcon, CaretDownIcon } from "./icons";
import { Button, Dialog, FilterChip, cx } from "./ui";
import { Calendar, DurationSelector, GuestSelector, type DurationValue } from "./booking-controls";
import { AIRPORTS, CITIES, getPropertiesSync } from "@/lib/api";
import { formatDateShort, relativeDayLabel, todayIso, toHHMM } from "@/lib/time";
import type { PropertyType } from "@/lib/types";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 639px)");
    const f = () => setM(q.matches);
    f();
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  return m;
}

/** Desktop: anchored dropdown. Mobile: bottom sheet. */
function Popover({
  open,
  onClose,
  title,
  children,
  align = "left",
  width = "w-[360px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || mobile) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mobile, onClose]);
  if (!open) return null;
  if (mobile)
    return (
      <Dialog open onClose={onClose} title={title} footer={<Button className="w-full" onClick={onClose}>Done</Button>}>
        {children}
      </Dialog>
    );
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className={cx("animate-pop absolute top-[calc(100%+8px)] z-30 rounded-2xl border border-border bg-surface p-4 shadow-lg", align === "right" ? "right-0" : "left-0", width)}
    >
      {children}
    </div>
  );
}

const TIMES = Array.from({ length: (20 - 6) * 2 + 1 }, (_, i) => toHHMM(6 * 60 + i * 30));

export interface SearchValues {
  location: string;
  date: string;
  checkIn: string;
  duration: DurationValue;
  adults: number;
  children: number;
  types: PropertyType[];
}

export function SearchBar({ initial, variant = "hero" }: { initial?: Partial<SearchValues>; variant?: "hero" | "compact" }) {
  const router = useRouter();
  const [v, setV] = useState<SearchValues>({
    location: "",
    date: todayIso(),
    checkIn: "",
    duration: 3,
    adults: 2,
    children: 0,
    types: [],
    ...initial,
  });
  const [open, setOpen] = useState<null | "date" | "duration" | "guests">(null);
  const [suggest, setSuggest] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const set = <K extends keyof SearchValues>(k: K, val: SearchValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const q = v.location.trim().toLowerCase();
  const suggestions = [
    ...CITIES.map((c) => ({ label: c, sub: "City, Zambia", icon: MapPinIcon })),
    ...AIRPORTS.map((a) => ({ label: `${a.name} (${a.code})`, sub: `Airport, ${a.city}`, icon: AirplaneTiltIcon })),
    ...getPropertiesSync().map((p) => ({ label: p.name, sub: `${p.type[0].toUpperCase() + p.type.slice(1)} in ${p.city}`, icon: BuildingsIcon })),
  ]
    .filter((s) => !q || s.label.toLowerCase().includes(q) || s.sub.toLowerCase().includes(q))
    .slice(0, q ? 7 : 6);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (v.location) p.set("location", v.location);
    p.set("date", v.date);
    if (v.checkIn) p.set("checkIn", v.checkIn);
    p.set("duration", String(v.duration));
    p.set("guests", String(v.adults + v.children));
    if (v.types.length) p.set("types", v.types.join(","));
    router.push(`/search?${p.toString()}`);
  };

  const pick = (label: string) => {
    set("location", label);
    setSuggest(false);
    setActive(-1);
  };

  const guests = v.adults + v.children;
  const fieldBtn = "flex h-full min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-surface-muted";
  const label = "block text-xs font-bold uppercase tracking-wide text-text-muted";

  return (
    <form onSubmit={submit} role="search" aria-label="Find a daytime stay" className={cx("rounded-[24px] border border-border bg-surface shadow-lg", variant === "hero" ? "p-3 md:p-4" : "p-2.5")}>
      {variant === "hero" && (
        <fieldset className="mb-3 flex flex-wrap items-center gap-2 px-1">
          <legend className="sr-only">Property type</legend>
          {(["hotel", "lodge", "apartment"] as const).map((t) => (
            <FilterChip key={t} selected={v.types.includes(t)} onClick={() => set("types", v.types.includes(t) ? v.types.filter((x) => x !== t) : [...v.types, t])}>
              <span className="capitalize">{t}s</span>
            </FilterChip>
          ))}
        </fieldset>
      )}
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.9fr_1.1fr_0.9fr_auto] lg:items-stretch lg:divide-x lg:divide-border">
        {/* Location combobox */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="search-location" className="flex min-h-14 items-center gap-3 rounded-xl px-3 hover:bg-surface-muted">
            <MapPinIcon className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="flex-1">
              <span className={label}>Where</span>
              <input
                id="search-location"
                role="combobox"
                aria-expanded={suggest && suggestions.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
                autoComplete="off"
                placeholder="City, airport or property"
                value={v.location}
                onChange={(e) => {
                  set("location", e.target.value);
                  setSuggest(true);
                  setActive(-1);
                }}
                onFocus={() => setSuggest(true)}
                onBlur={() => setTimeout(() => setSuggest(false), 150)}
                onKeyDown={(e) => {
                  if (!suggest) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(suggestions.length - 1, a + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(-1, a - 1));
                  } else if (e.key === "Enter" && active >= 0) {
                    e.preventDefault();
                    pick(suggestions[active].label);
                  } else if (e.key === "Escape") setSuggest(false);
                }}
                className="block w-full bg-transparent text-base font-semibold text-text placeholder:font-normal placeholder:text-text-subtle focus:outline-none"
              />
            </span>
          </label>
          {suggest && suggestions.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Suggestions" className="animate-pop absolute left-0 right-0 top-[calc(100%+8px)] z-30 max-h-80 overflow-auto rounded-2xl border border-border bg-surface p-2 shadow-lg lg:w-[380px]">
              {!q && <li className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wide text-text-muted" role="presentation">Popular</li>}
              {suggestions.map((s, i) => (
                <li
                  key={s.label}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s.label);
                  }}
                  className={cx("flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 py-2", i === active ? "bg-primary-soft" : "hover:bg-surface-muted")}
                >
                  <s.icon className="size-5 shrink-0 text-secondary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{s.label}</span>
                    <span className="block text-sm text-text-muted">{s.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Date */}
        <div className="relative lg:pl-1">
          <button type="button" className={fieldBtn} aria-haspopup="dialog" aria-expanded={open === "date"} onClick={() => setOpen(open === "date" ? null : "date")}>
            <CalendarBlankIcon className="size-5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className={label}>Date</span>
              <span className="block font-semibold">{relativeDayLabel(v.date) ? `${relativeDayLabel(v.date)}, ${formatDateShort(v.date).split(" ").slice(1).join(" ")}` : formatDateShort(v.date)}</span>
            </span>
          </button>
          <Popover open={open === "date"} onClose={() => setOpen(null)} title="Choose a date">
            <Calendar
              value={v.date}
              onChange={(d) => {
                set("date", d);
                setOpen(null);
              }}
            />
            <p className="mt-2 text-sm text-text-muted">Daytime stays are same-day: you check in and out on this date.</p>
          </Popover>
        </div>

        {/* Check-in time */}
        <div className="lg:pl-1">
          <label htmlFor="search-time" className={cx(fieldBtn, "cursor-pointer")}>
            <ClockIcon className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="relative flex-1">
              <span className={label}>Check-in</span>
              <select
                id="search-time"
                value={v.checkIn}
                onChange={(e) => set("checkIn", e.target.value)}
                className="block w-full appearance-none bg-transparent pr-5 font-semibold text-text focus:outline-none"
              >
                <option value="">Any time</option>
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <CaretDownIcon className="pointer-events-none absolute bottom-1 right-0 size-4 text-text-muted" aria-hidden />
            </span>
          </label>
        </div>

        {/* Duration */}
        <div className="relative lg:pl-1">
          <button type="button" className={fieldBtn} aria-haspopup="dialog" aria-expanded={open === "duration"} onClick={() => setOpen(open === "duration" ? null : "duration")}>
            <ClockIcon weight="fill" className="size-5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className={label}>Duration</span>
              <span className="block font-semibold">{v.duration === "daypass" ? "Day pass" : `${v.duration} hours`}</span>
            </span>
          </button>
          <Popover open={open === "duration"} onClose={() => setOpen(null)} title="How long do you need?" width="w-[420px]">
            <DurationSelector
              value={v.duration}
              onChange={(d) => {
                set("duration", d);
              }}
            />
            <p className="mt-3 text-sm text-text-muted">
              <strong className="text-text">Day pass</strong> gives you the property&apos;s full daytime window (typically 08:00–18:00) for one fixed price.
            </p>
          </Popover>
        </div>

        {/* Guests */}
        <div className="relative lg:pl-1">
          <button type="button" className={fieldBtn} aria-haspopup="dialog" aria-expanded={open === "guests"} onClick={() => setOpen(open === "guests" ? null : "guests")}>
            <UsersIcon className="size-5 shrink-0 text-primary" aria-hidden />
            <span>
              <span className={label}>Guests</span>
              <span className="block font-semibold">
                {guests} guest{guests > 1 ? "s" : ""}
              </span>
            </span>
          </button>
          <Popover open={open === "guests"} onClose={() => setOpen(null)} title="Who's coming?" align="right" width="w-[340px]">
            <GuestSelector adults={v.adults} childCount={v.children} onChange={(a, c) => setV((s) => ({ ...s, adults: a, children: c }))} />
          </Popover>
        </div>

        <div className="pt-2 sm:col-span-2 lg:col-span-1 lg:pl-3 lg:pt-0">
          <Button type="submit" size="lg" className="h-full min-h-14 w-full lg:w-auto">
            <MagnifyingGlassIcon weight="bold" className="size-5" aria-hidden />
            <span>Search</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
