import {isAdminEmail, requireUser} from "@/lib/auth-server";

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Concierge database is not configured.");
  return {url, key};
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return Response.json({error: "Admin access required."}, {status: 403});

    const {url, key} = cfg();
    const r = await fetch(
      `${url}/rest/v1/pre_arrival_requests?select=*&order=submitted_at.desc&limit=200`,
      {headers: {apikey: key, Authorization: `Bearer ${key}`}, cache: "no-store"},
    );
    const text = await r.text();
    const data = text ? JSON.parse(text) : [];
    if (!r.ok) throw new Error(data?.message || "Unable to load concierge requests.");
    return Response.json({requests: data});
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: e instanceof Error ? e.message : "Unable to load concierge requests."}, {status: 500});
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return Response.json({error: "Admin access required."}, {status: 403});

    const body = await request.json();
    const reservationId = String(body?.reservationId || "").trim();
    const status = String(body?.status || "").toLowerCase();
    const allowed = new Set(["new", "reviewing", "confirmed", "completed"]);
    if (!reservationId || !allowed.has(status)) return Response.json({error: "Invalid concierge update."}, {status: 400});

    const {url, key} = cfg();
    const r = await fetch(
      `${url}/rest/v1/pre_arrival_requests?reservation_id=eq.${encodeURIComponent(reservationId)}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({status, updated_at: new Date().toISOString()}),
        cache: "no-store",
      },
    );
    const text = await r.text();
    const data = text ? JSON.parse(text) : [];
    if (!r.ok) throw new Error(data?.message || "Unable to update concierge request.");
    return Response.json({request: Array.isArray(data) ? data[0] : data});
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") return Response.json({error: "Please log in."}, {status: 401});
    return Response.json({error: e instanceof Error ? e.message : "Unable to update concierge request."}, {status: 500});
  }
}
