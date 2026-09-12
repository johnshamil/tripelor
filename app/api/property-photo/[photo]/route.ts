import { managedProperties, propertyConfig, propertyDB } from "@/lib/property-store";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
export const dynamic="force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ photo: string }> }) {
  try {
    const { photo } = await params;
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(photo)) return new Response(null, { status: 404 });
    const rows = await propertyDB("managed_properties?select=id,data&status=eq.published");
    const listed = rows.some((row: any) => Array.isArray(row.data?.photos) && row.data.photos.includes(photo));
    if (!listed) {
      const user = await currentUser();
      if (!user) return new Response(null, { status: 404 });
      if (!isAdminEmail(user.email)) {
        const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
        const assigned = (await managedProperties()).some(
          (property) => (property.partnerEmail || "").trim().toLowerCase() === email && (property.photos || []).includes(photo),
        );
        if (!assigned) {
          const pending = await propertyDB(`property_partner_submissions?partner_email=eq.${encodeURIComponent(email)}&status=eq.pending&select=data`);
          const pendingPhoto = pending.some((row: any) => Array.isArray(row.data?.photos) && row.data.photos.includes(photo));
          if (!pendingPhoto) return new Response(null, { status: 404 });
        }
      }
    }
    const { url, key } = propertyConfig();
    const image = await fetch(`${url}/storage/v1/object/property-photos/${photo}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!image.ok) return new Response(null, { status: 404 });
    return new Response(image.body, {
      headers: {
        "Content-Type": image.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
