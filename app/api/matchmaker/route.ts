import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const styles = new Set(["romance","family","ocean","adventure","relax"]);
const destinations = new Set(["flexible","vaavu","ukulhas","maafushi","airport"]);
const meals = new Set(["flexible","Bed & Breakfast","Half Board","Full Board"]);

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Lead storage is not configured.");
  return { url, key };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, min: number, max: number, fallback = min) {
  const result = Number(value);
  return Number.isInteger(result) && result >= min && result <= max ? result : fallback;
}

function amount(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 && result <= 1_000_000 ? Math.round(result * 100) / 100 : 0;
}

function validDate(value: string) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] || character);
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: "Please submit your match from the Tripelor website." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Please submit a valid Matchmaker request." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 20_000) {
      return Response.json({ error: "This request is too large." }, { status: 413 });
    }

    const body = await request.json();
    if (text(body?.company, 100)) {
      return Response.json({ success: true, reference: "MATCH-SAVED" });
    }

    const name = text(body?.name, 120);
    const email = text(body?.email, 250).toLowerCase();
    const whatsapp = text(body?.whatsapp, 60);
    const style = text(body?.style, 30);
    const destination = text(body?.destination, 30);
    const meal = text(body?.meal, 40);
    const arrival = validDate(text(body?.arrival, 10));
    const adults = integer(body?.adults, 1, 20, 1);
    const children = integer(body?.children, 0, 20, 0);
    const nights = integer(body?.nights, 1, 60, 5);
    const budget = amount(body?.budget);
    const recommendedProperty = text(body?.recommendedProperty, 180);
    const recommendedRoom = text(body?.recommendedRoom, 180);
    const estimatedStayTotal = amount(body?.estimatedStayTotal);
    const marketingConsent = body?.marketingConsent === true;

    if (!name) return Response.json({ error: "Please enter your name." }, { status: 400 });
    if (!email && !whatsapp) return Response.json({ error: "Add an email address or WhatsApp number so we can save your trip match." }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!styles.has(style) || !destinations.has(destination) || !meals.has(meal)) {
      return Response.json({ error: "Please complete the Matchmaker questions." }, { status: 400 });
    }

    const reference = `MATCH-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const payload = {
      reference,
      name,
      email,
      whatsapp,
      adults,
      children,
      arrival: arrival || null,
      nights,
      budget_usd: budget,
      travel_style: style,
      destination,
      meal_preference: meal,
      recommended_property: recommendedProperty,
      recommended_room: recommendedRoom,
      estimated_stay_total: estimatedStayTotal,
      marketing_consent: marketingConsent,
      status: "new",
      source: "website-matchmaker",
      updated_at: new Date().toISOString(),
    };

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/matchmaker_leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const raw = await response.text();
    if (!response.ok) {
      console.error("Matchmaker lead insert failed:", raw);
      throw new Error("We could not save your trip match. Please try again.");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const details = [
        ["Reference", reference],
        ["Name", name],
        ["Email", email || "—"],
        ["WhatsApp", whatsapp || "—"],
        ["Travellers", `${adults} adult(s), ${children} child(ren)`],
        ["Arrival", arrival || "Flexible"],
        ["Nights", String(nights)],
        ["Accommodation budget", budget ? `USD ${budget.toFixed(2)}` : "Flexible"],
        ["Style", style],
        ["Destination", destination],
        ["Meal preference", meal],
        ["Top match", recommendedProperty || "No automatic match"],
        ["Room", recommendedRoom || "—"],
        ["Estimated stay total", estimatedStayTotal ? `USD ${estimatedStayTotal.toFixed(2)}` : "—"],
        ["Marketing opt-in", marketingConsent ? "Yes" : "No"],
      ];
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">
        <h1>New Tripelor Matchmaker Lead</h1>
        <p>A visitor requested a personalised Maldives match. Re-check live availability and final prices before quoting.</p>
        <table style="border-collapse:collapse;width:100%">${details.map(([label,value]) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd"><b>${escapeHtml(label)}</b></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join("")}</table>
      </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Tripelor Matchmaker <bookings@tripelor.com>",
          to: ["bookings@tripelor.com"],
          bcc: ["johnshamil87@gmail.com"],
          reply_to: email || undefined,
          subject: `${reference} · New Maldives Matchmaker lead · ${name}`,
          html,
        }),
      }).catch(() => {});
    }

    return Response.json(
      { success: true, reference },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save your Maldives match." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
