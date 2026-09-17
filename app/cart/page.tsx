import type { Metadata } from "next";
import CartCheckout from "@/components/cart-checkout";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false, follow: true } };
export default function CartPage() { return <CartCheckout />; }
