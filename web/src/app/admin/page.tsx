import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { requireRole } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Master control", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!read().users.some((u) => u.role === "admin")) redirect("/admin/setup");
  const admin = await requireRole("admin");
  if (!admin) redirect("/admin/login");
  return <AdminDashboard adminName={admin.name} />;
}
