import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus, ArrowLeft } from "lucide-react";
import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { manualRoomOptions } from "@/lib/manual-booking-server";
import ManualBookingForm from "@/components/manual-booking-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manual Booking | Tripelor Admin", robots: { index: false, follow: false } };

export default async function ManualBookingsPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login?next=%2Fadmin%2Fmanual-bookings");
  if (!isAdminEmail(user.email)) return <main className="container py-16">Admin access required.</main>;
  const rooms = await manualRoomOptions();
  return (
    <main className="container py-8 pb-28 md:py-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
      <p className="mt-7 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold"><CalendarPlus className="h-4 w-4" /> Tripelor Admin</p>
      <h1 className="mt-2 text-3xl font-semibold md:text-4xl">Manual Booking</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Record a direct or external booking, choose how many rooms you need, and set the price in MVR or USD.</p>
      <ManualBookingForm options={rooms} />
    </main>
  );
}
