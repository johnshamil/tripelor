"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export default function CartLink({ onClick }: { onClick?: () => void }) {
  const { lines, ready } = useCart();
  const count = ready ? lines.length : 0;
  return <Link href="/cart" onClick={onClick} aria-label={`View cart, ${count} selected ${count === 1 ? "item" : "items"}`} className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-full border border-gold/30 px-3 text-sm text-gold"><ShoppingCart aria-hidden="true" className="h-5 w-5" /><span>{count}</span></Link>;
}
