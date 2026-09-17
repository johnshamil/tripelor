"use client";

import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { findCartProduct } from "@/lib/trip-cart";

export default function AddToCartButton({ productId, className = "" }: { productId: string; className?: string }) {
  const cart = useCart();
  const product = findCartProduct(productId);
  if (!product) return null;
  const added = cart.lines.some(line => line.productId === productId);
  return <div className={className}>
    {added ? <Link href="/cart" className="btn-gold w-full gap-2" aria-label={`View cart with ${product.name}`}><Check aria-hidden="true" className="h-4 w-4 shrink-0" />In Cart · View Cart</Link>
      : <button type="button" disabled={!cart.ready} onClick={() => cart.add(productId)} className="btn-gold w-full gap-2 disabled:opacity-50" aria-label={`Add ${product.name} to cart`}><ShoppingCart aria-hidden="true" className="h-4 w-4 shrink-0" />Add to Cart</button>}
    <span className="sr-only" role="status">{added ? `${product.name} is in your cart.` : ""}</span>
  </div>;
}
