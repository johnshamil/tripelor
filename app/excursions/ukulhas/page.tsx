import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, Fish, MessageCircle, Waves } from "lucide-react";
import { UKULHAS_EXCURSIONS } from "@/lib/ukulhas-excursions";

export const metadata = {
  title: "Ukulhas Excursions | Tripelor",
  description: "Explore Paguro excursions in Ukulhas, North Ari Atoll.",
};

function enquiry(name: string, price: number) {
  return encodeURIComponent(`Hello Tripelor, I would like to enquire about the Ukulhas excursion: ${name} at USD ${price} per person. Please confirm availability for my travel date and number of guests.`);
}

export default function UkulhasExcursionsPage() {
  return (
    <main className="bg-[#06151c] text-white">
      <section className="container py-10 md:py-14">
        <Link href="/excursions" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/55 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All excursion destinations
        </Link>
        <p className="eyebrow mt-8">AA. Ukulhas · North Ari Atoll</p>
        <h1 className="font-display mt-3 max-w-4xl text-5xl leading-tight md:text-7xl">Ukulhas Excursions</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/55">
          Paguro excursion options for guests staying in Ukulhas. These are kept separate from the Vaavu Atoll excursion menu.
        </p>
      </section>

      <section className="container grid gap-5 pb-16 md:grid-cols-2 xl:grid-cols-3">
        {UKULHAS_EXCURSIONS.map((excursion) => {
          const Icon = excursion.category === "fishing" ? Fish : Waves;
          return (
            <article key={excursion.slug} className="flex h-full flex-col border border-white/10 bg-white/[.025] p-6 transition hover:border-gold/30 md:p-7">
              <Icon className="h-7 w-7 text-gold" />
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                {excursion.category === "full-day" ? "Full Day" : excursion.category === "combo" ? "Combo" : "Ocean Experience"}
              </p>
              <h2 className="font-display mt-2 text-3xl leading-tight">{excursion.name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">{excursion.description}</p>
              {excursion.duration && (
                <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
                  <Clock3 className="h-4 w-4 text-gold" /> {excursion.duration}
                </p>
              )}
              <div className="mt-5 space-y-2">
                {excursion.inclusions.map((item) => (
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

      <section className="container pb-12">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/stays/paguro-villa" className="border border-gold/20 bg-gold/[.05] p-5 transition hover:border-gold/45">
            <p className="text-[10px] uppercase tracking-[.18em] text-gold">Stay in Ukulhas</p>
            <h2 className="font-display mt-2 text-2xl">Paguro Villa</h2>
            <p className="mt-2 text-sm text-white/45">View rooms, live Cloudbeds booking and the Paguro excursion menu.</p>
          </Link>
          <Link href="/stays/paguro-beach-inn" className="border border-gold/20 bg-gold/[.05] p-5 transition hover:border-gold/45">
            <p className="text-[10px] uppercase tracking-[.18em] text-gold">Stay in Ukulhas</p>
            <h2 className="font-display mt-2 text-2xl">Paguro Beach Inn</h2>
            <p className="mt-2 text-sm text-white/45">View room categories, property details and live Cloudbeds booking.</p>
          </Link>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#041117]">
        <div className="container flex flex-col gap-4 py-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>Prices and activities follow the supplied Paguro excursion leaflet. Final operation depends on availability, weather and sea conditions.</p>
          <Link href="/excursions/vaavu-atoll" className="shrink-0 text-gold underline underline-offset-4">See Vaavu Atoll excursions →</Link>
        </div>
      </section>
    </main>
  );
}
