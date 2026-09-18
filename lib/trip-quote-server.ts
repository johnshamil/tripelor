import { createHmac, timingSafeEqual } from "node:crypto";
import type { CartLine } from "@/lib/trip-cart";

export type QuoteExtras = {
  room: string;
  meal: string;
  transferSeats: number;
  requestHref: string;
  customizeHref: string;
};

function signingSecret() {
  const secret = process.env.QUOTE_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Quote signing is not configured.");
  return `tripelor-quote-v1:${secret}`;
}

function canonicalQuote(
  reference: string,
  issued: number,
  lines: readonly CartLine[],
  extras: QuoteExtras,
) {
  return JSON.stringify({
    reference,
    issued,
    items: lines.map(line => [line.productId, line.quantity, line.date]),
    room: extras.room,
    meal: extras.meal,
    transferSeats: extras.transferSeats,
    requestHref: extras.requestHref,
    customizeHref: extras.customizeHref,
  });
}

export function signQuote(
  reference: string,
  issued: number,
  lines: readonly CartLine[],
  extras: QuoteExtras,
) {
  return createHmac("sha256", signingSecret())
    .update(canonicalQuote(reference, issued, lines, extras))
    .digest("base64url");
}

export function verifyQuoteSignature(
  signature: string,
  reference: string,
  issued: number,
  lines: readonly CartLine[],
  extras: QuoteExtras,
) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(signature)) return false;
  const expected = signQuote(reference, issued, lines, extras);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
