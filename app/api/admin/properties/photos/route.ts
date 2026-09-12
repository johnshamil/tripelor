import { propertyAdmin, propertyConfig, propertyError, sameOrigin } from "@/lib/property-store";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 512 * 1024;

export async function POST(r: Request) {
  try {
    await propertyAdmin();
    sameOrigin(r);
    const contentLength = Number(r.headers.get("content-length") || 0);
    if (contentLength > MAX_REQUEST_BYTES) throw new Error("Choose a photograph up to 10 MB.");

    const data = await r.formData();
    const file = data.get("photo");
    if (!(file instanceof File) || file.size > MAX_PHOTO_BYTES || !file.size) {
      throw new Error("Choose a photograph up to 10 MB.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    let ext = "";
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ext = "jpg";
    else if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) ext = "png";
    else if (new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP") ext = "webp";
    if (!ext) throw new Error("Upload a JPG, PNG or WebP photograph.");

    const name = `${crypto.randomUUID()}.${ext}`;
    const { url, key } = propertyConfig();
    const result = await fetch(`${url}/storage/v1/object/property-photos/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": ext === "jpg" ? "image/jpeg" : `image/${ext}`,
      },
      body: bytes,
    });
    if (!result.ok) throw new Error("Photo upload failed. Please try again.");
    return Response.json({ photo: name });
  } catch (e) {
    return propertyError(e);
  }
}
