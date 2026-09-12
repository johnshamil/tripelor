import { managedProperties, propertyConfig, propertyDB } from "@/lib/property-store";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
export const dynamic="force-dynamic";

function containsPhoto(value: any, photo: string) {
  if (Array.isArray(value?.photos) && value.photos.includes(photo)) return true;
  return Array.isArray(value?.rooms) && value.rooms.some((room: any) =>
    [room?.photos, room?.bathroomPhotos].some((photos: any) => Array.isArray(photos) && photos.includes(photo)),
  );
}
export async function GET(_request: Request, { params }: { params: Promise<{ photo: string }> }) {
  try {
    const { photo } = await params;
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(photo)) return new Response(null, { status: 404 });
    const rows = await propertyDB("managed_properties?select=id,data&status=eq.published");
    const listed = rows.some((row: any) => containsPhoto(row.data, photo));
    if (!listed) {
      const user = await currentUser();
      if (!user) return new Response(null, { status: 404 });
      if (!isAdminEmail(user.email)) {
        const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
        const assigned = (await managedProperties()).some(
          (property) => (property.partnerEmail || "").trim().toLowerCase() === email && containsPhoto(property, photo),
        );
        if (!assigned) {
          const pending = await propertyDB(`property_partner_submissions?partner_email=eq.${encodeURIComponent(email)}&status=eq.pending&select=data`);
          const pendingPhoto = pending.some((row: any) => containsPhoto(row.data, photo));
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
