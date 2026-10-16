import "server-only";
import { SEED, partnerToProperty } from "@/lib/catalog";
import type { Property } from "@/lib/types";
import { store } from "./db";

/**
 * Public catalogue: seed properties with admin statuses applied, plus partner listings
 * whose owner isn't blocked. Blocked partners' listings disappear from the site.
 */
export async function getPublicCatalog(): Promise<Property[]> {
  const [partners, listings, statuses] = await Promise.all([store.listPartners(), store.listListings(), store.seedStatuses()]);
  const blocked = new Set(partners.filter((u) => u.blocked).map((u) => u.id));
  const seed = SEED.map((p) => ({ ...p, status: statuses[p.id] ?? p.status }));
  return [...listings.filter((l) => !blocked.has(l.ownerId)).map(partnerToProperty), ...seed];
}

export async function getPublicProperty(slug: string): Promise<Property | undefined> {
  return (await getPublicCatalog()).find((p) => p.slug === slug);
}
