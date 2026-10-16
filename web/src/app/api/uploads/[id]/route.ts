import { store } from "@/lib/server/db";
import { PHOTO_ID, PHOTO_TYPES } from "@/lib/server/listings";

/** Public listing photos. IDs are random and validated, so no path traversal. Supabase photos redirect to Storage. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = id.match(PHOTO_ID);
  if (!m) return new Response("Not found", { status: 404 });
  const photo = await store.getPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });
  if ("url" in photo) return Response.redirect(photo.url, 302);
  return new Response(new Uint8Array(photo.bytes), {
    headers: { "Content-Type": PHOTO_TYPES[m[1] as keyof typeof PHOTO_TYPES], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
