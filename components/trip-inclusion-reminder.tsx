"use client";

import { Info } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { findCartProduct } from "@/lib/trip-cart";
import { findInclusionOverlaps } from "@/lib/trip-inclusions";
import { useSiteLanguage } from "@/components/use-site-language";

export default function TripInclusionReminder({ productId, onReview }: { productId: string; onReview?: () => void }) {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? {
        label: "Promemoria attività già inclusa",
        title: "Questa attività è già prevista nel tuo pacchetto",
        includes: "include",
        other: (count: number) => `${count} altri pacchetti selezionati includono attività simili.`,
        note: "Le uscite e i partecipanti possono variare. Mantieni questa selezione se desideri un’uscita aggiuntiva o posti per altri ospiti; il nostro team confermerà i dettagli.",
        review: "Rivedi le mie selezioni →",
      }
    : locale === "ru"
      ? {
          label: "Напоминание о включённой активности",
          title: "Эта активность уже входит в ваш пакет",
          includes: "включает",
          other: (count: number) => `Ещё в ${count} выбранных пакетах есть похожие активности.`,
          note: "Конкретные выезды и состав участников могут отличаться. Оставьте этот пункт, если хотите дополнительную экскурсию или места для других гостей; наша команда уточнит детали.",
          review: "Проверить мой выбор →",
        }
      : {
          label: "Included activity reminder",
          title: "Already listed in your package",
          includes: "includes",
          other: (count: number) => `${count} other selected packages also list similar activities.`,
          note: "Exact outings and participants may differ. Keep this for an extra outing or additional guests; our team will confirm the details.",
          review: "Review my selections →",
        };
  const { lines } = useCart();
  const overlaps = findInclusionOverlaps(productId, lines);
  if (!overlaps.length) return null;
  return <aside aria-label={`${copy.label}: ${findCartProduct(productId)?.name || ""}`} className="mt-4 rounded-xl border border-gold/25 bg-gold/[.06] p-4 text-xs leading-6 text-gray-300">
    <p className="flex items-start gap-2 font-semibold text-gold"><Info aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />{copy.title}</p>
    <ul className="mt-2 space-y-2">{overlaps.slice(0, 2).map(overlap => <li key={overlap.productId}><strong className="font-medium text-white">{overlap.packageName}</strong> {copy.includes} {overlap.activities.join(", ")}.</li>)}</ul>
    {overlaps.length > 2 && <p className="mt-2">{copy.other(overlaps.length - 2)}</p>}
    <p className="mt-2">{copy.note}</p>
    {onReview && <button type="button" onClick={onReview} className="mt-1 min-h-11 text-left font-semibold text-gold">{copy.review}</button>}
  </aside>;
}
