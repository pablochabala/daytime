import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSetupForm } from "@/components/auth-forms";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Set up master account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default function AdminSetup() {
  // Locked forever once the master account exists.
  if (read().users.some((u) => u.role === "admin")) redirect("/admin/login");
  return <AdminSetupForm />;
}
