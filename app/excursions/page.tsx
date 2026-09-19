import Link from "next/link";
import { ArrowRight, Fish, MapPin, Ship, Sparkles, Waves } from "lucide-react";

export const metadata = {
  title: "Maldives Excursions | Tripelor",
  description: "Explore Tripelor excursions separately by destination: Vaavu Atoll and Ukulhas.",
};

export default function ExcursionsPage() {
  return (
    <main className="bg-[#06151c] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(217,189,123,.13),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(38,130,148,.14),transparent_32%)]" />
        <div className="container relative py-16 md:py-24">
          <p className="eyebrow">Choose your island area</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">Maldives excursions, organised by destination.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/55">
            Vaavu Atoll and Ukulhas have different excursion menus, prices and operating areas. Choose where you are staying to see the correct experiences.
          </p>
        </div>
      </section>

      <section className="container grid gap-6 py-12 md:py-16 lg:grid-cols-2">
        <article className="group overflow-hidden border border-white/10 bg-white/[.025] transition hover:border-gold/35">
          <div className="relative min-h-72 overflow-hidden bg-gradient-to-br from-[#0b3d49] to-[#041117] p-7 md:p-9">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-gold/10" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full border border-white/5" />
            <Waves className="h-9 w-9 text-gold" />
            <p className="mt-10 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Vaavu Atoll</p>
            <h2 className="font-display mt-3 text-4xl">Vaavu Atoll Excursions</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
              Snorkeling, turtle and shark trips, sandbanks, guided house reef snorkeling and night fishing around the Vaavu experience.
            </p>
            <Link href="/excursions/vaavu-atoll" className="btn-gold mt-7">
              Explore Vaavu <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <article className="group overflow-hidden border border-white/10 bg-white/[.025] transition hover:border-gold/35">
          <div className="relative min-h-72 overflow-hidden bg-gradient-to-br from-[#123039] to-[#041117] p-7 md:p-9">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-gold/10" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full border border-white/5" />
            <Fish className="h-9 w-9 text-gold" />
            <p className="mt-10 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">AA. Ukulhas · North Ari Atoll</p>
            <h2 className="font-display mt-3 text-4xl">Ukulhas Excursions</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">
              Paguro snorkeling combinations, desert-island picnic trips, Thoddoo, fish feeding and full-day whale shark adventures.
            </p>
            <Link href="/excursions/ukulhas" className="btn-gold mt-7">
              Explore Ukulhas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </section>

      <section className="container pb-16 md:pb-20">
        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-3">
          <div className="bg-[#071922] p-6">
            <MapPin className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm font-semibold">Destination-specific menus</p>
            <p className="mt-2 text-xs leading-6 text-white/40">Customers see only the excursions relevant to the island area they choose.</p>
          </div>
          <div className="bg-[#071922] p-6">
            <Ship className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm font-semibold">Tripelor assistance</p>
            <p className="mt-2 text-xs leading-6 text-white/40">Tripelor confirms dates, guest numbers and final operating details before the excursion.</p>
          </div>
          <div className="bg-[#071922] p-6">
            <Sparkles className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm font-semibold">Keep planning clear</p>
            <p className="mt-2 text-xs leading-6 text-white/40">Vaavu and Ukulhas prices are kept separate so guests do not mix excursion lists between destinations.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
