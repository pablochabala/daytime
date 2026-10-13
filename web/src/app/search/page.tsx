import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchView } from "@/components/search-view";
import { PropertyCardSkeleton } from "@/components/property-card";

export const metadata: Metadata = { title: "Search daytime stays" };

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-[1280px] gap-5 px-4 py-10 md:px-6 xl:px-8">
          <PropertyCardSkeleton horizontal />
          <PropertyCardSkeleton horizontal />
        </div>
      }
    >
      <SearchView />
    </Suspense>
  );
}
