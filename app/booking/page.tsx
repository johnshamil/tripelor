"use client";

import { useMemo, useState } from "react";
import { CalendarDays, BedDouble, Utensils, Users, MapPin, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "9609429403";

export default function BookingPage() {
  const [destination, setDestination] = useState("Maldives");
  const [guests, setGuests] = useState("2 Adults");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("Deluxe Room");
  const [rooms, setRooms] = useState("1");
  const [mealPlan, setMealPlan] = useState("Bed & Breakfast");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn).getTime();
    const end = new Date(checkOut).getTime();
    const diff = Math.ceil((end - start) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  function requestBooking() {
    if (!checkIn || !checkOut) {
      alert("Please select your check-in and check-out dates.");
      return;
    }

    if (nights <= 0) {
      alert("Check-out date must be after the check-in date.");
      return;
    }

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    const message = [
      "Hello Tripelor! 👋",
      "",
      "I would like to request a booking.",
      "",
      `👤 Name: ${fullName}`,
      `📱 Guest Phone/WhatsApp: ${phone || "Not provided"}`,
      `📍 Destination: ${destination}`,
      `📅 Check-in: ${checkIn}`,
      `📅 Check-out: ${checkOut}`,
      `🌙 Stay: ${nights} night${nights === 1 ? "" : "s"}`,
      `👥 Guests: ${guests}`,
      `🛏️ Room Type: ${roomType}`,
      `🚪 Number of Rooms: ${rooms}`,
      `🍽️ Meal Plan: ${mealPlan}`,
      `📝 Special Requests: ${specialRequests.trim() || "None"}`,
      "",
      "Please confirm availability and send me the best price. Thank you!",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="container py-16">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.3em] text-gold">Book Your Stay</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Plan your perfect Tripelor escape</h1>
        <p className="mt-4 max-w-2xl text-gray-400">
          Choose your travel dates, room preference, guests and meal plan. Your booking request will open directly in WhatsApp for confirmation.
        </p>

        <form className="card mt-10 grid gap-6 p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-gold"/>Destination</span>
              <select value={destination} onChange={(e)=>setDestination(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
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
              <select value={guests} onChange={(e)=>setGuests(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
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
              <select value={roomType} onChange={(e)=>setRoomType(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
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
            <select value={mealPlan} onChange={(e)=>setMealPlan(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
              <option>Room Only</option>
              <option>Bed & Breakfast</option>
              <option>Half Board</option>
              <option>Full Board</option>
              <option>All Inclusive</option>
            </select>
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone / WhatsApp" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          </div>

          <textarea value={specialRequests} onChange={(e)=>setSpecialRequests(e.target.value)} rows={4} placeholder="Special requests, airport transfer, honeymoon setup, excursions, etc." className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />

          <button type="button" onClick={requestBooking} className="btn-gold w-full gap-2 md:w-auto">
            <MessageCircle className="h-5 w-5" /> Request Booking on WhatsApp
          </button>
          <p className="text-xs text-gray-500">WhatsApp will open with your booking details already filled in. You can review the message before sending it to Tripelor.</p>
        </form>
      </div>
    </section>
  );
}
