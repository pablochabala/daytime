import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingFlow } from "@/components/booking-flow";

export const metadata: Metadata = { title: "Book your daytime stay", robots: { index: false } };

export default function BookPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-[1100px] px-4 py-10"><div className="skeleton h-full rounded-2xl" /></div>}>
      <BookingFlow />
    </Suspense>
  );
}
