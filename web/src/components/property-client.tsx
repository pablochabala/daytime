"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/lib/types";
import { BookingPanel, MobileBookingBar, useBookingState } from "./booking-panel";

export const PropertyMap = dynamic(() => import("./stays-map"), {
  ssr: false,
  loading: () => <div className="skeleton h-full w-full rounded-2xl" aria-label="Loading map" />,
});

/** Shares one booking state between the desktop sticky panel and the mobile bottom sheet. */
export function PropertyBooking({ property, init }: { property: Property; init: { date?: string; duration?: string; checkIn?: string } }) {
  const state = useBookingState(property, init);
  return (
    <>
      <aside className="hidden lg:block" aria-label="Book this stay">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain rounded-[24px] border border-border bg-surface p-6 shadow-lg">
          <BookingPanel property={property} state={state} />
        </div>
      </aside>
      <MobileBookingBar property={property} state={state} />
    </>
  );
}

export function PropertyMapBlock({ property }: { property: Property }) {
  return <PropertyMap items={[{ property, label: property.name }]} single height="320px" className="overflow-hidden rounded-2xl border border-border" />;
}
