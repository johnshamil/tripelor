import { NextRequest } from "next/server";
import { isAdminEmail, requireUser } from "@/lib/auth-server";

function databaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Admin database is not configured.");
  return { url, key };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const requestedDays = Number(new URL(request.url).searchParams.get("days") || 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
    const { url, key } = databaseConfig();

    const response = await fetch(`${url}/rest/v1/rpc/get_website_analytics`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_days: days }),
      cache: "no-store",
    });

    const text = await response.text();
    if (!response.ok) throw new Error(text || "Unable to load website analytics.");
    const analytics = text ? JSON.parse(text) : null;
    return Response.json(analytics || { days, metrics: {} }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load website analytics.";
    const unauthorized = message === "UNAUTHORIZED";
    return Response.json(
      { error: unauthorized ? "Please log in." : message },
      { status: unauthorized ? 401 : 500 },
    );
  }
}
