import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BedDouble, CalendarDays, Check, Fish, MapPin, Ship } from "lucide-react";
import AddToCartButton from "@/components/add-to-cart-button";
import {
  BON_ABRI_EXCURSIONS,
  BON_ABRI_GROUP_RATES,
  BON_ABRI_PACKAGES,
  BON_ABRI_ROOM_RATES,
  BON_ABRI_TRANSFERS,
  bonAbriCartId,
  bonAbriMoney,
} from "@/lib/bon-abri-public";

export const metadata: Metadata = {
  title: "Bon Abri Maldives Packages & Rates | Tripelor",
  description: "Explore full-board stays, fishing holidays and three-island packages with Bon Abri Maldives on N. Magoodhoo. Send a request through Tripelor.",
  alternates: { canonical: "https://www.tripelor.com/island-adventures/bon-abri-maldives" },
};

type RoomRate = (typeof BON_ABRI_ROOM_RATES)[number] | (typeof BON_ABRI_GROUP_RATES)[number];

function RoomTable({ rates, label }: { rates: readonly RoomRate[]; label: string }) {
  return <div className="overflow-x-auto rounded-2xl border border-white/15">
    <table className="w-full min-w-[650px] text-left text-sm">
      <caption className="sr-only">{label} room rates per room per night in USD</caption>
      <thead className="bg-white/10 text-gold"><tr><th scope="col" className="px-5 py-4">Season</th><th scope="col" className="px-5 py-4">Room</th><th scope="col" className="px-5 py-4">Single</th><th scope="col" className="px-5 py-4">Double</th><th scope="col" className="px-5 py-4">Triple</th></tr></thead>
      <tbody>{rates.map(rate => <tr key={`${rate.season}-${rate.room}`} className="border-t border-white/10"><th scope="row" className="px-5 py-4 font-medium">{rate.season}</th><td className="px-5 py-4 text-gray-300">{rate.room}</td><td className="px-5 py-4">${bonAbriMoney(rate.single)}</td><td className="px-5 py-4">${bonAbriMoney(rate.double)}</td><td className="px-5 py-4">${bonAbriMoney(rate.triple)}</td></tr>)}</tbody>
    </table>
  </div>;
}

export default function BonAbriPage() {
  return <main className="bg-[#06151c] text-white">
    <section className="relative overflow-hidden border-b border-gold/20 bg-gradient-to-br from-[#123c48] via-[#092630] to-[#041117]">
      <div className="container relative py-20 md:py-28">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[.22em] text-gold"><MapPin aria-hidden="true" className="h-4 w-4" />N. Magoodhoo · Noonu Atoll</p>
        <h1 className="font-display mt-6 max-w-4xl text-5xl leading-tight md:text-7xl">Bon Abri Maldives</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">Full-board island stays, fishing holidays and ocean experiences. Choose a package, then Tripelor will confirm your dates and arrangements with the local team.</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href="#packages" className="btn-gold">Explore packages <ArrowRight aria-hidden="true" className="h-4 w-4" /></a><a href="#rooms" className="btn-outline">View room rates</a></div>
      </div>
    </section>

    <section id="packages" className="container scroll-mt-24 py-16 md:py-20">
      <p className="eyebrow">2026–2027 packages</p>
      <h2 className="font-display mt-3 text-4xl md:text-5xl">Choose your island escape</h2>
      <p className="mt-4 max-w-3xl leading-7 text-gray-300">Prices are per person for two adults sharing one room. Full Board means breakfast, lunch and dinner. Applicable taxes are included in the package prices.</p>
      <div className="mt-9 grid gap-6 lg:grid-cols-2">{BON_ABRI_PACKAGES.map(pkg => <article id={pkg.slug} key={pkg.slug} className="flex scroll-mt-28 flex-col rounded-2xl border border-white/15 bg-white/[.035] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-gold"><CalendarDays aria-hidden="true" className="h-4 w-4" />{pkg.nights} nights · N. Magoodhoo{pkg.nights === 9 ? " + two islands" : ""}</div>
        <h3 className="font-display mt-4 text-3xl md:text-4xl">{pkg.name}</h3>
        <p className="mt-3 text-sm leading-7 text-gray-300">{pkg.summary}</p>
        <ul className="mt-6 space-y-3">{pkg.inclusions.map(item => <li key={item} className="flex gap-3 text-sm leading-6 text-gray-200"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul>
        {pkg.note && <p className="mt-5 text-sm leading-6 text-gray-400">{pkg.note}</p>}
        <div className="mt-auto border-t border-white/15 pt-6" style={{ marginTop: "2rem" }}><p className="text-sm text-gray-300">USD {bonAbriMoney(pkg.perPerson)} per person · <strong className="text-white">USD {bonAbriMoney(pkg.perPerson * 2)} for two adults</strong></p><AddToCartButton productId={bonAbriCartId(pkg)} className="mt-5 max-w-sm" /></div>
      </article>)}</div>
      <p className="mt-7 text-sm leading-7 text-gray-400">Ocean activities and transfers depend on weather, sea conditions and availability. Transfers from Malé are separate unless a package explicitly includes them. Your request does not reserve a room; Tripelor will confirm availability and final details before payment.</p>
    </section>

    <section id="rooms" className="scroll-mt-24 border-y border-white/10 bg-[#0b2028]"><div className="container py-16 md:py-20">
      <div className="flex items-start gap-4"><BedDouble aria-hidden="true" className="mt-1 h-7 w-7 shrink-0 text-gold" /><div><p className="eyebrow">Room stays</p><h2 className="font-display mt-3 text-4xl md:text-5xl">Full-board room rates</h2></div></div>
      <p className="mt-5 max-w-3xl leading-7 text-gray-300">Rates below are in USD per room per night for the stated occupancy. Shoulder season: 1 December–31 March. Peak season: 1 April–30 November. Prices are from the supplier’s 2026–2027 rate sheet.</p>
      <div className="mt-8"><RoomTable rates={BON_ABRI_ROOM_RATES} label="Individual" /></div>
      <p className="mt-4 text-sm leading-7 text-gray-300">Children aged 2–11.99 sharing with parents: USD 22 per child per night. The supplier separately lists Green Tax at USD 6 per person per night for room bookings. We will confirm the final tax treatment and any applicable exemptions in your quote.</p>
      <h3 className="font-display mt-12 text-3xl">Group rates</h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">For bookings of at least four rooms and a minimum of four nights. Ask Tripelor for room allocation and a final group quote.</p>
      <div className="mt-6"><RoomTable rates={BON_ABRI_GROUP_RATES} label="Group" /></div>
      <Link href="/contact?bonAbri=rooms" className="btn-gold mt-8">Ask about rooms or a group stay</Link>
    </div></section>

    <section className="container grid gap-12 py-16 md:py-20 lg:grid-cols-2">
      <div><div className="flex items-center gap-3"><Fish aria-hidden="true" className="h-6 w-6 text-gold" /><h2 className="font-display text-3xl">Ocean experiences</h2></div><p className="mt-4 text-sm leading-7 text-gray-300">Rates include service charge and taxes. A minimum of two guests applies to all listed excursions except Big Game Fishing.</p><ul className="mt-6 divide-y divide-white/10 border-y border-white/10">{BON_ABRI_EXCURSIONS.map(item => <li key={item.name} className="flex items-baseline justify-between gap-4 py-4 text-sm"><span>{item.name}</span><strong className="shrink-0 text-gold">USD {bonAbriMoney(item.price)} / {item.unit}</strong></li>)}</ul><p className="mt-4 text-sm leading-6 text-gray-400">Big Game Fishing is quoted per hour; four- and six-hour trips are available subject to confirmation.</p><Link href="/contact?bonAbri=excursions" className="btn-outline mt-6">Ask about excursions</Link></div>
      <div><div className="flex items-center gap-3"><Ship aria-hidden="true" className="h-6 w-6 text-gold" /><h2 className="font-display text-3xl">Getting to Magoodhoo</h2></div><p className="mt-4 text-sm leading-7 text-gray-300">The supplier offers shared speedboat service or a domestic flight to Maafaru followed by a short speedboat ride. Reserve ahead with your international flight details.</p><ul className="mt-6 divide-y divide-white/10 border-y border-white/10">{BON_ABRI_TRANSFERS.map(item => <li key={item.name} className="py-4"><div className="flex flex-wrap items-baseline justify-between gap-3 text-sm"><span>{item.name}</span><strong className="text-gold">USD {bonAbriMoney(item.price)}</strong></div><p className="mt-2 text-sm text-gray-400">{item.detail}</p></li>)}</ul><p className="mt-4 text-sm leading-6 text-gray-400">Departure times and seats are confirmed by the transfer operator, and services may change with weather or demand. The 13-night fishing package already includes a return scheduled speedboat transfer.</p><Link href="/contact?bonAbri=transfers" className="btn-outline mt-6">Ask about transfers</Link></div>
    </section>

    <section className="border-t border-white/10 bg-[#0b2028]"><div className="container py-14"><h2 className="font-display text-3xl">Before you request</h2><div className="mt-6 grid gap-6 text-sm leading-7 text-gray-300 md:grid-cols-3"><p>Standard check-in is 14:00 and check-out is 12:00. Room rates include Full Board, service charge and TGST according to the supplier sheet.</p><p>The rate and terms pages give different cancellation wording. Tripelor will confirm the applicable cancellation terms in writing before you pay.</p><p>Availability, room occupancy, activity timing and transfers are subject to supplier confirmation. Your selection is an enquiry, with no automatic charge.</p></div></div></section>
  </main>;
}
