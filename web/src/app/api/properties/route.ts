import { NextResponse } from "next/server";
import { getPublicCatalog } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getPublicCatalog(), { headers: { "Cache-Control": "no-store" } });
}
