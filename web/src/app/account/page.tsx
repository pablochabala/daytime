import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountView } from "@/components/account-view";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-96 max-w-[1100px] px-4 py-10"><div className="skeleton h-full rounded-2xl" /></div>}>
      <AccountView />
    </Suspense>
  );
}
