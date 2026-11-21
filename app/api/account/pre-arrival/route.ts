import {requireUser} from "@/lib/auth-server";

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Concierge database is not configured.");
  return {url, key};
}

async function reservationForUser(reservationId: string, email: string) {
  const {url, key} = cfg();
  const fields = "id,booking_reference,property_name,room_type,check_in,check_out,guest_name,guest_email";
  const r = await fetch(
    `${url}/rest/v1/reservations?select=${fields}&id=eq.${encodeURIComponent(reservationId)}&guest_email=eq.${encodeURIComponent(email)}&limit=1`,
    {headers: {apikey: key, Authorization: `Bearer ${key}`}, cache: "no-store"},
  );
  const text = await r.text();
  const data = text ? JSON.parse(text) : [];
  if (!r.ok) throw new Error(data?.message || "Unable to verify this booking.");
  return data?.[0] || null;
}

function cleanText(value: unknown, max = 1200) {
  return String(value || "").trim().slice(0, max);
}

const allowedInterests = new Set([
  "Manta snorkeling",
  "Shark snorkeling",
  "Shipwreck visit",
  "Sandbank escape",
  "Dolphin cruise",
  "Night fishing",
  "Professional island photography",
  "Cinematic trip videography",
  "Drone photography & videography",
]);

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const reservationId = new URL(request.url).searchParams.get("reservationId") || "";
    if (!reservationId) return Response.json({error: "Booking is required."}, {status: 400});

    const reservation = await reservationForUser(reservationId, user.email || "");
    if (!reservation) return Response.json({error: "Booking not found."}, {status: 404});

    const {url, key} = cfg();
    const r = await fetch(
      `${url}/rest/v1/pre_arrival_requests?select=*&reservation_id=eq.${encodeURIComponent(reservationId)}&limit=1`,
      {headers: {apikey: key, Authorization: `Bearer ${key}`}, cache: "no-store"},
    );
    const text = await r.text();
    const data = text ? JSON.parse(text) : [];
    if (!r.ok) throw new Error(data?.message || "Unable to load concierge preferences.");
    return Response.json({request: data?.[0] || null});
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: e instanceof Error ? e.message : "Unable to load concierge preferences."}, {status: 500});
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const reservationId = cleanText(body?.reservationId, 80);
    if (!reservationId) return Response.json({error: "Booking is required."}, {status: 400});

    const reservation = await reservationForUser(reservationId, user.email || "");
    if (!reservation) return Response.json({error: "Booking not found."}, {status: 404});

    const interests = Array.isArray(body?.interests)
      ? Array.from(
          new Set<string>(
            body.interests
              .map((item: unknown) => cleanText(item, 80))
              .filter((item: string) => allowedInterests.has(item)),
          ),
        ).slice(0, allowedInterests.size)
      : [];

    const payload = {
      reservation_id: reservation.id,
      guest_email: reservation.guest_email,
      guest_name: reservation.guest_name || null,
      booking_reference: reservation.booking_reference || null,
      property_name: reservation.property_name,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      flight_number: cleanText(body?.flightNumber, 80) || null,
      arrival_time: cleanText(body?.arrivalTime, 40) || null,
      transfer_preference: cleanText(body?.transfer, 240) || "Please help arrange my speedboat transfer",
      bed_preference: cleanText(body?.bedPreference, 160) || "No preference",
      dietary: cleanText(body?.dietary, 1500) || null,
      celebration: cleanText(body?.celebration, 300) || null,
      interests,
      special_request: cleanText(body?.specialRequest, 2000) || null,
      status: "new",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const {url, key} = cfg();
    const r = await fetch(`${url}/rest/v1/pre_arrival_requests?on_conflict=reservation_id`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const text = await r.text();
    const data = text ? JSON.parse(text) : [];
    if (!r.ok) throw new Error(data?.message || "Unable to submit concierge request.");
    return Response.json({request: Array.isArray(data) ? data[0] : data});
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: e instanceof Error ? e.message : "Unable to submit concierge request."}, {status: 500});
  }
}
