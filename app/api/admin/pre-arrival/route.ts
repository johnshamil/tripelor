import {isAdminEmail, requireUser} from "@/lib/auth-server";

const allowedStatuses = new Set(["submitted", "reviewed", "confirmed"]);

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Admin database is not configured.");
  return {url, key};
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return Response.json({error: "Admin access required."}, {status: 403});

    const input = await request.json();
    const id = String(input.id || "");
    const status = String(input.status || "");
    if (!/^[0-9a-f-]{36}$/i.test(id) || !allowedStatuses.has(status)) {
      return Response.json({error: "Invalid concierge update."}, {status: 400});
    }

    const {url, key} = config();
    const response = await fetch(`${url}/rest/v1/pre_arrival_preferences?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({status, updated_at: new Date().toISOString()}),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : [];
    if (!response.ok) throw new Error(data?.message || "Unable to update concierge request.");
    if (!data?.[0]) return Response.json({error: "Concierge request not found."}, {status: 404});
    return Response.json({success: true, preference: data[0]});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update concierge request.";
    return Response.json(
      {error: message === "UNAUTHORIZED" ? "Please log in." : message},
      {status: message === "UNAUTHORIZED" ? 401 : 500},
    );
  }
}
