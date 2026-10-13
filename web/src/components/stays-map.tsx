"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Property } from "@/lib/types";
import { useApp } from "./providers";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export interface MapItem {
  property: Property;
  label?: string;
}

/** Price-pin map. Used on search results (many pins) and property detail (one pin). */
export default function StaysMap({ items, className, height = "100%", single }: { items: MapItem[]; className?: string; height?: string; single?: boolean }) {
  const { money } = useApp();
  const points = useMemo(() => items.map((i) => [i.property.lat, i.property.lng] as [number, number]), [items]);

  return (
    <div className={className} style={{ height }}>
      <MapContainer
        center={points[0] ?? [-15.4167, 28.2833]}
        zoom={12}
        scrollWheelZoom={!single}
        style={{ height: "100%", width: "100%", borderRadius: 16 }}
        aria-label={single ? `Map showing ${items[0]?.property.name}` : "Map of stays"}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {items.map(({ property: p, label }) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            title={`${p.name}: ${label ?? money(p.hourlyRate) + " per hour"}`}
            alt={p.name}
            icon={L.divIcon({
              className: "",
              html: `<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap;padding:6px 10px;border-radius:999px;background:var(--color-surface);color:var(--color-text);font:700 13px var(--font-sans);box-shadow:0 4px 12px rgb(0 0 0/.18);border:2px solid var(--color-primary);transform:translate(-50%,-100%)">${label ?? money(p.hourlyRate) + "/h"}${single ? "" : `<span style="background:var(--color-savings);color:var(--color-on-savings);border-radius:999px;padding:1px 6px;font-size:11px">-${p.discountPct}%</span>`}</span>`,
              iconSize: [0, 0],
            })}
          >
            {!single && (
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{p.name}</p>
                  <p style={{ margin: "2px 0 6px", fontSize: 13 }}>
                    {money(p.hourlyRate)}/h · {money(p.dayPassRate)} day pass · Save {p.discountPct}%
                  </p>
                  <Link href={`/property/${p.slug}`} style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                    View stay →
                  </Link>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
