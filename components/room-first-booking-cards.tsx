"use client";

import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Check,
  Coffee,
  MapPin,
  Sparkles,
  Users,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";

type FilterKey = "all" | "instant" | "under100" | "sea";

type RoomCard = {
  id: string;
  roomName: string;
  roomType: string;
  property: string;
  propertySlug: string;
  location: string;
  image: string;
  price: number;
  mealPlan: string;
  bookingMode: "instant" | "request";
  maxGuests: number;
  highlights: string[];
  seaView?: boolean;
};

const rooms: RoomCard[] = [
  {
    id: "uhoo-101",
    roomName: "Room 101",
    roomType: "ROOM 101",
    property: "Uhoo's Lavish Oasis",
    propertySlug: "uhoos-lavish-oasis",
    location: "V. Felidhoo, Maldives",
    image: "/properties/uhoos-lavish-oasis/20250517_193323.jpg",
    price: 85,
    mealPlan: "Bed & Breakfast",
    bookingMode: "instant",
    maxGuests: 2,
    highlights: ["Local-island stay", "Breakfast included", "Tripelor support"],
  },
  {
    id: "uhoo-102",
    roomName: "Room 102",
    roomType: "ROOM 102",
    property: "Uhoo's Lavish Oasis",
    propertySlug: "uhoos-lavish-oasis",
    location: "V. Felidhoo, Maldives",
    image: "/properties/uhoos-lavish-oasis/20250518_001256.jpg",
    price: 85,
    mealPlan: "Bed & Breakfast",
    bookingMode: "instant",
    maxGuests: 2,
    highlights: ["Local-island stay", "Breakfast included", "Tripelor support"],
  },
  {
    id: "masfalhi-101",
    roomName: "Guest Room",
    roomType: "ROOM 101",
    property: "Masfalhi View Inn",
    propertySlug: "masfalhi-view-inn",
    location: "Maldives",
    image: "/images%20(3).jpeg",
    price: 97,
    mealPlan: "Bed & Breakfast",
    bookingMode: "instant",
    maxGuests: 2,
    highlights: ["Flexible meal plans", "Breakfast included", "Instant booking"],
  },
  {
    id: "rivethi-double",
    roomName: "Deluxe Double",
    roomType: "Deluxe Double",
    property: "Rivethi Beach Hotel",
    propertySlug: "rivethi-beach-hotel",
    location: "Hulhumalé, Maldives",
    image: "/properties/rivethi-beach-hotel/1719713475.jpeg",
    price: 85,
    mealPlan: "Room Only",
    bookingMode: "request",
    maxGuests: 2,
    highlights: ["Beachfront hotel", "Near the airport", "Double room"],
  },
  {
    id: "rivethi-twin",
    roomName: "Deluxe Twin",
    roomType: "Deluxe Twin",
    property: "Rivethi Beach Hotel",
    propertySlug: "rivethi-beach-hotel",
    location: "Hulhumalé, Maldives",
    image: "/properties/rivethi-beach-hotel/604895445.jpg",
    price: 85,
    mealPlan: "Room Only",
    bookingMode: "request",
    maxGuests: 2,
    highlights: ["Beachfront hotel", "Near the airport", "Twin beds"],
  },
  {
    id: "rivethi-sea-view",
    roomName: "Deluxe Double Sea View",
    roomType: "Deluxe Double Sea View",
    property: "Rivethi Beach Hotel",
    propertySlug: "rivethi-beach-hotel",
    location: "Hulhumalé, Maldives",
    image: "/properties/rivethi-beach-hotel/816271360.jpg",
    price: 130,
    mealPlan: "Bed & Breakfast",
    bookingMode: "request",
    maxGuests: 2,
    highlights: ["Sea view", "Breakfast included", "Near the airport"],
    seaView: true,
  },
];

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All rooms" },
  { key: "instant", label: "Instant booking" },
  { key: "under100", label: "Under $100" },
  { key: "sea", label: "Sea view" },
];

function bookingHref(room: RoomCard) {
  const params = new URLSearchParams({
    property: room.property,
    roomType: room.roomType,
    mealPlan: room.mealPlan,
  });
  return `/booking?${params.toString()}`;
}

export default function RoomFirstBookingCards() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const visibleRooms = useMemo(() => {
    if (filter === "instant") return rooms.filter((room) => room.bookingMode === "instant");
    if (filter === "under100") return rooms.filter((room) => room.price < 100);
    if (filter === "sea") return rooms.filter((room) => room.seaView);
    return rooms;
  }, [filter]);

  return (
    <section className="bg-[#f1ebdf] text-[#071922]">
      <div className="container py-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="eyebrow text-[#8d7037]">Choose the room first</p>
            <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
              Find the room that feels right.
            </h2>
            <p className="mt-5 max-w-2xl leading-7 text-[#53616a]">
              Start with the room itself, compare the stay details at a glance, then continue to booking with your selection already prepared.
            </p>
          </div>
          <Link
            href="/stays"
            className="inline-flex h-fit items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#6f5729] transition hover:text-[#071922]"
          >
            Explore every stay <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mobile-filter-row mt-8 flex gap-2 overflow-x-auto pb-2 md:mt-9">
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[.1em] transition ${
                  active
                    ? "border-[#9c7d3d] bg-[#9c7d3d] text-white"
                    : "border-[#cfc4af] bg-[#f8f4ec] text-[#5c6670] hover:border-[#9c7d3d] hover:text-[#6f5729]"
                }`}
              >
                {active && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="room-card-rail mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:mt-8 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
          {visibleRooms.map((room) => (
            <article
              key={room.id}
              className="room-card-mobile group min-w-[86vw] snap-start overflow-hidden rounded-[1.5rem] border border-[#d5cab7] bg-[#faf7f1] shadow-[0_18px_55px_rgba(35,31,24,.08)] transition duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_70px_rgba(35,31,24,.14)] md:min-w-0 md:rounded-[1.75rem]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#d8d0c2]">
                <img
                  src={room.image}
                  alt={`${room.roomName} at ${room.property}`}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/5" />
                <div className="absolute left-3 top-3 flex flex-wrap gap-2 md:left-4 md:top-4">
                  <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.11em] text-white backdrop-blur-md md:text-[10px] md:tracking-[.13em]">
                    {room.bookingMode === "instant" ? "Instant booking" : "Request to book"}
                  </span>
                  {room.seaView && (
                    <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.11em] text-white backdrop-blur-md md:text-[10px] md:tracking-[.13em]">
                      Sea view
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white md:p-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.16em] text-white/70">From</p>
                    <p className="font-display text-3xl">${room.price}</p>
                    <p className="text-[11px] text-white/65">per night</p>
                  </div>
                  <div className="max-w-[46%] rounded-full border border-white/30 bg-black/20 px-3 py-2 text-center text-[9px] uppercase tracking-[.1em] backdrop-blur-md md:text-[10px] md:tracking-[.14em]">
                    Tripelor Points eligible
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-7">
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#8d7037] md:tracking-[.16em]">
                  <MapPin className="h-3.5 w-3.5" /> {room.location}
                </p>
                <h3 className="font-display mt-3 text-2xl leading-tight md:text-3xl">{room.roomName}</h3>
                <p className="mt-1 text-sm text-[#66727a]">{room.property}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 border-y border-[#ddd3c2] py-4 text-xs text-[#5c6670] md:mt-5">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-[#9c7d3d]" /> Up to {room.maxGuests}
                  </span>
                  <span className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 shrink-0 text-[#9c7d3d]" /> {room.mealPlan}
                  </span>
                </div>

                <div className="mt-4 space-y-2 md:mt-5 md:space-y-2.5">
                  {room.highlights.map((highlight, index) => (
                    <p key={highlight} className="flex items-center gap-2.5 text-sm text-[#59666e]">
                      {index === 0 && room.seaView ? (
                        <Waves className="h-4 w-4 shrink-0 text-[#9c7d3d]" />
                      ) : index === 0 ? (
                        <BedDouble className="h-4 w-4 shrink-0 text-[#9c7d3d]" />
                      ) : (
                        <Sparkles className="h-4 w-4 shrink-0 text-[#9c7d3d]" />
                      )}
                      {highlight}
                    </p>
                  ))}
                </div>

                <div className="touch-card-actions mt-6 grid grid-cols-2 gap-2.5 md:mt-7 md:gap-3">
                  <Link
                    href={`/stays/${room.propertySlug}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#bfb29c] px-3 py-3 text-[11px] font-semibold uppercase tracking-[.09em] text-[#4e5b63] transition hover:border-[#8d7037] hover:text-[#6f5729] md:px-4 md:text-xs md:tracking-[.11em]"
                  >
                    View stay
                  </Link>
                  <Link
                    href={bookingHref(room)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0b2731] px-3 py-3 text-[11px] font-semibold uppercase tracking-[.09em] text-white transition hover:bg-[#123743] md:px-4 md:text-xs md:tracking-[.11em]"
                  >
                    {room.bookingMode === "instant" ? "Book room" : "Select room"}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-2 text-center text-xs text-[#7a817f] md:hidden">
          Swipe to compare more rooms
        </p>
      </div>
    </section>
  );
}
