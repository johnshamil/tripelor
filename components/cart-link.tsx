"use client";

import Link from "next/link";
import { Map } from "lucide-react";
import { useCart } from "@/components/cart-provider";

export default function CartLink({ onClick, compact = false }: { onClick?: () => void; compact?: boolean }) {
  const { lines, ready } = useCart();
  const count = ready ? lines.length : 0;
  return <Link href="/my-trip" onClick={onClick} aria-label={`Open my trip plan, ${count} ${count === 1 ? "selection" : "selections"}`} className="relative inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-gold/30 px-3 text-sm text-gold">
    <Map aria-hidden="true" className="h-4 w-4" /><span className="whitespace-nowrap">{compact ? "Plan" : "My Trip Plan"}</span>
    {count > 0 && <span className={compact ? "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-[#041117]" : "flex h-5 min-w-5 items-center justify-center rounded-full bg-gold/15 px-1 text-xs"}>{count}</span>}
  </Link>;
}
