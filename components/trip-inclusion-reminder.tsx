"use client";

import { Info } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { findCartProduct } from "@/lib/trip-cart";
import { findInclusionOverlaps } from "@/lib/trip-inclusions";

export default function TripInclusionReminder({ productId, onReview }: { productId: string; onReview?: () => void }) {
  const { lines } = useCart();
  const overlaps = findInclusionOverlaps(productId, lines);
  if (!overlaps.length) return null;
  return <aside aria-label={`Included activity reminder for ${findCartProduct(productId)?.name}`} className="mt-4 rounded-xl border border-gold/25 bg-gold/[.06] p-4 text-xs leading-6 text-gray-300">
    <p className="flex items-start gap-2 font-semibold text-gold"><Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />Already listed in your package</p>
    <ul className="mt-2 space-y-2">{overlaps.slice(0, 2).map(overlap => <li key={overlap.productId}><strong className="font-medium text-white">{overlap.packageName}</strong> includes {overlap.activities.join(", ")}.</li>)}</ul>
    {overlaps.length > 2 && <p className="mt-2">{overlaps.length - 2} other selected packages also list similar activities.</p>}
    <p className="mt-2">Exact outings and participants may differ. Keep this for an extra outing or additional guests; our team will confirm the details.</p>
    {onReview && <button type="button" onClick={onReview} className="mt-1 min-h-11 text-left font-semibold text-gold">Review my selections →</button>}
  </aside>;
}
