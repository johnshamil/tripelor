"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { findCartProduct } from "@/lib/trip-cart";
import TripInclusionReminder from "@/components/trip-inclusion-reminder";
import { useSiteLanguage } from "@/components/use-site-language";

export default function AddToCartButton({ productId, className = "" }: { productId: string; className?: string }) {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? { added: "Aggiunto · Vedi il mio viaggio", add: "Aggiungi al mio viaggio", inPlan: "è nel tuo piano di viaggio." }
    : locale === "ru"
      ? { added: "Добавлено · Моя поездка", add: "Добавить в поездку", inPlan: "добавлено в ваш план поездки." }
      : { added: "{copy.added}", add: "{copy.add}", inPlan: "is in your trip plan." };
  const cart = useCart();
  const product = findCartProduct(productId);
  if (!product) return null;
  const added = cart.lines.some(line => line.productId === productId);
  return <div className={className}>
    <div className="mb-3"><TripInclusionReminder productId={productId} /></div>
    {added ? <Link href="/my-trip" className="btn-outline w-full gap-2" aria-label={`View my trip plan with ${product.name}`}><Check aria-hidden="true" className="h-4 w-4 shrink-0" />Added · View My Trip</Link>
      : <button type="button" disabled={!cart.ready} onClick={() => cart.add(productId)} className="btn-gold w-full gap-2 disabled:opacity-50" aria-label={`Add ${product.name} to my trip`}><Plus aria-hidden="true" className="h-4 w-4 shrink-0" />Add to My Trip</button>}
    <span className="sr-only" role="status">{added ? `${product.name} ${copy.inPlan}` : ""}</span>
  </div>;
}
