import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/server/auth";
import { read } from "@/lib/server/db";

export const metadata: Metadata = { title: "Master control sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  if (!read().users.some((u) => u.role === "admin")) redirect("/admin/setup");
  const u = await currentUser();
  if (u?.role === "admin") redirect("/admin");
  return <LoginForm heading="Master control" intro="Sign in with the Daytime master account." />;
}
