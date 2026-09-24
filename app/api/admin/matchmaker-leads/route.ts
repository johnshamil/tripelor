import { currentUser, isAdminEmail } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Lead storage is not configured.");
  return { url, key };
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdminEmail(user.email)) throw new Error("FORBIDDEN");
  return user;
}

function responseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to load Matchmaker leads.";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Please sign in." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Admin access required." }, { status: 403 });
  return Response.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();
    const { url, key } = cfg();
    const response = await fetch(
      `${url}/rest/v1/matchmaker_leads?select=*&order=created_at.desc&limit=250`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(data?.message || "Unable to load Matchmaker leads.");
    return Response.json({ leads: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return responseError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new Error("FORBIDDEN");
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const status = typeof body?.status === "string" ? body.status : "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid lead." }, { status: 400 });
    if (!["new","contacted","quoted","booked","closed"].includes(status)) {
      return Response.json({ error: "Invalid lead status." }, { status: 400 });
    }

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/matchmaker_leads?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      cache: "no-store",
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(data?.message || "Unable to update lead.");
    return Response.json({ lead: data?.[0] || null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return responseError(error);
  }
}
