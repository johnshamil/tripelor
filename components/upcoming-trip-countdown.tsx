"use client";

import Link from "next/link";
import {BellRing, CalendarDays, CheckCircle2, MapPin, Sparkles, WalletCards} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

type Trip = {
  booking_reference?: string;
  check_in?: string;
  check_out?: string;
  property_name?: string;
  room_type?: string;
  status?: string;
};

type Remaining = {days: number; hours: number; minutes: number; seconds: number};

const emptyRemaining: Remaining = {days: 0, hours: 0, minutes: 0, seconds: 0};

function getRemaining(checkIn?: string): Remaining {
  if (!checkIn) return emptyRemaining;
  const target = new Date(`${checkIn}T00:00:00+05:00`).getTime();
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1_000) % 60),
  };
}

function formatDate(value?: string) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function tripImage(propertyName?: string) {
  const name = String(propertyName || "").toLowerCase();
  if (name.includes("rivethi")) return "/properties/rivethi-beach-hotel/1719713475.jpeg";
  if (name.includes("masfalhi")) return "/images%20(3).jpeg";
  return "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
}

export default function UpcomingTripCountdown({trip, stage}: {trip: Trip; stage: string}) {
  const [remaining, setRemaining] = useState<Remaining>(() => getRemaining(trip.check_in));
  const image = useMemo(() => tripImage(trip.property_name), [trip.property_name]);

  useEffect(() => {
    if (stage !== "upcoming") return;
    const update = () => setRemaining(getRemaining(trip.check_in));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [stage, trip.check_in]);

  const counters = [
    [remaining.days, "Days"],
    [remaining.hours, "Hours"],
    [remaining.minutes, "Minutes"],
    [remaining.seconds, "Seconds"],
  ] as const;

  return (
    <div className="upcoming-trip-hero" style={{backgroundImage: `url('${image}')`}}>
      <div className="upcoming-trip-shade" />
      <div className="relative z-10 grid min-h-[520px] gap-10 p-6 md:p-10 lg:grid-cols-[1.2fr_.8fr] lg:items-end lg:p-12">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.32em] text-[#e3ca91]">
            <Sparkles className="h-4 w-4" /> Tripelor Private Journey
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-white/75">
            <MapPin className="h-4 w-4 text-[#e3ca91]" />
            {trip.property_name || "Your Maldives stay"}
          </div>
          <h2 className="font-display mt-3 max-w-3xl text-4xl leading-[1.02] text-white md:text-6xl">
            {stage === "staying" ? "Your island time has begun." : "Your Maldives escape is approaching."}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 md:text-base">
            {stage === "staying"
              ? "Everything you need for your stay is ready inside your Tripelor account."
              : "Your next chapter in the Maldives is getting closer, one beautiful moment at a time."}
          </p>

          {stage === "upcoming" ? (
            <div className="mt-8 grid max-w-2xl grid-cols-4 gap-2 md:gap-3" aria-label="Time remaining until check-in">
              {counters.map(([value, label]) => (
                <div key={label} className="countdown-tile">
                  <strong className="font-display block text-3xl font-normal tabular-nums text-white md:text-5xl">
                    {String(value).padStart(2, "0")}
                  </strong>
                  <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[.18em] text-[#e3ca91] md:text-[10px]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 inline-flex items-center gap-2 border border-emerald-300/30 bg-emerald-950/45 px-4 py-3 text-sm text-emerald-100 backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4" /> Currently staying
            </div>
          )}
        </div>

        <aside className="journey-ticket" aria-label="Upcoming trip summary">
          <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[.25em] text-[#e3ca91]">Confirmed Journey</p>
              <p className="mt-2 text-xl font-semibold text-white">{trip.room_type || "Tripelor stay"}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-300" />
          </div>
          <div className="grid grid-cols-2 gap-5 py-5">
            <div>
              <p className="text-[9px] uppercase tracking-[.2em] text-white/45">Arrival</p>
              <time className="mt-1 block text-sm font-semibold text-white" dateTime={trip.check_in}>{formatDate(trip.check_in)}</time>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[.2em] text-white/45">Departure</p>
              <time className="mt-1 block text-sm font-semibold text-white" dateTime={trip.check_out}>{formatDate(trip.check_out)}</time>
            </div>
          </div>
          {trip.booking_reference && (
            <div className="flex items-center justify-between border-y border-dashed border-white/15 py-3 text-xs">
              <span className="text-white/45">Booking reference</span>
              <span className="font-semibold tracking-[.12em] text-white">{trip.booking_reference}</span>
            </div>
          )}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/account/pre-arrival" className="btn-gold gap-2 px-4 py-2 text-[10px]">
              <BellRing className="h-4 w-4" /> Prepare My Arrival
            </Link>
            <Link href="/account/wallet" className="inline-flex items-center gap-2 px-1 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#e3ca91] transition hover:text-white">
              <WalletCards className="h-4 w-4" /> Travel Wallet
            </Link>
            <Link href="#my-bookings" className="inline-flex items-center gap-2 px-1 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-[#e3ca91] transition hover:text-white">
              <CalendarDays className="h-4 w-4" /> Journey details
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
