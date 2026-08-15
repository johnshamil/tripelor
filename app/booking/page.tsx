"use client";

import { useMemo, useState } from "react";
import { CalendarDays, BedDouble, Utensils, Users, MapPin } from "lucide-react";

export default function BookingPage() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState("1");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.ceil((end - start) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  return (
    <section className="container py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Book Your Stay</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Plan your perfect Tripelor escape</h1>
        <p className="mt-4 max-w-2xl text-gray-400">
          Choose your travel dates, room preference, guests and meal plan. We’ll confirm availability and send you the final quote.
        </p>

        <form className="card mt-10 grid gap-6 p-6 md:p-8">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-gold"/>Destination</span>
              <select className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" defaultValue="Maldives">
                <option>Maldives</option>
                <option>Dubai</option>
                <option>Bali</option>
                <option>Thailand</option>
                <option>Italy</option>
                <option>Japan</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-gold"/>Guests</span>
              <select className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" defaultValue="2 Adults">
                <option>1 Adult</option>
                <option>2 Adults</option>
                <option>2 Adults + 1 Child</option>
                <option>2 Adults + 2 Children</option>
                <option>3 Adults</option>
                <option>4 Adults</option>
              </select>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-gold"/>Check-in</span>
              <input type="date" value={checkIn} onChange={(e)=>setCheckIn(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            </label>
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-gold"/>Check-out</span>
              <input type="date" value={checkOut} onChange={(e)=>setCheckOut(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            </label>
          </div>

          {nights > 0 && <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">Stay length: {nights} night{nights === 1 ? "" : "s"}</div>}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><BedDouble className="h-4 w-4 text-gold"/>Room type</span>
              <select className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
                <option>Deluxe Room</option>
                <option>Sea View Room</option>
                <option>Family Room</option>
                <option>Beach Villa</option>
                <option>Water Villa</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><BedDouble className="h-4 w-4 text-gold"/>Number of rooms</span>
              <select value={rooms} onChange={(e)=>setRooms(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
                <option value="1">1 Room</option>
                <option value="2">2 Rooms</option>
                <option value="3">3 Rooms</option>
                <option value="4">4 Rooms</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium"><Utensils className="h-4 w-4 text-gold"/>Meal plan</span>
            <select className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
              <option>Room Only</option>
              <option>Bed & Breakfast</option>
              <option>Half Board</option>
              <option>Full Board</option>
              <option>All Inclusive</option>
            </select>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <input placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            <input placeholder="Phone / WhatsApp" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          </div>

          <textarea rows={4} placeholder="Special requests, airport transfer, honeymoon setup, excursions, etc." className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />

          <button type="button" className="btn-gold w-full md:w-auto">Request Booking</button>
          <p className="text-xs text-gray-500">This sends a booking request only. Availability and final price will be confirmed by Tripelor.</p>
        </form>
      </div>
    </section>
  );
}
