import { NextResponse } from "next/server";
import { getPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPublicCatalog(), { headers: { "Cache-Control": "no-store" } });
}
