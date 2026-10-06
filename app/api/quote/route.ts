import { randomUUID } from "node:crypto";
import { quoteCart, stayCartId, type CartLine } from "@/lib/trip-cart";
import { buildQuoteHref, createQuoteReference, QUOTE_VALID_MS } from "@/lib/trip-quote";
import { signQuote, type QuoteExtras } from "@/lib/trip-quote-server";
import { speedboatTransferTotal } from "@/lib/transfer-pricing";
import { MVR_PER_USD, quoteAmount } from "@/lib/quote-currency";
import { fiveNight, threeNight } from "@/lib/island-packages";

export const dynamic = "force-dynamic";

function cleanString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanContact(value: unknown, max: number) {
  return cleanString(value, max).replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanExtras(body: any): QuoteExtras {
  const transferSeatsRaw = Number(body?.transferSeats || 0);
  const transferSeats = Number.isInteger(transferSeatsRaw) && transferSeatsRaw >= 0 && transferSeatsRaw <= 20
    ? transferSeatsRaw
    : 0;
  const requestHref = cleanString(body?.requestHref, 2500);
  const customizeHref = cleanString(body?.customizeHref, 500);
  return {
    room: cleanString(body?.room, 100),
    meal: cleanString(body?.meal, 100),
    transferSeats,
    requestHref: requestHref.startsWith("/booking?") ? requestHref : "",
    customizeHref: customizeHref.startsWith("/build-your-trip") ? customizeHref : "",
    currency: body?.currency === "MVR" ? "MVR" : "USD",
    fxRate: MVR_PER_USD,
    clientName: cleanContact(body?.clientName, 120),
    clientEmail: cleanContact(body?.clientEmail, 180),
    clientPhone: cleanContact(body?.clientPhone, 50),
  };
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return Response.json({ error: "Please create your quote from the Tripelor website." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Please submit a valid trip quote." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 20000) {
      return Response.json({ error: "This trip plan is too large to quote." }, { status: 413 });
    }

    const body = await request.json();
    const quoted = quoteCart(body?.items);
    const lines: CartLine[] = quoted.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      date: item.date,
    }));
    const extras = cleanExtras(body);
    if (extras.room) {
      const selectedRooms = extras.room.split(", ");
      const allowedRooms = ["ROOM 101", "ROOM 102"];
      const builderProducts = [...threeNight, ...fiveNight].map(item => stayCartId(item.slug, item.nights));
      if (lines.length !== 1 || !builderProducts.includes(lines[0].productId) ||
          selectedRooms.length !== lines[0].quantity || new Set(selectedRooms).size !== selectedRooms.length ||
          selectedRooms.some(room => !allowedRooms.includes(room)) ||
          (extras.transferSeats !== 0 && extras.transferSeats !== selectedRooms.length * 2)) {
        return Response.json({ error: "Please review your room selection and transfer seats." }, { status: 400 });
      }
    }
    const issued = Date.now();
    const reference = createQuoteReference(new Date(issued), randomUUID().replace(/-/g, "").slice(0, 6));
    const baseHref = buildQuoteHref(reference, lines, issued);
    const url = new URL(baseHref, new URL(request.url).origin);

    if (extras.room) url.searchParams.set("room", extras.room);
    if (extras.meal) url.searchParams.set("meal", extras.meal);
    if (extras.transferSeats) url.searchParams.set("transferSeats", String(extras.transferSeats));
    if (extras.requestHref) url.searchParams.set("request", extras.requestHref);
    if (extras.customizeHref) url.searchParams.set("customize", extras.customizeHref);
    url.searchParams.set("currency", extras.currency || "USD");
    url.searchParams.set("fxRate", String(extras.fxRate));
    if (extras.clientName) url.searchParams.set("clientName", extras.clientName);
    if (extras.clientEmail) url.searchParams.set("clientEmail", extras.clientEmail);
    if (extras.clientPhone) url.searchParams.set("clientPhone", extras.clientPhone);

    const signature = signQuote(reference, issued, lines, extras);
    url.searchParams.set("sig", signature);

    return Response.json({
      reference,
      url: `${url.pathname}${url.search}`,
      total: quoteAmount(quoted.total + speedboatTransferTotal(extras.transferSeats), extras.currency || "USD", extras.fxRate),
      currency: extras.currency,
      expiresAt: new Date(issued + QUOTE_VALID_MS).toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not create this quote.";
    return Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
