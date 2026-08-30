"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Flame, Heart } from "lucide-react";
import { useEffect, useState } from "react";

const hotels = [
  { name: "Uhoo's Lavish Oasis", rooms: ["ROOM 101", "ROOM 102"] },
  {
    name: "Masfalhi View Inn",
    rooms: ["ROOM 101", "ROOM 102", "ROOM 103", "ROOM 104", "ROOM 105", "ROOM 106"],
  },
];

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export default function SmartOffers() {
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const today = formatDate(new Date());
  const tomorrow = addDays(1);
  const lastMinuteEnd = addDays(3);

  useEffect(() => {
    (async () => {
      const nextAvailability: Record<string, number> = {};
      for (const hotel of hotels) {
        const availableRooms = await Promise.all(
          hotel.rooms.map(async (room) => {
            try {
              const response = await fetch("/api/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  propertyName: hotel.name,
                  roomType: room,
                  checkIn: today,
                  checkOut: tomorrow,
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
        nextAvailability[hotel.name] = availableRooms.filter(Boolean).length;
      }
      setAvailability(nextAvailability);
    })();
  }, []);

  const scarce = hotels.find((hotel) => availability[hotel.name] === 1);
  const lastMinute = hotels.find((hotel) => (availability[hotel.name] ?? 0) > 0);

  return (
    <section className="border-y border-white/10 bg-[#06151c]">
      <div className="container py-24">
        <div className="grid gap-8 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="eyebrow">Timely escapes</p>
            <h2 className="section-title mt-4">A beautiful reason to stay longer.</h2>
            <p className="mt-5 max-w-md leading-7 text-white/50">
              Thoughtful packages and current availability, presented clearly so you can choose with confidence.
            </p>
            <Link href="/island-adventures" className="luxury-link mt-8">
              Explore All Packages <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {scarce && (
              <Link
                href={`/booking?property=${encodeURIComponent(scarce.name)}&checkIn=${today}&checkOut=${tomorrow}`}
                className="offer-card group"
              >
                <Flame className="h-6 w-6 text-[#d9bd7b]" />
                <p className="offer-tag mt-8">Live availability</p>
                <h3 className="font-display mt-3 text-3xl">Only one room left tonight.</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">{scarce.name}</p>
                <span className="luxury-link mt-7">View Room <ArrowRight className="h-4 w-4" /></span>
              </Link>
            )}

            <Link href="/island-adventures?duration=5" className="offer-card group">
              <CalendarDays className="h-6 w-6 text-[#d9bd7b]" />
              <p className="offer-tag mt-8">Five-night journey</p>
              <h3 className="font-display mt-3 text-3xl">More time for the Maldives.</h3>
              <p className="mt-3 text-sm leading-6 text-white/45">
                A longer island stay with more room for ocean experiences.
              </p>
              <span className="luxury-link mt-7">Explore Journey <ArrowRight className="h-4 w-4" /></span>
            </Link>

            <Link href="/island-adventures?duration=5" className="offer-card group">
              <Heart className="h-6 w-6 text-[#d9bd7b]" />
              <p className="offer-tag mt-8">For two</p>
              <h3 className="font-display mt-3 text-3xl">A romantic island escape.</h3>
              <p className="mt-3 text-sm leading-6 text-white/45">
                Sunset moments, island stays and memorable dinners for two.
              </p>
              <span className="luxury-link mt-7">Explore Couples Trips <ArrowRight className="h-4 w-4" /></span>
            </Link>

            {lastMinute && (
              <Link
                href={`/booking?property=${encodeURIComponent(lastMinute.name)}&checkIn=${today}&checkOut=${lastMinuteEnd}`}
                className="offer-card group"
              >
                <Clock3 className="h-6 w-6 text-[#d9bd7b]" />
                <p className="offer-tag mt-8">This week</p>
                <h3 className="font-display mt-3 text-3xl">The Maldives, sooner.</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  {lastMinute.name} currently has rooms available.
                </p>
                <span className="luxury-link mt-7">Check Dates <ArrowRight className="h-4 w-4" /></span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
