"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Plane, Search, Ship, Users } from "lucide-react";

const DEFAULT_PRICE = 50;
type Schedule = { day_of_week: number; departure_time: string; operator: string; capacity?: number; price_per_person?: number };
type FlightInfo = { flightNumber: string; airline: string | null; origin: string | null; arrivalAirport: string | null; arrivalDate: string; arrivalTime: string; terminal: string | null; status: string | null };
const toMinutes = (value: string) => { const [hour, minute] = value.slice(0, 5).split(":").map(Number); return hour * 60 + minute; };
const niceTime = (value: string) => new Date(`2000-01-01T${value.slice(0, 5)}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function SpeedboatPage() {
  const [date, setDate] = useState(""); const [time, setTime] = useState(""); const [flight, setFlight] = useState(""); const [seats, setSeats] = useState("1");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState<Schedule[]>([]); const [status, setStatus] = useState(""); const [sending, setSending] = useState(false);
  const [lookup, setLookup] = useState(false); const [flightInfo, setFlightInfo] = useState<FlightInfo | null>(null); const [lookupStatus, setLookupStatus] = useState("");

  useEffect(() => {
    fetch("/api/speedboat/schedule").then((response) => response.json()).then((result) => setSchedule(result.schedule || [])).catch(() => {});
    fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.json()).then((result) => { if (!result?.user) return; setName((value) => value || result.user.fullName || ""); setEmail((value) => value || result.user.email || ""); }).catch(() => {});
  }, []);

  const recommendation = useMemo(() => {
    if (!date || !time) return null;
    const day = new Date(`${date}T12:00:00Z`).getUTCDay();
    return schedule.filter((item) => item.day_of_week === day && toMinutes(item.departure_time) >= toMinutes(time) + 90).sort((a, b) => toMinutes(a.departure_time) - toMinutes(b.departure_time))[0] || false;
  }, [date, time, schedule]);
  const selectedPrice = Number(recommendation && typeof recommendation === "object" ? recommendation.price_per_person ?? DEFAULT_PRICE : DEFAULT_PRICE);

  async function lookupFlight() {
    setLookupStatus(""); setFlightInfo(null);
    if (!flight.trim()) { setLookupStatus("Enter your flight number first."); return; }
    setLookup(true);
    try {
      const query = new URLSearchParams({ flight: flight.trim() }); if (date) query.set("date", date);
      const response = await fetch(`/api/flight-lookup?${query.toString()}`, { cache: "no-store" }); const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to find this flight.");
      setFlightInfo(result.flight); setFlight(result.flight.flightNumber || flight); setDate(result.flight.arrivalDate); setTime(result.flight.arrivalTime); setLookupStatus("Flight found. Arrival date and time filled automatically.");
    } catch (error) { setLookupStatus(error instanceof Error ? error.message : "Unable to find this flight."); } finally { setLookup(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus("");
    const arrival = new Date(`${date}T${time}:00+05:00`);
    if (Number.isNaN(arrival.getTime())) { setStatus("Please enter a valid arrival date and time."); return; }
    if ((arrival.getTime() - Date.now()) / 3600000 < 24) { setStatus("Please request your speedboat at least 24 hours before arrival."); return; }
    if (recommendation?.capacity && Number(seats) > Number(recommendation.capacity)) { setStatus(`This departure has only ${recommendation.capacity} seats available.`); return; }
    setSending(true);
    try {
      const response = await fetch("/api/speedboat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ arrivalDate: date, arrivalTime: time, flightNumber: flight, recommendedDeparture: recommendation && recommendation.departure_time || null, seats: Number(seats), pricePerPerson: selectedPrice, total: Number(seats) * selectedPrice, fullName: name, email, phone, notes }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || "Unable to send request.");
      setStatus(`Request sent. Reference ${result.requestReference || "created"}. Tripelor will confirm your speedboat and seats.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to send request."); } finally { setSending(false); }
  }

  return <section className="container py-16 md:py-20"><div className="mx-auto max-w-4xl"><p className="text-sm uppercase tracking-[.3em] text-gold">Airport transfer</p><h1 className="mt-2 text-4xl font-bold md:text-6xl">Arrival Flight Assistant</h1><p className="mt-4 text-gray-400">Enter your flight number and Tripelor can look up the scheduled arrival into Malé, then recommend a suitable transfer to V. Felidhoo.</p>
    <div className="card mt-8 p-6"><div className="flex items-center gap-2 text-gold"><Plane className="h-5 w-5" /> <b>Your flight</b></div><div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_auto]"><input value={flight} onChange={(event) => { setFlight(event.target.value.toUpperCase()); setFlightInfo(null); setLookupStatus(""); }} placeholder="Flight number (e.g. EK652)" className="rounded-xl border border-white/10 bg-black px-4 py-3"/><button type="button" onClick={lookupFlight} disabled={lookup} className="btn-gold gap-2"><Search className="h-4 w-4" />{lookup ? "Looking up..." : "Find My Flight"}</button></div><p className="mt-2 text-xs text-gray-500">Optional: choose the arrival date first if the same flight operates every day.</p>{lookupStatus && <div className={`mt-4 rounded-xl border p-4 text-sm ${flightInfo ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-amber-500/30 bg-amber-500/10 text-amber-100"}`}>{lookupStatus}</div>}{flightInfo && <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-gold">Flight found</p><h2 className="mt-1 text-2xl font-bold">{flightInfo.airline ? `${flightInfo.airline} · ` : ""}{flightInfo.flightNumber}</h2><p className="mt-1 text-sm text-gray-400">{flightInfo.origin || "Origin"} → {flightInfo.arrivalAirport || "Velana International Airport"}</p></div><CheckCircle2 className="h-6 w-6 text-emerald-400" /></div><div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4"><Info label="Arrival date" value={flightInfo.arrivalDate} /><Info label="Arrival time" value={niceTime(flightInfo.arrivalTime)} /><Info label="Terminal" value={flightInfo.terminal || "TBC"} /><Info label="Status" value={flightInfo.status || "Scheduled"} /></div></div>}<div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm">Arrival date<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3" /></label><label className="grid gap-2 text-sm">Arrival time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3" /></label></div>{date && time && <div className={`mt-5 rounded-2xl border p-5 ${recommendation ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>{!schedule.length ? <><b>Schedule confirmation required</b><p className="mt-1 text-sm text-gray-300">Send your details and Tripelor will recommend the best transfer.</p></> : recommendation ? <><p className="text-xs uppercase tracking-[.2em] text-emerald-300">Recommended transfer</p><h2 className="mt-1 text-2xl font-bold"><Ship className="mr-2 inline text-gold" />{recommendation.operator || "Dream Speed"} · {niceTime(recommendation.departure_time)}</h2><p className="mt-2 text-sm text-gray-300">Includes approximately 90 minutes after landing for immigration, baggage and airport exit.</p><p className="mt-3 font-semibold text-gold">{seats} passenger{Number(seats) > 1 ? "s" : ""} · USD {Number(seats) * selectedPrice}</p><p className="mt-1 text-xs text-gray-500">Capacity: {recommendation.capacity || "TBC"} seats</p></> : <div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><div><b>No comfortable same-day connection found</b><p className="mt-1 text-sm text-gray-300">There is no scheduled departure at least 90 minutes after your arrival. Send the request and Tripelor will help with the best option.</p></div></div>}</div>}</div>
    <form onSubmit={submit} className="card mt-6 grid gap-5 p-6"><div className="grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-gold/30 bg-gold/10 p-4"><b className="text-gold">USD {selectedPrice} per person</b><p className="mt-1 text-sm text-gray-300">Pay the boat operator or Uhoo&apos;s Lavish Oasis.</p></div><div className="rounded-xl border border-gold/30 bg-gold/10 p-4"><b className="text-gold">Book at least 24 hours ahead</b><p className="mt-1 text-sm text-gray-300">Transfer schedule and seats are subject to confirmation.</p></div></div><label className="grid gap-2 text-sm"><span className="flex gap-2"><Users className="text-gold" />Passengers / seats</span><select value={seats} onChange={(event) => setSeats(event.target.value)} className="rounded-xl border border-white/10 bg-black px-4 py-3">{Array.from({ length: 20 }, (_, index) => index + 1).map((number) => <option key={number}>{number}</option>)}</select></label><div className="grid gap-4 md:grid-cols-3"><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="rounded-xl border border-white/10 bg-black px-4 py-3" /><input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone / WhatsApp" className="rounded-xl border border-white/10 bg-black px-4 py-3" /></div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Transfer notes" className="rounded-xl border border-white/10 bg-black px-4 py-3" />{status && <div className="rounded-xl bg-white/5 p-4 text-sm">{status}</div>}<button disabled={sending} className="btn-gold w-full md:w-auto"><Mail className="h-5 w-5" />{sending ? "Sending..." : "Request Recommended Speedboat"}</button><p className="text-xs text-gray-500">Flight times come from an external aviation-data provider and can change. Final departure and seat availability still require confirmation.</p></form></div></section>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-black/40 p-3"><p className="text-xs text-gray-500">{label}</p><b>{value}</b></div>; }
