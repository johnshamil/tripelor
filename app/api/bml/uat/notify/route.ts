import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC HTTPS RECEIVER FOR BML UAT ONLY.
 * This endpoint accepts only authenticated BML sandbox events for Tripelor
 * MVR 1.00 test transactions, stores the verified state in Tripelor STAGING,
 * and NEVER changes a production booking or accepts live customer payments.
 *
 * Registered URL: https://www.tripelor.com/api/bml/uat/notify
 */
const STATES = new Set([
  "INITIATED", "QR_CODE_GENERATED", "CONFIRMED", "CANCELLED", "FAILED",
  "EXPIRED", "VOIDED", "AUTHORIZED", "REFUND_REQUESTED", "REFUNDED"
]);
const STAGING_HOST = "cxlidghyytyehhlhxvte.supabase.co";

export function GET() {
  return Response.json(
    { service: "Tripelor BML UAT webhook", environment: "uat", status: "reachable" },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.BML_UAT_WEBHOOK_API_KEY;
    const stagingKey = process.env.BML_UAT_WEBHOOK_STAGING_SERVICE_ROLE_KEY;
    const stagingUrl = process.env.BML_UAT_WEBHOOK_STAGING_URL?.replace(/\/$/, "");
    if (!apiKey || !stagingKey || !stagingUrl ||
        new URL(stagingUrl).hostname !== STAGING_HOST) {
      return Response.json({ error: "UAT webhook not configured" }, { status: 503 });
    }
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return Response.json({ error: "Payload exceeds limit" }, { status: 413 });
    }

    const nonce = request.headers.get("x-signature-nonce") || "";
    const timestamp = request.headers.get("x-signature-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";
    if (!nonce || nonce.length > 256 || !/^[0-9]{10}$/.test(timestamp) ||
        !/^[a-f0-9]{64}$/i.test(signature)) {
      return Response.json({ error: "Signed BML webhook required" }, { status: 403 });
    }
    if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) {
      return Response.json({ error: "Expired BML webhook signature" }, { status: 403 });
    }
    const expected = createHash("sha256")
      .update(nonce + timestamp + apiKey)
      .digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return Response.json({ error: "Invalid BML webhook signature" }, { status: 403 });
    }

    const raw = await request.text();
    if (raw.length > 16000) return Response.json({ error: "Payload exceeds limit" }, { status: 413 });
    let event: Record<string, any>;
    try { event = JSON.parse(raw); }
    catch { return Response.json({ error: "Invalid webhook JSON" }, { status: 400 }); }
    if (event?.eventType !== "NOTIFY_TRANSACTION_CHANGE") {
      return new Response(null, { status: 204 });
    }
    const transactionId = event?.transactionId;
    if (typeof transactionId !== "string" ||
        !/^[A-Za-z0-9_-]{4,100}$/.test(transactionId)) {
      return Response.json({ error: "Invalid BML transaction ID" }, { status: 400 });
    }

    // Only the bank API decides the transaction state; never trust the
    // callback body, redirect query or a user-provided state.
    const bank = await fetch(
      `https://api.uat.merchants.bankofmaldives.com.mv/public/transactions/${encodeURIComponent(transactionId)}`,
      {
        headers: { Authorization: apiKey, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!bank.ok) {
      return Response.json({ error: "Bank verification temporarily unavailable" }, { status: 503 });
    }
    const data: any = await bank.json();
    const txn: any = data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data : data;
    const localId = String(txn?.localId || "");
    const verifiedState = String(txn?.state || "").toUpperCase();
    if ((txn?.id && String(txn.id) !== transactionId) ||
        !localId.startsWith("TRP-UAT-") || localId.length > 120 ||
        txn?.currency !== "MVR" || Number(txn?.amount) !== 100 ||
        !STATES.has(verifiedState)) {
      return Response.json({ error: "Transaction not a Tripelor UAT test" }, { status: 409 });
    }

    const saved = await fetch(
      `${stagingUrl}/rest/v1/bml_uat_webhook_notifications?on_conflict=transaction_id,verified_state`,
      {
        method: "POST",
        headers: {
          apikey: stagingKey,
          Authorization: `Bearer ${stagingKey}`,
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
      return Response.json({ error: "Staging receipt unavailable" }, { status: 503 });
    }
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "UAT webhook temporarily unavailable" }, { status: 503 });
  }
}
