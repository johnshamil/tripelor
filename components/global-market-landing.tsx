import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe2, Headphones, Hotel, Ship, Sparkles, UserPlus, Waves } from "lucide-react";
import type { GlobalMarketPage } from "@/lib/global-market-pages";

export default function GlobalMarketLanding({ market }: { market: GlobalMarketPage }) {
  return (
    <main lang={market.hreflang} className="bg-[#06151c] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <img
          src="/properties/rivethi-beach-hotel/1719713475.jpeg"
          alt="Maldives beach and turquoise lagoon"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#021016]/95 via-[#021016]/78 to-[#021016]/35" />
        <div className="container relative z-10 grid min-h-[72svh] items-center gap-10 py-16 lg:grid-cols-[1fr_330px]">
          <div className="max-w-4xl">
            <p className="eyebrow text-[#ead7aa]">{market.eyebrow}</p>
            <h1 className="font-display mt-6 text-5xl leading-[1.02] sm:text-6xl md:text-7xl">
              {market.headline}
              <span className="block italic text-[#ead7aa]">{market.accent}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">{market.body}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/build-your-trip" className="btn-gold justify-center">
                {market.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/#properties" className="btn-outline justify-center border-white/35 bg-black/15 text-white">
                <Hotel className="h-4 w-4" /> {market.secondaryCta}
              </Link>
              <Link href="/signup?next=%2Faccount" className="btn-outline justify-center border-[#ead7aa]/55 bg-[#ead7aa]/10 text-[#f6e7bf]">
                <UserPlus className="h-4 w-4" /> {market.memberCta}
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/12 bg-[#041117]/78 p-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-[#ead7aa]" />
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#ead7aa]">{market.marketLabel}</p>
            </div>
            <div className="mt-6 grid gap-4">
              {market.benefits.map((benefit, index) => {
                const Icon = index === 0 ? Hotel : index === 1 ? Sparkles : index === 2 ? Waves : index === 3 ? Ship : Headphones;
                return (
                  <p key={benefit} className="flex items-start gap-3 text-sm leading-6 text-white/72">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d9bd7b]" /> {benefit}
                  </p>
                );
              })}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#0a222c]">
        <div className="container py-14">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {market.trust.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <BadgeCheck className="h-5 w-5 text-[#d9bd7b]" />
                <p className="mt-3 text-sm font-semibold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_.85fr] lg:items-center">
            <div>
              <p className="eyebrow text-[#8d7037]">Tripelor · Maldives</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">Stay. Explore. Transfer. One local team.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-[#53616a]">
                Tripelor brings accommodation, island experiences, quotes and transfers together so international travellers can plan the Maldives with local support.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {market.searchTerms.map((term) => (
                  <span key={term} className="rounded-full border border-[#c9b88f] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#715721]">{term}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#c9b88f] bg-[#fffdf8] p-7 shadow-[0_18px_50px_rgba(34,43,46,.08)]">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8d7037]">Start with Tripelor</p>
              <div className="mt-5 grid gap-3">
                <Link href="/secret-deals" className="btn-gold justify-center">Private Maldives Deals <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/maldives-matchmaker" className="btn-outline justify-center text-[#071922]">Find My Maldives Match</Link>
                <Link href="/contact" className="btn-outline justify-center text-[#071922]">Speak With Tripelor</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
