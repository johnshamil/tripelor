import { redirect } from "next/navigation";
import { currentUser, isAdminEmail } from "@/lib/auth-server";
import CartBookingHistory from "@/components/cart-booking-history";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trip Planning Requests | Admin", robots: { index: false, follow: false } };
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login?next=%2Fadmin%2Ftrip-requests");
  if (!isAdminEmail(user.email)) return <section className="container py-20">Admin access required.</section>;
  return <CartBookingHistory admin />;
}
