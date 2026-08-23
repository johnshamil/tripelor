"use client";

import { useState } from "react";
import { CalendarDays, SearchCheck } from "lucide-react";

type Props={roomType:string;propertyName?:string};

export default function AvailabilityChecker({roomType,propertyName="Uhoo's Lavish Oasis"}:Props){
  const [checkIn,setCheckIn]=useState("");
  const [checkOut,setCheckOut]=useState("");
  const [status,setStatus]=useState("");
  const [ok,setOk]=useState<boolean|null>(null);
  const [loading,setLoading]=useState(false);

  async function check(){
    setStatus("");setOk(null);
    if(!checkIn||!checkOut){setStatus("Choose check-in and check-out dates.");return;}
    if(checkOut<=checkIn){setStatus("Check-out must be after check-in.");return;}
    setLoading(true);
    try{
      const r=await fetch("/api/availability",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({propertyName,roomType,checkIn,checkOut,rooms:1})});
      const x=await r.json();
      if(!r.ok)throw new Error(x?.error||"Unable to check availability.");
      const available=Boolean(x.available ?? x.isAvailable ?? x.ok);
      setOk(available);
      setStatus(available?`${roomType} is available for these dates.`:`${roomType} is not available for these dates. Please try different dates.`);
    }catch(e){setStatus(e instanceof Error?e.message:"Unable to check availability.");}
    finally{setLoading(false);}
  }

  const bookingHref=`/booking?property=${encodeURIComponent(propertyName)}&roomType=${encodeURIComponent(roomType)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&mealPlan=Bed%20%26%20Breakfast`;

  return <div className="card p-6 md:p-7">
    <div className="flex items-center gap-3"><SearchCheck className="h-6 w-6 text-gold"/><div><p className="text-xs uppercase tracking-[.22em] text-gold">Live availability</p><h3 className="text-xl font-bold">Check {roomType}</h3></div></div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold"/>Check-in</span><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3"/></label>
      <label className="grid gap-2 text-sm"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold"/>Check-out</span><input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3"/></label>
    </div>
    <button onClick={check} disabled={loading} className="btn-outline mt-5 w-full disabled:opacity-60">{loading?"Checking...":"Check Availability"}</button>
    {status&&<div className={`mt-4 rounded-xl border p-4 text-sm ${ok===true?"border-green-500/30 bg-green-500/5 text-green-200":ok===false?"border-red-500/30 bg-red-500/5 text-red-200":"border-white/10 text-gray-300"}`}>{status}</div>}
    {ok===true&&<a href={bookingHref} className="btn-gold mt-4 w-full">Book {roomType}</a>}
  </div>;
}
