import { createHash, randomUUID } from "node:crypto";
import { CART_PRODUCTS, CartLine, QuotedLine, isDate, quoteCart } from "@/lib/trip-cart";

export class CartBookingProblem extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type CartBookingRow = {
  id: string; user_id: string; submission_id: string; request_hash: string; booking_reference: string;
  status: "pending" | "confirmed" | "cancelled"; items: QuotedLine[]; estimated_total: number;
  guest_name: string; guest_email: string; guest_phone: string; notes: string;
  created_at: string; notification_sent_at: string | null;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function cartBookingBody(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new CartBookingProblem("Please submit your request from the Tripelor website.", 403);
  if (!request.headers.get("content-type")?.includes("application/json")) throw new CartBookingProblem("Please submit a valid booking request.", 415);
  if (Number(request.headers.get("content-length") || 0) > 16000) throw new CartBookingProblem("Your booking request is too large.", 413);
  const text = await request.text();
  if (text.length > 16000) throw new CartBookingProblem("Your booking request is too large.", 413);
  try { return JSON.parse(text); } catch { throw new CartBookingProblem("Please submit a valid booking request."); }
}

function normalizeRequest(body: any, email: string) {
  if (!body || typeof body !== "object" || !uuid.test(body.submissionId || "")) throw new CartBookingProblem("Please refresh your cart and try again.");
  if (typeof body.guestName !== "string" || !body.guestName.trim() || body.guestName.length > 120) throw new CartBookingProblem("Please enter your full name (up to 120 characters).");
  if (typeof body.phone !== "string" || body.phone.trim().length < 6 || body.phone.length > 40 || !/^[+\d\s().-]+$/.test(body.phone)) throw new CartBookingProblem("Please enter a valid phone number with country code.");
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 2000)) throw new CartBookingProblem("Keep your notes under 2,000 characters.");
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > CART_PRODUCTS.length) throw new CartBookingProblem("Please add an excursion or package to your cart.");
  const items: CartLine[] = body.items.map((line: any) => {
    if (!line || typeof line.productId !== "string" || line.productId.length > 120 || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100 || !isDate(line.date) || line.date > "9998-12-31") throw new CartBookingProblem("Check the dates and guest numbers for each cart item.");
    return { productId: line.productId, quantity: line.quantity, date: line.date };
  }).sort((a: CartLine, b: CartLine) => a.productId.localeCompare(b.productId));
  if (!Number.isFinite(body.expectedTotal) || body.expectedTotal <= 0) throw new CartBookingProblem("Please refresh your cart to check the total.");
  return { items, guestName: body.guestName.trim(), guestEmail: email, phone: body.phone.trim(), notes: (body.notes || "").trim(), expectedTotal: body.expectedTotal };
}

export async function cartBookingDB(query: string, init: RequestInit = {}): Promise<CartBookingRow[]> {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Cart booking database unavailable.");
  const response = await fetch(`${url}/rest/v1/cart_booking_requests${query}`, {
    ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) }, cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    if (response.status === 409) throw new CartBookingProblem("This booking request already exists.", 409);
    throw new Error("Cart booking storage failed.");
  }
  const text = await response.text();
  return text ? JSON.parse(text) : [];
}

export function publicCartBooking(row: CartBookingRow) {
  return { id: row.id, booking_reference: row.booking_reference, status: row.status, items: row.items, estimated_total: Number(row.estimated_total), guest_name: row.guest_name, guest_email: row.guest_email, guest_phone: row.guest_phone, notes: row.notes, created_at: row.created_at };
}
export function cartBookingResponse(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export function cartBookingError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return cartBookingResponse({ error: "Please sign in to book your cart." }, 401);
  if (error instanceof CartBookingProblem) return cartBookingResponse({ error: error.message }, error.status);
  return cartBookingResponse({ error: "We could not confirm your request. Your cart is kept; please retry or contact Tripelor." }, 500);
}

async function notifyCartBooking(row: CartBookingRow) {
  if (row.notification_sent_at || !process.env.RESEND_API_KEY) return;
  const details = row.items.map(item => `${item.name}\n${item.quantity} ${item.unit === "couple" ? "couple(s)" : "guest(s)"} × USD ${item.unitPrice} = USD ${item.lineTotal}\n${item.nights ? "Check-in" : "Preferred date"}: ${item.date}${item.checkOut ? `; check-out: ${item.checkOut}` : ""}\nIncludes: ${item.inclusions.join("; ")}`).join("\n\n");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `cart-booking/${row.id}` },
      body: JSON.stringify({ from: "Tripelor Bookings <bookings@tripelor.com>", to: ["bookings@tripelor.com"], bcc: ["johnshamil87@gmail.com"], reply_to: row.guest_email, subject: `Cart booking request ${row.booking_reference}`, text: `New cart booking request: ${row.booking_reference}\nStatus: pending confirmation\n\nGuest: ${row.guest_name}\nEmail: ${row.guest_email}\nPhone / WhatsApp: ${row.guest_phone}\n\n${details}\n\nEstimated total: USD ${row.estimated_total}\nNotes: ${row.notes || "None"}\n\nReview: https://www.tripelor.com/admin/cart-bookings\nNo payment or inventory hold has been made.` }),
      signal: AbortSignal.timeout(6000),
    });
    if (response.ok) await cartBookingDB(`?id=eq.${row.id}`, { method: "PATCH", body: JSON.stringify({ notification_sent_at: new Date().toISOString() }) });
  } catch { /* The durable request remains visible in the admin inbox if email is unavailable. */ }
}

export async function submitCartBooking(user: { id: string; email: string }, body: unknown) {
  const input = body as any;
  const normalized = normalizeRequest(body, user.email);
  const hash = createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
  const query = `?user_id=eq.${encodeURIComponent(user.id)}&submission_id=eq.${encodeURIComponent(input.submissionId)}&limit=1`;
  let row = (await cartBookingDB(query))[0];
  if (!row) {
    let quote: ReturnType<typeof quoteCart>;
    try { quote = quoteCart(normalized.items); } catch (e) { throw new CartBookingProblem(e instanceof Error ? e.message : "Please check your cart."); }
    if (quote.total !== normalized.expectedTotal) throw new CartBookingProblem("A price has changed. Refresh your cart and review the new total before booking.", 409);
    const payload = { user_id: user.id, submission_id: input.submissionId, request_hash: hash, booking_reference: `TRIP-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`, status: "pending", items: quote.items, estimated_total: quote.total, guest_name: normalized.guestName, guest_email: user.email, guest_phone: normalized.phone, notes: normalized.notes };
    try { row = (await cartBookingDB("", { method: "POST", body: JSON.stringify(payload) }))[0]; }
    catch (e) {
      if (!(e instanceof CartBookingProblem) || e.status !== 409) throw e;
      row = (await cartBookingDB(query))[0];
      if (!row) throw e;
    }
  }
  if (!row) throw new Error("Booking request was not saved.");
  if (row.request_hash !== hash) throw new CartBookingProblem("This request changed during submission. Refresh your cart and try again.", 409);
  await notifyCartBooking(row);
  return { bookingReference: row.booking_reference, total: Number(row.estimated_total), status: row.status };
}
