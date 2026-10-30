"use client";
import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Mail, Ship, Users } from "lucide-react";

function addDays(value:string,n:number){if(!value)return"";const d=new Date(value+"T00:00:00");d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function pretty(value:string){if(!value)return"";return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T00:00:00Z"));}
function money(value:number){return "USD "+value.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
function calculatePrice(tripType:string,adults:number,children:number,nights:number){
  // Published NOAH prices, not Tripelor's confidential agent net rates.
  const people=adults+children;
  const perNight=tripType==="Private Whole-Boat Charter"
    ?1200+Math.max(0,adults-Math.max(0,4-children))*75+Math.max(0,children-4)*37.5
    :(adults===1&&children===0?225:adults*175+children*87.5);
  const base=perNight*nights;
  const service=base*0.10;
  const tgst=(base+service)*0.17;
  const green=people*nights*12;
  return {perNight,base,service,tgst,green,total:base+service+tgst+green};
}

export default function NoahBookingForm(){
  const [tripType,setTripType]=useState("Shared Safari Cabin");
  const [startDate,setStartDate]=useState("");
  const [nights,setNights]=useState(7);
  const [adults,setAdults]=useState(2);
  const [children,setChildren]=useState(0);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [notes,setNotes]=useState("");
  const [status,setStatus]=useState("");
  const [sending,setSending]=useState(false);
  const endDate=useMemo(()=>addDays(startDate,nights),[startDate,nights]);
  const price=useMemo(()=>calculatePrice(tripType,adults,children,nights),[tripType,adults,children,nights]);
  const validGuests=adults+children<=18;
  const isShared=tripType==="Shared Safari Cabin";

  async function submit(e:FormEvent){
    e.preventDefault(); setStatus("");
    if(!validGuests){setStatus("NOAH has a maximum of 18 guests. Please reduce the number of guests.");return;}
    setSending(true);
    try{
      const r=await fetch("/api/booking",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        packageName:"NOAH Maldives Safari Boat", packagePrice:null, propertyName:"NOAH Maldives Safari Boat", fullName:name, email, phone,
        destination:"Maldives liveaboard safari", checkIn:pretty(startDate), checkOut:pretty(endDate), checkInISO:startDate, checkOutISO:endDate,
        nights, adults, children, roomType:tripType, rooms:"1", mealPlan:"Full Board", nightlyRate:price.perNight, estimatedTotal:Number(price.total.toFixed(2)), speedboatSeats:0, speedboatTotal:0,
        specialRequests:"NOAH direct booking request. Estimated public-price breakdown (subject to supplier confirmation): base "+money(price.base)+", service charge "+money(price.service)+", TGST "+money(price.tgst)+", Green Tax "+money(price.green)+". "+notes
      })});
      const x=await r.json(); if(!r.ok)throw new Error(x.error||"Unable to send booking.");
      location.href="/booking/confirmation?name="+encodeURIComponent(name)+"&title="+encodeURIComponent("NOAH Maldives Safari Boat")+"&dates="+encodeURIComponent(pretty(startDate)+" – "+pretty(endDate))+"&ref="+encodeURIComponent(x.bookingReference||"");
    }catch(err){setStatus(err instanceof Error?err.message:"Unable to send booking.");}finally{setSending(false);}
  }

  return <section id="book-noah" className="bg-[#f1ebdf] text-[#071922]"><div className="container py-14 md:py-20"><div className="mx-auto max-w-5xl">
    <p className="eyebrow text-[#8d7037]">Book directly with Tripelor</p>
    <h2 className="font-display mt-3 text-4xl leading-tight md:text-6xl">Reserve your NOAH safari.</h2>
    <p className="mt-4 max-w-2xl leading-7 text-[#58656c]">Choose your trip, dates and guests. Tripelor will issue your booking reference and personally confirm NOAH availability and payment instructions.</p>
    <form onSubmit={submit} className="mt-8 grid gap-5 border border-[#d8cdb8] bg-[#fffdf8] p-5 md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">Trip type<select value={tripType} onChange={e=>setTripType(e.target.value)} className="min-h-12 border border-[#d8cdb8] bg-white px-4"><option>Shared Safari Cabin</option><option>Private Whole-Boat Charter</option></select></label>
        <label className="grid gap-2 text-sm font-semibold">Start date<input type="date" required value={startDate} onChange={e=>setStartDate(e.target.value)} className="min-h-12 border border-[#d8cdb8] bg-white px-4"/></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">Nights<select value={nights} onChange={e=>setNights(Number(e.target.value))} className="min-h-12 border border-[#d8cdb8] bg-white px-4">{Array.from({length:12},(_,i)=>i+3).map(n=><option key={n} value={n}>{n} nights</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Adults<select value={adults} onChange={e=>setAdults(Number(e.target.value))} className="min-h-12 border border-[#d8cdb8] bg-white px-4">{Array.from({length:18},(_,i)=>i+1).map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Children 2–11<select value={children} onChange={e=>setChildren(Number(e.target.value))} className="min-h-12 border border-[#d8cdb8] bg-white px-4">{Array.from({length:10},(_,i)=>i).map(n=><option key={n}>{n}</option>)}</select></label>
      </div>
      <div className="grid gap-3 rounded-xl border border-[#c9b88f] bg-[#f8f2e7] p-4 sm:grid-cols-3">
        <div className="flex items-center gap-2"><Ship className="h-4 w-4 text-[#8d7037]"/><span className="text-sm">{tripType}</span></div>
        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8d7037]"/><span className="text-sm">{startDate?pretty(startDate)+" – "+pretty(endDate):"Select dates"}</span></div>
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-[#8d7037]"/><span className="text-sm">{adults} adult{adults===1?"":"s"}{children?", "+children+" child"+(children===1?"":"ren"):""}</span></div>
      </div>
      <div aria-live="polite" className="rounded-xl border border-[#c9b88f] bg-[#f8f2e7] p-5">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8d7037]">Your estimated trip price</p>
        <p className="mt-2 text-3xl font-bold text-[#071922]">{money(price.total)}</p>
        <p className="mt-1 text-xs text-[#58656c]">{nights} nights · {adults} adult{adults===1?"":"s"}{children>0?" · "+children+" child"+(children===1?"":"ren"):""} · all listed taxes included</p>
        <div className="mt-4 grid gap-2 border-t border-[#d8cdb8] pt-4 text-sm">
          <div className="flex justify-between gap-3"><span>Published nightly rate</span><span>{money(price.perNight)}</span></div>
          <div className="flex justify-between gap-3"><span>Accommodation / charter ({nights} nights)</span><span>{money(price.base)}</span></div>
          <div className="flex justify-between gap-3"><span>Service charge (10%)</span><span>{money(price.service)}</span></div>
          <div className="flex justify-between gap-3"><span>TGST (17% on rate + service)</span><span>{money(price.tgst)}</span></div>
          <div className="flex justify-between gap-3"><span>Green Tax ({adults+children} guests × {nights} nights × USD 12)</span><span>{money(price.green)}</span></div>
          <div className="flex justify-between gap-3 border-t border-[#d8cdb8] pt-3 font-bold"><span>Estimated total</span><span>{money(price.total)}</span></div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[#58656c]">Indicative public-rate calculation, not a confirmed offer. Shared trips require an available departure and suitable cabin allocation. Private charter capacity and extra-guest pricing will be checked with NOAH before confirmation. No payment is taken now.</p>
      </div>
      {!validGuests&&<p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Maximum 18 guests per trip.</p>}
      <div className="grid gap-4 md:grid-cols-3"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="min-h-12 border border-[#d8cdb8] bg-white px-4"/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="min-h-12 border border-[#d8cdb8] bg-white px-4"/><input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone / WhatsApp" className="min-h-12 border border-[#d8cdb8] bg-white px-4"/></div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} placeholder="Cabin preference, child ages, dietary requirements or other requests" className="border border-[#d8cdb8] bg-white px-4 py-3"/>
      {status&&<p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{status}</p>}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center"><button disabled={sending||!validGuests} className="btn-gold min-h-12 justify-center disabled:opacity-50"><Mail className="h-4 w-4"/>{sending?"Booking...":"Book NOAH Safari"}</button><p className="text-xs leading-5 text-[#687377]">No payment is taken online. Final availability and price are confirmed before payment.</p></div>
    </form>
  </div></div></section>;
}