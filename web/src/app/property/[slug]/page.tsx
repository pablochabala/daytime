import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProperty } from "@/lib/server/catalog";
import { STATUS_LABEL } from "@/lib/catalog";
import { Gallery } from "@/components/gallery";
import { PropertyBooking, PropertyMapBlock } from "@/components/property-client";
import { WishlistButton } from "@/components/property-card";
import { Money, Rating, SavingsBadge, Stars, TypeChip } from "@/components/ui";
import { ratingWord } from "@/lib/rating";
import { AMENITY_LABEL, USE_CASE_LABEL } from "@/lib/config";
import { windowHours } from "@/lib/time";
import {
  MapPinIcon,
  SunIcon,
  CheckIcon,
  WifiHighIcon,
  SwimmingPoolIcon,
  BarbellIcon,
  FlowerLotusIcon,
  DeskIcon,
  CarIcon,
  ShowerIcon,
  CookingPotIcon,
  ForkKnifeIcon,
  VanIcon,
  TreeIcon,
  WineIcon,
  ClockIcon,
  UsersIcon,
  CaretLeftIcon,
  AirplaneTiltIcon,
  NavigationArrowIcon,
} from "@/components/icons";
import type { Amenity } from "@/lib/types";

const AMENITY_ICON: Record<Amenity, typeof WifiHighIcon> = {
  wifi: WifiHighIcon,
  pool: SwimmingPoolIcon,
  gym: BarbellIcon,
  spa: FlowerLotusIcon,
  workspace: DeskIcon,
  parking: CarIcon,
  shower: ShowerIcon,
  kitchen: CookingPotIcon,
  restaurant: ForkKnifeIcon,
  "airport-shuttle": VanIcon,
  garden: TreeIcon,
  bar: WineIcon,
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPublicProperty((await params).slug);
  return p ? { title: `${p.name}, ${p.city}: day use from K ${p.hourlyRate}/h`, description: p.summary } : {};
}

const STATUS_STYLE = {
  available: "bg-savings-soft text-savings-ink",
  unavailable: "bg-surface-muted text-text",
  "coming-soon": "bg-accent-soft text-on-accent",
} as const;

function StatusBanner({ status, name }: { status: "unavailable" | "coming-soon"; name: string }) {
  return (
    <p role="status" className={`mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold ${STATUS_STYLE[status]}`}>
      <ClockIcon weight="fill" className="size-5 shrink-0" aria-hidden />
      {status === "coming-soon" ? `Coming soon: ${name} isn't taking bookings yet.` : `Unavailable: ${name} isn't taking bookings right now.`}
    </p>
  );
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await getPublicProperty((await params).slug);
  if (!p) notFound();
  const sp = await searchParams;
  const unitHeading = p.type === "hotel" ? "Rooms available for day use" : p.type === "lodge" ? "Day packages" : "The apartment";

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-32 pt-4 md:px-6 lg:pb-10 xl:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-text-muted">
          <li>
            <Link href="/search" className="inline-flex min-h-11 items-center gap-1 font-semibold text-secondary hover:underline">
              <CaretLeftIcon weight="bold" className="size-4" aria-hidden /> All stays
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/search?location=${encodeURIComponent(p.city)}`} className="hover:underline">
              {p.city}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate">
            {p.name}
          </li>
        </ol>
      </nav>

      {p.status !== "available" && <StatusBanner status={p.status} name={p.name} />}
      <Gallery photos={p.photos} name={p.name} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-12">
          {/* Overview */}
          <section aria-labelledby="overview">
            <div className="flex flex-wrap items-center gap-2">
              <TypeChip type={p.type} />
              <Stars n={p.stars} />
              <SavingsBadge pct={p.discountPct} />
            </div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 id="overview" className="text-3xl font-bold leading-tight text-secondary md:text-4xl">
                {p.name}
              </h1>
              <WishlistButton property={p} className="shrink-0 border border-border" />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-text-muted">
              <MapPinIcon className="size-5 shrink-0" aria-hidden /> {p.address}
            </p>
            <div className="mt-3">
              {p.isNew ? <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-sm font-semibold text-on-accent">New on Daytime</span> : <Rating value={p.rating} count={p.reviewCount} />}
            </div>
            <p className="mt-5 max-w-[68ch] text-lg">{p.summary}</p>
            <p className="mt-3 max-w-[68ch] text-text-muted">{p.description}</p>

            <dl className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface p-4">
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
                  <SunIcon weight="fill" className="size-4 text-accent" aria-hidden /> Daytime window
                </dt>
                <dd className="mt-1 font-display text-xl font-bold tabular">
                  {p.window.open}–{p.window.close}
                </dd>
                <dd className="text-sm text-text-muted">{windowHours(p.window.open, p.window.close)} hours, same day</dd>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
                  <ClockIcon className="size-4 text-primary" aria-hidden /> Minimum booking
                </dt>
                <dd className="mt-1 font-display text-xl font-bold">{p.minHours} hours</dd>
                <dd className="text-sm text-text-muted">Or a full day pass</dd>
              </div>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <dt className="flex items-center gap-1.5 text-sm font-semibold text-text-muted">
                  <UsersIcon className="size-4 text-primary" aria-hidden /> Guests
                </dt>
                <dd className="mt-1 font-display text-xl font-bold">Up to {p.maxGuests}</dd>
                <dd className="text-sm text-text-muted">Good for: {p.useCases.slice(0, 2).map((u) => USE_CASE_LABEL[u].toLowerCase()).join(", ")}</dd>
              </div>
            </dl>
            {p.nearAirport && (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-secondary-soft p-3 text-sm font-semibold text-secondary">
                <AirplaneTiltIcon weight="fill" className="size-5 shrink-0" aria-hidden /> Close to {p.nearAirport}: great for layovers.
              </p>
            )}
          </section>

          {/* Included */}
          <section aria-labelledby="included">
            <h2 id="included" className="text-2xl font-semibold text-secondary">
              Included with your booking
            </h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {p.includedInBooking.map((i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckIcon weight="bold" className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
            <h3 className="mt-8 font-sans text-lg font-bold">Amenities</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {p.amenities.map((a) => {
                const Icon = AMENITY_ICON[a];
                return (
                  <li key={a} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium">
                    <Icon className="size-5 text-secondary" aria-hidden /> {AMENITY_LABEL[a]}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Units */}
          <section aria-labelledby="units">
            <h2 id="units" className="text-2xl font-semibold text-secondary">
              {unitHeading}
            </h2>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {p.units.map((u) => (
                <li key={u.id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans text-lg font-bold">{u.name}</h3>
                    <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold">Up to {u.maxGuests} guests</span>
                  </div>
                  <p className="mt-1 text-text-muted">{u.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    {u.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckIcon weight="bold" className="size-4 text-success" aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-bold tabular">
                    <Money zmw={Math.round((p.hourlyRate * u.priceFactor) / 10) * 10} />/h <span className="font-normal text-text-muted">·</span> <Money zmw={Math.round((p.dayPassRate * u.priceFactor) / 10) * 10} /> day pass
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Rules */}
          <section aria-labelledby="rules">
            <h2 id="rules" className="text-2xl font-semibold text-secondary">
              House rules
            </h2>
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
              {p.houseRules.map((r) => (
                <li key={r} className="px-5 py-3.5">
                  {r}
                </li>
              ))}
            </ul>
          </section>

          {/* Location */}
          <section aria-labelledby="location">
            <h2 id="location" className="text-2xl font-semibold text-secondary">
              Location
            </h2>
            <p className="mb-4 mt-1 text-text-muted">
              {p.address}. {p.distanceKm} km from {p.city} centre.
            </p>
            <PropertyMapBlock property={p} />
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-secondary hover:underline"
            >
              <NavigationArrowIcon className="size-5" aria-hidden /> Get directions (opens Google Maps)
            </a>
          </section>

          {/* Reviews */}
          <section aria-labelledby="reviews">
            <h2 id="reviews" className="text-2xl font-semibold text-secondary">
              Guest reviews
            </h2>
            {p.isNew ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border-strong p-6 text-text-muted">No reviews yet. {p.name} is new on Daytime.</p>
            ) : (
            <>
            <div className="mt-4 grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="rounded-2xl bg-secondary p-5 text-bg">
                <p className="font-display text-5xl font-bold tabular">{p.rating.toFixed(1)}</p>
                <p className="mt-1 font-semibold">{ratingWord(p.rating)}</p>
                <p className="text-sm opacity-85">{p.reviewCount.toLocaleString("en-GB")} reviews</p>
              </div>
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {Object.entries(p.ratingBreakdown).map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-sm">
                      <dt className="font-semibold capitalize">{k === "wifi" ? "Free Wi-Fi" : k}</dt>
                      <dd className="tabular">{v.toFixed(1)}</dd>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                      <div className="h-full rounded-full bg-secondary" style={{ width: `${v * 10}%` }} />
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {p.reviews.map((r) => (
                <li key={r.author + r.date} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-primary-soft font-bold text-primary" aria-hidden>
                      {r.author[0]}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{r.author}</p>
                      <p className="text-sm text-text-muted">
                        {r.country} · {USE_CASE_LABEL[r.useCase]} · {new Date(r.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span className="rounded-md bg-secondary px-2 py-1 text-sm font-bold text-bg tabular">{r.rating.toFixed(1)}</span>
                  </div>
                  <p className="mt-3">{r.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-text-muted">Sample reviews for the prototype. The overall score and count come from the property&apos;s public listing.</p>
            </>
            )}
          </section>
        </div>

        {p.status === "available" ? (
          <PropertyBooking property={p} init={{ date: sp.date, duration: sp.duration, checkIn: sp.checkIn }} />
        ) : (
          <aside aria-label="Booking" className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[24px] border border-border bg-surface p-6">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
              <p className="mt-3 font-display text-xl font-semibold">{p.status === "coming-soon" ? "Bookings open soon" : "Not taking bookings right now"}</p>
              <p className="mt-1 text-text-muted">
                {p.status === "coming-soon"
                  ? "This stay is being set up on Daytime. Save it to your wishlist and check back soon."
                  : "This stay isn't available to book at the moment. Browse similar stays nearby."}
              </p>
              <Link href={`/search?location=${encodeURIComponent(p.city)}`} className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover">
                See available stays in {p.city}
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
