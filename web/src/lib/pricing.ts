import type { BookingMode, Property, Unit } from "./types";
import { addHours, windowHours } from "./time";

export interface Quote {
  mode: BookingMode;
  hours: number;
  checkIn: string;
  checkOut: string;
  /** Total in ZMW, taxes and fees included. */
  total: number;
  overnight: number;
  saving: number;
  savingPct: number;
  /** When hourly costs more than (or the same as) a day pass, suggest switching. */
  dayPassCheaper: boolean;
  dayPassTotal: number;
}

const round10 = (n: number) => Math.round(n / 10) * 10;

export function unitRates(p: Property, u?: Unit) {
  const f = u?.priceFactor ?? 1;
  return {
    overnight: round10(p.overnightRate * f),
    dayPass: round10(p.dayPassRate * f),
    hourly: round10(p.hourlyRate * f),
  };
}

export function quote(p: Property, u: Unit | undefined, mode: BookingMode, checkIn: string, hours: number): Quote {
  const r = unitRates(p, u);
  const start = mode === "daypass" ? checkIn || p.window.open : checkIn;
  const h = mode === "daypass" ? windowHours(start, p.window.close) : hours;
  const total = mode === "daypass" ? r.dayPass : r.hourly * hours;
  const saving = Math.max(0, r.overnight - total);
  return {
    mode,
    hours: h,
    checkIn: start,
    checkOut: addHours(start, h),
    total,
    overnight: r.overnight,
    saving,
    savingPct: Math.round((saving / r.overnight) * 100),
    dayPassCheaper: mode === "hourly" && r.dayPass <= total,
    dayPassTotal: r.dayPass,
  };
}

/** Partner calculator: given overnight rate + discount, suggest day-pass and hourly rates. */
export function suggestRates(overnight: number, discountPct: number, windowHrs: number) {
  const dayPass = round10(overnight * (1 - discountPct / 100));
  const hourly = round10(dayPass / Math.max(3, Math.min(windowHrs, 10) * 0.45));
  return { dayPass, hourly };
}
