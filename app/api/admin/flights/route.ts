import { currentUser, isAdminEmail } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const statuses = new Set(["new","quoted","payment_pending","paid","ticketed","travelled","cancelled"]);

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Flight Desk is not configured.");
  return { url, key };
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdminEmail(user.email)) throw new Error("FORBIDDEN");
  return user;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to load Flight Desk.";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Please sign in." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Admin access required." }, { status: 403 });
  return Response.json({ error: message }, { status: 500 });
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function amount(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000 ? Math.round(number * 100) / 100 : 0;
}

function validExpiry(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
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

async function notifyCustomer(row: any, previousStatus: string) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || !row?.customer_email || row.status === previousStatus) return;

  let subject = "";
  let heading = "";
  let body = "";

  if (row.status === "quoted") {
    subject = `${row.reference} · Your Tripelor flight quote is ready`;
    heading = "Your flight quote is ready";
    body = `Tripelor has prepared a flight quote for ${row.origin} → ${row.destination}. The current selling price is USD ${Number(row.selling_price || 0).toFixed(2)}. Please review the fare conditions and contact Tripelor before the quote expires.`;
  } else if (row.status === "paid") {
    subject = `${row.reference} · Payment received for your flight`;
    heading = "Payment received";
    body = "Tripelor has recorded your payment. Ticket issuance is the next step. Your booking is not ticketed until you receive a PNR/e-ticket confirmation.";
  } else if (row.status === "ticketed") {
    subject = `${row.reference} · Your flight ticket has been issued`;
    heading = "Your flight ticket is issued";
    body = `PNR: ${row.pnr || "See Tripelor account"} · E-ticket: ${row.e_ticket_numbers || "See Tripelor account"}. Please verify passenger names, dates, baggage and fare rules immediately.`;
  } else {
    return;
  }

  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto">
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(body)}</p>
    <p><b>Tripelor reference:</b> ${escapeHtml(row.reference)}</p>
    <p><b>Route:</b> ${escapeHtml(row.origin)} → ${escapeHtml(row.destination)}</p>
    <p><b>Airline:</b> ${escapeHtml(row.airline || "To be confirmed")}</p>
    <p><b>Flight:</b> ${escapeHtml(row.outbound_flight || "To be confirmed")}</p>
    <p><b>Baggage:</b> ${escapeHtml(row.baggage || "See fare conditions")}</p>
    <p>For help, reply to this email or contact Tripelor.</p>
  </div>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Tripelor Flight Desk <bookings@tripelor.com>",
      to: [row.customer_email],
      reply_to: "bookings@tripelor.com",
      subject,
      html,
    }),
  }).catch(() => {});
}

export async function GET() {
  try {
    await requireAdmin();
    const { url, key } = cfg();
    const response = await fetch(
      `${url}/rest/v1/flight_requests?select=*&order=created_at.desc&limit=300`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(data?.message || "Unable to load Flight Desk.");
    return Response.json({ requests: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new Error("FORBIDDEN");

    const body = await request.json();
    const id = text(body?.id, 60);
    const status = text(body?.status, 40);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid flight request." }, { status: 400 });
    if (!statuses.has(status)) return Response.json({ error: "Invalid flight status." }, { status: 400 });

    const { url, key } = cfg();
    const previousResponse = await fetch(
      `${url}/rest/v1/flight_requests?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    const previousRows = await previousResponse.json();
    if (!previousResponse.ok || !previousRows?.[0]) return Response.json({ error: "Flight request not found." }, { status: 404 });
    const previous = previousRows[0];

    const supplier = text(body?.supplier, 160);
    const airline = text(body?.airline, 160);
    const outboundFlight = text(body?.outboundFlight, 40).toUpperCase();
    const returnFlight = text(body?.returnFlight, 40).toUpperCase();
    const baggage = text(body?.baggage, 500);
    const fareRules = text(body?.fareRules, 3000);
    const baseFare = amount(body?.baseFare);
    const taxes = amount(body?.taxes);
    const serviceFee = amount(body?.serviceFee);
    const sellingPrice = amount(body?.sellingPrice);
    const quoteExpiresAt = validExpiry(text(body?.quoteExpiresAt, 80));
    const pnr = text(body?.pnr, 40).toUpperCase();
    const eTicketNumbers = text(body?.eTicketNumbers, 1000);
    const adminNotes = text(body?.adminNotes, 3000);

    if (["quoted","payment_pending","paid","ticketed","travelled"].includes(status)) {
      if (!airline || !outboundFlight || sellingPrice <= 0) {
        return Response.json({ error: "Add airline, outbound flight and selling price before moving beyond New." }, { status: 400 });
      }
    }
    if (status === "ticketed" || status === "travelled") {
      if (!pnr || !eTicketNumbers) {
        return Response.json({ error: "Add the airline PNR and e-ticket number(s) before marking the request ticketed." }, { status: 400 });
      }
    }

    const payload = {
      status,
      supplier,
      airline,
      outbound_flight: outboundFlight,
      return_flight: returnFlight,
      baggage,
      fare_rules: fareRules,
      base_fare: baseFare,
      taxes,
      service_fee: serviceFee,
      selling_price: sellingPrice,
      quote_expires_at: quoteExpiresAt,
      pnr,
      e_ticket_numbers: eTicketNumbers,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(`${url}/rest/v1/flight_requests?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
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
    const rows = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(rows?.message || "Unable to update Flight Desk.");
    const row = rows?.[0] || null;
    if (row) await notifyCustomer(row, previous.status);

    return Response.json({ request: row }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
