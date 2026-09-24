import { randomUUID } from "node:crypto";
import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const cabins = new Set(["Economy","Premium Economy","Business","First"]);
const tripTypes = new Set(["one-way","round-trip"]);

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Flight Desk is not configured.");
  return { url, key };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function maldivesToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Maldives",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeHtml(value: string) {
  const entities: Record<string,string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, character => entities[character] || character);
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: "Please request your flight fare from the Tripelor website." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Please submit a valid flight request." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 20_000) {
      return Response.json({ error: "This request is too large." }, { status: 413 });
    }

    const body = await request.json();
    if (text(body?.company, 100)) {
      return Response.json({ success: true, reference: "FLT-SAVED" });
    }

    const user = await currentUser().catch(() => null);
    const customerName = text(body?.customerName, 120);
    const customerEmail = text(body?.customerEmail, 250).toLowerCase();
    const customerPhone = text(body?.customerPhone, 60);
    const tripType = text(body?.tripType, 30);
    const originCity = text(body?.origin, 120);
    const destination = text(body?.destination || "MLE", 120).toUpperCase();
    const departureDate = text(body?.departureDate, 10);
    const returnDate = text(body?.returnDate, 10);
    const adults = integer(body?.adults, 1, 20, 1);
    const children = integer(body?.children, 0, 20, 0);
    const infants = integer(body?.infants, 0, 10, 0);
    const cabin = text(body?.cabin, 40);
    const flexibleDates = body?.flexibleDates === true;
    const notes = text(body?.notes, 2000);
    const marketingConsent = body?.marketingConsent === true;

    if (!customerName) return Response.json({ error: "Please enter the lead passenger name." }, { status: 400 });
    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!tripTypes.has(tripType)) return Response.json({ error: "Choose one-way or round-trip." }, { status: 400 });
    if (originCity.length < 2) return Response.json({ error: "Enter your departure city or airport." }, { status: 400 });
    if (destination.length < 2) return Response.json({ error: "Enter a destination airport." }, { status: 400 });
    if (!validDate(departureDate) || departureDate < maldivesToday()) {
      return Response.json({ error: "Choose a valid future departure date." }, { status: 400 });
    }
    if (tripType === "round-trip" && (!validDate(returnDate) || returnDate < departureDate)) {
      return Response.json({ error: "Choose a valid return date after your departure." }, { status: 400 });
    }
    if (!cabins.has(cabin)) return Response.json({ error: "Choose a valid cabin class." }, { status: 400 });
    if (infants > adults) return Response.json({ error: "Infants cannot exceed the number of adults." }, { status: 400 });

    const reference = `FLT-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const payload = {
      reference,
      user_id: user?.id || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      trip_type: tripType,
      origin: originCity,
      destination,
      departure_date: departureDate,
      return_date: tripType === "round-trip" ? returnDate : null,
      adults,
      children,
      infants,
      cabin,
      flexible_dates: flexibleDates,
      notes,
      marketing_consent: marketingConsent,
      status: "new",
      source: "tripelor-flight-desk",
      updated_at: new Date().toISOString(),
    };

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/flight_requests`, {
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
      console.error("Flight request insert failed:", raw);
      throw new Error("We could not save your flight request. Please try again.");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const itinerary = tripType === "round-trip"
        ? `${originCity} → ${destination} · ${departureDate} / ${returnDate}`
        : `${originCity} → ${destination} · ${departureDate}`;
      const rows: Array<[string,string]> = [
        ["Reference", reference],
        ["Passenger", customerName],
        ["Email", customerEmail],
        ["Phone / WhatsApp", customerPhone || "—"],
        ["Itinerary", itinerary],
        ["Passengers", `${adults} adult(s), ${children} child(ren), ${infants} infant(s)`],
        ["Cabin", cabin],
        ["Flexible dates", flexibleDates ? "Yes" : "No"],
        ["Notes", notes || "—"],
      ];
      const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:auto">
        <h1>New Tripelor Flight Fare Request</h1>
        <p>This is a fare request, not a confirmed airline booking. Check an authorized airline/GDS/consolidator source before quoting.</p>
        <table style="width:100%;border-collapse:collapse">${rows.map(([label,value]) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd"><b>${escapeHtml(label)}</b></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join("")}</table>
      </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Tripelor Flight Desk <bookings@tripelor.com>",
          to: ["bookings@tripelor.com"],
          bcc: ["johnshamil87@gmail.com"],
          reply_to: customerEmail,
          subject: `${reference} · New flight fare request · ${originCity} to ${destination}`,
          html,
        }),
      }).catch(() => {});
    }

    return Response.json(
      { success: true, reference, accountLinked: Boolean(user?.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save your flight request." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
