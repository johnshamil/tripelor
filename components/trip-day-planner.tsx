"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BedDouble, CalendarDays, Waves, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import TripInclusionReminder from "@/components/trip-inclusion-reminder";
import { addNights, findCartProduct, maldivesToday, type CartLine } from "@/lib/trip-cart";
import { buildItinerary, formatTripDate, isTripDate, LAST_TRIP_DATE, tripDay, tripDayDate } from "@/lib/trip-itinerary";

const field = "mt-2 min-h-12 min-w-0 w-full rounded-xl border border-white/20 bg-[#041117] px-3 py-3 text-base text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold [color-scheme:dark]";
const usd = (value: number) => `USD ${value.toLocaleString("en-US")}`;

export default function TripDayPlanner() {
  const { lines, startDate, setStartDate, update, remove } = useCart();
  const itinerary = buildItinerary(lines, startDate);
  const [startDraft, setStartDraft] = useState(startDate);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [focusProduct, setFocusProduct] = useState("");
  const planner = useRef<HTMLDivElement>(null);
  useEffect(() => { setStartDraft(startDate); }, [startDate]);
  useEffect(() => {
    if (!focusProduct) return;
    const card = planner.current?.querySelector<HTMLElement>(`[data-trip-product="${focusProduct}"]`);
    card?.focus({ preventScroll: true });
    card?.scrollIntoView({ block: "nearest" });
    setFocusProduct("");
  }, [focusProduct, lines]);

  function moveToDate(line: CartLine, date: string) {
    update(line.productId, { date });
    setFocusProduct(line.productId);
    setAnnouncement(`${findCartProduct(line.productId)?.name}: ${date ? formatTripDate(date) : "date to be chosen"}.`);
  }

  function selectionCard(line: CartLine) {
    const product = findCartProduct(line.productId);
    if (!product) return null;
    const Icon = product.kind === "stay" ? BedDouble : Waves;
    const day = tripDay(itinerary.start, line.date);
    const lastDay = itinerary.days.at(-1)?.day || 1;
    const options = Array.from({ length: Math.min(31, Math.max(14, lastDay)) }, (_, index) => index + 1);
    if (day > options.length) options.push(day);
    return <article key={product.id} data-trip-product={product.id} tabIndex={-1} aria-label={product.name} className="min-w-0 rounded-2xl border border-white/10 bg-white/[.025] p-5 outline-none focus-visible:ring-1 focus-visible:ring-gold sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="flex items-center gap-2 text-xs uppercase tracking-[.15em] text-gold"><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{product.kind === "stay" ? "Island stay · Check-in" : product.kind === "package" ? "Ocean escape" : "Island experience"}</p><h4 className="font-display mt-3 text-2xl leading-tight sm:text-3xl"><Link href={product.href} className="hover:text-gold">{product.name}</Link></h4></div>
        <button type="button" onClick={() => remove(product.id)} aria-label={`Remove ${product.name} from my trip`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/5 hover:text-white"><X aria-hidden="true" className="h-4 w-4" /></button>
      </div>
      <p className="mt-4 text-sm text-gold">{usd(product.price)} per {product.unit}{product.nights ? ` · ${product.nights}-night stay` : ""}{product.duration ? ` · ${product.duration}` : ""}</p>
      <details className="mt-2 text-sm leading-6 text-gray-300"><summary className="min-h-10 cursor-pointer py-2">Your experience includes</summary><ul className="list-disc space-y-1 pl-5">{product.inclusions.map(item => <li key={item}>{item}</li>)}</ul></details>
      <TripInclusionReminder productId={product.id} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-sm text-gray-300">Day in my trip<select aria-label={`${product.name}: trip day`} value={day || ""} disabled={!itinerary.start} onChange={event => moveToDate(line, event.target.value ? tripDayDate(itinerary.start, Number(event.target.value)) : "")} className={`${field} disabled:opacity-50`}>
          <option value="">{itinerary.start ? "Choose a day" : "Set your trip start first"}</option>
          {options.filter(number => tripDayDate(itinerary.start, number)).map(number => <option key={number} value={number} disabled={tripDayDate(itinerary.start, number) < maldivesToday()}>Day {number}</option>)}
        </select></label>
        <label className="min-w-0 text-sm text-gray-300">{product.nights ? "Preferred check-in" : "Preferred experience date"}<input type="date" required min={maldivesToday()} max={LAST_TRIP_DATE} value={line.date} aria-label={`${product.name}: date`} onChange={event => { const date = event.target.value; if (!date || (isTripDate(date) && date >= maldivesToday())) moveToDate(line, date); }} className={field} /></label>
        <label className="min-w-0 text-sm text-gray-300 sm:col-span-2">{product.unit === "couple" ? "Couples (2 adults, 1 room each)" : "Guests joining"}<input type="number" required min={1} max={100} step={1} value={line.quantity || ""} aria-label={`${product.name}: ${product.unit === "couple" ? "couples" : "guests"}`} onChange={event => update(product.id, { quantity: event.target.value === "" ? 0 : Number(event.target.value) })} className={field} /></label>
      </div>
      {product.nights && isTripDate(line.date) && <p className="mt-3 text-sm leading-6 text-gray-400">Check-out: {addNights(line.date, product.nights)} · {line.quantity * 2} adults · {line.quantity} {line.quantity === 1 ? "room" : "rooms"}. Included package activities will be scheduled with our island team.</p>}
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4"><span className="text-xs text-gray-400">Estimate for your {product.kind === "stay" ? "stay" : "experience"}</span><span className="font-semibold">{usd(product.price * line.quantity)}</span></div>
    </article>;
  }

  return <div ref={planner}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-3xl">Your day-by-day itinerary</h2><span className="text-xs text-gray-400">{lines.length} {lines.length === 1 ? "selection" : "selections"} · saved on this device</span></div>
    <div className="mb-7 rounded-2xl border border-gold/25 bg-gold/[.04] p-5">
      <label className="block text-sm text-gray-300"><span className="flex items-center gap-2 font-semibold text-gold"><CalendarDays aria-hidden="true" className="h-4 w-4" />Trip start date</span><input type="date" aria-label="Trip start date" aria-describedby="trip-start-help" required min={maldivesToday()} max={LAST_TRIP_DATE} value={startDraft} onChange={event => {
        const date = event.target.value;
        setStartDraft(date);
        setError("");
        if (!isTripDate(date) || date < maldivesToday()) return;
        try { setStartDate(date); setAnnouncement(`Trip starts ${formatTripDate(date)}. Dated selections have moved together; selections without a date still need a day.`); }
        catch (problem) { setStartDraft(startDate); setError(problem instanceof Error ? problem.message : "Please check your trip dates."); }
      }} className={field} /></label>
      <p id="trip-start-help" className="mt-3 text-xs leading-6 text-gray-300">Choose when Day 1 begins, then assign a day to each selection. Changing this date moves your dated selections together. You can also choose an individual date for any experience.</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
    </div>
    <p role="status" className="sr-only">{announcement}</p>
    {itinerary.unscheduled.length > 0 && <section aria-labelledby="unscheduled-heading" className="mb-8">
      <h3 id="unscheduled-heading" className="font-display text-2xl">Choose a day · {itinerary.unscheduled.length} {itinerary.unscheduled.length === 1 ? "selection" : "selections"}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-400">Assign these to Day 1, Day 2 or another preferred date.</p>
      <div className="mt-4 space-y-5">{itinerary.unscheduled.map(selectionCard)}</div>
    </section>}
    {itinerary.days.length > 0 && <ol aria-label="Trip days" className="space-y-7 border-l border-gold/25 pl-5 sm:pl-7">
      {itinerary.days.map((day, index) => <li key={day.date} className="relative">
        {index > 0 && day.day - itinerary.days[index - 1].day > 1 && <p className="mb-5 text-xs leading-6 text-gray-400">{day.day - itinerary.days[index - 1].day === 2 ? `Day ${day.day - 1}` : `Days ${itinerary.days[index - 1].day + 1}–${day.day - 1}`} · Free time between your selections</p>}
        <span aria-hidden="true" className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border border-gold bg-[#041117] sm:-left-[35px]" />
        <h3 className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="font-display text-3xl text-gold">Day {day.day}</span><span className="text-sm text-gray-300">{formatTripDate(day.date)}</span></h3>
        <div className="space-y-4">
          {day.stays.map(stay => <div key={stay.product.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[.02] p-4 text-sm leading-6"><BedDouble aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-gold" /><div><p className="text-gold">{stay.checkout ? "Check-out" : "Your stay continues"}</p><p className="text-gray-300">{stay.product.name}</p>{!stay.checkout && <p className="text-xs text-gray-400">Included in your selected stay</p>}</div></div>)}
          {day.lines.map(selectionCard)}
          {!day.lines.length && !day.stays.length && <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm leading-6 text-gray-400">No experiences assigned yet. Move a selection to this day whenever you’re ready.</p>}
        </div>
      </li>)}
    </ol>}
    <p className="mt-6 text-xs leading-6 text-gray-400">These are your preferred days. Our island team will confirm activity times, transfers and availability with you.</p>
  </div>;
}
