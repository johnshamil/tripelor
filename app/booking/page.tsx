"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, BedDouble, Utensils, Users, Mail, Hotel, MapPin, PackageCheck } from "lucide-react";

const PROPERTY_RATES: Record<string, Record<string, number>> = {
  "Uhoo's Lavish Oasis": { "Bed & Breakfast": 85, "Half Board": 95, "Full Board": 115 },
  "Masfalhi View Inn": { "Bed & Breakfast": 80, "Half Board": 90, "Full Board": 100 },
};

const PACKAGE_PRICES: Record<string, number> = {
  "Maldives Reef & Relax Escape": 320,
  "5-Night Island Adventure": 540,
  "Maldives Ocean Discovery Escape": 850,
};

function formatDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

function addDays(date: string, days: number) {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const [propertyName, setPropertyName] = useState("Uhoo's Lavish Oasis");
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState<number | null>(null);
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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("property")) setPropertyName(p.get("property")!);
    if (p.get("mealPlan")) setMealPlan(p.get("mealPlan")!);
    const pkg = p.get("package") || "";
    if (pkg) {
      const cleanName = pkg.replace(/\s*-\s*USD\s*\d+(?:\.\d+)?\s*$/i, "").trim();
      setPackageName(cleanName);
      const urlPrice = pkg.match(/USD\s*(\d+(?:\.\d+)?)/i);
      setPackagePrice(urlPrice ? Number(urlPrice[1]) : (PACKAGE_PRICES[cleanName] ?? null));
    }
  }, []);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const d = Math.ceil((new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86400000);
    return d > 0 ? d : 0;
  }, [checkIn, checkOut]);

  const nightlyRate = PROPERTY_RATES[propertyName]?.[mealPlan];
  const estimatedTotal = packageName && packagePrice ? packagePrice * Number(rooms) : (nightlyRate && nights > 0 ? nightlyRate * nights * Number(rooms) : 0);
  const location = propertyName === "Uhoo's Lavish Oasis" ? "V. Felidhoo, Maldives" : "Maldives";
  const packageMaxCheckout = packageName && checkIn ? addDays(checkIn, 5) : undefined;
  const checkoutMin = checkIn ? addDays(checkIn, 1) : undefined;

  function handleCheckIn(value: string) {
    setCheckIn(value);
    if (packageName && value) setCheckOut(addDays(value, 5));
  }

  function handleCheckOut(value: string) {
    if (packageName && checkIn) {
      const maxDate = addDays(checkIn, 5);
      if (value > maxDate) {
        setCheckOut(maxDate);
        setStatus("Package stays can be a maximum of 5 nights.");
        return;
      }
    }
    setCheckOut(value);
    setStatus("");
  }

  function validate() {
    if (!checkIn || !checkOut) { setStatus("Please select your check-in and check-out dates."); return false; }
    if (nights <= 0) { setStatus("Check-out date must be after the check-in date."); return false; }
    if (packageName && nights > 5) { setStatus("Package stays can be a maximum of 5 nights."); return false; }
    if (!fullName.trim()) { setStatus("Please enter your full name."); return false; }
    if (!email.trim() || !email.includes("@")) { setStatus("Please enter a valid email address."); return false; }
    if (!phone.trim()) { setStatus("Please enter your phone number."); return false; }
    return true;
  }

  async function sendBookingEmail() {
    setStatus("");
    if (!validate()) return;
    setSending(true);
    try {
      const r = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: packageName || null,
          packagePrice: packagePrice || null,
          propertyName: packageName ? null : propertyName,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          destination: packageName ? "Maldives" : location,
          checkIn: formatDate(checkIn),
          checkOut: formatDate(checkOut),
          nights,
          adults: packageName ? null : adults,
          children: packageName ? null : children,
          roomType: packageName ? null : roomType,
          rooms,
          mealPlan: packageName ? null : mealPlan,
          nightlyRate: packageName ? null : (nightlyRate || null),
          estimatedTotal: estimatedTotal || null,
          specialRequests: packageName ? "" : specialRequests.trim(),
        }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x?.error || "Unable to send booking request.");
      setStatus("Booking request sent successfully. A confirmation email has also been sent to you.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to send booking request.");
    } finally {
      setSending(false);
    }
  }

  return <section className="container py-16"><div className="mx-auto max-w-5xl">
    <p className="text-sm uppercase tracking-[0.3em] text-gold">{packageName ? "Book This Package" : "Book Your Stay"}</p>
    <h1 className="mt-2 text-4xl font-bold md:text-5xl">{packageName ? packageName : "Book your island guesthouse"}</h1>
    <p className="mt-4 max-w-2xl text-gray-400">{packageName ? "Enter your travel dates and contact details to request this package." : "Choose your guesthouse, dates and meal plan. Your booking request will be emailed directly to Tripelor."}</p>

    <form className="card mt-10 grid gap-6 p-6 md:p-8" onSubmit={e => e.preventDefault()}>
      {packageName && <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5"><div className="flex items-start gap-3"><PackageCheck className="mt-1 h-6 w-6 text-gold"/><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Selected Package</p><h2 className="mt-1 text-2xl font-bold">{packageName}</h2>{packagePrice ? <p className="mt-2 text-gray-300"><strong className="text-gold">USD {packagePrice}</strong> per package</p> : null}</div></div></div>}

      {!packageName && <>
        <div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><Hotel className="h-4 w-4 text-gold"/>Stay / Hotel</span><select value={propertyName} onChange={e => setPropertyName(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold"><option>Uhoo&apos;s Lavish Oasis</option><option>Masfalhi View Inn</option></select></label><div className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-gold"/>Location</span><div className="rounded-xl border border-white/10 bg-black px-4 py-3 text-gray-200">{location}</div></div></div>
        <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">{propertyName} · BB ${PROPERTY_RATES[propertyName]["Bed & Breakfast"]} · HB ${PROPERTY_RATES[propertyName]["Half Board"]} · FB ${PROPERTY_RATES[propertyName]["Full Board"]} per room/night</div>
      </>}

      <div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-gold"/>Check-in</span><input type="date" value={checkIn} onChange={e => handleCheckIn(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold"/></label><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="h-4 w-4 text-gold"/>Check-out</span><input type="date" value={checkOut} min={checkoutMin} max={packageMaxCheckout} onChange={e => handleCheckOut(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold"/></label></div>

      {packageName && <p className="-mt-3 text-xs text-gray-500">Selecting check-in automatically sets check-out 5 nights later. The check-out date cannot be more than 5 nights after check-in.</p>}

      <label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><BedDouble className="h-4 w-4 text-gold"/>Number of rooms</span><select value={rooms} onChange={e => setRooms(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3">{[1,2,3,4].map(n => <option key={n} value={n}>{n} Room{n > 1 ? "s" : ""}</option>)}</select></label>

      {packageName && estimatedTotal > 0 && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">Package total for {rooms} room{rooms === "1" ? "" : "s"}: <span className="font-semibold text-gold">USD {estimatedTotal}</span></div>}

      {!packageName && <>
        {nights > 0 && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">Stay length: <span className="text-gold">{nights} night{nights === 1 ? "" : "s"}</span>{estimatedTotal > 0 && <> · Estimated room total: <span className="font-semibold text-gold">USD {estimatedTotal}</span></>}</div>}
        <div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-gold"/>Adults</span><select value={adults} onChange={e => setAdults(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3">{[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}</select></label><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-gold"/>Children</span><select value={children} onChange={e => setChildren(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3">{[0,1,2,3,4,5,6].map(n => <option key={n}>{n}</option>)}</select></label></div>
        <div className="grid gap-5 md:grid-cols-2"><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><BedDouble className="h-4 w-4 text-gold"/>Room type</span><select value={roomType} onChange={e => setRoomType(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3"><option>Deluxe Room</option></select></label><label className="grid gap-2"><span className="flex items-center gap-2 text-sm font-medium"><Utensils className="h-4 w-4 text-gold"/>Meal plan</span><select value={mealPlan} onChange={e => setMealPlan(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3"><option>Bed & Breakfast</option><option>Half Board</option><option>Full Board</option></select></label></div>
        <p className="-mt-3 text-sm text-gray-400">Selected rate: <span className="font-semibold text-gold">USD {nightlyRate} per room/night</span></p>
      </>}

      <div className="grid gap-5 md:grid-cols-3"><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3"/><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" className="rounded-xl border border-white/10 bg-black px-4 py-3"/><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="rounded-xl border border-white/10 bg-black px-4 py-3"/></div>

      {!packageName && <textarea value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} rows={4} placeholder="Special requests, speedboat transfer, honeymoon setup, excursions, etc." className="rounded-xl border border-white/10 bg-black px-4 py-3"/>}
      {status && <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-200">{status}</div>}
      <button type="button" onClick={sendBookingEmail} disabled={sending} className="btn-gold w-full gap-2 disabled:opacity-60 md:w-auto"><Mail className="h-5 w-5"/>{sending ? "Sending..." : packageName ? "Book This Package Now" : "Send Booking Request"}</button>
      <p className="text-xs text-gray-500">Booking requests are subject to availability and confirmation by Tripelor.</p>
    </form>
  </div></section>;
}
