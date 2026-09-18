import { NextRequest } from "next/server";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "property_view",
  "booking_started",
  "booking_completed",
  "whatsapp_click",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOT_PATTERN = /bot|crawler|spider|preview|slurp|headless|lighthouse/i;

function databaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function cleanText(value: unknown, maximum: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, maximum);
  return cleaned || null;
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 12)
      .flatMap(([key, entry]) => {
        const cleanKey = cleanText(key, 60);
        const cleanValue = cleanText(entry, 300);
        return cleanKey && cleanValue ? [[cleanKey, cleanValue]] : [];
      }),
  );
}

export async function POST(request: NextRequest) {
  const config = databaseConfig();
  if (!config) return Response.json({ error: "Analytics is not configured." }, { status: 503 });

  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  if (origin && ![requestOrigin, "https://tripelor.com", "https://www.tripelor.com"].includes(origin)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return new Response(null, { status: 204 });

  try {
    const body = await request.json();
    const eventName = cleanText(body?.eventName, 60);
    const path = cleanText(body?.path, 500);
    const visitorId = cleanText(body?.visitorId, 40);
    const sessionId = cleanText(body?.sessionId, 40);
    const requestedDevice = cleanText(body?.device, 20);

    if (
      !eventName ||
      !ALLOWED_EVENTS.has(eventName) ||
      !path ||
      !path.startsWith("/") ||
      !visitorId ||
      !sessionId ||
      !UUID_PATTERN.test(visitorId) ||
      !UUID_PATTERN.test(sessionId)
    ) {
      return Response.json({ error: "Invalid analytics event." }, { status: 400 });
    }

    const countryHeader = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
    const country = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
    const device = ["mobile", "tablet", "desktop", "other"].includes(requestedDevice || "")
      ? requestedDevice
      : "other";

    const response = await fetch(`${config.url}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        event_name: eventName,
        path,
        session_id: sessionId,
        visitor_id: visitorId,
        referrer: cleanText(body?.referrer, 1000),
        source: cleanText(body?.source, 120) || "Direct",
        country,
        device,
        metadata: cleanMetadata(body?.metadata),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Analytics insert failed", response.status, await response.text());
      return Response.json({ error: "Unable to record analytics." }, { status: 500 });
    }

    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Invalid analytics request." }, { status: 400 });
  }
}
