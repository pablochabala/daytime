import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminSetupForm } from "@/components/auth-forms";
import { store } from "@/lib/server/db";

export const metadata: Metadata = { title: "Set up master account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminSetup() {
  if (store.kind === "none")
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-semibold text-secondary">Connect the database first</h1>
        <p className="mt-3 text-text-muted">
          This site is running without a database, so the master account can&apos;t be saved yet. In your hosting settings (Vercel → Project → Settings → Environment
          Variables), add <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> and <code>SESSION_SECRET</code>, then redeploy and come back to this page.
        </p>
      </div>
    );
  // Locked forever once the master account exists.
  if (await store.hasAdmin()) redirect("/admin/login");
  return <AdminSetupForm />;
}
