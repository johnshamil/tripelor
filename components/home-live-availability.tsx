"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Search } from "lucide-react";
import { useEffect, useState } from "react";

const properties = [
  { name: "Uhoo's Lavish Oasis", rooms: ["ROOM 101", "ROOM 102"] },
  {
    name: "Masfalhi View Inn",
    rooms: ["ROOM 101", "ROOM 102", "ROOM 103", "ROOM 104", "ROOM 105", "ROOM 106"],
  },
];

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

export default function HomeLiveAvailability() {
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const [checkIn, setCheckIn] = useState(formatDate(today));
  const [checkOut, setCheckOut] = useState(formatDate(tomorrow));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  async function check() {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    setLoading(true);
    const nextCounts: Record<string, number> = {};

    for (const property of properties) {
      const availability = await Promise.all(
        property.rooms.map(async (room) => {
          try {
            const response = await fetch("/api/availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                propertyName: property.name,
                roomType: room,
                checkIn,
                checkOut,
                rooms: 1,
              }),
            });
            const data = await response.json();
            return response.ok && data.available !== false;
          } catch {
            return false;
          }
        }),
      );
      nextCounts[property.name] = availability.filter(Boolean).length;
    }

    setCounts(nextCounts);
    setLoading(false);
  }

  useEffect(() => {
    check();
  }, []);

  return (
    <section className="availability-shell">
      <div className="container">
        <div className="availability-panel p-5 md:p-7 lg:p-8">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live availability
              </p>
              <h2 className="font-display mt-2 text-2xl text-white md:text-3xl">Find your island dates.</h2>
            </div>
            <p className="max-w-md text-xs leading-5 text-white/40">
              Select your travel dates to see available rooms before creating your booking.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_.8fr_auto_1.25fr_1.25fr] lg:items-end">
            <label className="field-label">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-[#c9a86a]" /> Check-in
              </span>
              <input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="date-field"
              />
            </label>
            <label className="field-label">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-[#c9a86a]" /> Check-out
              </span>
              <input
                type="date"
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                className="date-field"
              />
            </label>
            <button
              onClick={check}
              disabled={loading || checkOut <= checkIn}
              className="btn-gold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Search className="h-4 w-4" /> {loading ? "Checking" : "Check Dates"}
            </button>

            {properties.map((property) => {
              const count = counts[property.name];
              return (
                <div key={property.name} className="availability-result">
                  <p className="truncate text-[10px] uppercase tracking-[.16em] text-white/40">{property.name}</p>
                  <p className={`mt-2 text-sm font-semibold ${count === 0 ? "text-red-300" : "text-[#e3ca91]"}`}>
                    {count === undefined
                      ? "Checking rooms…"
                      : count === 0
                        ? "Unavailable for these dates"
                        : count === 1
                          ? "Only 1 room available"
                          : `${count} rooms available`}
                  </p>
                  <Link
                    href={`/booking?property=${encodeURIComponent(property.name)}&mealPlan=Bed%20%26%20Breakfast&checkIn=${checkIn}&checkOut=${checkOut}`}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-white/65 transition hover:text-[#d9bd7b]"
                  >
                    {count === 0 ? "Try other dates" : "Reserve"} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
