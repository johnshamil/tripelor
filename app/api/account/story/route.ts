import { requireUser } from "@/lib/auth-server";
import {
  ensureStory,
  reservationForStoryUser,
  signedPhotosForStory,
  storyForUser,
  updateStory,
} from "@/lib/trip-story-server";

export const dynamic = "force-dynamic";

const BADGES = new Set([
  "first-turtle",
  "shark-bay",
  "sunset",
  "dolphin",
  "sandbank",
  "island-hopping",
  "night-fishing",
  "shipwreck",
  "manta",
  "romantic",
]);

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanBadges(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map(String).filter(item => BADGES.has(item)))).slice(0, 10)
    : [];
}

function shareUrl(story: any) {
  return story?.is_public && story?.share_token ? `/story/${story.share_token}` : "";
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const reservationId = new URL(request.url).searchParams.get("reservationId") || "";
    if (!reservationId) return Response.json({ error: "Journey is required." }, { status: 400 });

    const reservation = await reservationForStoryUser(user, reservationId);
    if (!reservation) return Response.json({ error: "Journey not found." }, { status: 404 });

    const story = await storyForUser(user.id, reservationId);
    const photos = story ? await signedPhotosForStory(story.id) : [];
    return Response.json(
      { reservation, story, photos, shareUrl: shareUrl(story) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load your Maldives Story." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const reservationId = cleanText(body?.reservationId, 80);
    if (!reservationId) return Response.json({ error: "Journey is required." }, { status: 400 });

    const reservation = await reservationForStoryUser(user, reservationId);
    if (!reservation) return Response.json({ error: "Journey not found." }, { status: 404 });

    const current = await ensureStory(user, reservation);
    const story = await updateStory(current.id, {
      title: cleanText(body?.title, 160),
      story_text: cleanText(body?.storyText, 6000),
      favorite_moment: cleanText(body?.favoriteMoment, 500),
      badges: cleanBadges(body?.badges),
      is_public: Boolean(body?.isPublic),
    } as any);
    const photos = await signedPhotosForStory(story.id);

    return Response.json(
      { reservation, story, photos, shareUrl: shareUrl(story) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save your Maldives Story." },
      { status: 500 },
    );
  }
}
