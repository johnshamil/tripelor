import AddToCartButton from "@/components/add-to-cart-button";
import { CheckCircle2, Clock, Fish, Waves } from "lucide-react";
import { VAAVU_EXCURSIONS } from "@/lib/vaavu-excursions";

export default function VaavuExcursions() {
  return (
    <section id="excursions" aria-labelledby="vaavu-excursions-title" className="scroll-mt-28 border-y border-white/10 bg-[#06151c]">
      <div className="container py-12 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-gold">Snorkeling & night fishing</p>
        <h2 id="vaavu-excursions-title" className="font-display mt-3 text-4xl md:text-5xl">Vaavu excursions</h2>
        <p className="mt-4 max-w-2xl leading-7 text-gray-300">Choose an ocean experience for your island stay. All prices are in USD per person.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {VAAVU_EXCURSIONS.map(excursion => {
            const Icon = excursion.category === "fishing" ? Fish : Waves;
            return (
              <article key={excursion.slug} className="card flex min-w-0 flex-col p-6 sm:p-7">
                <Icon aria-hidden="true" className="h-7 w-7 text-gold" />
                <h3 className="font-display mt-5 text-3xl leading-tight">{excursion.name}</h3>
                {excursion.duration && <p className="mt-3 flex items-center gap-2 text-sm text-gold"><Clock aria-hidden="true" className="h-4 w-4" />{excursion.duration}</p>}
                <ul className="mb-7 mt-5 space-y-3">
                  {excursion.highlights.map(item => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-gray-300"><CheckCircle2 aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" /><span>{item}</span></li>
                  ))}
                </ul>
                <div className="mt-auto border-t border-white/10 pt-5">
                  <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><strong className="text-3xl text-gold">USD {excursion.price}</strong><span className="text-sm text-gray-300">per person</span></p>
                  <AddToCartButton productId={`excursion:${excursion.slug}`} className="mt-5" />
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-gray-400">Dolphin and other wildlife sightings cannot be guaranteed. Excursions depend on weather and sea conditions; final details are confirmed before payment.</p>
      </div>
    </section>
  );
}
