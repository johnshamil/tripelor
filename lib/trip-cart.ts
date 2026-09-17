import { fiveNight, threeNight } from "./island-packages";
import { VAAVU_BLUE_ESCAPE } from "./vaavu-blue-escape";
import { VAAVU_EXCURSIONS } from "./vaavu-excursions";

export type CartProduct = {
  id: string;
  name: string;
  price: number;
  unit: "person" | "couple";
  kind: "excursion" | "package" | "stay";
  href: string;
  inclusions: readonly string[];
  duration?: string;
  nights?: number;
};
export type CartLine = { productId: string; quantity: number; date: string };
export type QuotedLine = CartLine & { name: string; unitPrice: number; unit: CartProduct["unit"]; kind: CartProduct["kind"]; inclusions: readonly string[]; duration?: string; nights?: number; checkOut?: string; lineTotal: number };

export const CART_STORAGE_KEY = "tripelor-cart-v1";
export const stayCartId = (slug: string, nights: number) => `stay:${slug}:${nights}`;
export const CART_PRODUCTS: readonly CartProduct[] = [
  { id: "package:vaavu-blue-escape", name: VAAVU_BLUE_ESCAPE.name, price: VAAVU_BLUE_ESCAPE.price, unit: "person", kind: "package", href: VAAVU_BLUE_ESCAPE.href, inclusions: VAAVU_BLUE_ESCAPE.inclusions },
  ...VAAVU_EXCURSIONS.map(item => ({ id: `excursion:${item.slug}`, name: item.name, price: item.price, unit: "person" as const, kind: "excursion" as const, href: "/island-adventures#excursions", inclusions: item.highlights, duration: item.duration })),
  ...[...threeNight, ...fiveNight].map(item => ({ id: stayCartId(item.slug, item.nights), name: `${item.name} · ${item.nights} nights`, price: item.price, unit: "couple" as const, kind: "stay" as const, href: `/island-adventures?duration=${item.nights}`, inclusions: item.items, nights: item.nights })),
];

export function findCartProduct(id: string) { return CART_PRODUCTS.find(item => item.id === id); }
export function maldivesToday(now = new Date()) { return new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10); }
export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function addNights(date: string, nights: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + nights);
  return result.toISOString().slice(0, 10);
}
export function cleanStoredCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap(raw => {
    if (!raw || typeof raw !== "object" || typeof raw.productId !== "string" || !findCartProduct(raw.productId) || seen.has(raw.productId)) return [];
    if (!Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 100) return [];
    seen.add(raw.productId);
    return [{ productId: raw.productId, quantity: raw.quantity, date: isDate(raw.date) ? raw.date : "" }];
  });
}
export function quoteCart(value: unknown, today = maldivesToday()): { items: QuotedLine[]; total: number } {
  if (!Array.isArray(value) || value.length === 0 || value.length > CART_PRODUCTS.length) throw new Error("Please add an excursion or package to your cart.");
  const seen = new Set<string>();
  const items: QuotedLine[] = value.map(raw => {
    const product = raw && typeof raw.productId === "string" ? findCartProduct(raw.productId) : undefined;
    if (!product || seen.has(product.id)) throw new Error("One of your cart items is unavailable. Please refresh your cart.");
    seen.add(product.id);
    if (!Number.isInteger(raw.quantity) || raw.quantity < 1 || raw.quantity > 100) throw new Error(`Choose a valid quantity for ${product.name}.`);
    if (!isDate(raw.date) || raw.date < today || raw.date > "9998-12-31") throw new Error(`Choose a date from today onwards for ${product.name}.`);
    return { productId: product.id, quantity: raw.quantity, date: raw.date, name: product.name, unitPrice: product.price, unit: product.unit, kind: product.kind, inclusions: product.inclusions, duration: product.duration, nights: product.nights, checkOut: product.nights ? addNights(raw.date, product.nights) : undefined, lineTotal: product.price * raw.quantity };
  });
  return { items, total: items.reduce((total, item) => total + item.lineTotal, 0) };
}
