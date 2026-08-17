import Image from "next/image";
import Link from "next/link";
import { Globe2, ShieldCheck, Sparkles, MapPin, Utensils } from "lucide-react";

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
            <p className="mt-6 max-w-2xl text-lg text-gray-200">Relaxing island stays and memorable experiences, thoughtfully arranged for you.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/stays/uhoos-lavish-oasis" className="btn-gold">View Our Stay</Link><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" className="btn-outline">Book Your Stay</Link></div>
          </div>
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
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/stays/uhoos-lavish-oasis" className="btn-outline">View Stay</Link><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" className="btn-gold">Book Now</Link></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white/[0.02]">
        <div className="container grid gap-8 py-16 md:grid-cols-3">
          <div className="card p-6"><Sparkles className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Curated for you</h3><p className="mt-2 text-gray-400">A comfortable island stay tailored to your dates and meal preference.</p></div>
          <div className="card p-6"><Globe2 className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Local island experience</h3><p className="mt-2 text-gray-400">Enjoy Felidhoo, Vaavu Atoll and authentic Maldivian island life.</p></div>
          <div className="card p-6"><ShieldCheck className="h-8 w-8 text-gold" /><h3 className="mt-4 text-xl font-semibold">Trusted support</h3><p className="mt-2 text-gray-400">Personal guidance before, during, and after your stay.</p></div>
        </div>
      </section>

      <section className="container py-20 text-center"><p className="text-sm uppercase tracking-[0.3em] text-gold">Your island escape</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-bold md:text-5xl">Ready for your stay at Uhoo&apos;s Lavish Oasis?</h2><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" className="btn-gold mt-8">Book Your Stay</Link></section>
    </>
  );
}
