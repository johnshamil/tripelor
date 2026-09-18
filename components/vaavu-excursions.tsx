import AddToCartButton from "@/components/add-to-cart-button";
import Link from "next/link";
import { CheckCircle2, Clock, Fish, Waves } from "lucide-react";
import { VAAVU_EXCURSIONS } from "@/lib/vaavu-excursions";
import { localizedVaavuExcursion } from "@/lib/package-translations";
import type { ProfessionalLocale } from "@/lib/professional-translations";

export default function VaavuExcursions({ locale = "en" }: { locale?: ProfessionalLocale }) {
  const copy = locale === "it"
    ? { eyebrow: "Snorkeling e pesca notturna", title: "Escursioni a Vaavu", intro: "Scegli un'esperienza sull'oceano per il tuo soggiorno sull'isola. Tutti i prezzi sono in USD a persona.", shared: "Unisciti a una data di escursione condivisa →", perPerson: "a persona", note: "Gli avvistamenti di delfini e altra fauna non possono essere garantiti. Le escursioni dipendono dal meteo e dalle condizioni del mare; i dettagli finali vengono confermati prima del pagamento." }
    : locale === "ru"
      ? { eyebrow: "Снорклинг и ночная рыбалка", title: "Экскурсии на Вааву", intro: "Выберите океанское впечатление для островного отдыха. Все цены указаны в USD с человека.", shared: "Присоединиться к групповой экскурсии →", perPerson: "с человека", note: "Встречи с дельфинами и другой морской фауной не гарантируются. Экскурсии зависят от погоды и состояния моря; окончательные детали подтверждаются до оплаты." }
      : { eyebrow: "{copy.eyebrow}", title: "{copy.title}", intro: "{copy.intro}", shared: "{copy.shared}", perPerson: "{copy.perPerson}", note: "{copy.note}" };
  return (
    <section id="excursions" aria-labelledby="vaavu-excursions-title" className="scroll-mt-28 border-y border-white/10 bg-[#06151c]">
      <div className="container py-12 md:py-16">
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-gold">Snorkeling & night fishing</p>
        <h2 id="vaavu-excursions-title" className="font-display mt-3 text-4xl md:text-5xl">Vaavu excursions</h2>
        <p className="mt-4 max-w-2xl leading-7 text-gray-300">Choose an ocean experience for your island stay. All prices are in USD per person.</p>
        <Link href="/shared-excursions" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold/10">Join a shared excursion date →</Link>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {VAAVU_EXCURSIONS.map(excursion => {
            const Icon = excursion.category === "fishing" ? Fish : Waves;
            const localized = localizedVaavuExcursion(excursion.slug, locale);
            const name = localized?.name || excursion.name;
            const duration = localized?.duration || excursion.duration;
            const highlights = localized?.highlights || excursion.highlights;
            return (
              <article key={excursion.slug} className="card flex min-w-0 flex-col p-6 sm:p-7">
                <Icon aria-hidden="true" className="h-7 w-7 text-gold" />
                <h3 className="font-display mt-5 text-3xl leading-tight">{name}</h3>
                {duration && <p className="mt-3 flex items-center gap-2 text-sm text-gold"><Clock aria-hidden="true" className="h-4 w-4" />{duration}</p>}
                <ul className="mb-7 mt-5 space-y-3">
                  {highlights.map(item => (
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
