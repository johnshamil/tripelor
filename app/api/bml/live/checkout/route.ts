import { currentUser } from "@/lib/auth-server";
import { bankCreate, db, enabled, findIntent, LIVE_TERMS_VERSION, paymentId, safeJson } from "@/lib/bml-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorizedIntent(id: string) {
  const user = await currentUser();
  if (!user) return { status: 401 as const };
  const intent = await findIntent(id);
  if (!intent || !user.email || user.email.toLowerCase() !== intent.customer_email.toLowerCase()) {
    return { status: 404 as const };
  }
  return { status: 200 as const, intent };
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!paymentId.test(id)) return safeJson({ error: "Invalid payment request." }, 400);
    const result = await authorizedIntent(id);
    if (!result.intent) return safeJson({ error: "Payment request not found or sign-in required." }, result.status);
    const intent = result.intent;
    return safeJson({
      id: intent.id,
      bookingReference: intent.booking_reference,
      currency: intent.currency,
      amountMinor: intent.approved_amount_minor,
      status: intent.status,
      termsVersion: LIVE_TERMS_VERSION,
      checkoutEnabled: enabled(),
    });
  } catch { return safeJson({ error: "Unable to load payment request." }, 503); }
}

export async function POST(request: Request) {
  try {
    // Fail closed: saving API keys never enables live charges.
    if (!enabled()) return safeJson({ error: "Secure card checkout is not yet available." }, 503);
    if (request.headers.get("origin") !== new URL(request.url).origin ||
        !request.headers.get("content-type")?.includes("application/json")) {
      return safeJson({ error: "Invalid checkout request." }, 403);
    }
    const raw = await request.text();
    if (raw.length > 1024) return safeJson({ error: "Invalid checkout request." }, 413);
    const input = JSON.parse(raw);
    if (!paymentId.test(input?.intentId || "") ||
        input?.acceptTerms !== true || input?.termsVersion !== LIVE_TERMS_VERSION) {
      return safeJson({ error: "Please accept the Tripelor payment and cancellation terms." }, 400);
    }
    const result = await authorizedIntent(input.intentId);
    if (!result.intent) return safeJson({ error: "Please sign in as the booking guest." }, result.status);
    const intent = result.intent;
    if (intent.status !== "awaiting_payment" || intent.provider_transaction_id) {
      return safeJson({ error: "This checkout has already been started or completed. Contact Tripelor before retrying." }, 409);
    }
    // Claim exactly one request before creating a bank transaction. A lost BML
    // response remains initiated for manual reconciliation: NEVER retry charge.
    const claimed = await db(
      `bml_live_payment_intents?id=eq.${encodeURIComponent(intent.id)}&status=eq.awaiting_payment&provider_transaction_id=is.null`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "initiated",
          customer_terms_version: LIVE_TERMS_VERSION,
          customer_terms_accepted_at: new Date().toISOString()
        }),
      }
    );
    if (!claimed || claimed.length !== 1) {
      return safeJson({ error: "Payment was already initiated. Do not retry without Tripelor verification." }, 409);
    }
    const redirect = `https://www.tripelor.com/pay/${intent.id}?returned=1`;
    const bml = await bankCreate(intent, redirect);
    const updated = await db(
      `bml_live_payment_intents?id=eq.${encodeURIComponent(intent.id)}&status=eq.initiated&provider_transaction_id=is.null`,
      { method: "PATCH", body: JSON.stringify({ provider_transaction_id: bml.id }) }
    );
    if (!updated || updated.length !== 1) {
      return safeJson({ error: "Bank checkout was initiated but reconciliation is required. Contact Tripelor; do not retry." }, 503);
    }
    return safeJson({ checkoutUrl: bml.url }, 200);
  } catch (error) {
    if (error instanceof SyntaxError) return safeJson({ error: "Invalid checkout details." }, 400);
    console.error("bml-live-checkout-error", { code: error instanceof Error ? error.message : "UNKNOWN" });
    return safeJson({ error: "Payment could not be started or needs manual verification. Do not repeat the transaction; contact Tripelor." }, 503);
  }
}
