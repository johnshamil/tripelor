import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Fish, MessageCircle, Waves } from "lucide-react";
import { VAAVU_EXCURSIONS } from "@/lib/vaavu-excursions";

export const metadata = {
  title: "Vaavu Atoll Excursions | Tripelor",
  description: "Explore Tripelor snorkeling and fishing excursions in Vaavu Atoll.",
};

function enquiry(name: string, price: number) {
  return encodeURIComponent(`Hello Tripelor, I would like to enquire about the Vaavu Atoll excursion: ${name} at USD ${price} per person. Please confirm availability for my travel date and number of guests.`);
}

export default function VaavuExcursionsPage() {
  return (
    <main className="bg-[#06151c] text-white">
      <section className="container py-10 md:py-14">
        <Link href="/excursions" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All excursion destinations
        </Link>
        <p className="eyebrow mt-8">Vaavu Atoll</p>
        <h1 className="font-display mt-3 max-w-4xl text-5xl leading-tight md:text-7xl">Vaavu Atoll Excursions</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/55">
          Excursions for guests exploring Vaavu Atoll. These prices are separate from the Ukulhas / North Ari Atoll excursion menu.
        </p>
      </section>

      <section className="container grid gap-5 pb-16 md:grid-cols-2 xl:grid-cols-3">
        {VAAVU_EXCURSIONS.map((excursion) => {
          const Icon = excursion.category === "fishing" ? Fish : Waves;
          return (
            <article key={excursion.slug} className="flex h-full flex-col border border-white/10 bg-white/[.025] p-6 transition hover:border-gold/30 md:p-7">
              <Icon className="h-7 w-7 text-gold" />
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                {excursion.category === "fishing" ? "Fishing" : "Snorkeling"}
              </p>
              <h2 className="font-display mt-2 text-3xl leading-tight">{excursion.name}</h2>
              {excursion.duration && (
                <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
                  <Clock3 className="h-4 w-4 text-gold" /> {excursion.duration}
                </p>
              )}
              <div className="mt-5 space-y-2">
                {excursion.highlights.map((item) => (
                  <p key={item} className="flex items-start gap-2 text-sm leading-6 text-white/55">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" /> {item}
                  </p>
                ))}
              </div>
              <div className="mt-auto border-t border-white/10 pt-5">
                <p className="font-display text-3xl text-gold">USD {excursion.price}</p>
                <p className="mt-1 text-xs text-white/40">per person</p>
                <a
                  href={`https://wa.me/9609429403?text=${enquiry(excursion.name, excursion.price)}`}
                  className="btn-gold mt-5 w-full justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" /> Enquire
                </a>
              </div>
            </article>
          );
        })}
      </section>

      <section className="border-t border-white/10 bg-[#041117]">
        <div className="container flex flex-col gap-4 py-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>Wildlife sightings and ocean activities depend on weather and sea conditions. Tripelor confirms final availability before booking.</p>
          <Link href="/excursions/ukulhas" className="shrink-0 text-gold underline underline-offset-4">See Ukulhas excursions →</Link>
        </div>
      </section>
    </main>
  );
}
