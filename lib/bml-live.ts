import { createHash, timingSafeEqual } from "node:crypto";

export const LIVE_TERMS_VERSION = "tripelor-bml-live-2026-11-23";
export const BML_LIVE_ORIGIN = "https://api.merchants.bankofmaldives.com.mv";
const BML_API = `${BML_LIVE_ORIGIN}/public/transactions`;
export const paymentId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const transactionIdPattern = /^[A-Za-z0-9_-]{4,100}$/;

export type PaymentIntent = {
  id: string; reservation_id: string | null; cart_booking_id: string | null;
  booking_reference: string; customer_email: string; currency: "USD";
  approved_amount_minor: number; local_id: string; provider_transaction_id: string | null;
  status: "awaiting_payment" | "initiated" | "confirmed" | "failed" | "cancelled" | "refunded";
  terms_version: string; customer_terms_version: string | null;
  customer_terms_accepted_at: string | null;
};

export function enabled() { return process.env.BML_LIVE_PAYMENTS_ENABLED === "true"; }
export function requireBankConfig() {
  const apiKey = process.env.BML_LIVE_API_KEY;
  const appId = process.env.BML_LIVE_APPLICATION_ID;
  if (!apiKey || !appId) throw new Error("BML_PRODUCTION_CREDENTIALS_MISSING");
  return { apiKey, appId };
}

export function requireDb() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || new URL(url).protocol !== "https:" || !new URL(url).hostname.endsWith(".supabase.co")) {
    throw new Error("PAYMENT_DATABASE_MISSING");
  }
  return { url, key };
}

export async function db(path: string, init: RequestInit = {}) {
  const { url, key } = requireDb();
  const result = await fetch(`${url}/rest/v1/${path}`, {
    ...init, headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {})
    },
    cache: "no-store", signal: AbortSignal.timeout(12000),
  });
  const raw = await result.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* never expose provider data */ }
  if (!result.ok) {
    console.error("bml-live-db-error", { operation: init.method || "GET", status: result.status });
    throw new Error("PAYMENT_DATABASE_UNAVAILABLE");
  }
  return data;
}

export async function findIntent(id: string): Promise<PaymentIntent | null> {
  if (!paymentId.test(id)) return null;
  const items = await db(`bml_live_payment_intents?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  return items?.[0] || null;
}
export function safeJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export function bankSignature(amount: number, currency: "USD", key: string) {
  return createHash("sha1").update(`amount=${amount}&currency=${currency}&apiKey=${key}`).digest("hex");
}
export async function bankCreate(intent: PaymentIntent, redirectUrl: string) {
  const { apiKey } = requireBankConfig();
  const response = await fetch(BML_API, {
    method: "POST", headers: { Authorization: apiKey, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: intent.approved_amount_minor,
      currency: intent.currency,
      localId: intent.local_id,
      customerReference: intent.booking_reference,
      redirectUrl,
      signature: bankSignature(intent.approved_amount_minor, intent.currency, apiKey),
      signMethod: "sha1", apiVersion: "2.0", appVersion: "tripelor-live-web-1"
    }),
    cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  const payload: any = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.error || payload.success === false) {
    console.warn("bml-live-create-rejected", { status: response.status });
    throw new Error("BANK_REJECTED_PAYMENT");
  }
  const p = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const id = p.id || p.transactionId || payload.transactionId;
  const redirect = p.url || p.redirectUrl || p.paymentUrl || payload.url || payload.redirectUrl;
  if (typeof id !== "string" || !transactionIdPattern.test(id) || typeof redirect !== "string") {
    throw new Error("BANK_RESPONSE_INCOMPLETE");
  }
  let uri: URL;
  try { uri = new URL(redirect); } catch { throw new Error("BANK_REDIRECT_INVALID"); }
  if (uri.protocol !== "https:" || !uri.hostname.endsWith(".bankofmaldives.com.mv")) {
    throw new Error("BANK_REDIRECT_INVALID");
  }
  return { id, url: uri.href };
}
export async function bankGet(id: string) {
  if (!transactionIdPattern.test(id)) throw new Error("BANK_ID_INVALID");
  const { apiKey } = requireBankConfig();
  const response = await fetch(`${BML_API}/${encodeURIComponent(id)}`, {
    headers: { Authorization: apiKey, Accept: "application/json" },
    cache: "no-store", signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("BANK_TRANSACTION_UNAVAILABLE");
  const body: any = await response.json();
  return body?.data && typeof body.data === "object" ? body.data : body;
}
export function matchesVerifiedTransaction(intent: PaymentIntent, bank: any, id: string) {
  return (
    intent.provider_transaction_id === id &&
    (!bank?.id || String(bank.id) === id) &&
    bank?.localId === intent.local_id &&
    bank?.currency === intent.currency &&
    Number(bank?.amount) === intent.approved_amount_minor
  );
}
export function verifySignedWebhook(headers: Headers, apiKey: string) {
  const nonce = headers.get("x-signature-nonce") || "";
  const timestamp = headers.get("x-signature-timestamp") || "";
  const signature = headers.get("x-signature") || "";
  if (!nonce || nonce.length > 256 || !/^\d{10,13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const seconds = timestamp.length === 13 ? Number(timestamp) / 1000 : Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(Date.now() / 1000 - seconds) > 300) return false;
  const expected = createHash("sha256").update(nonce + timestamp + apiKey).digest();
  const supplied = Buffer.from(signature, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
