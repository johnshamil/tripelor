import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { properties } from "@/lib/properties";

export default function StaysPage() {
  return (
    <>
      <section className="relative min-h-[56vh] overflow-hidden">
        <img
          src="/properties/rivethi-beach-hotel/0584s12000ssx9b685F06_W_1280_853_R5.webp"
          alt="A curated Maldives stay"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041117]/95 via-[#041117]/75 to-[#041117]/30" />
        <div className="container relative z-10 flex min-h-[56vh] items-end pb-16 pt-28">
          <div className="max-w-3xl">
            <p className="eyebrow text-[#ead7aa]">The Tripelor collection</p>
            <h1 className="font-display mt-4 text-5xl leading-tight text-white md:text-7xl">
              Stays chosen with
              <span className="block italic text-[#d9bd7b]">care and character.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">
              Compare our selected Maldives properties, room options and meal plans,
              then check live dates in one effortless journey.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-20 md:py-24">
          <div className="flex flex-col gap-5 border-b border-[#cabfa9] pb-9 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow text-[#8d7037]">Selected properties</p>
              <h2 className="font-display mt-4 text-4xl md:text-6xl">Find your perfect setting.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-[#58656c]">
              Every stay includes clear pricing, live availability and Tripelor support before and during your journey.
            </p>
          </div>

          <div className="mt-10 grid gap-7">
            {properties.map((property, index) => (
              <article key={property.slug} className="group overflow-hidden border border-[#d0c5b0] bg-[#f8f4ec] shadow-[0_22px_70px_rgba(34,43,46,.09)]">
                <div className="grid lg:grid-cols-[.82fr_1.18fr]">
                  <Link href={`/stays/${property.slug}`} className="relative min-h-[330px] overflow-hidden lg:min-h-[470px]">
                    <img
                      src={property.images[0]}
                      alt={property.name}
                      className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#041117]/70 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5 flex items-center gap-2 bg-[#041117]/75 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#ead7aa] backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" /> Selected by Tripelor
                    </div>
                    <p className="absolute bottom-5 left-5 flex items-center gap-2 text-xs uppercase tracking-[.16em] text-white/80">
                      <MapPin className="h-4 w-4 text-[#d9bd7b]" /> {property.location}
                    </p>
                  </Link>

                  <div className="flex flex-col p-7 md:p-10 lg:p-12">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="font-display text-xl italic text-[#9c7d3d]">{String(index + 1).padStart(2, "0")}</p>
                        <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">{property.name}</h2>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[10px] uppercase tracking-[.18em] text-[#7b8588]">From</p>
                        <p className="font-display mt-1 text-3xl text-[#8d7037]">${property.startingFrom}</p>
                        <p className="text-[10px] text-[#7b8588]">USD / night</p>
                      </div>
                    </div>

                    <p className="mt-6 max-w-2xl leading-7 text-[#58656c]">{property.description}</p>
                    <div className="mt-7 flex flex-wrap gap-3 text-xs text-[#53616a]">
                      <span className="flex items-center gap-2 border border-[#d0c5b0] px-3 py-2">
                        <BedDouble className="h-4 w-4 text-[#9c7d3d]" /> {property.roomsLabel}
                      </span>
                      <span className="flex items-center gap-2 border border-[#d0c5b0] px-3 py-2">
                        <ShieldCheck className="h-4 w-4 text-[#9c7d3d]" /> Live availability
                      </span>
                    </div>

                    <div className="mt-8 grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] sm:grid-cols-3">
                      {property.rates.slice(0, 3).map((rate) => (
                        <div key={`${rate.label}-${rate.note || ""}`} className="bg-[#f1ebdf] p-4">
                          <p className="text-[10px] uppercase tracking-[.12em] text-[#7b8588]">{rate.label}</p>
                          <p className="font-display mt-2 text-2xl text-[#8d7037]">USD {rate.price}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-8">
                      <Link href={`/stays/${property.slug}`} className="btn-outline border-[#9c7d3d] text-[#745b2e]">
                        Explore Property <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href={`/booking?property=${encodeURIComponent(property.name)}`} className="btn-gold">
                        Reserve a Stay
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
