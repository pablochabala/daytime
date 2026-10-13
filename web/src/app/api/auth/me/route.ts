import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { publicUser } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await currentUser();
  return NextResponse.json({ user: u ? publicUser(u) : null }, { headers: { "Cache-Control": "no-store" } });
}
