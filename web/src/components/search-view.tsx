"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FunnelIcon, ListBulletsIcon, MapTrifoldIcon, MagnifyingGlassIcon, XIcon } from "./icons";
import { Button, Dialog, FilterChip, cx } from "./ui";
import { PropertyCard, PropertyCardSkeleton } from "./property-card";
import { SearchBar } from "./search-bar";
import { searchProperties, type SearchResult } from "@/lib/api";
import type { Amenity, PropertyType, SearchParams, UseCase } from "@/lib/types";
import { AMENITY_LABEL, USE_CASE_LABEL } from "@/lib/config";
import { formatDateShort, todayIso } from "@/lib/time";
import { useApp } from "./providers";
import type { DurationValue } from "./booking-controls";

const StaysMap = dynamic(() => import("./stays-map"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" aria-label="Loading map" />,
});

const SORTS: { value: NonNullable<SearchParams["sort"]>; label: string }[] = [
  { value: "saving", label: "Biggest saving" },
  { value: "price", label: "Lowest price" },
  { value: "rating", label: "Top rated" },
  { value: "distance", label: "Distance from centre" },
  { value: "earliest", label: "Earliest available slot" },
];

const FILTER_AMENITIES: Amenity[] = ["wifi", "pool", "gym", "spa", "workspace", "parking", "shower", "kitchen"];

function parse(sp: URLSearchParams): SearchParams {
  const list = <T extends string>(k: string) => (sp.get(k) ? (sp.get(k)!.split(",").filter(Boolean) as T[]) : undefined);
  const num = (k: string) => (sp.get(k) ? Number(sp.get(k)) : undefined);
  return {
    location: sp.get("location") ?? undefined,
    date: sp.get("date") ?? undefined,
    checkIn: sp.get("checkIn") ?? undefined,
    duration: sp.get("duration") ?? undefined,
    guests: num("guests"),
    types: list<PropertyType>("types"),
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minDiscount: num("minDiscount"),
    stars: list<string>("stars")?.map(Number),
    minRating: num("minRating"),
    window: (sp.get("window") as SearchParams["window"]) ?? undefined,
    amenities: list<Amenity>("amenities"),
    useCase: (sp.get("useCase") as UseCase) ?? undefined,
    sort: (sp.get("sort") as SearchParams["sort"]) ?? undefined,
  };
}

export function SearchView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { money } = useApp();
  const spKey = sp.toString();
  const q = useMemo(() => parse(new URLSearchParams(spKey)), [spKey]);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editSearch, setEditSearch] = useState(false);

  useEffect(() => {
    let alive = true;
    setResults(null);
    searchProperties(q)
      .then((r) => alive && setResults(r))
      .catch((e) => {
        console.error("Search failed", e);
        if (alive) setResults([]);
      });
    return () => {
      alive = false;
    };
  }, [q]);

  const update = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") n.delete(k);
      else n.set(k, v);
    }
    router.replace(`${pathname}?${n.toString()}`, { scroll: false });
  };
  const toggleList = (key: string, value: string, current?: (string | number)[]) => {
    const cur = (current ?? []).map(String);
    const next = cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
    update({ [key]: next.join(",") || undefined });
  };

  const hours = q.duration && q.duration !== "daypass" ? Number(q.duration) : undefined;
  const date = q.date ?? todayIso();
  const activeFilters =
    (q.types?.length ?? 0) +
    (q.amenities?.length ?? 0) +
    (q.stars?.length ?? 0) +
    [q.minPrice, q.maxPrice, q.minDiscount, q.minRating, q.window, q.useCase].filter((x) => x != null).length;
  const clearFilters = () =>
    update({ types: undefined, amenities: undefined, stars: undefined, minPrice: undefined, maxPrice: undefined, minDiscount: undefined, minRating: undefined, window: undefined, useCase: undefined });

  const filters = (
    <div className="space-y-7">
      <FilterGroup title="Property type">
        {(["hotel", "lodge", "apartment"] as const).map((t) => (
          <FilterChip key={t} selected={!!q.types?.includes(t)} onClick={() => toggleList("types", t, q.types)}>
            <span className="capitalize">{t}</span>
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Good for">
        {(Object.keys(USE_CASE_LABEL) as UseCase[]).map((u) => (
          <FilterChip key={u} selected={q.useCase === u} onClick={() => update({ useCase: q.useCase === u ? undefined : u })}>
            {USE_CASE_LABEL[u]}
          </FilterChip>
        ))}
      </FilterGroup>

      <fieldset>
        <legend className="mb-3 text-sm font-bold">Price {q.duration === "daypass" ? "(day pass)" : hours ? `(for ${hours} hours)` : "(per hour)"}</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["minPrice", "maxPrice"] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-1 block text-xs font-semibold text-text-muted">{k === "minPrice" ? "Min (ZMW)" : "Max (ZMW)"}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={50}
                defaultValue={q[k] ?? ""}
                onBlur={(e) => update({ [k]: e.target.value || undefined })}
                onKeyDown={(e) => e.key === "Enter" && update({ [k]: (e.target as HTMLInputElement).value || undefined })}
                className="h-11 w-full rounded-[10px] border border-border-strong bg-surface px-3 text-base"
                placeholder={k === "minPrice" ? "0" : "Any"}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <FilterGroup title="Discount">
        {[50, 55, 60, 65].map((d) => (
          <FilterChip key={d} selected={q.minDiscount === d} onClick={() => update({ minDiscount: q.minDiscount === d ? undefined : String(d) })}>
            {d}%+ off
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Available window">
        {(
          [
            ["morning", "Morning (before 12:00)"],
            ["midday", "Midday (12:00–14:00)"],
            ["afternoon", "Afternoon (after 14:00)"],
          ] as const
        ).map(([w, l]) => (
          <FilterChip key={w} selected={q.window === w} onClick={() => update({ window: q.window === w ? undefined : w })}>
            {l}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Duration">
        {(["2", "3", "4", "6", "daypass"] as const).map((d) => (
          <FilterChip key={d} selected={(q.duration ?? "3") === d} onClick={() => update({ duration: d })}>
            {d === "daypass" ? "Day pass" : `${d} hours`}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Star rating">
        {[3, 4, 5].map((s) => (
          <FilterChip key={s} selected={!!q.stars?.includes(s)} onClick={() => toggleList("stars", String(s), q.stars)}>
            {s} stars
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Guest rating">
        {[
          [9, "Superb 9+"],
          [8.5, "Excellent 8.5+"],
          [8, "Very good 8+"],
        ].map(([r, l]) => (
          <FilterChip key={r} selected={q.minRating === r} onClick={() => update({ minRating: q.minRating === r ? undefined : String(r) })}>
            {l}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Amenities">
        {FILTER_AMENITIES.map((a) => (
          <FilterChip key={a} selected={!!q.amenities?.includes(a)} onClick={() => toggleList("amenities", a, q.amenities)}>
            {AMENITY_LABEL[a]}
          </FilterChip>
        ))}
      </FilterGroup>
    </div>
  );

  const summary = [
    q.location || "All of Zambia",
    formatDateShort(date),
    q.checkIn ? `from ${q.checkIn}` : null,
    q.duration === "daypass" ? "Day pass" : `${q.duration ?? 3} hours`,
    q.guests ? `${q.guests} guest${q.guests > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-6 md:px-6 xl:px-8">
      {/* Search summary / edit */}
      <div className="mb-6">
        <div className="hidden lg:block">
          <SearchBar
            key={sp.toString()}
            variant="compact"
            initial={{
              location: q.location ?? "",
              date,
              checkIn: q.checkIn ?? "",
              duration: (q.duration === "daypass" ? "daypass" : Number(q.duration ?? 3)) as DurationValue,
              adults: Math.max(1, q.guests ?? 2),
              types: q.types ?? [],
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setEditSearch(true)}
          className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 text-left shadow-sm lg:hidden"
        >
          <MagnifyingGlassIcon weight="bold" className="size-5 shrink-0 text-primary" aria-hidden />
          <span className="flex-1 truncate">
            <span className="block text-xs font-bold uppercase tracking-wide text-text-muted">Your search</span>
            <span className="block truncate font-semibold">{summary}</span>
          </span>
          <span className="text-sm font-semibold text-secondary">Edit</span>
        </button>
        <Dialog open={editSearch} onClose={() => setEditSearch(false)} title="Edit search">
          <SearchBar
            initial={{
              location: q.location ?? "",
              date,
              checkIn: q.checkIn ?? "",
              duration: (q.duration === "daypass" ? "daypass" : Number(q.duration ?? 3)) as DurationValue,
              adults: Math.max(1, q.guests ?? 2),
              types: q.types ?? [],
            }}
          />
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Desktop filters */}
        <aside className="hidden lg:block" aria-labelledby="filters-h">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="filters-h" className="font-sans text-lg font-bold">
                Filters
              </h2>
              {activeFilters > 0 && (
                <button type="button" onClick={clearFilters} className="min-h-11 text-sm font-semibold text-secondary underline-offset-2 hover:underline">
                  Clear all ({activeFilters})
                </button>
              )}
            </div>
            {filters}
          </div>
        </aside>

        <section aria-labelledby="results-h" aria-busy={results === null}>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <h1 id="results-h" className="mr-auto font-sans text-xl font-bold md:text-2xl" aria-live="polite">
              {results === null ? "Finding stays…" : `${results.length} stay${results.length === 1 ? "" : "s"} ${q.location ? `in ${q.location}` : "in Zambia"}`}
            </h1>
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
              <FunnelIcon className="size-4" aria-hidden /> Filters{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-text-muted">Sort</span>
              <select
                value={q.sort ?? "saving"}
                onChange={(e) => update({ sort: e.target.value === "saving" ? undefined : e.target.value })}
                className="h-11 rounded-[10px] border border-border-strong bg-surface px-3 font-semibold"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div role="group" aria-label="Results view" className="flex rounded-[10px] border border-border-strong bg-surface p-1">
              {(
                [
                  ["list", "List", ListBulletsIcon],
                  ["map", "Map", MapTrifoldIcon],
                ] as const
              ).map(([v, l, Icon]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cx("flex min-h-9 items-center gap-1.5 rounded-[7px] px-3 text-sm font-semibold", view === v ? "bg-secondary text-bg" : "hover:bg-surface-muted")}
                >
                  <Icon className="size-4" aria-hidden /> {l}
                </button>
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          {activeFilters > 0 && (
            <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
              <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface-muted px-3 text-sm font-semibold">
                <XIcon className="size-3.5" aria-hidden /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
              </button>
            </div>
          )}

          {results === null ? (
            <ul className={cx("grid gap-5", view === "list" ? "" : "md:grid-cols-2")} aria-label="Loading results">
              {Array.from({ length: 4 }, (_, i) => (
                <li key={i}>
                  <PropertyCardSkeleton horizontal={view === "list"} />
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface p-8 text-center md:p-12">
              <MagnifyingGlassIcon className="mx-auto size-12 text-primary" aria-hidden />
              <h2 className="mt-3 text-2xl font-semibold">No stays match all of that</h2>
              <p className="mx-auto mt-2 max-w-md text-text-muted">
                Try a different date, a shorter duration or fewer filters. Daytime stays are available in Lusaka, Livingstone, Kitwe, Ndola, Siavonga and the Lower Zambezi.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {activeFilters > 0 && <Button onClick={clearFilters}>Clear {activeFilters} filters</Button>}
                {q.location && (
                  <Button variant="secondary" onClick={() => update({ location: undefined })}>
                    Search all of Zambia
                  </Button>
                )}
                {q.checkIn && (
                  <Button variant="secondary" onClick={() => update({ checkIn: undefined })}>
                    Any check-in time
                  </Button>
                )}
              </div>
            </div>
          ) : view === "list" ? (
            <ul className="grid gap-5">
              {results.map((r, i) => (
                <li key={r.property.id}>
                  <PropertyCard
                    layout="horizontal"
                    property={r.property}
                    nextSlot={r.nextSlot}
                    hours={hours}
                    dayPassAvailable={r.dayPassAvailable}
                    priority={i < 2}
                    href={`/property/${r.property.slug}?${new URLSearchParams({ date, ...(q.duration ? { duration: q.duration } : {}), ...(q.checkIn ? { checkIn: q.checkIn } : {}) }).toString()}`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
              <StaysMap
                className="h-[60dvh] min-h-[420px] overflow-hidden rounded-2xl border border-border"
                items={results.map((r) => ({
                  property: r.property,
                  label: q.duration === "daypass" ? money(r.property.dayPassRate) : `${money(r.property.hourlyRate)}/h`,
                }))}
              />
              <ul className="hidden max-h-[60dvh] space-y-3 overflow-y-auto xl:block" aria-label="Stays on the map">
                {results.map((r) => (
                  <li key={r.property.id}>
                    <a href={`/property/${r.property.slug}?date=${date}`} className="block rounded-xl border border-border bg-surface p-3 hover:border-primary">
                      <span className="block font-semibold">{r.property.name}</span>
                      <span className="block text-sm text-text-muted">
                        {money(r.property.hourlyRate)}/h · Save {r.property.discountPct}% · {r.nextSlot ? `Next ${r.nextSlot}` : "Fully booked"}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <Dialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-3">
            {activeFilters > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear all
              </Button>
            )}
            <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
              {results === null ? "Updating…" : `Show ${results.length} stay${results.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        }
      >
        {filters}
      </Dialog>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-bold">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
