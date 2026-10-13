import "server-only";
import { SEED, partnerToProperty } from "@/lib/catalog";
import type { Property } from "@/lib/types";
import { read } from "./db";

/**
 * Public catalogue: seed properties with admin statuses applied, plus partner listings
 * whose owner isn't blocked. Blocked partners' listings disappear from the site.
 */
export function getPublicCatalog(): Property[] {
  const db = read();
  const blocked = new Set(db.users.filter((u) => u.blocked).map((u) => u.id));
  const seed = SEED.map((p) => ({ ...p, status: db.seedStatuses[p.id] ?? p.status }));
  const partners = db.listings.filter((l) => !blocked.has(l.ownerId)).map(partnerToProperty);
  return [...partners, ...seed];
}

export function getPublicProperty(slug: string): Property | undefined {
  return getPublicCatalog().find((p) => p.slug === slug);
}
