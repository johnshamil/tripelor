import { type CartLine, quoteCart } from "@/lib/trip-cart";

export const QUOTE_VALID_HOURS = 48;
export const QUOTE_VALID_MS = QUOTE_VALID_HOURS * 60 * 60 * 1000;

export function createQuoteReference(now = new Date(), randomValue?: string) {
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const random = (randomValue || "XXXXXX").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6).padEnd(6, "X");
  return `TRP-${yy}${mm}${dd}-${random}`;
}

export function validQuoteReference(value: string) {
  return /^TRP-\d{6}-[A-Z0-9]{6}$/.test(value);
}

export function encodeQuoteLine(line: CartLine) {
  return `${line.productId}~${line.quantity}~${line.date}`;
}

export function decodeQuoteLine(value: string): CartLine | null {
  const parts = value.split("~");
  if (parts.length !== 3) return null;
  const [productId, quantityRaw, date] = parts;
  const quantity = Number(quantityRaw);
  if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return null;
  return { productId, quantity, date };
}

export function decodeQuoteLines(values: string | string[] | undefined) {
  const list = Array.isArray(values) ? values : values ? [values] : [];
  if (!list.length || list.length > 50) throw new Error("This quote does not contain a valid trip plan.");
  const lines = list.map(decodeQuoteLine);
  if (lines.some(line => !line)) throw new Error("This quote link is incomplete or invalid.");
  return lines as CartLine[];
}

export function quoteIssuedAt(value: string | undefined, now = Date.now()) {
  if (!value || !/^\d{10,14}$/.test(value)) throw new Error("This quote link is incomplete.");
  const issued = Number(value);
  if (!Number.isFinite(issued) || issued < Date.UTC(2025, 0, 1) || issued > now + 5 * 60 * 1000) {
    throw new Error("This quote link is invalid.");
  }
  return issued;
}

export function quoteStatus(issued: number, now = Date.now()) {
  const expiresAt = issued + QUOTE_VALID_MS;
  return { expired: now > expiresAt, expiresAt };
}

export function quoteFromLines(lines: CartLine[]) {
  return quoteCart(lines);
}

export function buildQuoteHref(reference: string, lines: CartLine[], issued = Date.now()) {
  const params = new URLSearchParams();
  params.set("issued", String(issued));
  for (const line of lines) params.append("item", encodeQuoteLine(line));
  return `/quote/${reference}?${params.toString()}`;
}
