import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ properties: await publishedProperties() }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
