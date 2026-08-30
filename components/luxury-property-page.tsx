"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Check,
  Compass,
  Headphones,
  MapPin,
  MessageCircle,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import { useState } from "react";

type Highlight = {
  icon: "shield" | "support" | "transfer" | "airport" | "dining" | "island";
  title: string;
  text: string;
};

type Rate = {
  name: string;
  price: number;
  detail: string;
  bookingHref: string;
};

type Room = {
  name: string;
  image: string;
  description: string;
  details: string[];
  href?: string;
  bookingHref: string;
};

type Term = { title: string; text: string };

const icons = {
  shield: ShieldCheck,
  support: Headphones,
  transfer: Ship,
  airport: Plane,
  dining: Utensils,
  island: Waves,
};

export default function LuxuryPropertyPage({
  eyebrow,
  name,
  location,
  description,
  photos,
  startingFrom,
  bookingHref,
  highlights,
  rates,
  rooms = [],
  terms = [],
  videos = [],
}: {
  eyebrow: string;
  name: string;
  location: string;
  description: string;
  photos: string[];
  startingFrom: number;
  bookingHref: string;
  highlights: Highlight[];
  rates: Rate[];
  rooms?: Room[];
  terms?: Term[];
  videos?: string[];
}) {
  const [activePhoto, setActivePhoto] = useState(photos[0]);
  const conciergeMessage = encodeURIComponent(
    `Hello Tripelor, I would like help planning a stay at ${name}.`,
  );

  return (
    <>
      <section className="property-cinematic-hero">
        <img key={activePhoto} src={activePhoto} alt={name} className="property-cinematic-image" />
        <div className="property-cinematic-shade" />
        <div className="container relative z-10 flex min-h-[78vh] flex-col justify-end pb-10 pt-28 md:pb-14">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 border border-[#d9bd7b]/45 bg-[#041117]/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#ead7aa] backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" /> Selected by Tripelor
            </span>
            <p className="eyebrow mt-7 text-[#ead7aa]">{eyebrow}</p>
            <h1 className="font-display mt-4 text-5xl leading-[.98] text-white md:text-7xl lg:text-[5.5rem]">
              {name}
            </h1>
            <p className="mt-5 flex items-center gap-2 text-sm uppercase tracking-[.16em] text-white/65">
              <MapPin className="h-4 w-4 text-[#d9bd7b]" /> {location}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={bookingHref} className="btn-gold">
                Reserve Your Stay <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={`https://wa.me/9609429403?text=${conciergeMessage}`}
                target="_blank"
                rel="noreferrer"
                className="btn-outline border-white/40 text-white"
              >
                <MessageCircle className="h-4 w-4" /> Ask a Concierge
              </a>
            </div>
          </div>

          <div className="mt-10 flex gap-3 overflow-x-auto pb-2">
            {photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                onClick={() => setActivePhoto(photo)}
                className={`relative h-20 w-28 shrink-0 overflow-hidden border transition md:h-24 md:w-36 ${
                  activePhoto === photo ? "border-[#d9bd7b]" : "border-white/25 opacity-70 hover:opacity-100"
                }`}
                aria-label={`View ${name} photo ${index + 1}`}
              >
                <img src={photo} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-20 md:py-24">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
            <div>
              <p className="eyebrow text-[#8d7037]">The experience</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
                Stay beautifully,
                <span className="block italic text-[#9c7d3d]">from arrival to departure.</span>
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] md:grid-cols-3">
              {highlights.map((highlight) => {
                const Icon = icons[highlight.icon];
                return (
                  <article key={highlight.title} className="bg-[#f8f4ec] p-7">
                    <Icon className="h-6 w-6 text-[#9c7d3d]" />
                    <h3 className="font-display mt-8 text-2xl">{highlight.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#58656c]">{highlight.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {rooms.length > 0 && (
        <section className="section-shell">
          <div className="container py-20 md:py-24">
            <div className="flex flex-col gap-5 border-b border-white/10 pb-9 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow">Rooms & spaces</p>
                <h2 className="section-title mt-4">Choose your place to unwind.</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-white/45">
                Every option includes clear rates, live date checking and personal Tripelor support.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {rooms.map((room) => (
                <article key={room.name} className="group overflow-hidden border border-white/10 bg-white/[.025]">
                  <div className="relative h-72 overflow-hidden md:h-80">
                    <img src={room.image} alt={room.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#041117] via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="text-[10px] uppercase tracking-[.22em] text-[#d9bd7b]">Available room</p>
                      <h3 className="font-display mt-2 text-4xl text-white">{room.name}</h3>
                    </div>
                  </div>
                  <div className="p-6 md:p-7">
                    <p className="leading-7 text-white/55">{room.description}</p>
                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      {room.details.map((detail) => (
                        <p key={detail} className="flex items-center gap-2 text-sm text-white/65">
                          <Check className="h-4 w-4 text-[#c9a86a]" /> {detail}
                        </p>
                      ))}
                    </div>
                    <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
                      {room.href && (
                        <Link href={room.href} className="btn-outline">
                          View Details
                        </Link>
                      )}
                      <Link href={room.bookingHref} className="btn-gold">
                        Select {room.name}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-[#06151c]">
        <div className="container grid gap-10 py-20 md:py-24 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="eyebrow">Stay options</p>
            <h2 className="section-title mt-4">Choose how you would like to stay.</h2>
            <div className="mt-9 grid gap-4 md:grid-cols-2">
              {rates.map((rate) => (
                <Link key={`${rate.name}-${rate.price}`} href={rate.bookingHref} className="group border border-white/10 bg-white/[.025] p-6 transition hover:border-[#c9a86a]/45 hover:bg-white/[.045]">
                  <div className="flex items-start justify-between gap-4">
                    <Utensils className="h-5 w-5 text-[#c9a86a]" />
                    <ArrowUpRight className="h-4 w-4 text-white/30 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#d9bd7b]" />
                  </div>
                  <h3 className="font-display mt-7 text-2xl text-white">{rate.name}</h3>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-white/45">{rate.detail}</p>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <span className="text-xs uppercase tracking-[.16em] text-white/35">From </span>
                    <span className="font-display text-3xl text-[#d9bd7b]">USD {rate.price}</span>
                    <span className="text-xs text-white/35"> / night</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <aside className="h-fit border border-[#c9a86a]/30 bg-[#0a222b] p-7 shadow-2xl lg:sticky lg:top-24">
            <p className="eyebrow">Your private escape</p>
            <h3 className="font-display mt-4 text-3xl text-white">{name}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/45">
              <MapPin className="h-4 w-4 text-[#c9a86a]" /> {location}
            </p>
            <div className="mt-7 border-y border-white/10 py-6">
              <p className="text-[10px] uppercase tracking-[.2em] text-white/35">Rates from</p>
              <p className="font-display mt-2 text-5xl text-[#d9bd7b]">USD {startingFrom}</p>
              <p className="mt-1 text-xs text-white/35">per room, per night</p>
            </div>
            <Link href={bookingHref} className="btn-gold mt-7 w-full">
              Reserve Your Stay <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={`https://wa.me/9609429403?text=${conciergeMessage}`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline mt-3 w-full"
            >
              Ask a Concierge
            </a>
            <p className="mt-5 text-center text-xs leading-5 text-white/35">
              No automatic charge. Tripelor reviews your request before confirmation.
            </p>
          </aside>
        </div>
      </section>

      {terms.length > 0 && (
        <section className="bg-[#f1ebdf] text-[#071922]">
          <div className="container py-16 md:py-20">
            <div className="grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] md:grid-cols-2">
              {terms.map((term) => (
                <article key={term.title} className="bg-[#f8f4ec] p-7 md:p-9">
                  <Compass className="h-5 w-5 text-[#9c7d3d]" />
                  <h3 className="font-display mt-5 text-2xl">{term.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#58656c]">{term.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="section-shell">
          <div className="container py-20 md:py-24">
            <p className="eyebrow">A closer look</p>
            <h2 className="section-title mt-4">See the stay before you arrive.</h2>
            <div className="mt-9 grid gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <video key={video} controls playsInline className="w-full border border-white/10 bg-black shadow-2xl" src={video} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
