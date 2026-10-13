"use client";

import { useEffect, useState } from "react";
import type { Property } from "@/lib/types";
import { buildAvailability, dayPassStart, nextAvailableSlot } from "@/lib/availability";
import { todayIso } from "@/lib/time";
import { PropertyCard } from "./property-card";

/** Featured cards with live "next slot" (computed on the client so it uses the visitor's clock). */
export function FeaturedStays({ properties }: { properties: Property[] }) {
  const [live, setLive] = useState<Record<string, { next: string | null; dp: boolean }>>({});
  useEffect(() => {
    const t = todayIso();
    const out: typeof live = {};
    for (const p of properties) {
      const av = buildAvailability(p, p.units[0].id, t);
      out[p.id] = { next: nextAvailableSlot(av, p.minHours), dp: !!dayPassStart(av) };
    }
    setLive(out);
  }, [properties]);

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p, i) => (
        <li key={p.id} className="flex">
          <div className="w-full">
            <PropertyCard property={p} nextSlot={live[p.id] ? live[p.id].next : undefined} dayPassAvailable={live[p.id]?.dp} priority={i < 3} />
          </div>
        </li>
      ))}
    </ul>
  );
}
