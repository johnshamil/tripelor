import { requireUser } from "@/lib/auth-server";
import {
  daysForStory,
  ensureStory,
  replaceStoryDays,
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

function cleanDays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 60).flatMap((entry: any, index) => {
    const dayNumber = Number(entry?.dayNumber ?? index + 1);
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60) return [];
    const title = cleanText(entry?.title, 160);
    const body = cleanText(entry?.body, 3000);
    const locationLabel = cleanText(entry?.locationLabel, 160);
    if (!title && !body && !locationLabel) return [];
    return [{ day_number: dayNumber, title, body, location_label: locationLabel }];
  });
}

function shareUrl(story: any) {
  return story?.visibility !== "private" && story?.share_token ? `/story/${story.share_token}` : "";
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const reservationId = new URL(request.url).searchParams.get("reservationId") || "";
    if (!reservationId) return Response.json({ error: "Journey is required." }, { status: 400 });

    const reservation = await reservationForStoryUser(user, reservationId);
    if (!reservation) return Response.json({ error: "Journey not found." }, { status: 404 });

    const story = await storyForUser(user.id, reservationId);
    const [photos, days] = story
      ? await Promise.all([signedPhotosForStory(story.id), daysForStory(story.id)])
      : [[], []];
    return Response.json(
      { reservation, story, photos, days, shareUrl: shareUrl(story) },
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
    const requestedVisibility = ["private", "unlisted", "public"].includes(String(body?.visibility))
      ? String(body.visibility)
      : Boolean(body?.isPublic) ? "unlisted" : "private";
    const story = await updateStory(current.id, {
      title: cleanText(body?.title, 160),
      story_text: cleanText(body?.storyText, 6000),
      favorite_moment: cleanText(body?.favoriteMoment, 500),
      badges: cleanBadges(body?.badges),
      is_public: requestedVisibility !== "private",
      visibility: requestedVisibility,
      public_name: cleanText(body?.publicName, 80),
      published_at: requestedVisibility === "public" ? (current.published_at || new Date().toISOString()) : null,
    } as any);
    const days = cleanDays(body?.days);
    await replaceStoryDays(story.id, days);
    const photos = await signedPhotosForStory(story.id);

    return Response.json(
      { reservation, story, photos, days: await daysForStory(story.id), shareUrl: shareUrl(story) },
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
