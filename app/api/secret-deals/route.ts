import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

const dealTypes = new Set(["honeymoon","budget","family","ocean","luxury","last-minute"]);
const destinations = new Set(["flexible","vaavu","ukulhas","maafushi","airport"]);

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Secret Deals storage is not configured.");
  return { url, key };
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, min: number, max: number, fallback: number) {
  const result = Number(value);
  return Number.isInteger(result) && result >= min && result <= max ? result : fallback;
}

function amount(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 && result <= 1_000_000 ? Math.round(result * 100) / 100 : 0;
}

function validMonth(value: string) {
  if (!value) return "";
  if (!/^\d{4}-\d{2}$/.test(value)) return "";
  const [year, month] = value.split("-").map(Number);
  return year >= 2026 && year <= 2100 && month >= 1 && month <= 12 ? value : "";
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
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
      return Response.json({ error: "Please unlock your deal from the Tripelor website." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Please submit a valid Secret Deals request." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 20_000) {
      return Response.json({ error: "This request is too large." }, { status: 413 });
    }

    const body = await request.json();
    if (text(body?.company, 100)) {
      return Response.json({ success: true, reference: "DEAL-SAVED" });
    }

    const name = text(body?.name, 120);
    const email = text(body?.email, 250).toLowerCase();
    const whatsapp = text(body?.whatsapp, 60);
    const country = text(body?.country, 100);
    const travelMonth = validMonth(text(body?.travelMonth, 7));
    const adults = integer(body?.adults, 1, 20, 2);
    const children = integer(body?.children, 0, 20, 0);
    const nights = integer(body?.nights, 1, 30, 5);
    const budget = amount(body?.budget);
    const dealType = text(body?.dealType, 30);
    const destination = text(body?.destination, 30);
    const revealedProperty = text(body?.revealedProperty, 180);
    const revealedRoom = text(body?.revealedRoom, 180);
    const estimatedTotal = amount(body?.estimatedTotal);
    const marketingConsent = body?.marketingConsent === true;

    if (!name) return Response.json({ error: "Please enter your name." }, { status: 400 });
    if (!email && !whatsapp) {
      return Response.json({ error: "Add an email address or WhatsApp number to unlock your private offers." }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!dealTypes.has(dealType) || !destinations.has(destination)) {
      return Response.json({ error: "Please complete the Secret Deals questions." }, { status: 400 });
    }

    const reference = `DEAL-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    const payload = {
      reference,
      name,
      email,
      whatsapp,
      country,
      travel_month: travelMonth,
      adults,
      children,
      nights,
      budget_usd: budget,
      deal_type: dealType,
      destination,
      revealed_property: revealedProperty,
      revealed_room: revealedRoom,
      estimated_total: estimatedTotal,
      marketing_consent: marketingConsent,
      status: "new",
      source: "website-secret-deals",
      updated_at: new Date().toISOString(),
    };

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/secret_deal_leads`, {
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
      console.error("Secret Deals lead insert failed:", raw);
      throw new Error("We could not unlock your private offers. Please try again.");
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const details: Array<[string, string]> = [
        ["Reference", reference],
        ["Name", name],
        ["Email", email || "—"],
        ["WhatsApp", whatsapp || "—"],
        ["Country", country || "—"],
        ["Travel month", travelMonth || "Flexible"],
        ["Travellers", `${adults} adult(s), ${children} child(ren)`],
        ["Nights", String(nights)],
        ["Accommodation budget", budget ? `USD ${budget.toFixed(2)}` : "Flexible"],
        ["Deal type", dealType],
        ["Destination", destination],
        ["Top unlocked property", revealedProperty || "No automatic match"],
        ["Room", revealedRoom || "—"],
        ["Starting estimate", estimatedTotal ? `USD ${estimatedTotal.toFixed(2)}` : "—"],
        ["Marketing opt-in", marketingConsent ? "Yes" : "No"],
      ];
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">
        <h1>New Tripelor Secret Deals Lead</h1>
        <p>A visitor unlocked private Maldives offers. Re-check availability, taxes and the final selling price before quoting.</p>
        <table style="border-collapse:collapse;width:100%">${details.map(([label,value]) => `<tr><td style="padding:8px;border-bottom:1px solid #ddd"><b>${escapeHtml(label)}</b></td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value)}</td></tr>`).join("")}</table>
      </div>`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Tripelor Secret Deals <bookings@tripelor.com>",
          to: ["bookings@tripelor.com"],
          bcc: ["johnshamil87@gmail.com"],
          reply_to: email || undefined,
          subject: `${reference} · Secret Deal lead · ${name}`,
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
      { error: error instanceof Error ? error.message : "Unable to unlock your private offers." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
