import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Globe2, ShieldCheck, Sparkles, MapPin, Utensils } from "lucide-react";

const destinations = [
  { name: "Maldives", text: "Crystal-clear lagoons, private islands, and unforgettable escapes.", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1400&auto=format&fit=crop" },
  { name: "Dubai", text: "Luxury, shopping, city lights, and world-class experiences.", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1400&auto=format&fit=crop" },
  { name: "Bali", text: "Tropical serenity, culture, wellness, and breathtaking nature.", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1400&auto=format&fit=crop" },
];

export default function Home() {
  return (
    <>
      <section className="relative min-h-[78vh] overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2200&auto=format&fit=crop" alt="Luxury tropical destination" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        <div className="container relative flex min-h-[78vh] items-center">
          <div className="max-w-3xl py-24">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-gold">Discover. Escape. Remember.</p>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl">Travel beautifully with <span className="text-gold">Tripelor</span></h1>
            <p className="mt-6 max-w-2xl text-lg text-gray-200">Curated holidays, romantic escapes, island getaways, and unforgettable journeys designed around you.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/tours" className="btn-gold">Explore Packages</Link><Link href="/contact" className="btn-outline">Plan My Trip</Link></div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div><p className="text-sm uppercase tracking-[0.3em] text-gold">Featured</p><h2 className="mt-2 text-4xl font-bold">Popular destinations</h2></div>
          <Link href="/destinations" className="hidden items-center gap-2 text-gold sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.map(d => <article key={d.name} className="card overflow-hidden"><div className="relative h-72"><Image src={d.image} alt={d.name} fill className="object-cover" /></div><div className="p-6"><h3 className="text-2xl font-semibold">{d.name}</h3><p className="mt-2 text-gray-400">{d.text}</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-gold">Enquire now <ArrowRight className="h-4 w-4" /></Link></div></article>)}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container py-20">
          <div className="mb-10"><p className="text-sm uppercase tracking-[0.3em] text-gold">Featured Stay</p><h2 className="mt-2 text-4xl font-bold">Uhoo&apos;s Lavish Oasis</h2><p className="mt-3 flex items-center gap-2 text-gray-400"><MapPin className="h-4 w-4 text-gold" />V. Felidhoo, Maldives</p></div>
          <div className="card overflow-hidden lg:grid lg:grid-cols-[1.15fr_.85fr]">
            <div className="min-h-[420px] overflow-hidden"><img src="/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.23.jpeg" alt="Uhoo's Lavish Oasis in Felidhoo" className="h-full min-h-[420px] w-full object-cover" /></div>
            <div className="flex flex-col justify-center p-7 md:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Island Guesthouse</p>
              <h3 className="mt-3 text-3xl font-bold">A welcoming stay in the heart of Vaavu Atoll</h3>
              <p className="mt-4 text-gray-400">Comfortable rooms, warm island hospitality and flexible meal plans for a relaxed Felidhoo getaway.</p>
              <div className="mt-7 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"><span className="flex items-center gap-2"><Utensils className="h-4 w-4 text-gold"/>Bed & Breakfast</span><strong className="text-gold">USD 85</strong></div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"><span className="flex items-center gap-2"><Utensils className="h-4 w-4 text-gold"/>Half Board</span><strong className="text-gold">USD 95</strong></div>
                <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3"><span className="flex items-center gap-2"><Utensils className="h-4 w-4 text-gold"/>Full Board</span><strong className="text-gold">USD 115</strong></div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Rates are per room, per night.</p>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/stays/uhoos-lavish-oasis" className="btn-outline">View Stay</Link><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&destination=Maldives&mealPlan=Bed%20%26%20Breakfast" className="btn-gold">Book Now</Link></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container grid gap-8 py-16 md:grid-cols-3">
          <div className="card p-6"><Sparkles className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Curated for you</h3><p className="mt-2 text-gray-400">Trips tailored to your budget, dates, and travel style.</p></div>
          <div className="card p-6"><Globe2 className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Global journeys</h3><p className="mt-2 text-gray-400">From island retreats to iconic cities and cultural adventures.</p></div>
          <div className="card p-6"><ShieldCheck className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Trusted support</h3><p className="mt-2 text-gray-400">Personal guidance before, during, and after your journey.</p></div>
        </div>
      </section>

      <section className="container py-20 text-center"><p className="text-sm uppercase tracking-[0.3em] text-gold">Your next journey</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-5xl">Tell us where you want to go. We’ll make it unforgettable.</h2><Link href="/contact" className="btn-gold mt-8">Start Planning</Link></section>
    </>
  );
}
