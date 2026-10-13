"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ListIcon,
  MagnifyingGlassIcon,
  BuildingsIcon,
  UserCircleIcon,
  MoonIcon,
  SunIcon,
  DesktopIcon,
  HeartIcon,
  ShieldCheckIcon,
  LockKeyIcon,
  ArrowCounterClockwiseIcon,
  HeadsetIcon,
  AppleLogoIcon,
  GooglePlayLogoIcon,
} from "@/components/icons";
import { useApp } from "./providers";
import { Dialog, cx } from "./ui";
import { SITE } from "@/lib/config";
import type { Currency } from "@/lib/currency";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display text-[1.375rem] font-bold tracking-tight text-secondary", className)}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <circle cx="16" cy="18" r="7" fill="var(--color-primary-bright)" />
        {[0, 45, 90, 135, 180].map((a) => (
          <rect key={a} x="15" y="3" width="2" height="5" rx="1" fill="var(--color-accent)" transform={`rotate(${a - 90} 16 18)`} />
        ))}
        <rect x="4" y="25" width="24" height="2.5" rx="1.25" fill="var(--color-secondary)" />
      </svg>
      Daytime
    </span>
  );
}

function CurrencySelect({ id }: { id: string }) {
  const { currency, setCurrency } = useApp();
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Currency
      </label>
      <select
        id={id}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="h-11 appearance-none rounded-[10px] border border-border bg-surface pl-3 pr-8 text-sm font-semibold text-text hover:border-secondary"
      >
        <option value="ZMW">K ZMW</option>
        <option value="USD">$ USD</option>
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted" aria-hidden>
        ▾
      </span>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useApp();
  const next = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
  const Icon = theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : DesktopIcon;
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid size-11 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

const NAV = [
  { href: "/search", label: "Find a stay", icon: MagnifyingGlassIcon },
  { href: "/partner", label: "List your property", icon: BuildingsIcon },
];

export function Header() {
  const pathname = usePathname();
  const { user, wishlist } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md">
        Skip to main content
      </a>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 md:px-6 xl:px-8">
        <Link href="/" aria-label="Daytime home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={pathname.startsWith(n.href) ? "page" : undefined}
              className={cx(
                "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-muted",
                pathname.startsWith(n.href) ? "text-primary" : "text-text",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <CurrencySelect id="currency-desktop" />
          </div>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/account?tab=wishlist"
            className="relative hidden size-11 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text sm:grid"
            aria-label={`Wishlist, ${wishlist.length} saved`}
          >
            <HeartIcon className="size-5" aria-hidden />
            {wishlist.length > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-on-primary" aria-hidden>
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link
            href="/account"
            className="hidden h-11 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold hover:border-secondary md:inline-flex"
          >
            <UserCircleIcon className="size-5 text-secondary" aria-hidden />
            {user ? user.firstName : "Sign in"}
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full hover:bg-surface-muted lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <ListIcon className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Menu">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {[...NAV, { href: "/account", label: user ? "My account" : "Sign in / Sign up", icon: UserCircleIcon }, { href: "/account?tab=wishlist", label: `Wishlist (${wishlist.length})`, icon: HeartIcon }].map((n) => (
            <Link key={n.href} href={n.href} className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-semibold hover:bg-surface-muted">
              <n.icon className="size-5 text-secondary" aria-hidden />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <CurrencySelect id="currency-mobile" />
          <ThemeToggle />
        </div>
      </Dialog>
    </header>
  );
}

export function TrustStrip({ className }: { className?: string }) {
  const items = [
    { icon: ShieldCheckIcon, title: "Verified properties", text: "Every stay is checked by our team" },
    { icon: LockKeyIcon, title: "Secure payment", text: "Pay safely on Daytime or in the app" },
    { icon: ArrowCounterClockwiseIcon, title: "Free cancellation", text: `Up to ${SITE.freeCancellationHours} hours before check-in` },
    { icon: HeadsetIcon, title: "Support 7 days", text: "Real people, 07:00–21:00" },
  ];
  return (
    <ul className={cx("grid grid-cols-2 gap-4 md:grid-cols-4", className)}>
      {items.map((i) => (
        <li key={i.title} className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary-soft text-secondary">
            <i.icon className="size-5" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-bold">{i.title}</span>
            <span className="block text-sm text-text-muted">{i.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AppButtons({ className }: { className?: string }) {
  return (
    <div className={cx("flex flex-wrap gap-3", className)}>
      <a href={SITE.appStoreUrl} className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-text px-4 text-bg hover:opacity-90">
        <AppleLogoIcon weight="fill" className="size-6" aria-hidden />
        <span className="text-left leading-tight">
          <span className="block text-[11px]">Download on the</span>
          <span className="block text-sm font-bold">App Store</span>
        </span>
      </a>
      <a href={SITE.playStoreUrl} className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-text px-4 text-bg hover:opacity-90">
        <GooglePlayLogoIcon weight="fill" className="size-6" aria-hidden />
        <span className="text-left leading-tight">
          <span className="block text-[11px]">Get it on</span>
          <span className="block text-sm font-bold">Google Play</span>
        </span>
      </a>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 md:grid-cols-2 md:px-6 lg:grid-cols-4 xl:px-8">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-text-muted">{SITE.tagline}</p>
          <p className="mt-6 text-sm font-semibold">Book faster in the Daytime app</p>
          <AppButtons className="mt-3" />
        </div>
        <nav aria-label="Explore">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-text-muted">Explore</h2>
          <ul className="mt-3 space-y-1">
            {[
              ["Lusaka", "/search?location=Lusaka"],
              ["Livingstone", "/search?location=Livingstone"],
              ["Kitwe and Ndola", "/search?location=Kitwe"],
              ["Siavonga and Lake Kariba", "/search?location=Siavonga"],
              ["Between flights", "/search?useCase=between-flights"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} className="inline-block py-1.5 text-text hover:text-primary">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company">
          <h2 className="font-sans text-sm font-bold uppercase tracking-wide text-text-muted">Daytime</h2>
          <ul className="mt-3 space-y-1">
            {[
              ["List your property", "/partner"],
              ["Partner sign in", "/partner/login"],
              ["My bookings", "/account"],
              ["Wishlist", "/account?tab=wishlist"],
            ].map(([l, h]) => (
              <li key={h}>
                <Link href={h} className="inline-block py-1.5 text-text hover:text-primary">
                  {l}
                </Link>
              </li>
            ))}
            <li className="pt-2 text-sm text-text-muted">{SITE.supportEmail}</li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-xs text-text-muted md:px-6 xl:px-8">
          © 2026 Daytime. Prices include taxes and fees. Prototype: property data and photos sourced from public Booking.com listings for demonstration only.
        </p>
      </div>
    </footer>
  );
}
