"use client";

import { useMemo, useState } from "react";
import { CalendarDays, BedDouble, Utensils, Users, MapPin, MessageCircle, Mail } from "lucide-react";

const WHATSAPP_NUMBER = "9609429403";

function formatDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function BookingPage() {
  const [destination, setDestination] = useState("Maldives");
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("Deluxe Room");
  const [rooms, setRooms] = useState("1");
  const [mealPlan, setMealPlan] = useState("Bed & Breakfast");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T00:00:00`).getTime();
    const end = new Date(`${checkOut}T00:00:00`).getTime();
    const diff = Math.ceil((end - start) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  function validateBooking() {
    if (!checkIn || !checkOut) {
      setStatus("Please select your check-in and check-out dates.");
      return false;
    }
    if (nights <= 0) {
      setStatus("Check-out date must be after the check-in date.");
      return false;
    }
    if (!fullName.trim()) {
      setStatus("Please enter your full name.");
      return false;
    }
    if (!email.trim() || !email.includes("@")) {
      setStatus("Please enter a valid email address.");
      return false;
    }
    return true;
  }

  async function sendBookingEmail() {
    setStatus("");
    if (!validateBooking()) return;

    setSending(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          destination,
          checkIn: formatDate(checkIn),
          checkOut: formatDate(checkOut),
          nights,
          adults,
          children,
          roomType,
          rooms,
          mealPlan,
          specialRequests: specialRequests.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Unable to send booking request.");
      }

      setStatus("Booking request sent successfully. Tripelor will contact you shortly.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send booking request.");
    } finally {
      setSending(false);
    }
  }

  function openWhatsApp() {
    setStatus("");
    if (!validateBooking()) return;

    const message = [
      "Hello Tripelor,",
      "",
      "I would like to request a booking.",
      "",
      `Name: ${fullName.trim()}`,
      `Email: ${email.trim()}`,
      `Phone / WhatsApp: ${phone.trim() || "Not provided"}`,
      `Destination: ${destination}`,
      `Check-in: ${formatDate(checkIn)}`,
      `Check-out: ${formatDate(checkOut)}`,
      `Adults: ${adults}`,
      `Children: ${children}`,
      `Room: ${roomType}`,
      `Rooms: ${rooms}`,
      `Meal Plan: ${mealPlan}`,
      `Special Request: ${specialRequests.trim() || "None"}`,
      "",
      "Please confirm availability and price.",
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
          Choose your travel dates, room preference, guests and meal plan. Submit the form and Tripelor will receive your booking request by email.
        </p>

        <form className="card mt-10 grid gap-6 p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
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
              <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-gold"/>Adults</span>
              <select value={adults} onChange={(e)=>setAdults(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-gold"/>Children</span>
              <select value={children} onChange={(e)=>setChildren(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold">
                {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>

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

          <div className="grid gap-5 md:grid-cols-3">
            <input value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email address" type="email" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
            <input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="Phone / WhatsApp" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          </div>

          <textarea value={specialRequests} onChange={(e)=>setSpecialRequests(e.target.value)} rows={4} placeholder="Special requests, airport transfer, honeymoon setup, excursions, etc." className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />

          {status && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-200">{status}</div>}

          <div className="flex flex-col gap-3 md:flex-row">
            <button type="button" onClick={sendBookingEmail} disabled={sending} className="btn-gold w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto">
              <Mail className="h-5 w-5" /> {sending ? "Sending..." : "Send Booking Request"}
            </button>
            <button type="button" onClick={openWhatsApp} className="btn-outline w-full gap-2 md:w-auto">
              <MessageCircle className="h-5 w-5" /> Send on WhatsApp
            </button>
          </div>

          <p className="text-xs text-gray-500">Booking requests are enquiries only. Availability and final price will be confirmed by Tripelor.</p>
        </form>
      </div>
    </section>
  );
}
