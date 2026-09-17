"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { findCartProduct } from "@/lib/trip-cart";

export default function AddToCartButton({ productId, className = "" }: { productId: string; className?: string }) {
  const cart = useCart();
  const product = findCartProduct(productId);
  if (!product) return null;
  const added = cart.lines.some(line => line.productId === productId);
  return <div className={className}>
    {added ? <Link href="/my-trip" className="btn-outline w-full gap-2" aria-label={`View my trip plan with ${product.name}`}><Check aria-hidden="true" className="h-4 w-4 shrink-0" />Added · View My Trip</Link>
      : <button type="button" disabled={!cart.ready} onClick={() => cart.add(productId)} className="btn-gold w-full gap-2 disabled:opacity-50" aria-label={`Add ${product.name} to my trip`}><Plus aria-hidden="true" className="h-4 w-4 shrink-0" />Add to My Trip</button>}
    <span className="sr-only" role="status">{added ? `${product.name} is in your trip plan.` : ""}</span>
  </div>;
}
