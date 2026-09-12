import { propertyAdmin, propertyConfig, propertyError, sameOrigin } from "@/lib/property-store";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const CONTENT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(r: Request) {
  try {
    await propertyAdmin();
    sameOrigin(r);
    const input = await r.json();
    const contentType = typeof input?.contentType === "string" ? input.contentType.toLowerCase() : "";
    const extension = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES];
    const size = Number(input?.size || 0);
    if (!extension || !Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_BYTES) {
      throw new Error("Choose a JPG, PNG or WebP photograph up to 10 MB.");
    }

    const name = `${crypto.randomUUID()}.${extension}`;
    const { url, key } = propertyConfig();
    const response = await fetch(`${url}/storage/v1/object/upload/sign/property-photos/${name}`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || typeof data?.url !== "string") {
      throw new Error("Photo upload failed. Please try again.");
    }

    const signedUrl = data.url.startsWith("http")
      ? data.url
      : `${url}/storage/v1${data.url.startsWith("/") ? data.url : `/${data.url}`}`;
    return Response.json({ photo: name, signedUrl });
  } catch (e) {
    return propertyError(e);
  }
}
