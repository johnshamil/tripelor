import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function queryRows(table: "manual_quotations" | "reservations", filter: string) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("DATABASE_NOT_CONFIGURED");
  const response = await fetch(`${url}/rest/v1/${table}?${filter}&select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("DATABASE_ERROR");
  return await response.json() as Array<Record<string, any>>;
}

function equalText(a: unknown, b: unknown) {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    if (!process.env.BML_UAT_API_KEY || !process.env.BML_UAT_APPLICATION_ID) {
      return Response.json({ error: "BML sandbox is not configured." }, { status: 503 });
    }
    const user = await currentUser();
    if (!user) return Response.json({ error: "Sign in to Tripelor first." }, { status: 401 });
    const testerEmail = process.env.BML_UAT_TESTER_EMAIL;
    if (!testerEmail || !equalText(user.email, testerEmail)) {
      return Response.json({ error: "Only the authorized tester can review payment readiness." }, { status: 403 });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Expected JSON." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 2000) {
      return Response.json({ error: "Request too large." }, { status: 413 });
    }
    const raw = await request.text();
    if (raw.length > 2000) return Response.json({ error: "Request too large." }, { status: 413 });
    const input = JSON.parse(raw);
    const token = String(input?.quoteToken || "").trim();
    const reference = String(input?.bookingReference || "").trim();
    if (!uuid.test(token) || !/^TRP-[A-Z0-9-]{6,40}$/i.test(reference)) {
      return Response.json({ error: "Enter a valid quotation token and booking reference." }, { status: 400 });
    }

    const [quoteRows, bookingRows] = await Promise.all([
      queryRows("manual_quotations", `share_token=eq.${encodeURIComponent(token)}`),
      queryRows("reservations", `booking_reference=eq.${encodeURIComponent(reference)}`),
    ]);
    const quote = quoteRows[0], booking = bookingRows[0];
    if (!quote || !booking) {
      return Response.json({ error: "Quotation and booking could not be matched." }, { status: 404 });
    }

    const price = Number(quote.total);
    const bookingPrice = Number(booking.estimated_total);
    const amountMinor = Number.isFinite(price) ? Math.round(price * 100) : 0;
    const checks = {
      quotationAccepted: quote.status === "accepted",
      quotationUnexpired: Number.isFinite(Date.parse(quote.valid_until)) && Date.parse(quote.valid_until) > Date.now(),
      bookingConfirmed: booking.status === "confirmed",
      bookingUnpaid: booking.payment_status === "unpaid",
      guestMatches: Boolean(quote.customer_email && booking.guest_email) && equalText(quote.customer_email, booking.guest_email),
      propertyMatches: Boolean(quote.property_name && booking.property_name) && equalText(quote.property_name, booking.property_name),
      datesMatch: Boolean(quote.check_in && quote.check_out) &&
        String(quote.check_in) === String(booking.check_in) && String(quote.check_out) === String(booking.check_out),
      currencyMvr: quote.currency === "MVR" && booking.currency === "MVR",
      priceMatches: Number.isFinite(price) && Number.isFinite(bookingPrice) &&
        amountMinor > 0 && amountMinor < 100000000000 &&
        Math.round(bookingPrice * 100) === amountMinor &&
        Math.abs(price * 100 - amountMinor) < 0.0001,
    };
    const eligible = Object.values(checks).every(Boolean);
    return Response.json({
      eligible,
      checks,
      currency: String(quote.currency),
      quotedAmount: Number.isFinite(price) ? price : null,
      bookingReference: String(booking.booking_reference),
      message: eligible
        ? "The booking and approved MVR quote agree. A payment-intent creation service is still required before collecting a payment."
        : "At least one booking/quotation condition is not met. Do not collect a card payment.",
      paymentEnabled: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Could not verify checkout readiness. No payment was started." }, { status: 503 });
  }
}
