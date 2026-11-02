import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Preview-only BML UAT webhook intake. This never confirms reservations or
 * writes payment status. Verify BML's exact webhook header format in UAT
 * before registering the URL or enabling production processing.
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.BML_UAT_API_KEY;
    if (!apiKey || !process.env.BML_UAT_TESTER_EMAIL) {
      return Response.json({ error: "UAT is not configured" }, { status: 503 });
    }
    if (Number(request.headers.get("content-length") || 0) > 16000) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }

    const nonce = request.headers.get("x-signature-nonce") || "";
    const timestamp = request.headers.get("x-signature-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";
    // Fail closed if the BML webhook uses a different signing scheme.
    if (!nonce || nonce.length > 256 || !/^[0-9]{10}$/.test(timestamp) ||
        !/^[a-f0-9]{64}$/i.test(signature)) {
      return Response.json({ error: "Invalid BML signature headers" }, { status: 403 });
    }
    const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
    if (ageSeconds > 300) {
      return Response.json({ error: "Expired webhook timestamp" }, { status: 403 });
    }
    const expected = createHash("sha256").update(nonce + timestamp + apiKey).digest();
    const received = Buffer.from(signature, "hex");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }
    const raw = await request.text();
    if (raw.length > 16000) return Response.json({ error: "Request too large" }, { status: 413 });
    let payload: any;
    try { payload = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
    if (payload?.eventType !== "NOTIFY_TRANSACTION_CHANGE") {
      return new Response(null, { status: 204 });
    }
    const transactionId = payload?.transactionId;
    if (typeof transactionId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(transactionId)) {
      return Response.json({ error: "Invalid transaction" }, { status: 400 });
    }

    // Never trust callback state on its own; confirm with BML's API.
    const upstream = await fetch(
      `https://api.uat.merchants.bankofmaldives.com.mv/public/transactions/${encodeURIComponent(transactionId)}`,
      { headers: { Authorization: apiKey, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(12000) }
    );
    if (!upstream.ok) return Response.json({ error: "Could not verify BML transaction" }, { status: 503 });
    const data: any = await upstream.json();
    const txn = data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : data;
    if (!String(txn?.localId || "").startsWith("TRP-UAT-") ||
        txn?.currency !== "MVR" || Number(txn?.amount) !== 100) {
      return Response.json({ error: "Unexpected transaction details" }, { status: 409 });
    }

    // No writes or booking changes. Durable, idempotent processing requires
    // the separate payment-intent table and verified customer checkout flow.
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "UAT webhook verification failed" }, { status: 503 });
  }
}
