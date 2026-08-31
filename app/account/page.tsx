"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LogOut,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Ship,
  Star,
  Waves,
} from "lucide-react";
import ReferralRewardsCard from "@/components/referral-rewards-card";
import Rewards2Card from "@/components/rewards-2-card";
import UpcomingTripCountdown from "@/components/upcoming-trip-countdown";

type User = {email: string; fullName: string; isAdmin?: boolean};

const day = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
};

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const memberResponse = await fetch("/api/auth/me", {cache: "no-store"});
        const member = await memberResponse.json();
        if (!member.user) {
          location.href = "/login";
          return;
        }
        setUser(member.user);

        const [bookingResponse, loyaltyResponse] = await Promise.all([
          fetch("/api/account/bookings", {cache: "no-store"}),
          fetch("/api/account/loyalty", {cache: "no-store"}),
        ]);
        const bookingData = await bookingResponse.json();
        const loyaltyData = await loyaltyResponse.json();

        if (bookingResponse.ok) setBookings(bookingData.bookings || []);
        else setStatus(bookingData.error || "Unable to load bookings.");
        if (loyaltyResponse.ok) setLoyalty(loyaltyData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", {method: "POST"});
    location.href = "/";
  }

  const trip = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (
      bookings
        .filter(
          booking =>
            String(booking.status || "").toLowerCase() !== "cancelled" &&
            booking.check_out &&
            day(booking.check_out) >= today,
        )
        .sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)))[0] || null
    );
  }, [bookings]);

  if (loading) return <main className="container py-20 text-gray-400">Loading your Tripelor account...</main>;
  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let stage = "none";
  if (trip) {
    const checkIn = day(trip.check_in);
    const checkOut = day(trip.check_out);
    if (today < checkIn) stage = "upcoming";
    else if (today < checkOut) stage = "staying";
  }

  const payment = String(trip?.payment_status || "unpaid").toLowerCase();
  const speedSeats = Number(trip?.speedboat_seats || 0);
  const activities = trip?.activities || trip?.package_name || "";

  return (
    <main className="container py-10 pb-24 md:py-16">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[.3em] text-gold">My Tripelor</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">Welcome{user.fullName ? `, ${user.fullName}` : ""}</h1>
          <p className="mt-2 text-sm text-gray-400">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {user.isAdmin && (
            <Link href="/admin" className="btn-outline gap-2">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button onClick={logout} className="btn-outline gap-2">
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </header>

      <Rewards2Card user={user} loyalty={loyalty} />
      <ReferralRewardsCard email={user.email} />

      <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-gold/20 bg-gradient-to-br from-white/[.05] via-black to-gold/[.06]">
        {trip ? (
          <>
            <UpcomingTripCountdown trip={trip} stage={stage} />
            <div className="p-6 md:p-8">
              <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-gold">
                        <MapPin className="h-4 w-4" /> {trip.status || "Booking"}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold">{trip.property_name || "Tripelor Stay"}</h3>
                      <p className="mt-1 text-gray-300">{trip.room_type || "Room"}</p>
                    </div>
                    {trip.booking_reference && (
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400">
                        {trip.booking_reference}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-white/[.04] p-3">
                      <span className="text-xs text-gray-500">Check-in</span>
                      <p className="font-semibold">{trip.check_in}</p>
                    </div>
                    <div className="rounded-xl bg-white/[.04] p-3">
                      <span className="text-xs text-gray-500">Check-out</span>
                      <p className="font-semibold">{trip.check_out}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link href="/speedboat" className="rounded-2xl border border-white/10 p-4 transition hover:border-gold/30">
                    <Ship className="h-6 w-6 text-gold" />
                    <p className="mt-2 font-semibold">Speedboat</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {speedSeats > 0 ? `${speedSeats} seat${speedSeats > 1 ? "s" : ""} requested` : "Add transfer"}
                    </p>
                  </Link>
                  <Link href="/tours" className="rounded-2xl border border-white/10 p-4 transition hover:border-gold/30">
                    <Waves className="h-6 w-6 text-gold" />
                    <p className="mt-2 font-semibold">Experiences</p>
                    <p className="mt-1 text-xs text-gray-500">{activities ? "Added to trip" : "Add activities"}</p>
                  </Link>
                  {stage === "staying" && (
                    <Link href="/account/guest-portal" className="col-span-2 rounded-2xl border border-gold/30 bg-gold/10 p-4 transition hover:bg-gold/15">
                      <BellRing className="h-5 w-5 text-gold" />
                      <p className="mt-2 font-semibold">Guest Services 🛎️</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Breakfast, housekeeping, snorkeling gear, excursions, late checkout and transfer help
                      </p>
                    </Link>
                  )}
                  <a href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20need%20help%20with%20my%20booking." className="col-span-2 rounded-2xl border border-gold/25 bg-gold/10 p-4">
                    <MessageCircle className="h-5 w-5 text-gold" />
                    <p className="mt-2 font-semibold">Chat with Tripelor</p>
                  </a>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <CreditCard className="h-5 w-5 text-gold" />
                  <p className="mt-2 text-xs uppercase tracking-[.16em] text-gray-500">Payment</p>
                  <p className={`mt-1 font-semibold ${payment === "paid" ? "text-emerald-300" : "text-amber-300"}`}>
                    {payment === "paid" ? "Paid" : "Payment pending"}
                  </p>
                  {trip.estimated_total && <p className="mt-1 text-sm text-gray-400">USD {Number(trip.estimated_total).toFixed(2)}</p>}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <Ship className="h-5 w-5 text-gold" />
                  <p className="mt-2 text-xs uppercase tracking-[.16em] text-gray-500">Speedboat</p>
                  <p className="mt-1 font-semibold">
                    {speedSeats > 0 ? `${speedSeats} seat${speedSeats > 1 ? "s" : ""} requested` : "Not added yet"}
                  </p>
                  {speedSeats > 0 && Number(trip.speedboat_total || 0) > 0 && (
                    <p className="mt-1 text-sm text-gray-400">USD {Number(trip.speedboat_total).toFixed(2)}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <PackageCheck className="h-5 w-5 text-gold" />
                  <p className="mt-2 text-xs uppercase tracking-[.16em] text-gray-500">Activities</p>
                  <p className="mt-1 font-semibold">{activities || "No activities added"}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center md:p-10">
            <CalendarDays className="mx-auto h-8 w-8 text-gold" />
            <p className="mt-3 text-gray-400">Book a stay and your trip countdown will appear here.</p>
            <Link href="/build-your-trip" className="btn-gold mt-4">
              Build My Maldives Trip
            </Link>
          </div>
        )}
      </section>

      <section id="my-bookings" className="mt-10 scroll-mt-28">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-gold" />
          <h2 className="text-2xl font-bold">My Bookings</h2>
        </div>
        {status && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm">{status}</p>}
        {bookings.length === 0 ? (
          <div className="card mt-6 p-8 text-center text-gray-400">No bookings yet.</div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bookings.map((booking, index) => {
              const past =
                booking.check_out &&
                day(booking.check_out) < today &&
                String(booking.status || "").toLowerCase() !== "cancelled";
              return (
                <article key={booking.id || index} className="card p-6">
                  <div className="flex justify-between gap-3">
                    <p className="text-xs uppercase tracking-[.2em] text-gold">{booking.status || "Booking"}</p>
                    {String(booking.status || "").toLowerCase() === "completed" && <CheckCircle2 className="h-4 w-4 text-green-300" />}
                  </div>
                  <h3 className="mt-3 text-xl font-bold">{booking.property_name || "Tripelor Stay"}</h3>
                  <p className="mt-1 text-gray-300">{booking.room_type || "Room"}</p>
                  <p className="mt-4 text-sm text-gray-400">{booking.check_in || ""} → {booking.check_out || ""}</p>
                  {booking.booking_reference && <p className="mt-2 text-xs text-gray-500">Ref: {booking.booking_reference}</p>}
                  {past && (
                    <div className="mt-5 rounded-xl border border-gold/25 bg-gold/10 p-4">
                      <p className="flex items-center gap-2 font-semibold text-gold">
                        <Star className="h-4 w-4" /> Earn 100 bonus points
                      </p>
                      <p className="mt-1 text-xs text-gray-400">Share a verified review of this completed stay.</p>
                      <Link href={`/reviews?reservationId=${encodeURIComponent(booking.id)}`} className="btn-gold mt-3 w-full">
                        Review My Stay
                      </Link>
                    </div>
                  )}
                  {String(booking.status || "").toLowerCase() === "completed" && !past && (
                    <p className="mt-4 rounded-xl bg-gold/10 px-3 py-2 text-xs text-gold">
                      Reward points earned for this completed stay.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
