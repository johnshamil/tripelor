"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SaveTripButton from "@/components/save-trip-button";
import { wishlistCatalog, wishlistMatches, tagKey } from "@/lib/wishlist";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

type Wishes={tags:string[];arrival:string;departure:string;guests:number;budget:string};
function validDate(value:string) {
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) && Number.isFinite(Date.parse(value+"T00:00:00Z")) && new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value;
}
function restore(raw:string):Wishes {
  let v:any={};try{const data=JSON.parse(raw);if(data&&typeof data==="object")v=data;}catch{}
  return {tags:Array.isArray(v.tags)?Array.from(new Map(v.tags.filter((t:unknown)=>typeof t==="string" && t.trim() && t.length<=40).slice(0,10).map((t:string)=>[tagKey(t),t.trim()])).values()) as string[]:[],
    arrival:typeof v.arrival==="string" && validDate(v.arrival)?v.arrival:"",
    departure:typeof v.departure==="string" && validDate(v.departure)?v.departure:"",
    guests:Number.isInteger(v.guests)&&v.guests>=1&&v.guests<=20?v.guests:2,
    budget:typeof v.budget==="string" && v.budget.trim() && Number.isFinite(Number(v.budget)) && Number(v.budget)>0 && Number(v.budget)<=1000000?v.budget:""};
}
const field="mt-2 min-h-[48px] w-full rounded-xl border border-white/20 bg-[#0b2731] px-3 py-3 text-base text-white";
export default function MaldivesWishlist({properties,initial=""}:{properties:PublicProperty[];initial?:string}) {
  const [wishes,setWishes]=useState(()=>restore(initial));
  const [error,setError]=useState("");
  const catalog=wishlistCatalog(properties);
  const choices=Array.from(new Map([...catalog,...wishes.tags].map(tag=>[tagKey(tag),tag])).values());
  const results=wishlistMatches(properties,wishes.tags);
  const covered=new Set(results.flatMap(result=>result.tags.map(tagKey)));
  const unmatched=wishes.tags.filter(tag=>!covered.has(tagKey(tag)));
  const saved=JSON.stringify(wishes),href="/wishlist?wishes="+encodeURIComponent(saved);
  useEffect(()=>{window.history.replaceState(null,"",href);},[href]);
  function toggle(tag:string) {
    setError("");
    setWishes(current=>{
      if(current.tags.some(t=>tagKey(t)===tagKey(tag)))return {...current,tags:current.tags.filter(t=>tagKey(t)!==tagKey(tag))};
      return current.tags.length<10?{...current,tags:[...current.tags,tag]}:current;
    });
  }
  const invalid = !wishes.tags.length ? "Choose at least one wish." :
    Boolean(wishes.arrival)!==Boolean(wishes.departure) ? "Choose both arrival and departure dates, or leave both blank." :
    wishes.arrival && (!validDate(wishes.arrival) || !validDate(wishes.departure) || wishes.departure<=wishes.arrival) ? "Departure must be after a valid arrival date." :
    wishes.budget && (!Number.isFinite(Number(wishes.budget)) || Number(wishes.budget)<=0 || Number(wishes.budget)>1000000) ? "Enter a valid total trip budget in USD, or leave it blank." : "";
  const request=["Hello Tripelor, please help plan My Maldives Wishlist.",
    "My wishes: "+wishes.tags.join(", "),
    "Dates: "+(wishes.arrival?wishes.arrival+" to "+wishes.departure:"Flexible"),
    "Travellers: "+wishes.guests,
    "Total trip budget: "+(wishes.budget?"USD "+Number(wishes.budget):"Please advise"),
    ...(unmatched.length?["Please advise on these wishes without a listed match: "+unmatched.join(", ")]:[]),
    "Please suggest suitable stays, meal plans, experiences and transfers, and confirm availability, inclusions and the full price."].join("\n");
  return <div className="bg-[#06151c] text-white"><div className="container py-12 md:py-20">
    <p className="eyebrow">Start with the moments you want</p><h1 className="font-display mt-4 text-4xl md:text-6xl">My Maldives Wishlist</h1>
    <p className="mt-5 max-w-2xl leading-8 text-white/65">Tell us what your dream holiday looks like. Discover stays and activities connected to your wishes, then let Tripelor help bring the details together.</p>
    <fieldset className="mt-10"><legend className="text-lg">What would you love to do?</legend><p className="mt-2 text-sm text-white/55">Choose up to 10 interests. These are holiday wishes; availability is confirmed with our team.</p><div className="mt-5 flex flex-wrap gap-3">{choices.map(tag=>{
      const active=wishes.tags.some(t=>tagKey(t)===tagKey(tag));
      return <button key={tagKey(tag)} type="button" aria-pressed={active} disabled={!active&&wishes.tags.length>=10} onClick={()=>toggle(tag)} className={"min-h-[52px] rounded-full border px-5 py-3 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40 "+(active?"border-gold bg-gold/15 text-gold":"border-white/20 bg-white/[.025] text-white")}>{active?"✓ ":"+ "}{tag}</button>;
    })}</div></fieldset>
    <section className="mt-10 rounded-2xl border border-gold/25 bg-[#0b2731]/50 p-6">
      <h2 className="font-display text-3xl">A few details for your plan</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <label>Arrival (optional)<input type="date" className={field} value={wishes.arrival} onChange={e=>setWishes({...wishes,arrival:e.target.value})}/></label>
        <label>Departure (optional)<input type="date" className={field} min={wishes.arrival||undefined} value={wishes.departure} onChange={e=>setWishes({...wishes,departure:e.target.value})}/></label>
        <label>Travellers<select className={field} value={wishes.guests} onChange={e=>setWishes({...wishes,guests:Number(e.target.value)})}>{Array.from({length:20},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
        <label>Total trip budget (USD)<input type="number" min="1" max="1000000" step="1" className={field} value={wishes.budget} placeholder="Optional" onChange={e=>setWishes({...wishes,budget:e.target.value})}/></label>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/55">Matches below are based on your interests. Your dates, group size and budget help our team prepare a suitable quote; they do not confirm room availability or a package price.</p>
    </section>
    {wishes.tags.length>0 && <section className="mt-12" aria-labelledby="wishlist-results">
      <h2 id="wishlist-results" className="font-display text-3xl md:text-4xl">Places for your wishlist</h2>
      <p className="mt-4 text-sm leading-7 text-white/60">Each card explains which wishes it supports. Activities may cost extra and require separate arrangements.</p>
      {unmatched.length>0 && <p role="status" className="mt-5 rounded-xl border border-gold/25 p-5 text-sm leading-7 text-gold">No published match yet for: {unmatched.join(", ")}. Keep them in your request and our team can advise.</p>}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{results.map(({property,tags,direct,activities})=>{
        const rates=property.rooms.map(room=>room.sellingRate).filter(rate=>Number.isFinite(rate)&&rate>0);
        const starting=rates.length?Math.min(...rates):0;
        return <article key={property.slug} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/[.025]">
          {property.photos[0] && <img src={propertyPhotoUrl(property.photos[0])} alt={property.name} loading="lazy" className="aspect-[4/3] w-full object-cover"/>}
          <div className="flex flex-1 flex-col p-6">
            <p className="text-xs text-gold">{property.island}</p><h3 className="font-display mt-3 text-3xl">{property.name}</h3>
            <p className="mt-3 text-sm text-gold">Matches {tags.length} of {wishes.tags.length} wishes</p>
            {direct.length>0 && <p className="mt-3 text-sm leading-6 text-white/65">At this stay: {direct.join(", ")}</p>}
            {activities.length>0 && <div className="mt-5"><h4 className="text-sm font-semibold">Experiences for your wishes</h4><ul className="mt-3 space-y-4">{activities.map(({experience,tags})=><li key={experience.id} className="border-l border-gold/30 pl-3"><Link className="text-sm font-semibold underline" href={"/stays/"+property.slug+"#experience-"+experience.id}>{experience.name}</Link><p className="mt-1 text-xs leading-6 text-white/60">{tags.join(" · ")}<br/>{experience.duration} · {experience.price>0?"From USD "+experience.price+" "+experience.priceUnit:"Price on request"}</p></li>)}</ul></div>}
            <div className="mt-auto pt-6"><p className="text-sm text-gold">{starting>0?"Rooms from USD "+starting+" / night":"Room rates on request"}</p><Link className="btn-outline mt-4" href={"/stays/"+property.slug}>Explore this property</Link></div>
          </div>
        </article>;
      })}</div>
    </section>}
    <section className="mt-12 rounded-2xl border border-gold/30 bg-[#0b2731] p-6 md:p-8">
      <h2 className="font-display text-3xl">Let us plan your wishlist</h2><p className="mt-4 max-w-2xl leading-7 text-white/65">Send us your wishes, dates and budget. We will help you explore the options and confirm the arrangements.</p>
      {error && <p role="alert" className="mt-4 text-gold">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="button" className="btn-gold" onClick={()=>{if(invalid){setError(invalid);return;}setError("");window.open("https://wa.me/9609429403?text="+encodeURIComponent(request),"_blank","noopener,noreferrer");}}>Ask Tripelor to Plan This</button>
        {!invalid && <SaveTripButton key={saved} itemType="package" itemKey="maldives-wishlist" title="My Maldives Wishlist" subtitle={wishes.tags.join(" · ")} href={href} label="Save My Wishlist"/>}
      </div>
      <p className="mt-4 text-xs leading-6 text-white/55">Opens WhatsApp with your request for you to review and send. Saving updates your Maldives Wishlist in My Trip.</p>
    </section>
  </div></div>;
}
