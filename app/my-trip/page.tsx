import type { Metadata } from "next";
import CartCheckout from "@/components/cart-checkout";

export const metadata: Metadata = { title: "My Trip Plan", robots: { index: false, follow: true } };
export default function MyTripPage() { return <CartCheckout />; }
