"use client";
import {useState} from "react";
export default function CharterRequest({vessel}:{vessel:string}){
 const [arrival,setArrival]=useState("");const [departure,setDeparture]=useState("");const [guests,setGuests]=useState(4);const [name,setName]=useState("");const [contact,setContact]=useState("");
 const valid=!!name.trim()&&!!contact.trim()&&!!arrival&&!!departure&&departure>arrival&&guests>=1;
 const message=["Voyages Maldives private charter booking request","Vessel: "+vessel,"Guest name: "+name,"Contact: "+contact,"Arrival: "+arrival,"Departure: "+departure,"Guests: "+guests,"Please confirm availability, total price including taxes, and payment instructions. I understand this is a request, not a confirmed reservation."].join("\n");
 return <form onSubmit={e=>{e.preventDefault();if(valid)window.open("https://wa.me/9609429403?text="+encodeURIComponent(message),"_blank","noopener,noreferrer")}} className="mt-5 space-y-3 rounded-xl border border-white/15 p-4">
 <p className="font-semibold text-white">Start a charter booking</p>
 <div className="grid grid-cols-2 gap-2"><label className="text-xs text-white/70">Arrival<input required type="date" value={arrival} onChange={e=>setArrival(e.target.value)} className="mt-1 w-full rounded bg-white p-2 text-[#06151c]"/></label><label className="text-xs text-white/70">Departure<input required type="date" min={arrival||undefined} value={departure} onChange={e=>setDeparture(e.target.value)} className="mt-1 w-full rounded bg-white p-2 text-[#06151c]"/></label></div>
 <label className="block text-xs text-white/70">Guests<input required type="number" min="1" max="30" value={guests} onChange={e=>setGuests(Number(e.target.value))} className="mt-1 w-full rounded bg-white p-2 text-[#06151c]"/></label>
 <label className="block text-xs text-white/70">Your name<input required value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded bg-white p-2 text-[#06151c]"/></label>
 <label className="block text-xs text-white/70">Email or WhatsApp<input required value={contact} onChange={e=>setContact(e.target.value)} className="mt-1 w-full rounded bg-white p-2 text-[#06151c]"/></label>
 <button disabled={!valid} type="submit" className="btn-gold w-full disabled:opacity-40">Send Booking Request</button>
 <p className="text-xs leading-5 text-white/55">Opens WhatsApp with your details. Tripelor will check availability with Voyages before confirming any booking or requesting payment.</p>
 </form>
}