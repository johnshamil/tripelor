import {isAdminEmail, requireUser} from "@/lib/auth-server";

function env() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Admin database is not configured.");
  return {url, headers: {apikey: key, Authorization: `Bearer ${key}`}};
}

async function json(response: Response) {
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Unable to load admin data.");
  return text ? JSON.parse(text) : [];
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return Response.json({error: "Admin access required."}, {status: 403});

    const {url, headers} = env();
    const [bookingsResponse, salesResponse, servicesResponse, preArrivalsResponse] = await Promise.all([
      fetch(`${url}/rest/v1/reservations?select=*&order=check_in.asc&limit=500`, {headers, cache: "no-store"}),
      fetch(`${url}/rest/v1/sales_entries?select=*&order=sale_date.desc&limit=500`, {headers, cache: "no-store"}),
      fetch(`${url}/rest/v1/guest_service_requests?select=*&order=created_at.desc&limit=100`, {headers, cache: "no-store"}),
      fetch(`${url}/rest/v1/pre_arrival_preferences?select=*&order=updated_at.desc&limit=100`, {headers, cache: "no-store"}),
    ]);

    const bookings = await json(bookingsResponse);
    const sales = await json(salesResponse);
    let services = [];
    let preArrivals = [];
    try {
      services = await json(servicesResponse);
    } catch {}
    try {
      preArrivals = await json(preArrivalsResponse);
    } catch {}

    return Response.json({bookings, sales, services, preArrivals, generatedAt: new Date().toISOString()});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load command center.";
    return Response.json(
      {error: message === "UNAUTHORIZED" ? "Please log in." : message},
      {status: message === "UNAUTHORIZED" ? 401 : 500},
    );
  }
}
