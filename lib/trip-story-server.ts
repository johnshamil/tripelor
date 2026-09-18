export type StoryReservation = {
  id: string;
  booking_reference?: string | null;
  property_name: string;
  room_type?: string | null;
  check_in: string;
  check_out: string;
  guest_name?: string | null;
  guest_email: string;
  status?: string | null;
  payment_status?: string | null;
  package_name?: string | null;
  activities?: string | null;
  meal_plan?: string | null;
  adults?: number | null;
  children?: number | null;
  speedboat_seats?: number | null;
};

export type TripStory = {
  id: string;
  reservation_id: string;
  user_id: string;
  guest_email: string;
  title: string;
  story_text: string;
  favorite_moment: string;
  badges: string[];
  is_public: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
};

export type StoryPhoto = {
  id: string;
  story_id: string;
  storage_path: string;
  caption: string;
  sort_order: number;
  created_at: string;
  signed_url?: string;
};

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Trip story storage is not configured.");
  return { url, key };
}

function headers(contentType = true) {
  const { key } = cfg();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  };
}

function encodePath(path: string) {
  return path.split("/").map(segment => encodeURIComponent(segment)).join("/");
}

async function jsonResponse(response: Response, fallback: string) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.message || data?.error || fallback);
  return data;
}

export async function reservationForStoryUser(
  user: { id: string; email?: string | null },
  reservationId: string,
): Promise<StoryReservation | null> {
  const { url } = cfg();
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return null;
  const fields = [
    "id",
    "booking_reference",
    "property_name",
    "room_type",
    "check_in",
    "check_out",
    "guest_name",
    "guest_email",
    "status",
    "payment_status",
    "package_name",
    "activities",
    "meal_plan",
    "adults",
    "children",
    "speedboat_seats",
  ].join(",");
  const response = await fetch(
    `${url}/rest/v1/reservations?select=${fields}&id=eq.${encodeURIComponent(reservationId)}&guest_email=eq.${encodeURIComponent(email)}&limit=1`,
    { headers: headers(false), cache: "no-store" },
  );
  const data = await jsonResponse(response, "Unable to verify this journey.");
  return data?.[0] || null;
}

export async function storyForUser(userId: string, reservationId: string): Promise<TripStory | null> {
  const { url } = cfg();
  const response = await fetch(
    `${url}/rest/v1/trip_stories?select=*&user_id=eq.${encodeURIComponent(userId)}&reservation_id=eq.${encodeURIComponent(reservationId)}&limit=1`,
    { headers: headers(false), cache: "no-store" },
  );
  const data = await jsonResponse(response, "Unable to load your Maldives Story.");
  return data?.[0] || null;
}

export async function ensureStory(
  user: { id: string; email?: string | null },
  reservation: StoryReservation,
): Promise<TripStory> {
  const { url } = cfg();
  const response = await fetch(
    `${url}/rest/v1/trip_stories?on_conflict=user_id,reservation_id`,
    {
      method: "POST",
      headers: { ...headers(), Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        user_id: user.id,
        reservation_id: reservation.id,
        guest_email: String(user.email || reservation.guest_email || "").toLowerCase(),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );
  const data = await jsonResponse(response, "Unable to create your Maldives Story.");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Unable to create your Maldives Story.");
  return row;
}

export async function updateStory(storyId: string, patch: Partial<TripStory>): Promise<TripStory> {
  const { url } = cfg();
  const response = await fetch(
    `${url}/rest/v1/trip_stories?id=eq.${encodeURIComponent(storyId)}`,
    {
      method: "PATCH",
      headers: { ...headers(), Prefer: "return=representation" },
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
      cache: "no-store",
    },
  );
  const data = await jsonResponse(response, "Unable to save your Maldives Story.");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Unable to save your Maldives Story.");
  return row;
}

export async function photosForStory(storyId: string): Promise<StoryPhoto[]> {
  const { url } = cfg();
  const response = await fetch(
    `${url}/rest/v1/trip_story_photos?select=*&story_id=eq.${encodeURIComponent(storyId)}&order=sort_order.asc,created_at.asc`,
    { headers: headers(false), cache: "no-store" },
  );
  const data = await jsonResponse(response, "Unable to load story photos.");
  return Array.isArray(data) ? data : [];
}

export async function signedStoryPhoto(path: string, expiresIn = 3600) {
  const { url, key } = cfg();
  const response = await fetch(
    `${url}/storage/v1/object/sign/trip-stories/${encodePath(path)}`,
    {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn }),
      cache: "no-store",
    },
  );
  const data = await jsonResponse(response, "Unable to open story photo.");
  const signed = data?.signedURL || data?.signedUrl || "";
  if (!signed) throw new Error("Unable to open story photo.");
  return signed.startsWith("http") ? signed : `${url}/storage/v1${signed}`;
}

export async function signedPhotosForStory(storyId: string, expiresIn = 3600): Promise<StoryPhoto[]> {
  const photos = await photosForStory(storyId);
  return Promise.all(
    photos.map(async photo => {
      try {
        return { ...photo, signed_url: await signedStoryPhoto(photo.storage_path, expiresIn) };
      } catch {
        return { ...photo, signed_url: "" };
      }
    }),
  );
}

export async function uploadStoryObject(path: string, file: File) {
  const { url, key } = cfg();
  const response = await fetch(
    `${url}/storage/v1/object/trip-stories/${encodePath(path)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Unable to upload story photo.");
  }
}

export async function insertStoryPhoto(storyId: string, storagePath: string, caption = ""): Promise<StoryPhoto> {
  const { url } = cfg();
  const current = await photosForStory(storyId);
  const response = await fetch(`${url}/rest/v1/trip_story_photos`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      story_id: storyId,
      storage_path: storagePath,
      caption,
      sort_order: current.length,
    }),
    cache: "no-store",
  });
  const data = await jsonResponse(response, "Unable to save story photo.");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Unable to save story photo.");
  return row;
}

export async function deleteStoryPhoto(storyId: string, photoId: string) {
  const { url, key } = cfg();
  const lookup = await fetch(
    `${url}/rest/v1/trip_story_photos?select=*&id=eq.${encodeURIComponent(photoId)}&story_id=eq.${encodeURIComponent(storyId)}&limit=1`,
    { headers: headers(false), cache: "no-store" },
  );
  const rows = await jsonResponse(lookup, "Unable to find story photo.");
  const photo: StoryPhoto | undefined = rows?.[0];
  if (!photo) throw new Error("Story photo not found.");

  const storageResponse = await fetch(`${url}/storage/v1/object/trip-stories`, {
    method: "DELETE",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [photo.storage_path] }),
  });
  if (!storageResponse.ok && storageResponse.status !== 404) {
    throw new Error("Unable to remove story photo.");
  }

  const deleteResponse = await fetch(
    `${url}/rest/v1/trip_story_photos?id=eq.${encodeURIComponent(photoId)}&story_id=eq.${encodeURIComponent(storyId)}`,
    { method: "DELETE", headers: headers(false), cache: "no-store" },
  );
  if (!deleteResponse.ok) throw new Error("Unable to remove story photo.");
}

export async function publicStoryByToken(token: string) {
  const { url } = cfg();
  const response = await fetch(
    `${url}/rest/v1/trip_stories?select=*&share_token=eq.${encodeURIComponent(token)}&is_public=eq.true&limit=1`,
    { headers: headers(false), cache: "no-store" },
  );
  const data = await jsonResponse(response, "Story not found.");
  const story: TripStory | undefined = data?.[0];
  if (!story) return null;

  const reservationResponse = await fetch(
    `${url}/rest/v1/reservations?select=id,booking_reference,property_name,room_type,check_in,check_out,guest_name,guest_email,status,package_name,activities,meal_plan,adults,children,speedboat_seats&id=eq.${encodeURIComponent(story.reservation_id)}&limit=1`,
    { headers: headers(false), cache: "no-store" },
  );
  const reservations = await jsonResponse(reservationResponse, "Unable to load story journey.");
  const reservation = reservations?.[0] || null;
  if (!reservation) return null;

  const photos = await signedPhotosForStory(story.id, 3600);
  return { story, reservation, photos };
}
