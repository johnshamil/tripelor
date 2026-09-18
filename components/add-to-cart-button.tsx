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
    ? { added: "Aggiunto · Vedi il mio viaggio", add: "Aggiungi al mio viaggio", viewLabel: "Vedi il mio piano di viaggio con", addLabel: "Aggiungi al mio viaggio", inPlan: "è nel tuo piano di viaggio." }
    : locale === "ru"
      ? { added: "Добавлено · Моя поездка", add: "Добавить в поездку", viewLabel: "Открыть план поездки с", addLabel: "Добавить в поездку", inPlan: "добавлено в ваш план поездки." }
      : { added: "Added · View My Trip", add: "Add to My Trip", viewLabel: "View my trip plan with", addLabel: "Add to my trip", inPlan: "is in your trip plan." };
  const cart = useCart();
  const product = findCartProduct(productId);
  if (!product) return null;
  const added = cart.lines.some(line => line.productId === productId);
  return <div className={className}>
    <div className="mb-3"><TripInclusionReminder productId={productId} /></div>
    {added ? <Link href="/my-trip" className="btn-outline w-full gap-2" aria-label={`${copy.viewLabel} ${product.name}`}><Check aria-hidden="true" className="h-4 w-4 shrink-0" />{copy.added}</Link>
      : <button type="button" disabled={!cart.ready} onClick={() => cart.add(productId)} className="btn-gold w-full gap-2 disabled:opacity-50" aria-label={`${copy.addLabel}: ${product.name}`}><Plus aria-hidden="true" className="h-4 w-4 shrink-0" />{copy.add}</button>}
    <span className="sr-only" role="status">{added ? `${product.name} ${copy.inPlan}` : ""}</span>
  </div>;
}
