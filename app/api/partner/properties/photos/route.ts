import { currentUser } from "@/lib/auth-server";
import { managedProperties, propertyConfig, propertyDB, sameOrigin } from "@/lib/property-store";

function partnerError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to complete this action.";
  const safeMessage = message === "UNAUTHORIZED" ? "Please sign in." : message === "FORBIDDEN" ? "Partner access required." : message;
  return Response.json({ error: safeMessage }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400 });
}

function emailFor(user: any) {
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) throw new Error("FORBIDDEN");
  return email;
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    sameOrigin(request);
    const email = emailFor(user);
    const data = await request.formData();
    const propertyId = String(data.get("propertyId") || "");
    if (!/^[0-9a-f-]{36}$/.test(propertyId)) throw new Error("Choose a valid assigned property.");
    const property = (await managedProperties()).find((item) => item.id === propertyId && (item.partnerEmail || "").trim().toLowerCase() === email);
    if (!property) throw new Error("This email is not assigned to that property.");
    const file = data.get("photo");
    if (!(file instanceof File) || file.size > 3 * 1024 * 1024 || !file.size) throw new Error("Choose a photograph under 3 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let extension = "";
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) extension = "jpg";
    else if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) extension = "png";
    else if (new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") extension = "webp";
    if (!extension) throw new Error("Upload a JPG, PNG or WebP photograph.");
    const name = `${crypto.randomUUID()}.${extension}`;
    const { url, key } = propertyConfig();
    const upload = await fetch(`${url}/storage/v1/object/property-photos/${name}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": extension === "jpg" ? "image/jpeg" : `image/${extension}` },
      body: bytes,
    });
    if (!upload.ok) throw new Error("Photo upload failed. Please try again.");

    const pending = await propertyDB(`property_partner_submissions?property_id=eq.${property.id}&partner_email=eq.${encodeURIComponent(email)}&status=eq.pending&select=*&limit=1`);
    const existing = pending[0];
    const { id: _id, slug: _slug, status: _status, updated_at: _updatedAt, ...propertyData } = property;
    const candidate = existing?.data && typeof existing.data === "object"
      ? { ...existing.data, photos: Array.isArray(existing.data.photos) ? [...existing.data.photos] : [] }
      : { ...propertyData, photos: [...(property.photos || [])] };
    if (!candidate.photos.includes(name)) candidate.photos.push(name);
    const payload = {
      property_id: property.id,
      partner_email: email,
      data: candidate,
      note: typeof existing?.note === "string" ? existing.note : "",
      base_updated_at: existing?.base_updated_at || property.updated_at,
    };
    if (existing?.id) await propertyDB(`property_partner_submissions?id=eq.${existing.id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify(payload) });
    else await propertyDB("property_partner_submissions", { method: "POST", body: JSON.stringify(payload) });
    return Response.json({ photo: name });
  } catch (error) {
    return partnerError(error);
  }
}
