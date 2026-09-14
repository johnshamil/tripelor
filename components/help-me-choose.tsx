"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import { chooseStays,chooseTransfers,helpDate,helpNights } from "@/lib/help-me-choose";
import type { HelpService,HelpSchedule } from "@/lib/help-me-choose";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";
const field="mt-3 min-h-[50px] w-full rounded-xl border border-white/20 bg-[#0b2731] px-4 py-3 text-base text-white focus:outline focus:outline-2 focus:outline-gold";
const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
export default function HelpMeChoose({properties}:{properties:PublicProperty[]}) {
  const [step,setStep]=useState(0),[service,setService]=useState<HelpService>("stay");
  const [flexible,setFlexible]=useState(true),[arrival,setArrival]=useState(""),[departure,setDeparture]=useState("");
  const [unsure,setUnsure]=useState(true),[budget,setBudget]=useState(""),[route,setRoute]=useState("");
  const [schedule,setSchedule]=useState<HelpSchedule[]>([]),[loading,setLoading]=useState(false),[scheduleError,setScheduleError]=useState(false),[error,setError]=useState("");
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(step>0)heading.current?.focus();},[step]);
  useEffect(()=>{
    if(service!=="transfer")return;
    let cancelled=false;setLoading(true);setScheduleError(false);
    fetch("/api/speedboat/schedule",{cache:"no-store"}).then(async r=>{if(!r.ok)throw Error();const data=await r.json();if(!cancelled)setSchedule(Array.isArray(data.schedule)?data.schedule:[]);}).catch(()=>{if(!cancelled)setScheduleError(true);}).finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
  },[service]);
  const routes=Array.from(new Set(schedule.map(s=>s.route))).sort();
  const first=flexible?"":arrival,last=flexible?"":departure,amount=unsure?null:Number(budget);
  const stays=service!=="transfer"?chooseStays(properties,service,first,last,amount):[];
  const transfers=service==="transfer"?chooseTransfers(schedule,route,first,amount):[];
  function next() {
    setError("");
    if(step===1&&!flexible) {
      if(!helpDate(arrival)){setError("Choose a valid travel date, or select Not sure yet.");return;}
      const today=new Date().toLocaleDateString("en-CA",{timeZone:"Indian/Maldives"});
      if(arrival<today){setError("Choose today or a future travel date.");return;}
      if(service!=="transfer"&&(!helpDate(departure)||helpNights(arrival,departure)<1||helpNights(arrival,departure)>60)){setError("Choose a departure 1 to 60 nights after arrival.");return;}
    }
    if(step===2&&!unsure&&(!budget.trim()||!Number.isFinite(amount)||Number(amount)<=0||Number(amount)>1000000)){setError("Enter a budget in USD, or select Help me decide.");return;}
    setStep(step+1);
  }
  const unit=service==="stay"?"per room per night":service==="transfer"?"per person, one way":"for the complete holiday";
  const answers=["I need: "+({stay:"a stay",transfer:"a transfer",holiday:"a complete holiday"})[service],
    ...(service==="transfer"?["Route: "+(route||"Please help me choose")]:[]),
    "Dates: "+(flexible?"Not sure yet":arrival+(service!=="transfer"?" to "+departure:"")),
    "Budget: "+(unsure?"Help me decide":"USD "+budget+" "+unit)].join("\n");
  const ask=(option="")=>"https://wa.me/9609429403?text="+encodeURIComponent("Hello Tripelor, please help me choose.\n"+answers+(option?"\nOption I like: "+option:"")+"\nPlease confirm availability, inclusions, taxes and the full price.");
  const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
  const button=(active:boolean)=>"min-h-[60px] rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold "+(active?"border-gold bg-gold/10 text-gold":"border-white/20 bg-white/[.025]");
  return <div className="bg-[#06151c] text-white"><div className="container max-w-6xl py-12 md:py-20">
    <p className="eyebrow">A simple place to start · No sign-in needed</p>
    <h1 className="font-display mt-4 text-4xl md:text-6xl">Help Me Choose</h1>
    <p className="mt-5 max-w-2xl leading-7 text-white/65">Three easy questions. A few clear options. And a real person to help whenever you need one.</p>
    <p className="mt-8 text-sm text-gold">{step<3?"Question "+(step+1)+" of 3":"Your next steps"}</p>
    <div className="mt-3 flex gap-2" aria-hidden="true">{[0,1,2].map(i=><span key={i} className={"h-1 flex-1 rounded-full "+(i<=step?"bg-gold":"bg-white/15")}/>)}</div>
    <section className="mt-8 rounded-2xl border border-gold/20 p-6 md:p-8">
      <h2 ref={heading} tabIndex={-1} className="font-display text-3xl focus:outline-none">{["What do you need?","Do you have travel dates?","What budget feels comfortable?","A few options to explore"][step]}</h2>
      {step===0&&<>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{([["stay","A stay","Find a guesthouse or hotel."],["transfer","A transfer","Find a published boat route."],["holiday","A complete holiday","Start with a stay and let us plan the rest."]] as const).map(([value,title,description])=><button key={value} type="button" aria-pressed={service===value} className={button(service===value)} onClick={()=>setService(value)}><span className="block text-lg font-semibold">{title}</span><span className="mt-2 block text-sm leading-6 text-white/60">{description}</span></button>)}</div>
        {service==="transfer"&&<label className="mt-6 block">Which route? (optional)<select className={field} value={route} onChange={e=>setRoute(e.target.value)}><option value="">Help me choose a route</option>{routes.map(r=><option key={r} value={r}>{r}</option>)}</select>{loading?<span className="mt-2 block text-sm text-white/50">Loading published routes…</span>:(scheduleError||!routes.length)&&<span className="mt-2 block text-sm text-white/50">No routes could be loaded. You can still ask our team for help.</span>}</label>}
      </>}
      {step===1&&<>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" className={button(flexible)} aria-pressed={flexible} onClick={()=>setFlexible(true)}>Not sure yet</button><button type="button" className={button(!flexible)} aria-pressed={!flexible} onClick={()=>setFlexible(false)}>Choose my dates</button></div>
        {!flexible&&<div className="mt-6 grid gap-4 sm:grid-cols-2"><label>{service==="transfer"?"Travel date":"Arrival"}<input type="date" className={field} value={arrival} onChange={e=>setArrival(e.target.value)}/></label>{service!=="transfer"&&<label>Departure<input type="date" className={field} min={arrival||undefined} value={departure} onChange={e=>setDeparture(e.target.value)}/></label>}</div>}
      </>}
      {step===2&&<>
        <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" className={button(unsure)} aria-pressed={unsure} onClick={()=>setUnsure(true)}>Help me decide</button><button type="button" className={button(!unsure)} aria-pressed={!unsure} onClick={()=>setUnsure(false)}>I have a budget</button></div>
        {!unsure&&<label className="mt-6 block">Budget in USD · {unit}<input className={field} type="number" min="1" max="1000000" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Enter an amount"/></label>}
        <p className="mt-4 text-sm leading-6 text-white/55">{service==="holiday"?"The full holiday needs a quote. We can show starting stays; activities, meals beyond the selected plan and transfers may cost extra.":service==="stay"?"Room estimates include the listed meal plan. Taxes and transfers follow each property's terms.":"Shown fares are per person for one-way travel. Seats and departure arrangements need confirmation."}</p>
      </>}
      {step===3&&<>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/65">{answers}</p>
        {service==="holiday"&&<p className="mt-5 rounded-xl border border-gold/20 p-4 text-sm leading-7 text-gold">These are starting stays for your holiday, not complete packages. {flexible?"With flexible dates, we cannot yet compare a total holiday budget.":"The room estimate is only part of your holiday budget."} Ask us to confirm the complete price.</p>}
        {service!=="transfer"&&<>
          {!stays.length&&<p className="mt-6 text-white/65">No published stay currently matches these details. Change your answers or ask Tripelor to find an option.</p>}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">{stays.map(({property,room,nightly,total,nights})=><article key={property.slug} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/15">
            {property.photos[0]&&<img src={propertyPhotoUrl(property.photos[0])} alt={property.name} loading="lazy" className="aspect-[4/3] w-full object-cover"/>}
            <div className="flex flex-1 flex-col p-5"><p className="text-xs text-gold">{property.island}</p><h3 className="font-display mt-3 text-2xl">{property.name}</h3><p className="mt-3 text-sm">{room.name} · Up to {room.capacity} guests</p><p className="mt-4 text-xl text-gold">{money(nightly)} / room / night</p><p className="mt-1 text-xs text-white/55">{nights?money(total)+" for "+nights+" nights · Average nightly rate":"Starting base rate · Dates to be confirmed"}</p>
              <p className="mt-4 text-sm"><strong>Meal plan:</strong> {room.mealPlan}</p>
              <details className="mt-4 text-sm leading-6 text-white/65"><summary className="cursor-pointer text-white">Inclusions and conditions</summary><p className="mt-3 whitespace-pre-line">Amenities: {room.amenities||property.amenities||"Ask our team"}</p><p className="mt-3 whitespace-pre-line">Taxes: {property.taxes}</p><p className="mt-3 whitespace-pre-line">Transfers: {property.transfers}</p><p className="mt-3 whitespace-pre-line">Cancellation: {property.cancellation}</p></details>
              <div className="mt-auto pt-5"><Link href={"/stays/"+property.slug} className="btn-outline">Explore stay</Link><a href={ask(property.name+" · "+room.name+" · "+room.mealPlan)} target="_blank" rel="noopener noreferrer" className="mt-4 block min-h-[44px] text-sm text-gold underline">Ask about this option</a></div>
            </div>
          </article>)}</div>
        </>}
        {service==="transfer"&&<>
          {!route&&<p className="mt-6 text-white/65">We will help you choose the right route. Browse transfers or tell us your destination.</p>}
          {route&&!transfers.length&&<p className="mt-6 text-white/65">No listed departures match this route, date and budget. Change your answers or ask our team.</p>}
          <div className="mt-6 grid gap-5 lg:grid-cols-3">{transfers.map(t=><article key={t.id} className="rounded-2xl border border-white/15 p-5"><h3 className="font-display text-2xl">{t.route}</h3><p className="mt-3 text-sm">{t.operator} · {days[t.day_of_week]} · {t.departure_time.slice(0,5)}</p><p className="mt-4 text-xl text-gold">{money(Number(t.price_per_person))}</p><p className="mt-2 text-sm text-white/60">Per person, one-way boat transfer. Maldives local time. Schedule, seats and fare inclusions require confirmation.</p><Link className="btn-outline mt-5" href={"/speedboat?"+new URLSearchParams({route:t.route,...(first?{date:first}:{})}).toString()}>View this route</Link></article>)}</div>
          <Link href="/speedboat" className="mt-6 inline-block min-h-[44px] text-gold underline">Browse all transfers</Link>
        </>}
        <p className="mt-6 text-xs leading-6 text-white/50">Suggestions are not a reservation. Final prices and availability are confirmed before booking.</p>
      </>}
      {error&&<p role="alert" className="mt-5 text-gold">{error}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        {step>0&&<button type="button" onClick={()=>{setError("");setStep(step-1);}} className="btn-outline">Back</button>}
        {step<3&&<button type="button" onClick={next} className="btn-gold">{step===2?"Show my options":"Continue"}</button>}
        {step===3&&<button type="button" onClick={()=>{setError("");setStep(0);}} className="btn-outline">Change my answers</button>}
        <a href={ask()} target="_blank" rel="noopener noreferrer" className={step===3?"btn-gold":"btn-outline"}>Ask Tripelor</a>
      </div>
      <p className="mt-4 text-xs text-white/50">Ask Tripelor opens a WhatsApp message for you to review and send.</p>
    </section>
  </div></div>;
}
