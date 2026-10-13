import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/server/db";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Public listing photos. Names are random and validated, so no path traversal. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = id.match(/^[a-f0-9]{24}\.(jpg|png|webp)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, id);
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
