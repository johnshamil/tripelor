"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SaveTripButton from "@/components/save-trip-button";
import { propertyPhotoUrl, propertyRateForDate } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

const moods = [
  { id: "adventure", label: "Adventure", icon: "🌊", line: "Make space for discovery, with an island home to return to.", chapter: "Choose a new experience and leave room for a little curiosity." },
  { id: "reconnect", label: "Reconnect", icon: "🤍", line: "Slow down together. Let the island set the pace.", chapter: "Keep a little time free for the people who matter most." },
  { id: "slow", label: "Slow down", icon: "🌴", line: "Unhurried mornings. Fewer plans. More time to simply be.", chapter: "Leave a day open and enjoy your stay at your own pace." },
  { id: "celebrate", label: "Celebrate", icon: "✨", line: "Give your next milestone an island chapter of its own.", chapter: "Choose a moment to remember, and ask our team about your celebration wishes." },
];
type Selection = { mood: string; slug: string; room: string; meal: string; date: string; nights: number; experience: string };
function readSelection(raw: string): Selection {
  let value: Partial<Selection> = {};
  try { const parsed = JSON.parse(raw); if(parsed && typeof parsed === "object") value = parsed; } catch {}
  const text = (v: unknown) => typeof v === "string" ? v.slice(0, 200) : "";
  const date = text(value.date);
  return {
    mood: moods.some(m => m.id === value.mood) ? value.mood! : "slow",
    slug: text(value.slug), room: text(value.room), meal: text(value.meal),
    date: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date) && Number.isFinite(Date.parse(date + "T00:00:00Z")) && new Date(date + "T00:00:00Z").toISOString().slice(0, 10) === date ? date : "",
    nights: Number.isInteger(value.nights) && Number(value.nights) >= 1 && Number(value.nights) <= 30 ? Number(value.nights) : 3,
    experience: text(value.experience),
  };
}
const field = "mt-2 min-h-[48px] w-full rounded-xl border border-white/20 bg-[#0b2731] px-3 py-3 text-base text-white focus:outline focus:outline-2 focus:outline-gold";

export default function IslandStory({ properties, initial = "" }: { properties: PublicProperty[]; initial?: string }) {
  const [selection, setSelection] = useState(() => readSelection(initial));
  const available = properties.filter(p => p.status === "published" && p.rooms.some(r => r.sellingRate > 0));
  const property = available.find(p => p.slug === selection.slug) || available[0];
  const rooms = property?.rooms.filter(r => r.sellingRate > 0) || [];
  const room = rooms.find(r => r.name === selection.room && r.mealPlan === selection.meal) || rooms[0];
  const experiences = (property?.experiences || []).filter(e => e.enabled);
  const experience = experiences.find(e => e.id === selection.experience);
  const mood = moods.find(m => m.id === selection.mood)!;
  const current: Selection = { ...selection, slug: property?.slug || "", room: room?.name || "", meal: room?.mealPlan || "", experience: experience?.id || "" };
  const serialized = JSON.stringify(current);
  const href = "/island-story?story=" + encodeURIComponent(serialized);
  useEffect(() => { window.history.replaceState(null, "", href); }, [href]);
  const update = (patch: Partial<Selection>) => setSelection(previous => ({ ...previous, ...patch }));
  if (!property || !room) return <div className="container py-20"><h1 className="section-title">Your Island Story</h1><p className="mt-5">Our island stories are being prepared. Explore our stays or ask us to help plan your holiday.</p><Link href="/stays" className="btn-gold mt-6">Explore stays</Link></div>;
  const roomNames = Array.from(new Set(rooms.map(r => r.name)));
  const meals = rooms.filter(r => r.name === room.name);
  const amount = Array.from({ length: selection.nights }, (_, index) => {
    if (!selection.date) return room.sellingRate;
    const date = new Date(selection.date + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + index);
    return propertyRateForDate(property, room.name, room.mealPlan, date.toISOString().slice(0, 10));
  }).reduce((sum, rate) => sum + rate, 0);
  const price = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const activityPrice = experience ? experience.price > 0 ? price(experience.price) + " " + experience.priceUnit : "Price on request" : "";
  const request = [
    "Hello Tripelor, please check availability for my Island Story.",
    "Mood: " + mood.label, "Stay: " + property.name + " · " + property.island,
    "Room: " + room.name + " · " + room.mealPlan, "Arrival: " + (selection.date || "Dates flexible"),
    "Nights: " + selection.nights + " · One room (capacity " + room.capacity + ")",
    "Experience: " + (experience ? experience.name + " · " + activityPrice : "Leave time free"),
    "Room estimate: " + price(amount) + ". Please confirm occupancy pricing, taxes, transfers and availability.",
  ].join("\n");
  const changed = Boolean(initial && ((selection.slug && selection.slug !== property.slug) || (selection.room && selection.room !== room.name) || (selection.meal && selection.meal !== room.mealPlan) || (selection.experience && !experience)));
  return <div className="bg-[#06151c] text-white">
    <div className="container py-12 md:py-20">
      <p className="eyebrow">A holiday that feels like you</p>
      <h1 className="font-display mt-4 text-4xl md:text-6xl">Your Island Story</h1>
      <p className="mt-5 max-w-2xl leading-7 text-white/65">Choose a feeling, find your island home and shape a chapter worth remembering. This is your holiday wish list; our team confirms the arrangements.</p>
      {changed && <p role="status" className="mt-6 rounded-xl border border-gold/40 p-4 text-gold">Some saved options are no longer available. Please review the current choices below. Prices reflect the latest published rates.</p>}
      <fieldset className="mt-10">
        <legend className="text-lg">How do you want your holiday to feel?</legend>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{moods.map(m => <button type="button" key={m.id} aria-pressed={mood.id === m.id} onClick={() => update({ mood: m.id })} className={"rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold " + (mood.id === m.id ? "border-gold bg-gold/10" : "border-white/15 bg-white/[.025]")}><span className="block text-2xl" aria-hidden="true">{m.icon}</span><span className="mt-3 block font-semibold">{m.label}</span></button>)}</div>
      </fieldset>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-2xl border border-white/10 p-6">
          <h2 className="font-display text-3xl">Make it yours</h2>
          <div className="mt-6 grid gap-5">
            <label>Island home<select className={field} value={property.slug} onChange={e => update({ slug: e.target.value, room: "", meal: "", experience: "" })}>{available.map(p => <option key={p.slug} value={p.slug}>{p.name} · {p.island}</option>)}</select></label>
            <label>Room<select className={field} value={room.name} onChange={e => { const next = rooms.find(r => r.name === e.target.value)!; update({ room: next.name, meal: next.mealPlan }); }}>{roomNames.map(name => <option key={name}>{name}</option>)}</select></label>
            <label>Meal plan<select className={field} value={room.mealPlan} onChange={e => update({ room: room.name, meal: e.target.value })}>{meals.map(r => <option key={r.mealPlan} value={r.mealPlan}>{r.mealPlan}</option>)}</select></label>
            <p className="text-sm text-white/60">Planning for one room, up to {room.capacity} guests. Confirm your guest count with our team.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>Arrival date (optional)<input type="date" className={field} value={selection.date} onChange={e => update({ date: e.target.value })} /></label>
              <label>Nights<select className={field} value={selection.nights} onChange={e => update({ nights: Number(e.target.value) })}>{Array.from({ length: 30 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
            </div>
            <label>A moment to look forward to<select className={field} value={experience?.id || ""} onChange={e => update({ experience: e.target.value })}><option value="">Leave time free</option>{experiences.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
            {!experiences.length && <p className="text-sm text-white/60">No activities are listed for this stay yet. Ask our team for ideas.</p>}
          </div>
        </section>
        <article className="overflow-hidden rounded-2xl border border-gold/30 bg-[#f1ebdf] text-[#071922]">
          {property.photos[0] && <img src={propertyPhotoUrl(property.photos[0])} alt={property.name} className="aspect-[16/10] w-full object-cover" />}
          <div className="p-6 md:p-8">
            <p className="text-xs uppercase tracking-[.2em] text-[#745b2e]">{mood.label} · {selection.nights} nights</p>
            <h2 className="font-display mt-4 text-3xl md:text-4xl">Your chapter in {property.island}</h2>
            <p className="mt-4 text-lg leading-8">{mood.line}</p>
            <ol className="mt-8 space-y-6">
              <li><h3 className="font-semibold">01 · Arrive and settle in</h3><p className="mt-2 leading-7">Make {property.name} your island home. Your choice: {room.name}, with {room.mealPlan}.</p><Link href={"/stays/" + property.slug} className="mt-2 inline-block underline">Explore your stay</Link></li>
              <li><h3 className="font-semibold">02 · Your island moment</h3><p className="mt-2 leading-7">{experience ? experience.name + " · " + experience.duration + ". " + experience.description : mood.chapter}</p>{experience?.photos[0] && <img src={propertyPhotoUrl(experience.photos[0])} alt={experience.name} loading="lazy" className="mt-4 aspect-video w-full rounded-xl object-cover" />}</li>
              <li><h3 className="font-semibold">03 · Leave room for yourself</h3><p className="mt-2 leading-7">Keep the rest of your story open. Our team can help arrange arrival, departure and the details that matter to you.</p><Link href="/speedboat" className="mt-2 inline-block underline">Explore transfer options</Link></li>
            </ol>
            <div className="mt-8 border-t border-[#cfc4af] pt-6" aria-live="polite">
              <p className="font-semibold">Room estimate · {selection.nights} nights</p><p className="font-display mt-2 text-3xl">{price(amount)}</p>
              {experience && <p className="mt-3">Activity separately: {activityPrice}</p>}
              <p className="mt-3 text-sm leading-6 text-[#53616a]">Room estimate only, not a package total. {selection.date ? "Uses published rates for your selected dates." : "Uses base rates; choose dates for seasonal pricing."} Occupancy adjustments, taxes, transfers and activities are confirmed separately. Availability is not reserved.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-[#0b2731] p-6 text-white">
            <SaveTripButton key={serialized} itemType="package" itemKey={"island-story-" + property.slug + "-" + mood.id} title={("My Island Story · " + mood.label).slice(0, 150)} subtitle={property.name + " · " + selection.nights + " nights · " + (selection.date || "Flexible dates")} href={href} imageUrl={property.photos[0] ? propertyPhotoUrl(property.photos[0]) : undefined} label="Save My Story" />
            <a href={"https://wa.me/9609429403?text=" + encodeURIComponent(request)} target="_blank" rel="noopener noreferrer" className="btn-gold">Request availability</a>
            <p className="w-full text-xs leading-6 text-white/60">Opens WhatsApp with your choices. Review the message and send it when ready. Saving updates your story for this property and mood.</p>
          </div>
        </article>
      </div>
    </div>
  </div>;
}
