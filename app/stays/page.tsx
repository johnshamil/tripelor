import Link from "next/link";
import { ArrowRight, BedDouble, MapPin, ShieldCheck, Sparkles, Clock3, CheckCircle2 } from "lucide-react";
import { properties } from "@/lib/properties";
import { publishedProperties } from "@/lib/property-store";

export default async function StaysPage() {
  const managed = await publishedProperties();
  const managedCards = managed.map((property) => {
    const rates = property.rooms
      .filter((room, index, all) => all.findIndex((candidate) => candidate.mealPlan === room.mealPlan) === index)
      .slice(0, 3)
      .map((room) => ({ label: room.mealPlan, price: room.sellingRate }));
    const seasonalRate = property.seasonalRates.find((rate) => rate.sellingRate > 0);
    if (seasonalRate) rates.push({ label: `${seasonalRate.name} · ${seasonalRate.mealPlan}`, price: seasonalRate.sellingRate });
    return {
      name: property.name,
      slug: property.slug,
      location: property.island,
      images: property.photos.map((photo) => `/api/property-photo/${photo}`),
      description: property.description,
      startingFrom: Math.min(...property.rooms.map((room) => room.sellingRate), ...property.seasonalRates.map((rate) => rate.sellingRate)),
      currency: "USD" as const,
      bookingMode: "request" as const,
      roomsLabel: `${property.rooms.length} room type${property.rooms.length === 1 ? "" : "s"}`,
      rates,
    };
  });
  const allProperties = [...properties, ...managedCards];
  return <main className="bg-[#f1ebdf] text-[#071922] pb-24 md:pb-0">
    <section className="relative min-h-[50vh] overflow-hidden">
      <img src="/properties/rivethi-beach-hotel/0584s12000ssx9b685F06_W_1280_853_R5.webp" alt="Maldives stays" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#041117]/95 via-[#041117]/70 to-[#041117]/25" />
      <div className="container relative z-10 flex min-h-[50vh] items-end pb-14 pt-28"><div className="max-w-3xl"><p className="eyebrow text-[#ead7aa]">The Tripelor collection</p><h1 className="font-display mt-4 text-5xl leading-tight text-white md:text-7xl">Choose your stay.<span className="block italic text-[#d9bd7b]">We make the rest easy.</span></h1><p className="mt-5 max-w-2xl leading-7 text-white/65">Compare selected Maldives stays, open the rooms you love and send a booking request in just a few taps. Your reservation is confirmed only after Tripelor sends final confirmation.</p></div></div>
    </section>

    <section><div className="container py-14 md:py-20">
      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-3 gap-2 text-center text-xs md:text-sm"><div className="border border-[#d0c5b0] bg-[#f8f4ec] p-3"><b className="block text-[#8d7037]">01</b>Choose stay</div><div className="border border-[#d0c5b0] bg-[#f8f4ec] p-3"><b className="block text-[#8d7037]">02</b>View rooms</div><div className="border border-[#d0c5b0] bg-[#f8f4ec] p-3"><b className="block text-[#8d7037]">03</b>Select dates & book</div></div>
      <div className="space-y-7">{allProperties.map((property,index)=>{const instant=property.bookingMode==="instant";const bookingHref=instant||managed.some((item)=>item.slug===property.slug)?`/booking?property=${encodeURIComponent(property.name)}`:property.slug==="rivethi-beach-hotel"?"/booking/rivethi":`/stays/${property.slug}`;return <article key={property.slug} className="group overflow-hidden border border-[#d0c5b0] bg-[#f8f4ec] shadow-[0_22px_70px_rgba(34,43,46,.09)]"><div className="grid lg:grid-cols-[.82fr_1.18fr]">
        <Link href={`/stays/${property.slug}`} className="relative min-h-[320px] overflow-hidden lg:min-h-[450px]"><img src={property.images[0]} alt={property.name} className="absolute inset-0 h-full w-full object-cover transition duration-1000 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#041117]/75 via-transparent to-transparent"/><div className={`absolute left-5 top-5 flex items-center gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.15em] backdrop-blur-md ${instant?"bg-emerald-950/80 text-emerald-200":"bg-[#041117]/80 text-[#ead7aa]"}`}>{instant?<CheckCircle2 className="h-3.5 w-3.5"/>:<Clock3 className="h-3.5 w-3.5"/>}{instant?"Live availability":"Request availability"}</div><p className="absolute bottom-5 left-5 flex items-center gap-2 text-xs uppercase tracking-[.14em] text-white/85"><MapPin className="h-4 w-4 text-[#d9bd7b]"/>{property.location}</p></Link>
        <div className="flex flex-col p-7 md:p-10 lg:p-12"><div className="flex items-start justify-between gap-5"><div><p className="font-display text-xl italic text-[#9c7d3d]">{String(index+1).padStart(2,"0")}</p><h2 className="font-display mt-2 text-4xl leading-tight md:text-5xl">{property.name}</h2></div><div className="shrink-0 text-right"><p className="text-[10px] uppercase tracking-[.18em] text-[#7b8588]">From</p><p className="font-display mt-1 text-3xl text-[#8d7037]">${property.startingFrom}</p><p className="text-[10px] text-[#7b8588]">USD / night</p></div></div>
        <p className="mt-5 max-w-2xl leading-7 text-[#58656c]">{property.description}</p><div className="mt-6 flex flex-wrap gap-3 text-xs text-[#53616a]"><span className="flex items-center gap-2 border border-[#d0c5b0] px-3 py-2"><BedDouble className="h-4 w-4 text-[#9c7d3d]"/>{property.roomsLabel}</span><span className="flex items-center gap-2 border border-[#d0c5b0] px-3 py-2"><ShieldCheck className="h-4 w-4 text-[#9c7d3d]"/>Tripelor support</span></div>
        <div className="mt-7 flex flex-wrap gap-2">{property.rates.slice(0,3).map((rate,i)=><span key={`${rate.label}-${i}`} className="border border-[#d0c5b0] bg-[#f1ebdf] px-3 py-2 text-xs text-[#58656c]">{rate.label} <b className="ml-1 text-[#8d7037]">${rate.price}</b></span>)}</div>
        <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2"><Link href={`/stays/${property.slug}`} className="btn-outline justify-center border-[#9c7d3d] text-[#745b2e]">View Rooms & Photos <ArrowRight className="h-4 w-4"/></Link><Link href={bookingHref} className="btn-gold justify-center">{instant?"Request to Book":"Check Availability"}</Link></div>
      </div></div></article>})}</div>
      <div className="mt-10 border border-[#d0c5b0] bg-[#f8f4ec] p-6 text-center"><Sparkles className="mx-auto h-5 w-5 text-[#9c7d3d]"/><p className="mt-2 text-sm text-[#58656c]">Need help choosing? Tripelor can help you match the right stay, room, meal plan and transfer.</p></div>
    </div></section>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#041117]/95 p-3 backdrop-blur-xl md:hidden"><Link href="/booking" className="btn-gold w-full justify-center">Request to Book</Link></div>
  </main>;
}
