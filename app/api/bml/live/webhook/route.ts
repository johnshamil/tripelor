import { bankGet, db, findIntent, matchesVerifiedTransaction, requireBankConfig, safeJson, transactionIdPattern, verifySignedWebhook } from "@/lib/bml-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const acceptedStates = new Set([
  "INITIATED", "CONFIRMED", "CANCELLED", "FAILED", "EXPIRED",
  "VOIDED", "AUTHORIZED", "REFUND_REQUESTED", "REFUNDED"
]);

/**
 * Public production BML notification receiver.
 *
 * Signature check -> independent authenticated BML transaction lookup ->
 * immutable local payment-intent match -> atomic verified-event/payment commit.
 * No browser input, redirect or raw webhook body can directly mark a booking paid.
 */
export async function POST(request: Request) {
  try {
    const { apiKey } = requireBankConfig();
    if (!verifySignedWebhook(request.headers, apiKey)) {
      return safeJson({ error: "Invalid signature." }, 403);
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return safeJson({ error: "JSON required." }, 415);
    }
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return safeJson({ error: "Webhook too large." }, 413);
    }
    const raw = await request.text();
    if (raw.length > 16000) return safeJson({ error: "Webhook too large." }, 413);
    let body: any;
    try { body = JSON.parse(raw); } catch { return safeJson({ error: "Invalid JSON." }, 400); }
    if (body?.eventType !== "NOTIFY_TRANSACTION_CHANGE") {
      return new Response(null, { status: 204 });
    }
    const transactionId = body?.transactionId;
    if (typeof transactionId !== "string" || !transactionIdPattern.test(transactionId)) {
      return safeJson({ error: "Invalid BML transaction." }, 400);
    }
    const bank = await bankGet(transactionId);
    const localId = bank?.localId;
    if (typeof localId !== "string" || !/^TRP-LIVE-[0-9a-f-]{36}$/i.test(localId)) {
      return safeJson({ error: "Unrecognized merchant transaction." }, 409);
    }
    const intents = await db(
      `bml_live_payment_intents?select=*&local_id=eq.${encodeURIComponent(localId)}&limit=1`
    );
    const intent = intents?.[0];
    if (!intent || !matchesVerifiedTransaction(intent, bank, transactionId)) {
      return safeJson({ error: "Payment record does not match verified bank transaction." }, 409);
    }
    const state = String(bank.state || "").toUpperCase();
    if (!acceptedStates.has(state)) {
      return safeJson({ error: "Unknown BML transaction status." }, 503);
    }
    // RPC is a single DB transaction, so the verified event and any paid
    // status update commit together and duplicate callbacks are idempotent.
    const stamp = request.headers.get("x-signature-timestamp") || "";
    await db("rpc/bml_record_verified_payment", {
      method: "POST", body: JSON.stringify({
        p_intent_id: intent.id, p_provider_transaction_id: transactionId,
        p_provider_state: state, p_event_type: "NOTIFY_TRANSACTION_CHANGE",
        p_signature_timestamp: Number(stamp)
      }),
    });
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("bml-live-webhook-unavailable", {
      stage: error instanceof Error ? error.message : "UNKNOWN"
    });
    // Transient 503 allows BML delivery retry without acknowledging unsaved state.
    return safeJson({ error: "Bank callback verification temporarily unavailable." }, 503);
  }
}
