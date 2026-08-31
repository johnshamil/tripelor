"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Flame,
  Heart,
  Headphones,
  Hotel,
  MapPin,
  PackageCheck,
  SearchCheck,
  ShieldCheck,
  Ship,
  Sparkles,
  Utensils,
  Users,
} from "lucide-react";
import AvailabilityDatePicker from "@/components/availability-date-picker";

const PACKAGE_HOTEL = "Uhoo's Lavish Oasis";
const PROPERTY_ROOMS: Record<string, string[]> = {
  "Uhoo's Lavish Oasis": ["ROOM 101", "ROOM 102"],
  "Masfalhi View Inn": ["ROOM 101", "ROOM 102", "ROOM 103", "ROOM 104", "ROOM 105", "ROOM 106"],
  "Rivethi Beach Hotel": ["Deluxe Double", "Deluxe Twin", "Deluxe Double Sea View"],
};
const STANDARD_RATES: Record<string, Record<string, number>> = {
  "Uhoo's Lavish Oasis": { "Bed & Breakfast": 85, "Half Board": 95, "Full Board": 115 },
  "Masfalhi View Inn": { "Bed & Breakfast": 97, "Half Board": 110, "Full Board": 130 },
};
const RIVETHI_RATES: Record<string, Record<string, [number, number]>> = {
  "Deluxe Double": { "Room Only": [85, 85], "Bed & Breakfast": [95, 95] },
  "Deluxe Twin": { "Room Only": [85, 85], "Bed & Breakfast": [95, 95] },
  "Deluxe Double Sea View": { "Bed & Breakfast": [130, 130], "Full Board": [195, 195] },
};

function formatDate(date: string) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${date}T00:00:00`),
  );
}

function addDays(date: string, days: number) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(
    result.getUTCDate(),
  ).padStart(2, "0")}`;
}

export default function BookingPageClientV2() {
  const [propertyName, setPropertyName] = useState(PACKAGE_HOTEL);
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState<number | null>(null);
  const [packageNights, setPackageNights] = useState(5);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("ROOM 101");
  const [mealPlan, setMealPlan] = useState("Bed & Breakfast");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [speedboatSeats, setSpeedboatSeats] = useState(0);
  const [speedboatTotal, setSpeedboatTotal] = useState(0);
  const [planTotal, setPlanTotal] = useState(0);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [availability, setAvailability] = useState<{
    available: boolean;
    rooms_left?: number;
    total_rooms?: number;
  } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const property = params.get("property");
    const meal = params.get("mealPlan");
    const room = params.get("roomType");
    const checkInParam = params.get("checkIn");
    const checkOutParam = params.get("checkOut");

    if (property) {
      setPropertyName(property);
      setRoomType(PROPERTY_ROOMS[property]?.[0] || "ROOM 101");
    }
    if (meal) setMealPlan(meal);
    if (room) setRoomType(room);
    if (checkInParam) setCheckIn(checkInParam);
    if (checkOutParam) setCheckOut(checkOutParam);
    setSpeedboatSeats(Number(params.get("speedboatSeats") || 0));
    setSpeedboatTotal(Number(params.get("speedboatTotal") || 0));
    setPlanTotal(Number(params.get("planTotal") || 0));

    const nightsParam = Number(params.get("nights") || 5);
    if (nightsParam === 3 || nightsParam === 5) setPackageNights(nightsParam);

    const selectedPackage = params.get("package") || "";
    if (selectedPackage) {
      const cleanName = selectedPackage.replace(/\s*-\s*USD\s*\d+(?:\.\d+)?\s*$/i, "").trim();
      setPackageName(cleanName);
      setPropertyName(PACKAGE_HOTEL);
      const priceMatch = selectedPackage.match(/USD\s*(\d+(?:\.\d+)?)/i);
      setPackagePrice(priceMatch ? Number(priceMatch[1]) : null);
      setAdults("2");
      setChildren("0");
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!result?.user) return;
        setFullName((current) => current || result.user.fullName || "");
        setEmail((current) => current || result.user.email || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (packageName && checkIn) setCheckOut(addDays(checkIn, packageNights));
  }, [packageName, checkIn, packageNights]);

  useEffect(() => {
    setAvailability(null);
  }, [propertyName, roomType, checkIn, checkOut]);

  useEffect(() => {
    if (propertyName === "Rivethi Beach Hotel") {
      const options = roomType === "Deluxe Double Sea View" ? ["Bed & Breakfast", "Full Board"] : ["Room Only", "Bed & Breakfast"];
      if (!options.includes(mealPlan)) setMealPlan(options[0]);
    }
  }, [propertyName, roomType, mealPlan]);

  const isRivethi = propertyName === "Rivethi Beach Hotel";
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const difference =
      (new Date(`${checkOut}T00:00:00`).getTime() - new Date(`${checkIn}T00:00:00`).getTime()) / 86400000;
    return difference > 0 ? Math.round(difference) : 0;
  }, [checkIn, checkOut]);

  const nightlyRate = useMemo(() => {
    if (isRivethi) {
      const pair = RIVETHI_RATES[roomType]?.[mealPlan];
      return pair ? (Number(adults) <= 1 ? pair[0] : pair[1]) : 0;
    }
    return STANDARD_RATES[propertyName]?.[mealPlan] || 0;
  }, [isRivethi, propertyName, roomType, mealPlan, adults]);

  const roomTotal = packageName && packagePrice ? packagePrice : nightlyRate * nights;
  const estimatedTotal = planTotal || roomTotal + speedboatTotal;
  const location =
    propertyName === PACKAGE_HOTEL
      ? "V. Felidhoo, Maldives"
      : propertyName === "Rivethi Beach Hotel"
        ? "Hulhumalé, Maldives"
        : "Maldives";
  const roomOptions = PROPERTY_ROOMS[propertyName] || ["ROOM 101"];
  const mealOptions = isRivethi
    ? roomType === "Deluxe Double Sea View"
      ? ["Bed & Breakfast", "Full Board"]
      : ["Room Only", "Bed & Breakfast"]
    : ["Bed & Breakfast", "Half Board", "Full Board"];

  function handlePropertyChange(value: string) {
    setPropertyName(value);
    setRoomType(PROPERTY_ROOMS[value]?.[0] || "ROOM 101");
    setMealPlan("Bed & Breakfast");
    setAdults("2");
    setCheckIn("");
    setCheckOut("");
    setAvailability(null);
    setStatus("");
  }

  function handleCheckIn(value: string) {
    setCheckIn(value);
    setStatus("");
    if (packageName && value) setCheckOut(addDays(value, packageNights));
    else if (checkOut && checkOut <= value) setCheckOut("");
  }

  async function checkAvailability() {
    setStatus("");
    if (!checkIn || !checkOut) {
      setStatus("Please select your dates first.");
      return false;
    }
    setChecking(true);
    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyName, roomType, checkIn, checkOut, rooms: 1 }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to check availability.");
      setAvailability(result);
      if (!result.available) setStatus("Sorry, no rooms are available for the selected dates.");
      return Boolean(result.available);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to check availability.");
      return false;
    } finally {
      setChecking(false);
    }
  }

  function validate() {
    if (!checkIn || !checkOut) {
      setStatus("Please select your check-in and check-out dates.");
      return false;
    }
    if (nights <= 0) {
      setStatus("Check-out must be after check-in.");
      return false;
    }
    if (packageName && nights !== packageNights) {
      setStatus(`This package is for exactly ${packageNights} nights.`);
      return false;
    }
    if (!fullName.trim()) {
      setStatus("Please enter your full name.");
      return false;
    }
    if (!email.includes("@")) {
      setStatus("Please enter a valid email address.");
      return false;
    }
    if (!phone.trim()) {
      setStatus("Please enter your phone / WhatsApp number.");
      return false;
    }
    if (isRivethi && Number(adults) > 2) {
      setStatus("Rivethi room rate supports up to 2 adults per room. Please contact Tripelor for extra-bed arrangements.");
      return false;
    }
    return true;
  }

  async function sendBooking() {
    setStatus("");
    if (!validate()) return;
    let available = availability?.available;
    if (!available) available = await checkAvailability();
    if (!available) return;

    setSending(true);
    try {
      const finalCheckOut = packageName ? addDays(checkIn, packageNights) : checkOut;
      const finalNights = packageName ? packageNights : nights;
      const builderNote =
        speedboatSeats > 0
          ? `Speedboat requested: ${speedboatSeats} seat${speedboatSeats > 1 ? "s" : ""} at USD 50/person (USD ${speedboatTotal}).`
          : "";
      const requestNote = [
        packageName ? `Couple package for 2 adults sharing ${roomType} at ${PACKAGE_HOTEL}.` : specialRequests.trim(),
        builderNote,
      ]
        .filter(Boolean)
        .join(" ");

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName: packageName || null,
          packagePrice: packagePrice || null,
          propertyName: packageName ? PACKAGE_HOTEL : propertyName,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          destination: location,
          checkIn: formatDate(checkIn),
          checkOut: formatDate(finalCheckOut),
          checkInISO: checkIn,
          checkOutISO: finalCheckOut,
          nights: finalNights,
          adults: packageName ? "2" : adults,
          children: packageName ? "0" : children,
          roomType,
          rooms: "1",
          mealPlan,
          nightlyRate: packageName ? null : nightlyRate,
          estimatedTotal: estimatedTotal || null,
          speedboatSeats,
          speedboatTotal,
          specialRequests: requestNote,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Unable to send booking request.");

      const title = packageName || `${propertyName} · ${roomType}`;
      window.location.href = `/booking/confirmation?name=${encodeURIComponent(fullName.trim())}&title=${encodeURIComponent(
        title,
      )}&dates=${encodeURIComponent(`${formatDate(checkIn)} – ${formatDate(finalCheckOut)}`)}&ref=${encodeURIComponent(
        result.bookingReference || result.reservationId || "",
      )}&total=${encodeURIComponent(String(result.finalTotal ?? estimatedTotal ?? ""))}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send booking request.");
      setAvailability(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <div className="bg-[#06151c] text-white">
        <div className="container py-16 md:py-20">
          <p className="eyebrow">Tripelor private booking</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">
            {packageName || "Your stay, beautifully arranged."}
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-white/55">
            Select your stay, confirm live dates and share your details. A Tripelor concierge reviews every request before confirmation.
          </p>
          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
            {[
              ["01", "Choose your stay"],
              ["02", "Share your details"],
              ["03", "Receive confirmation"],
            ].map(([number, label]) => (
              <div key={number} className="bg-[#071922] p-4 md:p-5">
                <p className="font-display text-xl italic text-[#d9bd7b]">{number}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[.16em] text-white/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container grid gap-7 pt-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <form
          className="border border-[#d0c5b0] bg-[#f8f4ec] shadow-[0_24px_80px_rgba(34,43,46,.08)]"
          onSubmit={(event) => event.preventDefault()}
        >
          {packageName && (
            <div className="border-b border-[#d0c5b0] bg-[#eadfc8] p-6 md:p-8">
              <div className="flex gap-4">
                <PackageCheck className="mt-1 h-6 w-6 shrink-0 text-[#8d7037]" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8d7037]">Selected couple package</p>
                  <h2 className="font-display mt-2 text-3xl">{packageName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#58656c]">
                    <Heart className="h-4 w-4 text-[#9c7d3d]" /> 2 adults · 1 room · {packageNights} nights
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-[#d0c5b0] p-6 md:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="font-display text-2xl italic text-[#9c7d3d]">01</span>
              <div>
                <h2 className="font-display text-3xl">Choose your stay</h2>
                <p className="mt-1 text-sm text-[#6a767a]">Property, dates, room and dining preferences.</p>
              </div>
            </div>

            {!packageName && (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="premium-label">
                  <span><Hotel className="h-4 w-4 text-[#9c7d3d]" /> Property</span>
                  <select value={propertyName} onChange={(event) => handlePropertyChange(event.target.value)} className="premium-control">
                    <option>Uhoo&apos;s Lavish Oasis</option>
                    <option>Masfalhi View Inn</option>
                    <option>Rivethi Beach Hotel</option>
                  </select>
                </label>
                <div className="premium-label">
                  <span><MapPin className="h-4 w-4 text-[#9c7d3d]" /> Location</span>
                  <div className="premium-control flex items-center">{location}</div>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <AvailabilityDatePicker label="Check-in" value={checkIn} onChange={handleCheckIn} propertyName={propertyName} roomType={roomType} />
              <AvailabilityDatePicker
                label="Check-out"
                value={checkOut}
                onChange={setCheckOut}
                propertyName={propertyName}
                roomType={roomType}
                minDate={checkIn ? addDays(checkIn, 1) : undefined}
                disabled={!!packageName}
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="premium-label">
                <span><BedDouble className="h-4 w-4 text-[#9c7d3d]" /> Room</span>
                <select value={roomType} onChange={(event) => setRoomType(event.target.value)} className="premium-control">
                  {roomOptions.map((room) => <option key={room}>{room}</option>)}
                </select>
              </label>
              <label className="premium-label">
                <span><Utensils className="h-4 w-4 text-[#9c7d3d]" /> Meal plan</span>
                <select
                  value={mealPlan}
                  disabled={!!packageName}
                  onChange={(event) => setMealPlan(event.target.value)}
                  className="premium-control disabled:opacity-60"
                >
                  {mealOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>

            {!packageName && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="premium-label">
                  <span><Users className="h-4 w-4 text-[#9c7d3d]" /> Adults</span>
                  <select value={adults} onChange={(event) => setAdults(event.target.value)} className="premium-control">
                    {(isRivethi ? [1, 2] : [1, 2, 3, 4]).map((number) => <option key={number}>{number}</option>)}
                  </select>
                </label>
                <label className="premium-label">
                  <span><Users className="h-4 w-4 text-[#9c7d3d]" /> Children</span>
                  <select value={children} onChange={(event) => setChildren(event.target.value)} className="premium-control">
                    {[0, 1, 2, 3].map((number) => <option key={number}>{number}</option>)}
                  </select>
                </label>
              </div>
            )}

            {isRivethi && (
              <div className="mt-5 border border-[#8ea99a]/45 bg-[#e5eee7] p-4 text-sm leading-6 text-[#40564a]">
                <strong>Rivethi live booking is enabled.</strong> Tripelor checks the hotel&apos;s pooled inventory before final room-category confirmation.
              </div>
            )}

            <button
              type="button"
              onClick={checkAvailability}
              disabled={checking || !checkIn || !checkOut}
              className="btn-outline mt-6 border-[#8d7037] text-[#745b2e] disabled:opacity-45"
            >
              <SearchCheck className="h-4 w-4" /> {checking ? "Checking Dates…" : "Check Live Availability"}
            </button>

            {availability?.available && availability.rooms_left === 1 && (
              <div className="mt-5 flex items-center gap-3 border border-[#b9964f]/45 bg-[#efe2c5] p-4 text-[#745b2e]">
                <Flame className="h-5 w-5" /> <strong>Only one room remains for these dates.</strong>
              </div>
            )}
            {availability && (
              <div className={`mt-5 flex items-center gap-3 border p-4 text-sm ${availability.available ? "border-[#8ea99a]/45 bg-[#e5eee7] text-[#40564a]" : "border-[#c69292]/45 bg-[#f2dfdc] text-[#744740]"}`}>
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {availability.available
                  ? `${roomType} is available · ${availability.rooms_left ?? ""} room${availability.rooms_left === 1 ? "" : "s"} left for these dates.`
                  : "Sold out for the selected dates."}
              </div>
            )}
          </div>

          <div className="p-6 md:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="font-display text-2xl italic text-[#9c7d3d]">02</span>
              <div>
                <h2 className="font-display text-3xl">Your details</h2>
                <p className="mt-1 text-sm text-[#6a767a]">So your concierge can prepare the reservation correctly.</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="premium-label">
                <span>Full name</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" className="premium-control" />
              </label>
              <label className="premium-label">
                <span>Email address</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@email.com" type="email" className="premium-control" />
              </label>
              <label className="premium-label">
                <span>Phone / WhatsApp</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Include country code" className="premium-control" />
              </label>
            </div>

            {!packageName && (
              <label className="premium-label mt-5">
                <span>Personal requests</span>
                <textarea
                  value={specialRequests}
                  onChange={(event) => setSpecialRequests(event.target.value)}
                  rows={4}
                  placeholder="Airport transfer, honeymoon setup, extra bed or anything we should arrange"
                  className="premium-control resize-y"
                />
              </label>
            )}

            {status && <div className="mt-5 border border-[#c4b89f] bg-[#eee5d4] p-4 text-sm text-[#5e625f]">{status}</div>}
          </div>
        </form>

        <aside className="border border-[#c9a86a]/35 bg-[#071922] p-7 text-white shadow-2xl lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">Your journey</p>
            <Sparkles className="h-5 w-5 text-[#d9bd7b]" />
          </div>
          <h2 className="font-display mt-4 text-3xl leading-tight">{packageName || propertyName}</h2>
          <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/40">
            <MapPin className="h-3.5 w-3.5 text-[#c9a86a]" /> {location}
          </p>

          <div className="mt-7 space-y-3 border-y border-white/10 py-6 text-sm text-white/60">
            <p className="flex items-center justify-between gap-4"><span>Room</span><strong className="text-right text-white">{roomType}</strong></p>
            <p className="flex items-center justify-between gap-4"><span>Stay</span><strong className="text-white">{nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Select dates"}</strong></p>
            <p className="flex items-center justify-between gap-4"><span>Dining</span><strong className="text-right text-white">{mealPlan}</strong></p>
            {nightlyRate > 0 && <p className="flex items-center justify-between gap-4"><span>Nightly rate</span><strong className="text-white">USD {nightlyRate}</strong></p>}
          </div>

          <div className="py-6">
            <p className="text-[10px] uppercase tracking-[.2em] text-white/35">Estimated total</p>
            <p className="font-display mt-2 text-5xl text-[#d9bd7b]">USD {estimatedTotal || 0}</p>
            {speedboatSeats > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-white/45">
                <Ship className="h-4 w-4 text-[#c9a86a]" /> {speedboatSeats} speedboat seat(s) included
              </p>
            )}
          </div>

          <button type="button" onClick={sendBooking} disabled={sending} className="btn-gold w-full disabled:opacity-60">
            {sending ? "Preparing Request…" : "Request My Stay"} <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-6 text-xs leading-5 text-white/40">
            <p className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" /> No automatic charge is taken. Confirmation and payment instructions follow after review.</p>
            <p className="flex gap-3"><Headphones className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" /> Need help? WhatsApp your Tripelor concierge on +960 942 9403.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
