import type { Availability, Property, Slot } from "./types";
import { SLOT_MINUTES, nowMinutesRounded, toHHMM, toMinutes, todayIso } from "./time";

/** Small deterministic PRNG so mock availability is stable per property/unit/date. */
function seeded(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Mock availability: 30-minute blocks across the daytime window, with a few
 * existing bookings carved out. Swap this for a real API call later.
 */
export function buildAvailability(p: Property, unitId: string, date: string): Availability {
  const open = toMinutes(p.window.open);
  const close = toMinutes(p.window.close);
  const rand = seeded(`${p.id}|${unitId}|${date}`);
  const blocks = (close - open) / SLOT_MINUTES;
  const free = new Array<boolean>(blocks).fill(true);

  // 0–2 existing bookings of 2–3 hours each.
  const bookings = rand() < 0.45 ? 0 : 1 + Math.floor(rand() * 2);
  for (let b = 0; b < bookings; b++) {
    const len = (2 + Math.floor(rand() * 2)) * 2;
    const start = Math.floor(rand() * blocks);
    for (let i = start; i < Math.min(blocks, start + len); i++) free[i] = false;
  }

  // Past times today are not bookable.
  if (date === todayIso()) {
    const now = nowMinutesRounded();
    for (let i = 0; i < blocks; i++) if (open + i * SLOT_MINUTES < now) free[i] = false;
  }

  const slots: Slot[] = free.map((f, i) => ({
    time: toHHMM(open + i * SLOT_MINUTES),
    minutes: open + i * SLOT_MINUTES,
    free: f,
  }));
  return { propertyId: p.id, unitId, date, slots };
}

/** A start time is valid only if every 30-min block for the whole duration is free and inside the window. */
export function canStartAt(av: Availability, startMinutes: number, hours: number): boolean {
  const need = (hours * 60) / SLOT_MINUTES;
  const idx = av.slots.findIndex((s) => s.minutes === startMinutes);
  if (idx < 0 || idx + need > av.slots.length) return false;
  for (let i = idx; i < idx + need; i++) if (!av.slots[i].free) return false;
  return true;
}

export function validStarts(av: Availability, hours: number): Set<number> {
  const out = new Set<number>();
  for (const s of av.slots) if (canStartAt(av, s.minutes, hours)) out.add(s.minutes);
  return out;
}

/**
 * Day pass: the rest of the daytime window must be free (from opening, or from the
 * next slot if the window has already started today). Needs at least half the window left.
 * Returns the day-pass check-in time, or null.
 */
export function dayPassStart(av: Availability): string | null {
  // Past slots today are marked unavailable; skip them.
  let start = 0;
  if (av.date === todayIso()) {
    const now = nowMinutesRounded();
    start = av.slots.findIndex((s) => s.minutes >= now);
    if (start < 0) return null;
  }
  const rest = av.slots.slice(start);
  if (rest.length < av.slots.length / 2) return null;
  return rest.every((s) => s.free) ? rest[0].time : null;
}

export function nextAvailableSlot(av: Availability, hours: number): string | null {
  for (const s of av.slots) if (canStartAt(av, s.minutes, hours)) return s.time;
  return null;
}

export function freeSlotCount(av: Availability, hours: number): number {
  return validStarts(av, hours).size;
}
