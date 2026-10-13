import Link from "next/link";
import { AIRPORTS } from "@/lib/catalog";
import { getPublicCatalog } from "@/lib/server/catalog";
import { SearchBar } from "@/components/search-bar";
import { FeaturedStays } from "@/components/featured-stays";
import { AppButtons, TrustStrip } from "@/components/site-chrome";
import { ButtonLink, Photo, SavingsBadge } from "@/components/ui";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  DoorOpenIcon,
  BriefcaseIcon,
  BedIcon,
  SwimmingPoolIcon,
  AirplaneTiltIcon,
  ShowerIcon,
  ArrowRightIcon,
  LockKeyIcon,
  DeviceMobileIcon,
  CheckCircleIcon,
  TrendUpIcon,
} from "@/components/icons";

const STEPS = [
  { icon: MagnifyingGlassIcon, title: "Find your stay", text: "Search hotels, lodges and apartments near you, at the airport or on your route." },
  { icon: ClockIcon, title: "Pick your hours", text: "Choose a check-in time and 2–6 hours, or a day pass. You'll see exactly when you check out." },
  { icon: DoorOpenIcon, title: "Check in and relax", text: "Pay securely on Daytime or in the app, show your booking at reception, and enjoy your day." },
];

const USE_CASES = [
  { key: "work", icon: BriefcaseIcon, title: "Work", text: "A quiet room with a desk and fast Wi-Fi", photo: "p04" },
  { key: "rest", icon: BedIcon, title: "Rest", text: "Nap, recharge or just switch off", photo: "p11" },
  { key: "pool-spa", icon: SwimmingPoolIcon, title: "Pool and spa", text: "Day passes with pool, spa and lunch", photo: "p09" },
  { key: "between-flights", icon: AirplaneTiltIcon, title: "Between flights", text: "Shower and sleep near the airport", photo: "p02" },
  { key: "freshen-up", icon: ShowerIcon, title: "Freshen up", text: "Change and get ready before an event", photo: "p03" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = getPublicCatalog();
  const featured = all.filter((p) => p.featured && p.status === "available").slice(0, 6);
  const byId = Object.fromEntries(all.map((p) => [p.id, p]));
  const hero = byId["p09"];
  const maxSave = Math.max(...all.map((p) => p.discountPct));

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_85%_10%,var(--color-glow-sun),transparent_55%),radial-gradient(circle_at_10%_0%,var(--color-glow-warm),transparent_50%)]" aria-hidden />
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-10 pt-10 md:px-6 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-center xl:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-secondary shadow-xs ring-1 ring-border">
              <span className="size-2 rounded-full bg-savings" aria-hidden />
              Same-day stays across Zambia
            </p>
            <h1 className="mt-5 text-[2.5rem] font-bold leading-[1.08] tracking-tight text-secondary md:text-6xl">
              Great stays, by the hour, <span className="text-primary">for a fraction of the price.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-text-muted">
              Book a hotel room, lodge day package or a whole apartment for a few hours or the full day. Check in and out the same day, and save up to {maxSave}% on the overnight rate.
            </p>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[32px] bg-surface-muted shadow-lg">
              <Photo src={hero.photos[0].src} alt={hero.photos[0].alt} priority sizes="(min-width: 1024px) 600px, 100vw" />
            </div>
            <div className="animate-pop absolute -bottom-6 -left-6 w-72 rounded-2xl border border-border bg-surface p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-text-muted">{hero.city} · Day pass</p>
                <SavingsBadge pct={hero.discountPct} size="sm" />
              </div>
              <p className="mt-1 font-bold leading-snug">{hero.name}</p>
              <p className="mt-1 text-sm text-text-muted">
                Check-in {hero.window.open} → Check-out {hero.window.close}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 pb-6 md:px-6 xl:px-8">
          <SearchBar />
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 px-2 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon weight="fill" className="size-4 text-success" aria-hidden /> Free cancellation up to 2 hours before
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon weight="fill" className="size-4 text-success" aria-hidden /> Prices include taxes and fees
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircleIcon weight="fill" className="size-4 text-success" aria-hidden /> Pay securely on Daytime
            </span>
          </p>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section aria-labelledby="how" className="mx-auto max-w-[1280px] px-4 py-16 md:px-6 md:py-24 xl:px-8">
        <h2 id="how" className="text-3xl font-semibold text-secondary md:text-4xl">
          How Daytime works
        </h2>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-surface p-6">
              <span className="absolute right-5 top-4 font-display text-5xl font-bold text-primary-soft" aria-hidden>
                {i + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary">
                <s.icon weight="bold" className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-bold">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-1.5 text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Use cases ---------- */}
      <section aria-labelledby="usecases" className="bg-surface-muted py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 xl:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="usecases" className="text-3xl font-semibold text-secondary md:text-4xl">
                What will you do with your day?
              </h2>
              <p className="mt-2 text-text-muted">Pick a reason and we&apos;ll show stays that fit it.</p>
            </div>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {USE_CASES.map((u, i) => (
              <li key={u.key} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
                <Link href={`/search?useCase=${u.key}`} className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl bg-secondary p-4 text-white">
                  <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                    <Photo src={byId[u.photo].photos[0].src} alt="" sizes="(min-width: 1024px) 240px, 50vw" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/90 via-[#0b1220]/35 to-transparent" aria-hidden />
                  <span className="relative">
                    <span className="mb-2 grid size-10 place-items-center rounded-full bg-white/95 text-primary">
                      <u.icon weight="bold" className="size-5" aria-hidden />
                    </span>
                    <span className="block font-display text-xl font-semibold">{u.title}</span>
                    <span className="mt-0.5 block text-sm text-white/90">{u.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Featured ---------- */}
      <section aria-labelledby="featured" className="mx-auto max-w-[1280px] px-4 py-16 md:px-6 md:py-24 xl:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured" className="text-3xl font-semibold text-secondary md:text-4xl">
              Featured stays today
            </h2>
            <p className="mt-2 text-text-muted">Hand-picked hotels, lodges and apartments with great daytime deals.</p>
          </div>
          <ButtonLink href="/search" variant="secondary" size="sm">
            See all stays <ArrowRightIcon weight="bold" className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <div className="mt-8">
          <FeaturedStays properties={featured} />
        </div>
      </section>

      {/* ---------- Between flights ---------- */}
      <section aria-labelledby="airports" className="mx-auto max-w-[1280px] px-4 md:px-6 xl:px-8">
        <div className="grid gap-8 overflow-hidden rounded-[32px] bg-secondary p-6 text-white md:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <AirplaneTiltIcon weight="fill" className="size-10 text-accent" aria-hidden />
            <h2 id="airports" className="mt-3 text-3xl font-semibold md:text-4xl">
              Long layover? Rest between flights.
            </h2>
            <p className="mt-3 text-white/85">Shower, sleep and recharge minutes from the terminal. Check in from 06:00 at selected airport stays.</p>
          </div>
          <ul className="grid gap-3">
            {AIRPORTS.map((a) => (
              <li key={a.code}>
                <Link
                  href={`/search?location=${encodeURIComponent(`${a.name} (${a.code})`)}&useCase=between-flights`}
                  className="flex min-h-16 items-center gap-4 rounded-2xl bg-white/10 px-4 py-3 transition-colors hover:bg-white/20"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white font-display font-bold text-secondary">{a.code}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{a.name}</span>
                    <span className="block text-sm text-white/80">{a.city}</span>
                  </span>
                  <ArrowRightIcon weight="bold" className="size-5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section aria-labelledby="trust" className="mx-auto max-w-[1280px] px-4 py-16 md:px-6 md:py-24 xl:px-8">
        <h2 id="trust" className="sr-only">
          Why book with Daytime
        </h2>
        <TrustStrip />
      </section>

      {/* ---------- Pay + app ---------- */}
      <section aria-labelledby="pay" className="mx-auto max-w-[1280px] px-4 md:px-6 xl:px-8">
        <div className="grid gap-8 rounded-[32px] border border-border bg-surface p-6 md:grid-cols-2 md:p-10">
          <div>
            <span className="grid size-12 place-items-center rounded-2xl bg-savings-soft text-savings-ink">
              <LockKeyIcon weight="bold" className="size-6" aria-hidden />
            </span>
            <h2 id="pay" className="mt-4 text-2xl font-semibold text-secondary md:text-3xl">
              Book and pay securely on Daytime
            </h2>
            <p className="mt-2 text-text-muted">
              Pay on the Daytime website or in the Daytime app by card or mobile money. You see the full price, with taxes and fees, before you book. No surprises at reception.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="inline-flex items-center gap-2 font-semibold">
              <DeviceMobileIcon className="size-5 text-primary" aria-hidden /> Book faster in the Daytime app
            </p>
            <AppButtons />
          </div>
        </div>
      </section>

      {/* ---------- Partner teaser ---------- */}
      <section aria-labelledby="partners" className="mx-auto max-w-[1280px] px-4 pt-16 md:px-6 md:pt-24 xl:px-8">
        <div className="flex flex-col items-start gap-6 rounded-[32px] bg-accent-soft p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <TrendUpIcon weight="bold" className="size-8 text-on-accent" aria-hidden />
            <h2 id="partners" className="mt-2 text-2xl font-semibold text-on-accent md:text-3xl">
              Own a hotel, lodge or apartment?
            </h2>
            <p className="mt-1 max-w-xl text-on-accent">Earn extra revenue from rooms that sit empty during the day. You set the hours, rates and rules.</p>
          </div>
          <ButtonLink href="/partner" size="lg">
            List your property
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
