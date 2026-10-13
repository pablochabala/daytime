"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartIcon, MapPinIcon, LightningIcon, SunIcon } from "./icons";
import { Photo, Rating, SavingsBadge, Stars, TypeChip, cx } from "./ui";
import { useApp } from "./providers";
import type { Property } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/catalog";

export function WishlistButton({ property, className }: { property: Property; className?: string }) {
  const { wishlist, toggleWishlist } = useApp();
  const saved = wishlist.includes(property.id);
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${property.name} from wishlist` : `Save ${property.name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(property.id, property.name);
        setPop(added);
      }}
      onAnimationEnd={() => setPop(false)}
      className={cx(
        "grid size-11 place-items-center rounded-full bg-surface/95 shadow-sm transition-transform hover:scale-105",
        saved ? "text-primary" : "text-text",
        className,
      )}
    >
      <HeartIcon weight={saved ? "fill" : "regular"} className={cx("size-5", pop && "animate-heart")} aria-hidden />
    </button>
  );
}

export function PriceBlock({
  property,
  hours,
  compact,
}: {
  property: Property;
  /** If set, show the total for this many hours as the headline. */
  hours?: number;
  compact?: boolean;
}) {
  const { money } = useApp();
  return (
    <div>
      <p className="text-sm text-text-subtle">
        <span className="sr-only">Overnight price was </span>
        <s className="tabular">{money(property.overnightRate)}</s> per night
      </p>
      <p className={cx("flex flex-wrap items-baseline gap-x-2 font-bold tabular", compact ? "text-lg" : "text-xl")}>
        <span>
          {money(hours ? property.hourlyRate * hours : property.hourlyRate)}
          <span className="text-sm font-semibold text-text-muted">{hours ? ` for ${hours}h` : "/hour"}</span>
        </span>
        <span className="text-base font-semibold text-text-muted" aria-hidden>
          ·
        </span>
        <span className="text-base">
          {money(property.dayPassRate)}
          <span className="text-sm font-semibold text-text-muted"> day pass</span>
        </span>
      </p>
      <p className="text-xs text-text-muted">Includes taxes and fees</p>
    </div>
  );
}

export function PropertyCard({
  property,
  nextSlot,
  hours,
  dayPassAvailable,
  href,
  priority,
  layout = "vertical",
}: {
  property: Property;
  nextSlot?: string | null;
  hours?: number;
  dayPassAvailable?: boolean;
  href?: string;
  priority?: boolean;
  layout?: "vertical" | "horizontal";
}) {
  const link = href ?? `/property/${property.slug}`;
  const horizontal = layout === "horizontal";
  return (
    <article
      className={cx(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-surface transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md",
        horizontal ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cx("relative overflow-hidden bg-surface-muted", horizontal ? "aspect-[4/3] sm:aspect-auto sm:w-[38%] sm:min-h-full" : "aspect-[4/3]")}>
        <Photo
          src={property.photos[0].src}
          alt={property.photos[0].alt}
          priority={priority}
          sizes={horizontal ? "(min-width: 640px) 300px, 100vw" : "(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {property.status === "available" ? (
          <SavingsBadge pct={property.discountPct} className="absolute left-3 top-3 z-10 shadow-sm" />
        ) : (
          <span
            className={cx(
              "absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
              property.status === "coming-soon" ? "bg-accent text-[#422006]" : "bg-text text-bg",
            )}
          >
            {STATUS_LABEL[property.status]}
          </span>
        )}
        <WishlistButton property={property} className="absolute right-2.5 top-2.5 z-10" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-4 md:p-5">
        <div className="flex items-center gap-2">
          <TypeChip type={property.type} />
          <Stars n={property.stars} />
        </div>
        <h3 className="font-sans text-lg font-bold leading-snug">
          <Link href={link} className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none group-focus-within:underline">
            {property.name}
          </Link>
        </h3>
        <p className="-mt-1.5 flex items-center gap-1 text-sm text-text-muted">
          <MapPinIcon className="size-4 shrink-0" aria-hidden />
          {property.area}, {property.city}
        </p>
        {property.isNew ? (
          <span className="inline-flex self-start rounded-full bg-accent-soft px-2.5 py-0.5 text-sm font-semibold text-on-accent">New on Daytime</span>
        ) : (
          <Rating value={property.rating} count={property.reviewCount} />
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <PriceBlock property={property} hours={hours} compact={horizontal} />
        </div>
        <div className="flex flex-wrap gap-2">
          {property.status !== "available" ? (
            <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">
              {property.status === "coming-soon" ? "Bookings open soon" : "Not taking bookings"}
            </span>
          ) : nextSlot !== undefined &&
            (nextSlot ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-pool px-2.5 py-1 text-xs font-semibold text-pool">
                <LightningIcon weight="fill" className="size-3.5" aria-hidden /> Next slot {nextSlot}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted">Fully booked this day</span>
            ))}
          {dayPassAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-on-accent">
              <SunIcon weight="fill" className="size-3.5" aria-hidden /> Day pass available
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function PropertyCardSkeleton({ horizontal }: { horizontal?: boolean }) {
  return (
    <div className={cx("flex overflow-hidden rounded-2xl border border-border bg-surface", horizontal ? "flex-col sm:flex-row" : "flex-col")} aria-hidden>
      <div className={cx("skeleton", horizontal ? "aspect-[4/3] sm:aspect-auto sm:w-[38%] sm:min-h-56" : "aspect-[4/3]")} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-6 w-3/4 rounded-md" />
        <div className="skeleton h-4 w-1/2 rounded-md" />
        <div className="skeleton h-5 w-40 rounded-md" />
        <div className="skeleton mt-2 h-7 w-2/3 rounded-md" />
        <div className="skeleton h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}
