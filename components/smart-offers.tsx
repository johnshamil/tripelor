"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Flame, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { translations, type ProfessionalLocale } from "@/lib/professional-translations";

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

export default function SmartOffers({ locale = "en" }: { locale?: ProfessionalLocale }) {
  const copy = translations[locale].offers;
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
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 className="section-title mt-4">{copy.title}</h2>
            <p className="mt-5 max-w-md leading-7 text-white/50">
              {copy.body}
            </p>
            <Link href="/island-adventures" className="luxury-link mt-8">
              {copy.allPackages} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {scarce && (
              <Link
                href={`/booking?property=${encodeURIComponent(scarce.name)}&checkIn=${today}&checkOut=${tomorrow}`}
                className="offer-card group"
              >
                <Flame className="h-6 w-6 text-[#d9bd7b]" />
                <p className="offer-tag mt-8">{copy.live}</p>
                <h3 className="font-display mt-3 text-3xl">{copy.oneLeft}</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">{scarce.name}</p>
                <span className="luxury-link mt-7">{copy.viewRoom} <ArrowRight className="h-4 w-4" /></span>
              </Link>
            )}

            <Link href="/island-adventures?duration=5" className="offer-card group">
              <CalendarDays className="h-6 w-6 text-[#d9bd7b]" />
              <p className="offer-tag mt-8">{copy.fiveNight}</p>
              <h3 className="font-display mt-3 text-3xl">{copy.moreTime}</h3>
              <p className="mt-3 text-sm leading-6 text-white/45">
                {copy.moreTimeBody}
              </p>
              <span className="luxury-link mt-7">{copy.exploreJourney} <ArrowRight className="h-4 w-4" /></span>
            </Link>

            <Link href="/island-adventures?duration=5" className="offer-card group">
              <Heart className="h-6 w-6 text-[#d9bd7b]" />
              <p className="offer-tag mt-8">{copy.forTwo}</p>
              <h3 className="font-display mt-3 text-3xl">{copy.romantic}</h3>
              <p className="mt-3 text-sm leading-6 text-white/45">
                {copy.romanticBody}
              </p>
              <span className="luxury-link mt-7">{copy.couples} <ArrowRight className="h-4 w-4" /></span>
            </Link>

            {lastMinute && (
              <Link
                href={`/booking?property=${encodeURIComponent(lastMinute.name)}&checkIn=${today}&checkOut=${lastMinuteEnd}`}
                className="offer-card group"
              >
                <Clock3 className="h-6 w-6 text-[#d9bd7b]" />
                <p className="offer-tag mt-8">{copy.thisWeek}</p>
                <h3 className="font-display mt-3 text-3xl">{copy.sooner}</h3>
                <p className="mt-3 text-sm leading-6 text-white/45">
                  {lastMinute.name} {copy.available}
                </p>
                <span className="luxury-link mt-7">{copy.checkDates} <ArrowRight className="h-4 w-4" /></span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
