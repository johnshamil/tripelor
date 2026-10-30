import { randomUUID } from "node:crypto";
import { requireUser } from "@/lib/auth-server";
import {
  deleteStoryPhoto,
  ensureStory,
  insertStoryPhoto,
  photosForStory,
  reservationForStoryUser,
  signedStoryPhoto,
  storyForUser,
  uploadStoryObject,
} from "@/lib/trip-story-server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED = new Map([
  ["image/jpeg", { extension: "jpg", mediaType: "photo" as const }],
  ["image/png", { extension: "png", mediaType: "photo" as const }],
  ["image/webp", { extension: "webp", mediaType: "photo" as const }],
  ["video/mp4", { extension: "mp4", mediaType: "video" as const }],
  ["video/webm", { extension: "webm", mediaType: "video" as const }],
  ["video/quicktime", { extension: "mov", mediaType: "video" as const }],
]);

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();
    const reservationId = cleanText(form.get("reservationId"), 80);
    const caption = cleanText(form.get("caption"), 300);
    const file = form.get("file");

    if (!reservationId) return Response.json({ error: "Journey is required." }, { status: 400 });
    if (!(file instanceof File)) return Response.json({ error: "Choose a photo to upload." }, { status: 400 });
    const allowed = ALLOWED.get(file.type);
    if (!allowed) return Response.json({ error: "Upload a JPG, PNG, WebP, MP4, WebM or MOV file." }, { status: 415 });
    const maxSize = allowed.mediaType === "video" ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxSize) {
      return Response.json({ error: allowed.mediaType === "video" ? "Video must be 50 MB or smaller." : "Photo must be 10 MB or smaller." }, { status: 413 });
    }

    const reservation = await reservationForStoryUser(user, reservationId);
    if (!reservation) return Response.json({ error: "Journey not found." }, { status: 404 });

    let story = await storyForUser(user.id, reservationId);
    if (!story) story = await ensureStory(user, reservation);

    const currentPhotos = await photosForStory(story.id);
    if (currentPhotos.length >= 12) {
      return Response.json({ error: "You can add up to 12 photos to one Maldives Story." }, { status: 400 });
    }

    const path = `${user.id}/${reservation.id}/${randomUUID()}.${allowed.extension}`;
    await uploadStoryObject(path, file);
    const rawDay = Number(form.get("dayNumber") || 0);
    const dayNumber = Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= 60 ? rawDay : null;
    const photo = await insertStoryPhoto(story.id, path, caption, allowed.mediaType, dayNumber);
    const signedUrl = await signedStoryPhoto(path);

    return Response.json(
      { photo: { ...photo, signed_url: signedUrl } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to upload story photo." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const url = new URL(request.url);
    const reservationId = cleanText(url.searchParams.get("reservationId"), 80);
    const photoId = cleanText(url.searchParams.get("photoId"), 80);
    if (!reservationId || !photoId) {
      return Response.json({ error: "Journey and photo are required." }, { status: 400 });
    }

    const reservation = await reservationForStoryUser(user, reservationId);
    if (!reservation) return Response.json({ error: "Journey not found." }, { status: 404 });
    const story = await storyForUser(user.id, reservationId);
    if (!story) return Response.json({ error: "Story not found." }, { status: 404 });

    await deleteStoryPhoto(story.id, photoId);
    return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to remove story photo." },
      { status: 500 },
    );
  }
}
