import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PartnerDashboard } from "@/components/partner-dashboard";
import { requireRole } from "@/lib/server/auth";
import { store } from "@/lib/server/db";

export const metadata: Metadata = { title: "Partner dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  // Server-side check: only the signed-in partner, and only their own listing.
  const u = await requireRole("partner");
  if (!u) redirect("/partner/login");
  const listing = await store.listingByOwner(u.id);
  if (!listing) redirect("/partner#list");
  return <PartnerDashboard name={u.name} email={u.email} initial={listing} />;
}
