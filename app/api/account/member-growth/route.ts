import { requireUser } from "@/lib/auth-server";

class GrowthError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new GrowthError("Member tools are temporarily unavailable.", 503);
  return { url, key };
}

async function db(path: string, init: RequestInit = {}) {
  const { url, key } = cfg();
  const response = await fetch(url + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new GrowthError(result?.message || "Unable to update member tools.", 503);
  return result;
}

function validDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function propertyForSlug(slug: string) {
  const rows = await db("managed_properties?slug=eq." + encodeURIComponent(slug) + "&status=eq.published&select=slug,data&limit=1");
  const row = rows?.[0];
  if (!row) throw new GrowthError("Choose a published Tripelor stay.", 404);
  return { slug: row.slug as string, name: String(row.data?.name || row.slug) };
}

export async function GET() {
  try {
    const user = await requireUser();
    const [preferences, holds] = await Promise.all([
      db("member_preferences?user_id=eq." + encodeURIComponent(user.id) + "&select=occasion,occasion_date,preferred_budget_usd,preferred_nights,preferred_style,marketing_opt_in,updated_at&limit=1"),
      db("deal_hold_requests?user_id=eq." + encodeURIComponent(user.id) + "&select=id,property_slug,property_name,check_in,check_out,notes,status,expires_at,created_at&order=created_at.desc&limit=20"),
    ]);
    return Response.json({ preferences: preferences?.[0] || null, holds, email: user.email }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Please sign in." }, { status: 401 });
    if (error instanceof GrowthError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Member tools are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = String(body?.action || "");

    if (action === "preferences") {
      const occasionValues = new Set(["none", "birthday", "anniversary", "honeymoon", "family", "friends", "other"]);
      const styleValues = new Set(["romance", "family", "ocean", "adventure", "relax"]);
      const occasion = occasionValues.has(body?.occasion) ? body.occasion : "none";
      const occasionDate = validDate(body?.occasionDate);
      const preferredBudget = body?.preferredBudgetUsd === "" || body?.preferredBudgetUsd == null ? null : Number(body.preferredBudgetUsd);
      const preferredNights = body?.preferredNights === "" || body?.preferredNights == null ? null : Number(body.preferredNights);
      const preferredStyle = styleValues.has(body?.preferredStyle) ? body.preferredStyle : null;
      if (preferredBudget != null && (!Number.isFinite(preferredBudget) || preferredBudget < 0 || preferredBudget > 1000000)) throw new GrowthError("Choose a valid budget.");
      if (preferredNights != null && (!Number.isInteger(preferredNights) || preferredNights < 1 || preferredNights > 60)) throw new GrowthError("Choose between 1 and 60 nights.");

      const rows = await db("member_preferences?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          occasion,
          occasion_date: occasionDate,
          preferred_budget_usd: preferredBudget,
          preferred_nights: preferredNights,
          preferred_style: preferredStyle,
          marketing_opt_in: Boolean(body?.marketingOptIn),
          updated_at: new Date().toISOString(),
        }),
      });
      return Response.json({ success: true, preferences: rows?.[0] || null });
    }

    if (action === "hold") {
      const slug = typeof body?.propertySlug === "string" ? body.propertySlug.trim() : "";
      if (!/^[a-z0-9-]{1,180}$/.test(slug)) throw new GrowthError("Choose a valid property.");
      const property = await propertyForSlug(slug);
      const checkIn = validDate(body?.checkIn);
      const checkOut = validDate(body?.checkOut);
      if ((checkIn && !checkOut) || (!checkIn && checkOut) || (checkIn && checkOut && checkOut <= checkIn)) {
        throw new GrowthError("Choose valid stay dates or leave both dates blank.");
      }
      const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
      const rows = await db("deal_hold_requests", {
        method: "POST",
        body: JSON.stringify({
          user_id: user.id,
          property_slug: property.slug,
          property_name: property.name,
          check_in: checkIn,
          check_out: checkOut,
          notes,
        }),
      });

      if (process.env.RESEND_API_KEY && user.email) {
        const subject = "Tripelor member deal-hold request · " + property.name;
        const text = [
          "A Tripelor member requested a 24-hour deal review.",
          "Member: " + user.email,
          "Property: " + property.name,
          checkIn ? "Check-in: " + checkIn : "",
          checkOut ? "Check-out: " + checkOut : "",
          notes ? "Notes: " + notes : "",
          "",
          "Important: this is a request for Tripelor to review whether a rate/inventory hold is possible. It is not automatically approved.",
        ].filter(Boolean).join("\n");
        void fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Tripelor Website <bookings@tripelor.com>",
            to: ["bookings@tripelor.com"],
            reply_to: user.email,
            subject,
            text,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        }).catch(() => undefined);
      }

      return Response.json({
        success: true,
        hold: rows?.[0] || null,
        message: "Request sent. Tripelor will confirm whether a 24-hour hold is available. No room or price is held until Tripelor confirms it.",
      });
    }

    throw new GrowthError("Choose a valid member action.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return Response.json({ error: "Please sign in." }, { status: 401 });
    if (error instanceof GrowthError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Unable to update member tools." }, { status: 500 });
  }
}
