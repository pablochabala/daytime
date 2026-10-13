/**
 * Browser data access. Components get data only through these functions.
 * The live catalogue (seed + partner listings, with admin statuses) comes from /api/properties.
 */
import type { Availability, Property, SearchParams } from "./types";
import { buildAvailability } from "./availability";
import { SEED, searchList, type SearchResult } from "./catalog";

export { AIRPORTS, CITIES, type SearchResult } from "./catalog";

let cache: { at: number; promise: Promise<Property[]> } | null = null;
/** Last catalogue loaded from the server (seed data until the first load finishes). */
let latest: Property[] = SEED;

/** Live public catalogue, cached for 30 seconds. Falls back to the seed data if the server can't be reached. */
export function loadCatalog(force = false): Promise<Property[]> {
  if (!force && cache && Date.now() - cache.at < 30_000) return cache.promise;
  const promise = fetch("/api/properties", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Property[]>) : SEED))
    .catch(() => SEED)
    .then((list) => (latest = list));
  cache = { at: Date.now(), promise };
  return promise;
}

/** Synchronous view of the catalogue. Pair with useCatalog() so components re-render once the live list arrives. */
export function getPropertiesSync(): Property[] {
  return latest;
}

export function getPropertySync(slugOrId: string): Property | undefined {
  return latest.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export async function findProperty(slugOrId: string): Promise<Property | undefined> {
  return (await loadCatalog()).find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export async function getAvailability(propertyId: string, unitId: string, date: string): Promise<Availability> {
  const p = await findProperty(propertyId);
  if (!p) throw new Error("Property not found");
  return buildAvailability(p, unitId, date);
}

export async function searchProperties(q: SearchParams): Promise<SearchResult[]> {
  return searchList(await loadCatalog(), q);
}
