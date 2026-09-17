"use client";

import { useState } from "react";
import { ArrowRight, BedDouble, Check, Fish, Plus, Search, Waves } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import TripInclusionReminder from "@/components/trip-inclusion-reminder";
import { CART_PRODUCTS, stayCartId } from "@/lib/trip-cart";
import { fiveNight, threeNight } from "@/lib/island-packages";
import { VAAVU_BLUE_ESCAPE } from "@/lib/vaavu-blue-escape";
import { VAAVU_EXCURSIONS } from "@/lib/vaavu-excursions";

type Filter = "all" | "packages" | "excursions";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "packages", label: "Packages" },
  { id: "excursions", label: "Excursions" },
];
const stays = [...threeNight, ...fiveNight];
const usd = (value: number) => `USD ${value.toLocaleString("en-US")}`;

export default function TripExperienceCatalog({ onViewPlan }: { onViewPlan: () => void }) {
  const { lines, ready, add } = useCart();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const search = query.trim().toLowerCase();
  const matchesFilter = (kind: string, selected: Filter) => selected === "all" || (selected === "excursions" ? kind === "excursion" : kind !== "excursion");
  const products = CART_PRODUCTS.filter(product => matchesFilter(product.kind, filter) &&
    `${product.name} ${product.inclusions.join(" ")} ${product.nights ? `${product.nights} nights` : ""}`.toLowerCase().includes(search));
  const total = lines.reduce((sum, line) => sum + (CART_PRODUCTS.find(product => product.id === line.productId)?.price || 0) * line.quantity, 0);

  return <section aria-labelledby="trip-catalog-heading" className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[.2em] text-gold">Discover your Maldives</p>
        <h2 id="trip-catalog-heading" className="font-display mt-3 text-3xl md:text-4xl">All packages & excursions</h2>
        <p className="mt-3 text-sm leading-6 text-gray-300">Browse every experience, see what’s included, and add your favourites to your trip. Choose dates and guests in My selections.</p>
      </div>
      {ready && lines.length > 0 && <button type="button" onClick={onViewPlan} className="flex min-h-12 w-full items-center justify-between gap-4 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 text-left sm:w-auto">
        <span><span className="block text-sm font-semibold text-gold">View My Trip · {lines.length} selected</span><span className="mt-1 block text-xs text-gray-300">Trip estimate {usd(total)}</span></span>
        <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-gold" />
      </button>}
    </div>
    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter packages and excursions" className="flex flex-wrap gap-2">
        {filters.map(item => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${filter === item.id ? "border-gold bg-gold text-[#071922]" : "border-white/15 text-gray-300 hover:border-gold/50"}`}>
          {item.label}<span className="text-xs opacity-75">{CART_PRODUCTS.filter(product => matchesFilter(product.kind, item.id)).length}</span>
        </button>)}
      </div>
      <label className="relative block w-full lg:max-w-sm">
        <span className="sr-only">Search packages and excursions</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-400" />
        <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search snorkeling, fishing, stays…" className="min-h-12 w-full rounded-xl border border-white/20 bg-[#041117] py-3 pl-11 pr-4 text-base text-white placeholder:text-gray-400 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold" />
      </label>
    </div>
    <p role="status" className="mt-4 text-xs text-gray-400">Showing {products.length} of {CART_PRODUCTS.length} experiences</p>
    <p role="status" className="sr-only">{announcement}</p>
    {products.length === 0 ? <div className="mt-6 rounded-2xl border border-white/10 p-8 text-center">
      <p className="text-gray-300">No experiences match your search.</p>
      <button type="button" onClick={() => { setFilter("all"); setQuery(""); }} className="mt-3 min-h-11 text-sm font-semibold text-gold">Show all packages & excursions</button>
    </div> : <div className="mt-6 grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map(product => {
        const selected = lines.some(line => line.productId === product.id);
        const stay = stays.find(item => stayCartId(item.slug, item.nights) === product.id);
        const fishing = VAAVU_EXCURSIONS.some(item => `excursion:${item.slug}` === product.id && item.category === "fishing");
        const Icon = stay ? BedDouble : fishing ? Fish : Waves;
        const image = product.id === "package:vaavu-blue-escape" ? VAAVU_BLUE_ESCAPE.image : stay?.image;
        const label = stay ? `${stay.nights}-night stay package` : product.kind === "package" ? "Ocean package" : fishing ? "Fishing excursion" : "Snorkeling excursion";
        return <article key={product.id} className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-white/[.025] transition ${selected ? "border-gold/60" : "border-white/10 hover:border-gold/30"}`}>
          <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#174550] to-[#071923]">
            {image ? <><img src={image} alt={product.id === "package:vaavu-blue-escape" ? VAAVU_BLUE_ESCAPE.imageAlt : "Maldives island scenery"} loading="lazy" decoding="async" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#041117]/90 to-transparent" /></> : <Icon aria-hidden="true" className="h-14 w-14 text-gold/40" />}
            <span className="absolute bottom-3 left-4 right-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-gold"><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}</span>
            {selected && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#041117]/90 px-3 py-1.5 text-xs text-gold"><Check aria-hidden="true" className="h-3 w-3" />In your trip</span>}
          </div>
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <h3 className="font-display text-2xl leading-tight">{stay ? stay.name : product.name}</h3>
            {product.duration && <p className="mt-2 text-xs text-gray-400">{product.duration}</p>}
            <ul className="mt-4 space-y-2 text-sm leading-6 text-gray-300">{product.inclusions.slice(0, 3).map(item => <li key={item} className="flex gap-2"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul>
            {product.inclusions.length > 3 && <details className="mt-2 text-sm leading-6 text-gray-300"><summary className="min-h-11 cursor-pointer py-2 text-gold">See all inclusions</summary><ul className="space-y-2">{product.inclusions.slice(3).map(item => <li key={item} className="flex gap-2"><Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul></details>}
            <TripInclusionReminder productId={product.id} onReview={onViewPlan} />
            <div className="mt-auto pt-5">
              <div className="border-t border-white/10 pt-4"><strong className="font-display text-3xl text-gold">{usd(product.price)}</strong><p className="mt-1 text-xs text-gray-300">{product.unit === "couple" ? `Total for 2 adults · ${product.nights} nights` : "Per person"}</p></div>
              <button type="button" disabled={!ready} onClick={() => { if (selected) onViewPlan(); else { add(product.id); setAnnouncement(`${product.name} added to your trip. Choose dates and guests in My selections.`); } }} aria-label={selected ? `View my selections with ${product.name}` : `Add ${product.name} to my trip`} className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${selected ? "border-gold/60 text-gold hover:bg-gold/10" : "border-gold bg-gold text-[#071922] hover:bg-[#e3ca91]"}`}>
                {selected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />}{selected ? "Added · View My Trip" : "Add to My Trip"}
              </button>
            </div>
          </div>
        </article>;
      })}
    </div>}
    <p className="mt-6 text-xs leading-6 text-gray-400">Wildlife sightings and ocean activities depend on weather and sea conditions. Transfers are separate unless stated. Our island team confirms availability and final details before payment.</p>
  </section>;
}
