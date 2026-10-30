import { requireUser } from "@/lib/auth-server";

class PriceAlertError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function db(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new PriceAlertError("Price alerts are temporarily unavailable.", 503);
  const response = await fetch(url + "/rest/v1/" + path, {
    ...init,
    headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new PriceAlertError("Unable to save or load price alerts.", 503);
  return result;
}

function currentStartingPrice(data: any) {
  const roomRates = Array.isArray(data?.rooms) ? data.rooms.map((x: any) => Number(x?.sellingRate)) : [];
  const seasonalRates = Array.isArray(data?.seasonalRates) ? data.seasonalRates.map((x: any) => Number(x?.sellingRate)) : [];
  const values = [...roomRates, ...seasonalRates].filter((x: number) => Number.isFinite(x) && x > 0);
  return values.length ? Math.min(...values) : 0;
}

async function propertyPrice(slug: string) {
  const rows = await db("managed_properties?slug=eq." + encodeURIComponent(slug) + "&status=eq.published&select=slug,data&limit=1");
  const row = rows?.[0];
  if (!row) throw new PriceAlertError("This property is not currently available for price watching.", 404);
  const price = currentStartingPrice(row.data);
  if (!price) throw new PriceAlertError("This property currently has rates on request, so a numeric price alert cannot be created.", 409);
  return { name: String(row.data?.name || slug), price };
}

export async function listPriceAlerts(userId: string) {
  return db("price_alerts?user_id=eq." + encodeURIComponent(userId) + "&select=id,property_slug,property_name,baseline_price,last_seen_price,status,created_at,notified_at&order=created_at.desc&limit=50");
}

export async function subscribePriceAlert(body: any) {
  const user = await requireUser();
  if (!user.email || !user.email_confirmed_at) throw new PriceAlertError("Confirm your account email before setting a price alert.", 403);
  const slug = typeof body?.propertySlug === "string" ? body.propertySlug.trim() : "";
  if (!/^[a-z0-9-]{1,180}$/.test(slug)) throw new PriceAlertError("Choose a valid property.");
  const current = await propertyPrice(slug);
  const existing = await db("price_alerts?user_id=eq." + encodeURIComponent(user.id) + "&property_slug=eq." + encodeURIComponent(slug) + "&status=eq.active&select=*&limit=1");
  if (existing.length) return { saved: true, email: user.email, price: Number(existing[0].baseline_price), existing: true };
  const active = await db("price_alerts?user_id=eq." + encodeURIComponent(user.id) + "&status=eq.active&select=id");
  if (active.length >= 10) throw new PriceAlertError("You can watch up to 10 property prices. Cancel one before adding another.", 409);
  const rows = await db("price_alerts", { method: "POST", body: JSON.stringify({ user_id: user.id, property_slug: slug, property_name: current.name, baseline_price: current.price, last_seen_price: current.price }) });
  return { saved: true, id: rows[0]?.id, email: user.email, price: current.price };
}

export async function cancelPriceAlert(id: unknown) {
  const user = await requireUser();
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)) throw new PriceAlertError("Choose a valid alert.");
  await db("price_alerts?id=eq." + encodeURIComponent(id) + "&user_id=eq." + encodeURIComponent(user.id) + "&status=eq.active", { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
}

async function customerEmail(id: string) {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(base + "/auth/v1/admin/users/" + encodeURIComponent(id), { headers: { apikey: key, Authorization: "Bearer " + key }, cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!response.ok) return null;
  const user = await response.json();
  return user.email_confirmed_at && typeof user.email === "string" ? user.email : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m] || m));
}

export async function processPriceAlerts() {
  const alerts = await db("price_alerts?status=eq.active&next_check_at=lte." + encodeURIComponent(new Date().toISOString()) + "&select=id,user_id,property_slug,property_name,baseline_price&order=next_check_at&limit=20");
  const summary = { checked: 0, sent: 0, failed: 0 };
  for (const alert of alerts) {
    try {
      const current = await propertyPrice(alert.property_slug);
      const patch: any = { last_seen_price: current.price, last_checked_at: new Date().toISOString(), next_check_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
      if (current.price < Number(alert.baseline_price)) {
        const email = await customerEmail(alert.user_id);
        if (email && process.env.RESEND_API_KEY) {
          const url = "https://www.tripelor.com/stays/" + encodeURIComponent(alert.property_slug);
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json", "Idempotency-Key": "price-alert/" + alert.id },
            body: JSON.stringify({
              from: "Tripelor <bookings@tripelor.com>",
              to: [email],
              reply_to: "bookings@tripelor.com",
              subject: "Price drop: " + alert.property_name,
              text: "Good news — the published Tripelor starting price for " + alert.property_name + " dropped from USD " + Number(alert.baseline_price).toFixed(2) + " to USD " + current.price.toFixed(2) + ". View the stay: " + url + "\n\nRates and availability can change and require confirmation.",
              html: "<div style=\"font-family:Arial,sans-serif;max-width:620px;margin:auto\"><h1>Price drop on a stay you watch</h1><p>The published Tripelor starting price for <strong>" + escapeHtml(alert.property_name) + "</strong> dropped from <strong>USD " + Number(alert.baseline_price).toFixed(2) + "</strong> to <strong>USD " + current.price.toFixed(2) + "</strong>.</p><p><a href=\"" + url + "\">View this stay</a></p><p style=\"font-size:12px\">Rates and availability can change and require confirmation.</p></div>"
            }),
            signal: AbortSignal.timeout(5000),
          });
          if (response.ok) { patch.status = "notified"; patch.notified_at = new Date().toISOString(); summary.sent++; }
        }
      }
      await db("price_alerts?id=eq." + alert.id + "&status=eq.active", { method: "PATCH", body: JSON.stringify(patch) });
      summary.checked++;
    } catch { summary.failed++; }
  }
  return summary;
}

export function priceAlertResponse(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export function priceAlertError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return priceAlertResponse({ error: "Please sign in to use price alerts." }, 401);
  if (error instanceof PriceAlertError) return priceAlertResponse({ error: error.message }, error.status);
  return priceAlertResponse({ error: "Price alerts are temporarily unavailable." }, 503);
}
