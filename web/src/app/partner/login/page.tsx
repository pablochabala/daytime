import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/server/auth";

export const metadata: Metadata = { title: "Partner sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PartnerLogin() {
  const u = await currentUser();
  if (u) redirect(u.role === "admin" ? "/admin" : "/partner/dashboard");
  return (
    <>
      <LoginForm heading="Partner sign in" intro="Manage your listing, rates and photos. Only you can access your partner account." />
      <p className="pb-12 text-center text-sm text-text-muted">
        Not listed yet?{" "}
        <Link href="/partner#list" className="font-semibold text-secondary underline">
          List your property
        </Link>
      </p>
    </>
  );
}
