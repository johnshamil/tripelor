import { requireUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Flight Desk is not configured.");
  return { url, key };
}

export async function GET() {
  try {
    const user = await requireUser();
    const { url, key } = cfg();
    const response = await fetch(
      `${url}/rest/v1/flight_requests?user_id=eq.${encodeURIComponent(user.id)}&select=id,reference,trip_type,origin,destination,departure_date,return_date,adults,children,infants,cabin,status,airline,outbound_flight,return_flight,baggage,fare_rules,selling_price,quote_expires_at,pnr,e_ticket_numbers,created_at,updated_at&order=created_at.desc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(data?.message || "Unable to load your flights.");
    return Response.json({ requests: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please sign in." }, { status: 401 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load your flights." },
      { status: 500 },
    );
  }
}
