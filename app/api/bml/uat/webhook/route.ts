import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// BML UAT-only signed webhook. Records verified events in Tripelor Staging,
// never confirms a booking or updates a live customer's payment status.
const states = new Set([
  "INITIATED", "QR_CODE_GENERATED", "CONFIRMED", "CANCELLED", "FAILED",
  "EXPIRED", "VOIDED", "AUTHORIZED", "REFUND_REQUESTED", "REFUNDED",
]);

export async function POST(request: Request) {
  try {
    const apiKey = process.env.BML_UAT_API_KEY;
    const stagingUrl = process.env.BML_UAT_STAGING_URL?.replace(/\/$/, "");
    const stagingKey = process.env.BML_UAT_STAGING_SERVICE_ROLE_KEY;
    if (!apiKey || !stagingKey || !stagingUrl ||
        new URL(stagingUrl).hostname !== "cxlidghyytyehhlhxvte.supabase.co") {
      return Response.json({ error: "UAT webhook storage is not configured" }, { status: 503 });
    }
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }
    const nonce = request.headers.get("x-signature-nonce") || "";
    const timestamp = request.headers.get("x-signature-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";
    if (!nonce || nonce.length > 256 || !/^\d{10,13}$/.test(timestamp) ||
        !/^[a-f0-9]{64}$/i.test(signature)) {
      console.warn("bml-uat-webhook-rejected", {
        stage: "signature-headers", hasNonce: Boolean(nonce), timestampLength: timestamp.length,
        hasSignature: Boolean(signature), signatureLength: signature.length,
        hasOriginator: Boolean(request.headers.get("x-originator")),
      });
      return Response.json({ error: "Invalid BML signature headers" }, { status: 403 });
    }
    const stampSeconds = timestamp.length === 13 ? Number(timestamp) / 1000 : Number(timestamp);
    if (Math.abs(Date.now() / 1000 - stampSeconds) > 300) {
      console.warn("bml-uat-webhook-rejected", {
        stage: "timestamp-expired", timestampLength: timestamp.length,
      });
      return Response.json({ error: "Expired webhook timestamp" }, { status: 403 });
    }
    // BML Connect signature: SHA-256(nonce + timestamp + private API key).
    const expected = createHash("sha256").update(nonce + timestamp + apiKey).digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      console.warn("bml-uat-webhook-rejected", {
        stage: "signature-mismatch", timestampLength: timestamp.length,
        hasOriginator: Boolean(request.headers.get("x-originator")),
      });
      return Response.json({ error: "Invalid BML webhook signature" }, { status: 403 });
    }
    const raw = await request.text();
    if (raw.length > 16000) return Response.json({ error: "Request too large" }, { status: 413 });
    let payload: any;
    try { payload = JSON.parse(raw); } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (payload?.eventType !== "NOTIFY_TRANSACTION_CHANGE") {
      return new Response(null, { status: 204 });
    }
    const transactionId = payload?.transactionId;
    if (typeof transactionId !== "string" ||
        !/^[A-Za-z0-9_-]{4,100}$/.test(transactionId)) {
      return Response.json({ error: "Invalid BML transaction ID" }, { status: 400 });
    }

    // Callback state alone is not trustworthy: always retrieve the
    // authoritative transaction from BML before recording its status.
    const upstream = await fetch(
      `https://api.uat.merchants.bankofmaldives.com.mv/public/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: { Authorization: apiKey, Accept: "application/json" },
        cache: "no-store", signal: AbortSignal.timeout(12000),
      }
    );
    if (!upstream.ok) {
      return Response.json({ error: "BML transaction verification unavailable" }, { status: 503 });
    }
    const response: any = await upstream.json();
    const txn = response?.data && typeof response.data === "object" && !Array.isArray(response.data)
      ? response.data : response;
    const verifiedState = String(txn?.state || "").toUpperCase();
    const localId = String(txn?.localId || "");
    const amount = Number(txn?.amount);
    if ((txn?.id && String(txn.id) !== transactionId) ||
        !localId.startsWith("TRP-UAT-") || localId.length > 120 ||
        txn?.currency !== "MVR" || amount !== 100 || !states.has(verifiedState)) {
      return Response.json({ error: "BML transaction does not match Tripelor UAT" }, { status: 409 });
    }

    // Composite primary key ensures repeat deliveries of a state are
    // idempotent. Never store card information, signatures or entire payloads.
    const saved = await fetch(
      `${stagingUrl}/rest/v1/bml_uat_webhook_notifications?on_conflict=transaction_id,verified_state`,
      {
        method: "POST",
        headers: {
          apikey: stagingKey, Authorization: `Bearer ${stagingKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          verified_state: verifiedState,
          local_id: localId,
          currency: "MVR",
          amount_minor: 100,
          signature_timestamp: Number(timestamp),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!saved.ok) {
      // Let BML retry instead of acknowledging a webhook we could not store.
      return Response.json({ error: "Webhook receipt could not be saved" }, { status: 503 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "UAT webhook verification unavailable" }, { status: 503 });
  }
}
