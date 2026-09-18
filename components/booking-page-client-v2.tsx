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
import AvailabilityAlertButton from "@/components/availability-alert-button";
import { propertyRateForDate, seasonalRateForDate } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";
import { translations, type ProfessionalLocale } from "@/lib/professional-translations";

const PACKAGE_HOTEL = "Uhoo's Lavish Oasis";

type RoomOption = { value: string; label: string; maxGuests: number };

const PROPERTY_ROOMS: Record<string, RoomOption[]> = {
  "Uhoo's Lavish Oasis": [
    { value: "ROOM 101", label: "Deluxe Room", maxGuests: 2 },
    { value: "ROOM 102", label: "Double Deluxe Room", maxGuests: 2 },
  ],
  "Masfalhi View Inn": [
    { value: "Standard Double Room", label: "Standard Double Room", maxGuests: 2 },
    { value: "Family Room with Sea View", label: "Family Room with Sea View", maxGuests: 5 },
  ],
  "Rivethi Beach Hotel": [
    { value: "Deluxe Double", label: "Deluxe Double", maxGuests: 2 },
    { value: "Deluxe Twin", label: "Deluxe Twin", maxGuests: 2 },
    { value: "Deluxe Double Sea View", label: "Deluxe Double Sea View", maxGuests: 2 },
  ],
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

function formatDate(date: string, locale: ProfessionalLocale = "en") {
  if (!date) return "";
  const language = locale === "it" ? "it-IT" : locale === "ru" ? "ru-RU" : "en-GB";
  return new Intl.DateTimeFormat(language, { day: "numeric", month: "long", year: "numeric" }).format(
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

function stayDates(checkIn: string, checkOut: string) {
  const dates: string[] = [];
  let current = checkIn;
  while (current && checkOut && current < checkOut) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export default function BookingPageClientV2({ locale = "en" }: { locale?: ProfessionalLocale }) {
  const copy = translations[locale].booking;
  const fill = (template: string, values: Record<string,string|number>) => Object.entries(values).reduce((text,[key,value]) => text.replace(`{${key}}`,String(value)),template);
  const roomDisplay = (value: string, fallback = value) => ({
    "ROOM 101": copy.deluxeRoom,
    "ROOM 102": copy.doubleDeluxeRoom,
    "Standard Double Room": copy.standardDoubleRoom,
    "Family Room with Sea View": copy.familySeaView,
    "Deluxe Double": copy.deluxeDouble,
    "Deluxe Twin": copy.deluxeTwin,
    "Deluxe Double Sea View": copy.deluxeSeaView,
  } as Record<string,string>)[value] || fallback;
  const mealDisplay = (value: string) => ({
    "Room Only": copy.roomOnly,
    "Bed & Breakfast": copy.bedBreakfast,
    "Half Board": copy.halfBoard,
    "Full Board": copy.fullBoard,
  } as Record<string,string>)[value] || value;
  const [propertyName, setPropertyName] = useState(PACKAGE_HOTEL);
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState<number | null>(null);
  const [packageNights, setPackageNights] = useState(5);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState(PROPERTY_ROOMS[PACKAGE_HOTEL][0].value);
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
  const [checkedSelection, setCheckedSelection] = useState('');
  const selectionKey = [propertyName, roomType, checkIn, checkOut].join('|');
  const [managedProperties, setManagedProperties] = useState<PublicProperty[]>([]);

  const managedProperty = managedProperties.find((property) => property.name === propertyName);
  const roomOptions = managedProperty
    ? managedProperty.rooms
        .filter((room, index, all) => all.findIndex((candidate) => candidate.name === room.name) === index)
        .map((room) => ({ value: room.name, label: room.name, maxGuests: room.capacity }))
    : (PROPERTY_ROOMS[propertyName] || PROPERTY_ROOMS[PACKAGE_HOTEL]).map((room) => ({ ...room, label: roomDisplay(room.value, room.label) }));
  const selectedRoom = roomOptions.find((room) => room.value === roomType) || roomOptions[0];
  const roomLabel = selectedRoom?.label || roomType;
  const maxGuests = selectedRoom?.maxGuests || 2;
  const isRivethi = propertyName === "Rivethi Beach Hotel";
  const isMasfalhi = propertyName === "Masfalhi View Inn";

  useEffect(() => {
    fetch("/api/properties", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setManagedProperties(result.properties || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const property = params.get("property");
    const meal = params.get("mealPlan");
    const room = params.get("roomType");
    const checkInParam = params.get("checkIn");
    const checkOutParam = params.get("checkOut");

    if (property) {
      setPropertyName(property);
      setRoomType(PROPERTY_ROOMS[property]?.[0]?.value || PROPERTY_ROOMS[PACKAGE_HOTEL][0].value);
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
      setRoomType(PROPERTY_ROOMS[PACKAGE_HOTEL][0].value);
      const priceMatch = selectedPackage.match(/USD\s*(\d+(?:\.\d+)?)/i);
      setPackagePrice(priceMatch ? Number(priceMatch[1]) : null);
      setAdults("2");
      setChildren("0");
    }
  }, []);

  useEffect(() => {
    if (!managedProperty) return;
    const matchingRoom = managedProperty.rooms.find((room) => room.name === roomType);
    if (!matchingRoom) setRoomType(managedProperty.rooms[0]?.name || "");
    if (matchingRoom && !managedProperty.rooms.some((room) => room.name === roomType && room.mealPlan === mealPlan)) {
      setMealPlan(matchingRoom.mealPlan);
    }
  }, [managedProperty, roomType, mealPlan]);

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
    if (managedProperty) {
      return propertyRateForDate(managedProperty, roomType, mealPlan, checkIn);
    }
    return STANDARD_RATES[propertyName]?.[mealPlan] || 0;
  }, [isRivethi, propertyName, roomType, mealPlan, adults, managedProperty, checkIn]);

  const roomTotal = useMemo(() => {
    if (packageName && packagePrice) return packagePrice;
    if (managedProperty && checkIn && checkOut && nights > 0) {
      return stayDates(checkIn, checkOut).reduce((total, date) => total + propertyRateForDate(managedProperty, roomType, mealPlan, date), 0);
    }
    return nightlyRate * nights;
  }, [packageName, packagePrice, managedProperty, checkIn, checkOut, nights, roomType, mealPlan, nightlyRate]);
  const estimatedTotal = planTotal || roomTotal + speedboatTotal;
  const activeSeason = managedProperty ? seasonalRateForDate(managedProperty, roomType, mealPlan, checkIn) : null;
  const location = managedProperty?.island || (
    propertyName === PACKAGE_HOTEL || propertyName === "Masfalhi View Inn"
      ? "V. Felidhoo, Maldives"
      : propertyName === "Rivethi Beach Hotel"
        ? "Hulhumalé, Maldives"
        : "Maldives"
  );

  const mealOptions = managedProperty
    ? managedProperty.rooms.filter((room, index, all) => room.name === roomType && all.findIndex((candidate) => candidate.name === room.name && candidate.mealPlan === room.mealPlan) === index).map((room) => room.mealPlan)
    : isRivethi
    ? roomType === "Deluxe Double Sea View"
      ? ["Bed & Breakfast", "Full Board"]
      : ["Room Only", "Bed & Breakfast"]
    : ["Bed & Breakfast", "Half Board", "Full Board"];

  const adultOptions = Array.from({ length: maxGuests }, (_, index) => index + 1);
  const childOptions = Array.from({ length: Math.min(4, maxGuests) + 1 }, (_, index) => index);

  function handlePropertyChange(value: string) {
    const firstRoomValue = PROPERTY_ROOMS[value]?.[0]?.value || managedProperties.find((property) => property.name === value)?.rooms[0]?.name || "ROOM 101";
    setPropertyName(value);
    setRoomType(firstRoomValue);
    setMealPlan(value === "Rivethi Beach Hotel" ? "Room Only" : "Bed & Breakfast");
    setAdults("2");
    setChildren("0");
    setCheckIn("");
    setCheckOut("");
    setAvailability(null);
    setStatus("");
  }

  function handleRoomChange(value: string) {
    setRoomType(value);
    setAdults("2");
    setChildren("0");
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
      setStatus(copy.selectDatesFirst);
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
      if (!response.ok) throw new Error(result?.error || copy.unableAvailability);
      setAvailability(result);
      setCheckedSelection(selectionKey);
      if (!result.available) setStatus(copy.noRooms);
      return Boolean(result.available);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.unableAvailability);
      return false;
    } finally {
      setChecking(false);
    }
  }

  function validate() {
    if (!checkIn || !checkOut) {
      setStatus(copy.selectCheckDates);
      return false;
    }
    if (nights <= 0) {
      setStatus(copy.checkoutAfter);
      return false;
    }
    if (packageName && nights !== packageNights) {
      setStatus(fill(copy.exactNights,{nights:packageNights}));
      return false;
    }
    if (Number(adults) + Number(children) > maxGuests) {
      setStatus(fill(copy.maxGuests,{room:roomLabel,guests:maxGuests}));
      return false;
    }
    if (!fullName.trim()) {
      setStatus(copy.enterName);
      return false;
    }
    if (!email.includes("@")) {
      setStatus(copy.validEmail);
      return false;
    }
    if (!phone.trim()) {
      setStatus(copy.enterPhone);
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
        packageName ? `Couple package for 2 adults sharing ${roomLabel} at ${PACKAGE_HOTEL}.` : specialRequests.trim(),
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
          checkIn: formatDate(checkIn, locale),
          checkOut: formatDate(finalCheckOut, locale),
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
      if (!response.ok) throw new Error(result?.error || copy.unableRequest);

      const title = packageName || `${propertyName} · ${roomLabel}`;
      window.location.href = `/booking/confirmation?name=${encodeURIComponent(fullName.trim())}&title=${encodeURIComponent(
        title,
      )}&dates=${encodeURIComponent(`${formatDate(checkIn, locale)} – ${formatDate(finalCheckOut, locale)}`)}&ref=${encodeURIComponent(
        result.bookingReference || result.reservationId || "",
      )}&total=${encodeURIComponent(String(result.finalTotal ?? estimatedTotal ?? ""))}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.unableRequest);
      setAvailability(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <div className="bg-[#06151c] text-white">
        <div className="container py-16 md:py-20">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">
            {packageName || copy.title}
          </h1>
          <p className="mt-5 max-w-2xl leading-8 text-white/55">
            {copy.intro}
          </p>
          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10">
            {[
              ["01", copy.stepChoose],
              ["02", copy.stepDetails],
              ["03", copy.stepConfirm],
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
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8d7037]">{copy.selectedPackage}</p>
                  <h2 className="font-display mt-2 text-3xl">{packageName}</h2>
                  <p className="mt-2 flex items-center gap-2 text-sm text-[#58656c]">
                    <Heart className="h-4 w-4 text-[#9c7d3d]" /> {copy.adultsRoomNights} · {packageNights} {copy.nights}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-[#d0c5b0] p-6 md:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="font-display text-2xl italic text-[#9c7d3d]">01</span>
              <div>
                <h2 className="font-display text-3xl">{copy.stepChoose}</h2>
                <p className="mt-1 text-sm text-[#6a767a]">{copy.staySectionBody}</p>
              </div>
            </div>

            {!packageName && (
              <div className="grid gap-5 md:grid-cols-2">
                <label className="premium-label">
                  <span><Hotel className="h-4 w-4 text-[#9c7d3d]" /> {copy.property}</span>
                  <select value={propertyName} onChange={(event) => handlePropertyChange(event.target.value)} className="premium-control">
                    <option>Uhoo&apos;s Lavish Oasis</option>
                    <option>Masfalhi View Inn</option>
                    <option>Rivethi Beach Hotel</option>
                    {managedProperties.map((property) => <option key={property.id} value={property.name}>{property.name}</option>)}
                  </select>
                </label>
                <div className="premium-label">
                  <span><MapPin className="h-4 w-4 text-[#9c7d3d]" /> {copy.location}</span>
                  <div className="premium-control flex items-center">{location}</div>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <AvailabilityDatePicker allowUnavailable label={copy.checkIn} value={checkIn} onChange={handleCheckIn} propertyName={propertyName} roomType={roomType} />
              <AvailabilityDatePicker
                label={copy.checkOut}
                value={checkOut}
                onChange={setCheckOut}
                propertyName={propertyName}
                roomType={roomType}
                minDate={checkIn ? addDays(checkIn, 1) : undefined}
                disabled={!!packageName}
                allowUnavailable
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="premium-label">
                <span><BedDouble className="h-4 w-4 text-[#9c7d3d]" /> {copy.roomType}</span>
                <select value={roomType} onChange={(event) => handleRoomChange(event.target.value)} className="premium-control">
                  {roomOptions.map((room) => <option key={room.value} value={room.value}>{room.label}</option>)}
                </select>
              </label>
              <label className="premium-label">
                <span><Utensils className="h-4 w-4 text-[#9c7d3d]" /> {copy.mealPlan}</span>
                <select
                  value={mealPlan}
                  disabled={!!packageName}
                  onChange={(event) => setMealPlan(event.target.value)}
                  className="premium-control disabled:opacity-60"
                >
                  {mealOptions.map((option) => <option key={option} value={option}>{mealDisplay(option)}</option>)}
                </select>
              </label>
            </div>

            {!packageName && (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="premium-label">
                  <span><Users className="h-4 w-4 text-[#9c7d3d]" /> {copy.adults}</span>
                  <select value={adults} onChange={(event) => setAdults(event.target.value)} className="premium-control">
                    {adultOptions.map((number) => <option key={number}>{number}</option>)}
                  </select>
                </label>
                <label className="premium-label">
                  <span><Users className="h-4 w-4 text-[#9c7d3d]" /> {copy.children}</span>
                  <select value={children} onChange={(event) => setChildren(event.target.value)} className="premium-control">
                    {childOptions.map((number) => <option key={number}>{number}</option>)}
                  </select>
                </label>
              </div>
            )}

            {isMasfalhi && (
              <div className="mt-5 border border-[#8ea99a]/45 bg-[#e5eee7] p-4 text-sm leading-6 text-[#40564a]">
                <strong>{copy.masfalhiTitle}</strong> {copy.masfalhiBody}
              </div>
            )}

            {isRivethi && (
              <div className="mt-5 border border-[#8ea99a]/45 bg-[#e5eee7] p-4 text-sm leading-6 text-[#40564a]">
                <strong>{copy.rivethiTitle}</strong> {copy.rivethiBody}
              </div>
            )}

            <button
              type="button"
              onClick={checkAvailability}
              disabled={checking || !checkIn || !checkOut}
              className="btn-outline mt-6 border-[#8d7037] text-[#745b2e] disabled:opacity-45"
            >
              <SearchCheck className="h-4 w-4" /> {checking ? copy.checking : copy.checkAvailability}
            </button>

            {checkedSelection === selectionKey && availability?.available && availability.rooms_left === 1 && (
              <div className="mt-5 flex items-center gap-3 border border-[#b9964f]/45 bg-[#efe2c5] p-4 text-[#745b2e]">
                <Flame className="h-5 w-5" /> <strong>{copy.oneRoom}</strong>
              </div>
            )}
            {checkedSelection === selectionKey && availability && (
              <div className={`mt-5 flex items-center gap-3 border p-4 text-sm ${availability.available ? "border-[#8ea99a]/45 bg-[#e5eee7] text-[#40564a]" : "border-[#c69292]/45 bg-[#f2dfdc] text-[#744740]"}`}>
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                {availability.available
                  ? `${roomLabel} ${copy.available} · ${availability.rooms_left ?? ""} ${availability.rooms_left === 1 ? copy.room : copy.rooms} ${copy.roomsLeft}`
                  : copy.soldOut}
              </div>
            )}
            {checkedSelection === selectionKey && availability?.available === false && <AvailabilityAlertButton
              key={[propertyName, roomType, checkIn, checkOut].join('|')} light
              selection={{ propertyName, roomType, checkIn, checkOut, rooms: 1 }} />}
          </div>

          <div className="p-6 md:p-9">
            <div className="mb-7 flex items-start gap-4">
              <span className="font-display text-2xl italic text-[#9c7d3d]">02</span>
              <div>
                <h2 className="font-display text-3xl">{copy.detailsTitle}</h2>
                <p className="mt-1 text-sm text-[#6a767a]">{copy.detailsBody}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="premium-label">
                <span>{copy.fullName}</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={copy.fullNamePlaceholder} className="premium-control" />
              </label>
              <label className="premium-label">
                <span>{copy.email}</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@email.com" type="email" className="premium-control" />
              </label>
              <label className="premium-label">
                <span>{copy.phone}</span>
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={copy.phonePlaceholder} className="premium-control" />
              </label>
            </div>

            {!packageName && (
              <label className="premium-label mt-5">
                <span>{copy.requests}</span>
                <textarea
                  value={specialRequests}
                  onChange={(event) => setSpecialRequests(event.target.value)}
                  rows={4}
                  placeholder={copy.requestsPlaceholder}
                  className="premium-control resize-y"
                />
              </label>
            )}

            {status && <div className="mt-5 border border-[#c4b89f] bg-[#eee5d4] p-4 text-sm text-[#5e625f]">{status}</div>}
          </div>
        </form>

        <aside className="border border-[#c9a86a]/35 bg-[#071922] p-7 text-white shadow-2xl lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">{copy.journey}</p>
            <Sparkles className="h-5 w-5 text-[#d9bd7b]" />
          </div>
          <h2 className="font-display mt-4 text-3xl leading-tight">{packageName || propertyName}</h2>
          <p className="mt-2 flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/40">
            <MapPin className="h-3.5 w-3.5 text-[#c9a86a]" /> {location}
          </p>

          <div className="mt-7 space-y-3 border-y border-white/10 py-6 text-sm text-white/60">
            <p className="flex items-center justify-between gap-4"><span>{copy.roomType}</span><strong className="text-right text-white">{roomLabel}</strong></p>
            <p className="flex items-center justify-between gap-4"><span>{copy.stay}</span><strong className="text-white">{nights ? `${nights} ${nights === 1 ? copy.night : copy.nights}` : copy.selectDates}</strong></p>
            <p className="flex items-center justify-between gap-4"><span>{copy.dining}</span><strong className="text-right text-white">{mealDisplay(mealPlan)}</strong></p>
            {nightlyRate > 0 && <p className="flex items-center justify-between gap-4"><span>{copy.nightlyRate}</span><strong className="text-white">USD {nightlyRate}</strong></p>}
            {activeSeason && <p className="flex items-center justify-between gap-4"><span>{copy.ratePeriod}</span><strong className="text-right text-[#d9bd7b]">{activeSeason.name}</strong></p>}
          </div>

          <div className="py-6">
            <p className="text-[10px] uppercase tracking-[.2em] text-white/35">{copy.estimatedTotal}</p>
            <p className="font-display mt-2 text-5xl text-[#d9bd7b]">USD {estimatedTotal || 0}</p>
            {speedboatSeats > 0 && (
              <p className="mt-3 flex items-center gap-2 text-xs text-white/45">
                <Ship className="h-4 w-4 text-[#c9a86a]" /> {speedboatSeats} {copy.speedboatIncluded}
              </p>
            )}
          </div>

          <button type="button" onClick={sendBooking} disabled={sending} className="btn-gold w-full disabled:opacity-60">
            {sending ? copy.preparing : copy.requestStay} <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-6 space-y-4 border-t border-white/10 pt-6 text-xs leading-5 text-white/40">
            <p className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" /> {copy.noCharge}</p>
            <p className="flex gap-3"><Headphones className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" /> {copy.needHelp}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
