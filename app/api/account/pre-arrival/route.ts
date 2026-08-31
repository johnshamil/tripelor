import {requireUser} from "@/lib/auth-server";

const celebrationTypes = new Set(["none", "birthday", "honeymoon", "anniversary", "other"]);
const beddingPreferences = new Set(["", "double", "twin", "no_preference"]);
const activityOptions = new Set([
  "manta_encounter",
  "turtle_snorkelling",
  "dolphin_cruise",
  "sandbank_escape",
  "sunset_fishing",
  "island_hopping",
  "shipwreck_snorkelling",
]);

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Concierge service is not configured.");
  return {url, key, headers: {apikey: key, Authorization: `Bearer ${key}`}};
}

function clean(value: unknown, max: number) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, max) : null;
}

function reservationId(value: unknown) {
  const id = String(value || "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ? id : "";
}

async function body(response: Response) {
  const text = await response.text();
  const value = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(value?.message || value?.error || "Unable to complete concierge request.");
  return value;
}

async function ownedBooking(id: string, email: string) {
  const {url, headers} = config();
  const response = await fetch(
    `${url}/rest/v1/reservations?select=id,property_name,room_type,check_in,check_out,status&limit=1&id=eq.${encodeURIComponent(id)}&guest_email=eq.${encodeURIComponent(email)}`,
    {headers, cache: "no-store"},
  );
  const bookings = await body(response);
  const booking = bookings?.[0];
  if (!booking || String(booking.status || "").toLowerCase() === "cancelled") return null;
  return booking;
}

function unauthorized(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const email = String(user.email || "").trim().toLowerCase();
    const id = reservationId(new URL(request.url).searchParams.get("reservationId"));
    if (!id) return Response.json({error: "Choose a valid booking."}, {status: 400});
    const booking = await ownedBooking(id, email);
    if (!booking) return Response.json({error: "Booking not found."}, {status: 404});

    const {url, headers} = config();
    const response = await fetch(
      `${url}/rest/v1/pre_arrival_preferences?select=*&limit=1&reservation_id=eq.${encodeURIComponent(id)}&guest_email=eq.${encodeURIComponent(email)}`,
      {headers, cache: "no-store"},
    );
    const preferences = await body(response);
    return Response.json({booking, preference: preferences?.[0] || null});
  } catch (error) {
    if (unauthorized(error)) return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: error instanceof Error ? error.message : "Unable to load concierge details."}, {status: 500});
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const email = String(user.email || "").trim().toLowerCase();
    const input = await request.json();
    const id = reservationId(input.reservationId);
    if (!id) return Response.json({error: "Choose a valid booking."}, {status: 400});
    const booking = await ownedBooking(id, email);
    if (!booking) return Response.json({error: "Booking not found."}, {status: 404});

    const celebrationType = String(input.celebrationType || "none");
    const beddingPreference = String(input.beddingPreference || "");
    const activities = Array.isArray(input.preferredActivities)
      ? [...new Set(input.preferredActivities.map(String).filter(value => activityOptions.has(value)))].slice(0, 7)
      : [];

    if (!celebrationTypes.has(celebrationType)) {
      return Response.json({error: "Choose a valid celebration type."}, {status: 400});
    }
    if (!beddingPreferences.has(beddingPreference)) {
      return Response.json({error: "Choose a valid bedding preference."}, {status: 400});
    }

    let arrivalAt: string | null = null;
    if (input.arrivalAt) {
      const arrival = new Date(`${String(input.arrivalAt)}:00+05:00`);
      if (Number.isNaN(arrival.getTime())) return Response.json({error: "Enter a valid arrival date and time."}, {status: 400});
      arrivalAt = arrival.toISOString();
    }

    const now = new Date().toISOString();
    const payload = {
      reservation_id: id,
      guest_email: email,
      flight_number: clean(input.flightNumber, 40),
      arrival_at: arrivalAt,
      transfer_required: Boolean(input.transferRequired),
      dietary_requirements: clean(input.dietaryRequirements, 600),
      allergies: clean(input.allergies, 600),
      bedding_preference: clean(beddingPreference, 40),
      room_preferences: clean(input.roomPreferences, 800),
      celebration_type: celebrationType,
      celebration_notes: clean(input.celebrationNotes, 600),
      preferred_activities: activities,
      early_check_in: Boolean(input.earlyCheckIn),
      late_check_out: Boolean(input.lateCheckOut),
      emergency_contact_name: clean(input.emergencyContactName, 100),
      emergency_contact_phone: clean(input.emergencyContactPhone, 60),
      notes: clean(input.notes, 1200),
      status: "submitted",
      updated_at: now,
    };

    const {url, key} = config();
    const response = await fetch(`${url}/rest/v1/pre_arrival_preferences?on_conflict=reservation_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });
    const saved = await body(response);
    return Response.json({success: true, preference: saved?.[0] || null});
  } catch (error) {
    if (unauthorized(error)) return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: error instanceof Error ? error.message : "Unable to save concierge details."}, {status: 500});
  }
}
