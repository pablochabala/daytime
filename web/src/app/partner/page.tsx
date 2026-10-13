import type { Metadata } from "next";
import { PartnerForm, RevenueCalculator } from "@/components/partner-view";
import { BuildingsIcon, TreeIcon, HouseLineIcon, TrendUpIcon, HandshakeIcon, ClockIcon, ShieldCheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "List your property",
  description: "Earn extra revenue from rooms that sit empty during the day. List your hotel, lodge or apartment on Daytime.",
};

const PARTNER_TYPES = [
  { icon: BuildingsIcon, title: "Hotels", text: "Sell empty rooms between check-out and check-in. Perfect for business travellers, layovers and meetings." },
  { icon: TreeIcon, title: "Lodges", text: "Package your pool, lunch and activities into day passes for locals and day-trippers." },
  { icon: HouseLineIcon, title: "Apartments", text: "Rent the whole unit by the hour as a private office, a place to rest or somewhere to get ready." },
];

const PARTNER_BENEFITS = [
  { icon: TrendUpIcon, title: "New revenue", text: "Rooms sit empty most of the day. Turn those hours into income without affecting overnight stays." },
  { icon: ClockIcon, title: "You set the hours", text: "Choose your daytime window, minimum booking and the slots you open." },
  { icon: ShieldCheckIcon, title: "Paid upfront", text: "Guests pay securely on Daytime. No no-shows, no cash handling." },
  { icon: HandshakeIcon, title: "No set-up fees", text: "Free to list. We only earn when you do." },
];

const STEPS = [
  { title: "Tell us about your property", text: "Fill in the form below. It takes about five minutes." },
  { title: "We verify and set up", text: "Our team checks your property and builds your daytime calendar with you." },
  { title: "Start earning", text: "Guests book and pay on Daytime, and you receive payouts every week." },
];

export default function PartnerPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_0%,var(--color-glow-sun),transparent_55%),radial-gradient(circle_at_0%_20%,var(--color-glow-warm),transparent_50%)]" aria-hidden />
        <div className="mx-auto max-w-[1280px] px-4 pb-12 pt-12 md:px-6 md:pt-20 xl:px-8">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Daytime for partners</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight text-secondary md:text-6xl">Your rooms sit empty all day. Let&apos;s fill them.</h1>
          <p className="mt-5 max-w-2xl text-lg text-text-muted">
            Hotels, lodges and apartments across Zambia earn extra revenue on Daytime by selling rooms by the hour or as day passes. You keep full control of hours, rates and rules.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#list" size="lg">
              List your property
            </ButtonLink>
            <ButtonLink href="#calculator" size="lg" variant="secondary">
              Estimate your revenue
            </ButtonLink>
          </div>
        </div>
      </section>

      <section aria-labelledby="benefits" className="mx-auto max-w-[1280px] px-4 py-12 md:px-6 xl:px-8">
        <h2 id="benefits" className="sr-only">
          Benefits
        </h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNER_BENEFITS.map((b) => (
            <li key={b.title} className="rounded-2xl border border-border bg-surface p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <b.icon weight="bold" className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 font-sans text-lg font-bold">{b.title}</h3>
              <p className="mt-1 text-text-muted">{b.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="who" className="bg-surface-muted py-16">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 xl:px-8">
          <h2 id="who" className="text-3xl font-semibold text-secondary md:text-4xl">
            Built for every kind of stay
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {PARTNER_TYPES.map((t) => (
              <li key={t.title} className="rounded-2xl bg-surface p-6">
                <t.icon className="size-8 text-secondary" aria-hidden />
                <h3 className="mt-3 font-sans text-xl font-bold">{t.title}</h3>
                <p className="mt-1 text-text-muted">{t.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="calculator" aria-labelledby="calc" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-16 md:px-6 xl:px-8">
        <h2 id="calc" className="mb-6 text-3xl font-semibold text-secondary md:text-4xl">
          How much could you earn?
        </h2>
        <RevenueCalculator />
      </section>

      <section aria-labelledby="steps" className="mx-auto max-w-[1280px] px-4 md:px-6 xl:px-8">
        <h2 id="steps" className="text-3xl font-semibold text-secondary md:text-4xl">
          How it works
        </h2>
        <ol className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary font-display font-bold text-bg">{i + 1}</span>
              <div>
                <h3 className="font-sans text-lg font-bold">{s.title}</h3>
                <p className="text-text-muted">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="list" aria-labelledby="form-h" className="mx-auto max-w-[960px] scroll-mt-24 px-4 pt-16 md:px-6">
        <h2 id="form-h" className="mb-2 text-3xl font-semibold text-secondary md:text-4xl">
          List your property
        </h2>
        <p className="mb-6 text-text-muted">Set your daytime window and rates. You can change everything later.</p>
        <PartnerForm />
      </section>
    </>
  );
}
