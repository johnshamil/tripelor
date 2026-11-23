import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { db, LIVE_TERMS_VERSION, paymentId, safeJson } from "@/lib/bml-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MINOR_AMOUNT_LIMIT = 100000000; // USD 1,000,000 max; admin-reviewed total only.

/** Admin explicitly approves a FINAL USD price for an existing confirmed request. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return safeJson({ error: "Admin access required." }, 403);
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return safeJson({ error: "Invalid request origin." }, 403);
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return safeJson({ error: "JSON required." }, 415);
    }
    const bodyText = await request.text();
    if (bodyText.length > 2000) return safeJson({ error: "Request too large." }, 413);
    const input = JSON.parse(bodyText);
    if (!paymentId.test(input?.bookingId || "") || !paymentId.test(input?.idempotencyKey || "") ||
      !["reservation", "cart"].includes(input?.bookingType) ||
      !Number.isSafeInteger(input?.finalAmountMinor) || input.finalAmountMinor < 1 ||
      input.finalAmountMinor > MINOR_AMOUNT_LIMIT ||
      input?.approveFinalPrice !== true) {
      return safeJson({ error: "Select a confirmed booking, enter the approved USD amount and explicitly approve." }, 400);
    }
    const existing = await db(`bml_live_payment_intents?select=*&idempotency_key=eq.${encodeURIComponent(input.idempotencyKey)}&limit=1`);
    if (existing?.length) {
      const original = existing[0];
      const matchingBooking = input.bookingType === "reservation"
        ? original.reservation_id === input.bookingId
        : original.cart_booking_id === input.bookingId;
      if (!matchingBooking || Number(original.approved_amount_minor) !== input.finalAmountMinor) {
        return safeJson({ error: "This request key belongs to a different booking or approved amount." }, 409);
      }
      return safeJson({ intentId: original.id, paymentUrl: `/pay/${original.id}`, existing: true });
    }
    const table = input.bookingType === "reservation" ? "reservations" : "cart_booking_requests";
    const rows = await db(`${table}?select=*&id=eq.${encodeURIComponent(input.bookingId)}&limit=1`);
    const booking = rows?.[0];
    if (!booking || booking.status !== "confirmed" ||
        !booking.booking_reference || !booking.guest_email) {
      return safeJson({ error: "Booking is missing or not confirmed. Review booking before requesting payment." }, 409);
    }
    if (input.bookingType === "reservation" &&
      (booking.currency !== "USD" || booking.payment_status === "paid")) {
      return safeJson({ error: "Only unpaid USD reservations can be charged through this application." }, 409);
    }
    // During the initial rollout there can be only one payment request per
    // booking, even after a failed/cancelled bank state. Do not make a second
    // attempt until the bank has reconciled the first transaction.
    const bookingKey = input.bookingType === "reservation" ? "reservation_id" : "cart_booking_id";
    const byBooking = await db(
      `bml_live_payment_intents?select=*&${bookingKey}=eq.${encodeURIComponent(input.bookingId)}&limit=1`
    );
    if (byBooking?.length) {
      const original = byBooking[0];
      if (Number(original.approved_amount_minor) !== input.finalAmountMinor) {
        return safeJson({ error: "This booking already has a payment request for a different approved amount. Reconcile that request before editing the price." }, 409);
      }
      return safeJson({ intentId: original.id, paymentUrl: `/pay/${original.id}`, existing: true });
    }
    const payload = {
      reservation_id: input.bookingType === "reservation" ? input.bookingId : null,
      cart_booking_id: input.bookingType === "cart" ? input.bookingId : null,
      booking_reference: booking.booking_reference,
      customer_email: booking.guest_email.toLowerCase(),
      currency: "USD",
      approved_amount_minor: input.finalAmountMinor,
      approved_by: user.id,
      terms_version: LIVE_TERMS_VERSION,
      idempotency_key: input.idempotencyKey,
      local_id: `TRP-LIVE-${input.idempotencyKey}`,
      status: "awaiting_payment"
    };
    const saved = await db("bml_live_payment_intents", { method: "POST", body: JSON.stringify(payload) });
    if (!saved?.[0]?.id) return safeJson({ error: "Unable to save approved payment request." }, 503);
    return safeJson({
      intentId: saved[0].id, paymentUrl: `/pay/${saved[0].id}`,
      bookingReference: booking.booking_reference,
      currency: "USD", approvedAmountMinor: input.finalAmountMinor,
      readyForCustomerPayment: false, // Key activation and final checkout QA still required.
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return safeJson({ error: "Please sign in." }, 401);
    return safeJson({ error: "Unable to approve payment. No charge was created." }, 503);
  }
}
