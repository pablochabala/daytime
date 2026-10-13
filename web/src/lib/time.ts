export const SLOT_MINUTES = 30;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addHours(hhmm: string, hours: number): string {
  return toHHMM(toMinutes(hhmm) + Math.round(hours * 60));
}

/** Local-date ISO string (YYYY-MM-DD) without timezone drift. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): string {
  return isoDate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

export function formatDateLong(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatDateShort(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function relativeDayLabel(iso: string): string | null {
  const t = todayIso();
  if (iso === t) return "Today";
  if (iso === addDays(t, 1)) return "Tomorrow";
  return null;
}

export function hoursLabel(hours: number): string {
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function windowHours(open: string, close: string): number {
  return (toMinutes(close) - toMinutes(open)) / 60;
}

/** Minutes since midnight for "now", rounded up to the next slot. */
export function nowMinutesRounded(): number {
  const n = new Date();
  const mins = n.getHours() * 60 + n.getMinutes();
  return Math.ceil(mins / SLOT_MINUTES) * SLOT_MINUTES;
}
