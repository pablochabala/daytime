/**
 * Shared catalogue logic (safe for server and browser): seed data, enrichment,
 * partner-listing conversion and search filtering. No I/O here.
 */
import raw from "@/data/properties.json";
import type { Amenity, ListingStatus, PartnerListing, Property, PropertyType, Review, SearchParams, Unit, UseCase } from "./types";
import { buildAvailability, dayPassStart, nextAvailableSlot } from "./availability";
import { toMinutes, todayIso } from "./time";

type RawProperty = (typeof raw.properties)[number] & { stars?: number; featured?: boolean; nearAirport?: string };

const PHOTO_BASE = "https://cf.bstatic.com/xdata/images/hotel/{size}/";

function photoUrl(entry: string): string {
  const [id, key, ext = "jpg"] = entry.split(":");
  return `${PHOTO_BASE}${id}.${ext}?k=${key}&o=`;
}

const UNIT_TEMPLATES: Record<PropertyType, Omit<Unit, "id">[]> = {
  hotel: [
    { name: "Standard room", description: "Queen or twin beds, en-suite shower, desk and smart TV.", priceFactor: 1, maxGuests: 2, features: ["En-suite shower", "Desk", "Smart TV", "Blackout curtains"] },
    { name: "Executive room", description: "Larger room with a work area, coffee machine and lounge access.", priceFactor: 1.25, maxGuests: 2, features: ["Work area", "Coffee machine", "Lounge access", "Bathrobe and slippers"] },
    { name: "Suite", description: "Separate lounge that seats four, ideal for meetings.", priceFactor: 1.6, maxGuests: 4, features: ["Separate lounge", "Seats 4 for meetings", "Bathtub", "Minibar"] },
  ],
  lodge: [
    { name: "Pool and lunch package", description: "Chalet for the day, pool access, towels and a 2-course lunch.", priceFactor: 1, maxGuests: 2, features: ["Pool access", "2-course lunch", "Towels", "Chalet for the day"] },
    { name: "Spa and relax package", description: "Chalet, pool, 60-minute massage and afternoon tea.", priceFactor: 1.45, maxGuests: 2, features: ["60-min massage", "Afternoon tea", "Pool access", "Chalet for the day"] },
    { name: "Family activity package", description: "Family chalet, pool, lunch for 4 and a guided activity.", priceFactor: 1.7, maxGuests: 4, features: ["Lunch for 4", "Guided activity", "Pool access", "Family chalet"] },
  ],
  apartment: [
    { name: "Whole apartment", description: "The entire unit: bedroom, lounge, kitchen and workspace.", priceFactor: 1, maxGuests: 4, features: ["1–2 bedrooms", "Full kitchen", "Workspace", "Private entrance"] },
  ],
};

const REVIEW_POOL: Omit<Review, "date" | "rating">[] = [
  { author: "Mwila", country: "Zambia", useCase: "between-flights", text: "My connection was nine hours. I slept, showered and had lunch, and the shuttle got me back on time. Worth every kwacha." },
  { author: "Thandiwe", country: "South Africa", useCase: "work", text: "Quiet room, strong Wi-Fi and a proper desk. I ran three client calls and finished a report. Much better than a café." },
  { author: "Chanda", country: "Zambia", useCase: "pool-spa", text: "We booked a day pass for my sister's birthday. Pool, lunch and a room to change in. Great value compared with a night." },
  { author: "James", country: "United Kingdom", useCase: "freshen-up", text: "Came straight off an overnight bus and needed to look presentable for a wedding. Check-in was quick and the room was spotless." },
  { author: "Natasha", country: "Zambia", useCase: "rest", text: "Booked three hours in the middle of the day just to sleep. Exactly what I needed, with no awkward questions." },
  { author: "Kelvin", country: "Zambia", useCase: "work", text: "Used it for interviews with candidates. The staff brought tea and kept the corridor quiet. Will book again." },
  { author: "Amara", country: "Nigeria", useCase: "between-flights", text: "Easy booking on my phone and the times were exactly as shown. The check-out time was clear before I paid." },
  { author: "Bwalya", country: "Zambia", useCase: "pool-spa", text: "The day package with lunch is a hidden gem. Kids loved the pool and we were home by evening." },
];

function seededInt(seed: string, mod: number) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h) % mod;
}

export function enrich(r: RawProperty): Property {
  const type = r.type as PropertyType;
  const units = UNIT_TEMPLATES[type].map((u, i) => ({ ...u, id: `${r.id}-u${i + 1}` }));
  const offset = seededInt(r.id, REVIEW_POOL.length);
  const reviews: Review[] = Array.from({ length: 4 }, (_, i) => {
    const base = REVIEW_POOL[(offset + i) % REVIEW_POOL.length];
    const rating = Math.min(10, Math.max(6, Math.round((r.rating + ((i % 3) - 1) * 0.6) * 10) / 10));
    const d = new Date(2026, 8 - i, 3 + ((offset + i * 7) % 25));
    return { ...base, rating, date: d.toISOString().slice(0, 10) };
  });
  const b = (delta: number) => Math.min(10, Math.max(5, Math.round((r.rating + delta) * 10) / 10));
  const amenities = r.amenities as Amenity[];
  return {
    ...r,
    type,
    window: r.window,
    amenities,
    useCases: r.useCases as UseCase[],
    photos: r.photos.map((p, i) => ({
      src: photoUrl(p),
      alt: `${r.name}, ${r.city}: photo ${i + 1} of ${r.photos.length}`,
    })),
    ratingBreakdown: { cleanliness: b(0.3), comfort: b(0.1), location: b(0.4), staff: b(0.2), value: b(0.5), wifi: b(-0.3) },
    includedInBooking: [
      type === "apartment" ? "Exclusive use of the whole apartment" : "Private room for your booked hours",
      "Fresh towels and toiletries",
      ...(amenities.includes("wifi") ? ["Free Wi-Fi"] : []),
      ...(amenities.includes("pool") ? ["Pool access during your booking"] : []),
      ...(amenities.includes("gym") ? ["Gym access"] : []),
      ...(amenities.includes("parking") ? ["Free parking"] : []),
      ...(type === "lodge" ? ["Lunch (on day packages)"] : []),
    ],
    houseRules: [
      `Check-in from ${r.window.open}; check-out by ${r.window.close} at the latest`,
      "Same-day bookings only: check in and out on the same day",
      "Valid photo ID (NRC or passport) required at check-in",
      "Free cancellation up to 2 hours before check-in",
      "No smoking inside rooms",
      type === "apartment" ? "No parties or events without host approval" : "Quiet hours in corridors are respected all day",
    ],
    units,
    reviews,
    source: "Booking.com listing (prototype data)",
    status: "available",
  } as Property;
}

export const SEED: Property[] = (raw.properties as RawProperty[]).map(enrich);

export const CITIES = Array.from(new Set(SEED.map((p) => p.city)));
export const AIRPORTS = [
  { code: "LUN", name: "Kenneth Kaunda International", city: "Lusaka" },
  { code: "LVI", name: "Harry Mwanga Nkumbula International", city: "Livingstone" },
  { code: "NLA", name: "Simon Mwansa Kapwepwe International", city: "Ndola" },
];

export interface SearchResult {
  property: Property;
  nextSlot: string | null;
  dayPassAvailable: boolean;
}

function durationHours(d?: string): number {
  if (!d || d === "daypass") return 2;
  return Number(d) || 2;
}

/** Filter + sort a catalogue for a search. Listings that aren't bookable go last. */
export function searchList(all: Property[], q: SearchParams): SearchResult[] {
  const date = q.date ?? todayIso();
  const hours = durationHours(q.duration);
  const loc = q.location?.trim().toLowerCase();

  const list = all.filter((p) => {
    if (loc) {
      const airport = AIRPORTS.find((a) => loc.includes(a.code.toLowerCase()) || loc.includes(a.name.toLowerCase()));
      const hay = `${p.name} ${p.city} ${p.area} ${p.nearAirport ?? ""}`.toLowerCase();
      if (airport) {
        if (p.city !== airport.city) return false;
      } else if (!loc.split(/[ ,]+/).filter(Boolean).every((w) => hay.includes(w)) && !hay.includes(loc)) return false;
    }
    if (q.types?.length && !q.types.includes(p.type)) return false;
    if (q.guests && p.maxGuests < q.guests) return false;
    if (q.minDiscount && p.discountPct < q.minDiscount) return false;
    if (q.stars?.length && !q.stars.includes(p.stars ?? 0)) return false;
    if (q.minRating && p.rating < q.minRating) return false;
    if (q.amenities?.length && !q.amenities.every((a) => p.amenities.includes(a))) return false;
    if (q.useCase && !p.useCases.includes(q.useCase)) return false;
    const price = q.duration === "daypass" ? p.dayPassRate : p.hourlyRate * hours;
    if (q.minPrice != null && price < q.minPrice) return false;
    if (q.maxPrice != null && price > q.maxPrice) return false;
    if (q.duration && q.duration !== "daypass" && hours < p.minHours) return false;
    return true;
  });

  let results: SearchResult[] = list.map((p) => {
    if (p.status !== "available") return { property: p, nextSlot: null, dayPassAvailable: false };
    const av = buildAvailability(p, p.units[0].id, date);
    return { property: p, nextSlot: nextAvailableSlot(av, Math.max(hours, p.minHours)), dayPassAvailable: !!dayPassStart(av) };
  });

  if (q.checkIn) {
    const want = toMinutes(q.checkIn);
    results = results.filter((r) => r.nextSlot && toMinutes(r.nextSlot) <= want + 120);
  }
  if (q.window) {
    const ranges = { morning: [0, 720], midday: [720, 900], afternoon: [900, 1440] } as const;
    const [a, b] = ranges[q.window];
    results = results.filter((r) => r.nextSlot && toMinutes(r.nextSlot) >= a && toMinutes(r.nextSlot) < b);
  }
  if (q.duration === "daypass") results = results.filter((r) => r.dayPassAvailable);

  const priceOf = (p: Property) => (q.duration === "daypass" ? p.dayPassRate : p.hourlyRate);
  const sorters: Record<NonNullable<SearchParams["sort"]>, (a: SearchResult, b: SearchResult) => number> = {
    saving: (a, b) => b.property.discountPct - a.property.discountPct || priceOf(a.property) - priceOf(b.property),
    price: (a, b) => priceOf(a.property) - priceOf(b.property),
    rating: (a, b) => b.property.rating - a.property.rating,
    distance: (a, b) => a.property.distanceKm - b.property.distanceKm,
    earliest: (a, b) => (a.nextSlot ? toMinutes(a.nextSlot) : 9999) - (b.nextSlot ? toMinutes(b.nextSlot) : 9999),
  };
  const bookable = (r: SearchResult) => (r.property.status === "available" ? 0 : 1);
  results.sort((a, b) => bookable(a) - bookable(b) || sorters[q.sort ?? "saving"](a, b));
  return results;
}

/* ---------------- Partner listings ---------------- */

/** Approximate town centres, used to place partner listings on the map until they set an exact pin. */
const TOWN_CENTRES: Record<string, [number, number]> = {
  lusaka: [-15.4167, 28.2833],
  livingstone: [-17.8419, 25.8543],
  kitwe: [-12.8024, 28.2132],
  ndola: [-12.9587, 28.6366],
  siavonga: [-16.5383, 28.7088],
  "lower zambezi": [-15.75, 29.25],
  kabwe: [-14.4469, 28.4464],
  chipata: [-13.6333, 32.65],
  solwezi: [-12.1833, 26.4],
  kasama: [-10.2129, 31.1808],
  mongu: [-15.2484, 23.1274],
  mazabuka: [-15.8564, 27.7486],
  chingola: [-12.5289, 27.8536],
  mufulira: [-12.55, 28.24],
  luanshya: [-13.1367, 28.4166],
};

const AMENITY_USE_CASES: Partial<Record<Amenity, UseCase[]>> = {
  workspace: ["work"],
  wifi: ["work"],
  pool: ["pool-spa"],
  spa: ["pool-spa"],
  shower: ["freshen-up"],
  "airport-shuttle": ["between-flights"],
};

export const STATUS_LABEL: Record<ListingStatus, string> = {
  available: "Available",
  unavailable: "Unavailable",
  "coming-soon": "Coming soon",
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 60);
}

/** Turn a partner's listing into a public Property (same shape as the seed catalogue). */
export function partnerToProperty(l: PartnerListing): Property {
  const centre = TOWN_CENTRES[l.city.trim().toLowerCase()] ?? TOWN_CENTRES.lusaka;
  const useCases = Array.from(new Set(["rest" as UseCase, ...l.amenities.flatMap((a) => AMENITY_USE_CASES[a] ?? [])]));
  const base = enrich({
    id: l.id,
    slug: l.slug,
    name: l.propertyName,
    type: l.type,
    city: l.city.trim(),
    area: l.city.trim(),
    address: l.address?.trim() || `${l.city.trim()}, Zambia`,
    lat: centre[0],
    lng: centre[1],
    distanceKm: 0,
    summary: l.summary?.trim() || `${l.type[0].toUpperCase() + l.type.slice(1)} in ${l.city.trim()}, available for daytime stays.`,
    description: l.summary?.trim() || "",
    photos: [],
    overnightRate: l.overnightRate,
    discountPct: Math.round((1 - l.dayPassRate / l.overnightRate) * 100),
    dayPassRate: l.dayPassRate,
    hourlyRate: l.hourlyRate,
    window: l.window,
    minHours: l.minHours,
    maxGuests: l.type === "apartment" ? 4 : 2,
    rating: 0,
    reviewCount: 0,
    amenities: l.amenities,
    useCases,
  } as unknown as RawProperty);
  return {
    ...base,
    photos: l.photos.map((id, i) => ({ src: `/api/uploads/${id}`, alt: `${l.propertyName}, ${l.city}: photo ${i + 1} of ${l.photos.length}` })),
    reviews: [],
    ratingBreakdown: { cleanliness: 0, comfort: 0, location: 0, staff: 0, value: 0, wifi: 0 },
    source: "Partner listing",
    status: l.status,
    isNew: true,
    ownerId: l.ownerId,
  };
}
