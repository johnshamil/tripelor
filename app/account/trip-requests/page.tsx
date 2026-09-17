import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth-server";
import CartBookingHistory from "@/components/cart-booking-history";
export const dynamic = "force-dynamic";
export const metadata = { title: "My Trip Requests", robots: { index: false, follow: false } };
export default async function Page() {
  if (!await currentUser()) redirect("/login?next=%2Faccount%2Ftrip-requests");
  return <CartBookingHistory />;
}
