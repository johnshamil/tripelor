"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { BellRing, CalendarPlus, CheckCircle2, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { allocateManualRooms, AUTOMATIC_ROOM_TYPE, bookingMoney, ManualRoomAvailability, ManualRoomOption, ManualRoomSelection, manualRoomTotal, stayNights } from "@/lib/manual-booking";

type RoomLine = { id: string; roomType: string; quantity: string; nightlyRate: string };
const emptyForm = { propertyName: "", guestName: "", guestEmail: "", guestPhone: "", checkIn: "", checkOut: "", adults: "2", children: "0", mealPlan: "", bookingSource: "Manual", externalReference: "", notes: "", paymentStatus: "unpaid", currency: "USD" };
const newLine = (id: string, roomType = ""): RoomLine => ({ id, roomType, quantity: "1", nightlyRate: "" });
const control = "min-h-[48px] min-w-0 w-full rounded-xl border border-white/10 bg-[#06151c] px-3 py-3 text-sm text-white outline-none focus:border-gold/60";

export default function ManualBookingForm({ options }: { options: ManualRoomOption[] }) {
  const [form, setForm] = useState(emptyForm);
  const [lines, setLines] = useState<RoomLine[]>([newLine("first")]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState<{ reference: string; rooms: number; total: number; currency: string } | null>(null);
  const [availability, setAvailability] = useState<{ key: string; rooms: ManualRoomAvailability[]; error: string } | null>(null);
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  const requestId = useRef("");
  const properties = Array.from(new Set(options.map(room => room.propertyName)));
  const roomOptions = options.filter(room => room.propertyName === form.propertyName);
  const nights = stayNights(form.checkIn, form.checkOut);
  const availabilityKey = form.propertyName && nights ? JSON.stringify([form.propertyName, form.checkIn, form.checkOut, availabilityVersion]) : "";
  const checkedAvailability = availability?.key === availabilityKey ? availability : null;
  const checkingAvailability = Boolean(availabilityKey && !checkedAvailability);
  const availableRooms: ManualRoomAvailability[] = checkedAvailability?.rooms.length ? checkedAvailability.rooms : roomOptions.map(room => ({ ...room, roomsAvailable: room.totalRooms }));
  const availableCount = availableRooms.reduce((sum, room) => sum + room.roomsAvailable, 0);
  const automatic = lines.some(line => line.roomType === AUTOMATIC_ROOM_TYPE);
  let selections: ManualRoomSelection[] = [];
  let selectionError = "";
  if (form.propertyName && lines.every(line => line.roomType)) {
    try {
      if (new Set(lines.map(line => line.roomType)).size !== lines.length) throw new Error("Choose each room type once and adjust its quantity.");
      selections = lines.flatMap(line => allocateManualRooms(availableRooms, { roomType: line.roomType, quantity: Number(line.quantity), nightlyRate: Number(line.nightlyRate) }));
      if (selections.length > 20 || selections.reduce((sum, room) => sum + room.quantity, 0) > 100) throw new Error("Use up to 100 rooms and 20 room types in one booking.");
    } catch (problem) { selectionError = problem instanceof Error ? problem.message : "Check the room selection."; }
  }
  const roomCount = lines.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const total = lines.reduce((sum, line) => sum + manualRoomTotal({ roomType: line.roomType, quantity: Number(line.quantity), nightlyRate: Number(line.nightlyRate) }, nights), 0);

  useEffect(() => {
    if (!availabilityKey || saved) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ propertyName: form.propertyName, checkIn: form.checkIn, checkOut: form.checkOut });
    fetch(`/api/admin/manual-bookings?${query}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to check availability.");
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, rooms: result.rooms, error: "" });
      })
      .catch(problem => {
        if (!controller.signal.aborted) setAvailability({ key: availabilityKey, rooms: [], error: problem instanceof Error ? problem.message : "Unable to check availability." });
      });
    return () => controller.abort();
  }, [availabilityKey, form.propertyName, form.checkIn, form.checkOut, availabilityVersion, saved]);

  function refreshAvailability() {
    setAvailability(null);
    setAvailabilityVersion(current => current + 1);
  }

  function field(name: keyof typeof emptyForm, value: string) {
    setForm(current => ({ ...current, [name]: value }));
    setError("");
  }

  function roomField(id: string, name: keyof RoomLine, value: string) {
    setLines(current => current.map(line => line.id === id ? { ...line, [name]: value, ...(name === "roomType" && value !== AUTOMATIC_ROOM_TYPE ? { nightlyRate: "" } : {}) } : line));
    setError("");
  }

  function changeProperty(propertyName: string) {
    field("propertyName", propertyName);
    const choices = options.filter(room => room.propertyName === propertyName);
    setLines([newLine("first", choices.length > 1 ? AUTOMATIC_ROOM_TYPE : choices[0]?.roomType || "")]);
    setNotice("");
  }

  function useIndividualTypes() {
    setLines(selections.map(room => ({ id: crypto.randomUUID(), roomType: room.roomType, quantity: String(room.quantity), nightlyRate: lines[0].nightlyRate })));
    setError("");
  }

  function changeCurrency(currency: string) {
    field("currency", currency);
    setLines(current => current.map(line => ({ ...line, nightlyRate: "" })));
    setNotice(`Enter the room prices in ${currency}.`);
  }

  function reset() {
    setForm(emptyForm); setLines([newLine("first")]); setSaved(null); setAvailability(null); setError(""); setNotice(""); requestId.current = "";
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!checkedAvailability || checkedAvailability.error || selectionError || !selections.length) { setError(checkedAvailability?.error || selectionError || "Choose your dates and wait for the room availability check."); return; }
    if (lines.some(line => line.nightlyRate.trim() === "")) { setError("Enter a price per room per night."); return; }
    setError(""); setSaving(true);
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/admin/manual-bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        ...form, requestId: requestId.current, adults: Number(form.adults), children: Number(form.children),
        rooms: selections,
      }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) refreshAvailability();
        throw new Error(result.error || "Unable to save booking.");
      }
      setSaved(result);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Unable to save booking. Please try again."); }
    finally { setSaving(false); }
  }

  if (saved) return (
    <section className="mt-7 rounded-2xl border border-emerald-400/30 bg-emerald-400/[.06] p-6" role="status">
      <CheckCircle2 className="h-8 w-8 text-emerald-300" />
      <h2 className="mt-4 text-2xl font-semibold">Booking saved</h2>
      <p className="mt-2 font-mono text-gold">{saved.reference}</p>
      <p className="mt-3 text-sm text-gray-300">{saved.rooms} room{saved.rooms === 1 ? "" : "s"} · {bookingMoney(saved.total, saved.currency)}</p>
      <p className="mt-2 text-sm leading-6 text-gray-400">The rooms are reserved for these dates. An admin reminder is scheduled for two days before arrival; bookings arriving sooner are included straight away.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="btn-gold" onClick={reset}>New booking</button>
        <Link href="/admin#bookings" className="btn-outline">View bookings</Link>
        <Link href="/admin/room-calendar" className="btn-outline">Room calendar</Link>
      </div>
    </section>
  );

  return (
    <form onSubmit={submit} className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <fieldset disabled={saving} className="min-w-0 space-y-5 disabled:opacity-70">
        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <h2 className="text-lg font-semibold">Guest & travel</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Guest name"><input required maxLength={200} autoComplete="name" className={control} value={form.guestName} onChange={event => field("guestName", event.target.value)} placeholder="Guest full name" /></Field>
            <Field label="Phone / WhatsApp"><input type="tel" maxLength={80} autoComplete="tel" className={control} value={form.guestPhone} onChange={event => field("guestPhone", event.target.value)} placeholder="+960…" /></Field>
            <Field label="Guest email (optional)"><input type="email" maxLength={250} autoComplete="email" className={control} value={form.guestEmail} onChange={event => field("guestEmail", event.target.value)} placeholder="guest@email.com" /></Field>
            <Field label="Booking source"><select className={control} value={form.bookingSource} onChange={event => field("bookingSource", event.target.value)}>{["Manual", "WhatsApp", "Phone", "Walk-in", "Booking.com", "Agoda", "Other"].map(source => <option key={source}>{source}</option>)}</select></Field>
            <Field label="Check-in"><input required type="date" className={control} value={form.checkIn} onChange={event => field("checkIn", event.target.value)} /></Field>
            <Field label="Check-out"><input required type="date" min={form.checkIn || undefined} className={control} value={form.checkOut} onChange={event => field("checkOut", event.target.value)} /></Field>
            <Field label="Adults"><input required type="number" min={1} max={200} step={1} className={control} value={form.adults} onChange={event => field("adults", event.target.value)} /></Field>
            <Field label="Children"><input required type="number" min={0} max={200} step={1} className={control} value={form.children} onChange={event => field("children", event.target.value)} /></Field>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <h2 className="text-lg font-semibold">Rooms & price</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
            <Field label="Property"><select required className={control} value={form.propertyName} onChange={event => changeProperty(event.target.value)}><option value="">Choose property</option>{properties.map(property => <option key={property}>{property}</option>)}</select></Field>
            <Field label="Currency"><select className={control} value={form.currency} onChange={event => changeCurrency(event.target.value)}><option value="USD">USD</option><option value="MVR">MVR</option></select></Field>
          </div>
          {notice && <p role="status" className="mt-3 text-xs text-gold">{notice}</p>}
          {form.propertyName && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm">
            <p role="status" className="flex items-center gap-2 text-gray-300">{checkingAvailability ? <><Loader2 className="h-4 w-4 animate-spin text-gold" /> Checking availability…</> : checkedAvailability?.error ? "Availability check failed" : checkedAvailability ? <><CheckCircle2 className="h-4 w-4 text-gold" /><strong className="text-white">{availableCount}</strong> room{availableCount === 1 ? "" : "s"} available for your dates</> : `${availableCount} rooms in this property · choose dates to check availability`}</p>
            {availabilityKey && <button type="button" disabled={checkingAvailability} onClick={refreshAvailability} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-gold disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" /> Check again</button>}
          </div>}
          <div className="mt-5 space-y-4">
            {lines.map((line, index) => {
              const isAutomatic = line.roomType === AUTOMATIC_ROOM_TYPE;
              const roomLimit = isAutomatic ? availableCount : availableRooms.find(room => room.roomType === line.roomType)?.roomsAvailable;
              return (
              <div key={line.id} className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold text-gold">{isAutomatic ? "Choose the number of rooms" : `Room type ${index + 1}`}</p>{lines.length > 1 && <button type="button" aria-label={`Remove room type ${index + 1}`} onClick={() => { setLines(current => current.filter(item => item.id !== line.id)); setError(""); }} className="flex min-h-10 min-w-10 items-center justify-center text-gray-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>}</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px_150px]">
                  <Field label="Room type"><select required disabled={!form.propertyName} className={control} value={line.roomType} onChange={event => roomField(line.id, "roomType", event.target.value)}><option value="">Choose room type</option>{lines.length === 1 && roomOptions.length > 1 && <option value={AUTOMATIC_ROOM_TYPE}>Split across available room types</option>}{availableRooms.map(room => <option key={room.roomType} value={room.roomType} disabled={lines.some(item => item.id !== line.id && item.roomType === room.roomType) || (Boolean(checkedAvailability && !checkedAvailability.error) && !room.roomsAvailable)}>{room.roomType} · {room.roomsAvailable} {checkedAvailability && !checkedAvailability.error ? "available" : "in inventory"}</option>)}</select></Field>
                  <Field label="Rooms"><input required type="number" min={1} max={Math.max(1, Math.min(100, roomLimit ?? 100))} step={1} className={control} value={line.quantity} onChange={event => roomField(line.id, "quantity", event.target.value)} /></Field>
                  <Field label={`Per room / night · ${form.currency}`}><input required type="number" min={0} max={1000000} step="0.01" inputMode="decimal" className={control} value={line.nightlyRate} onChange={event => roomField(line.id, "nightlyRate", event.target.value)} placeholder="0.00" /></Field>
                </div>
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-gray-400"><span>{roomLimit ?? "—"} room{roomLimit === 1 ? "" : "s"} {checkedAvailability && !checkedAvailability.error && !checkingAvailability ? "available for these dates" : "in inventory"}</span><strong className="text-gold">{bookingMoney(manualRoomTotal({ roomType: line.roomType, quantity: Number(line.quantity), nightlyRate: Number(line.nightlyRate) }, nights), form.currency)}</strong></div>
                {isAutomatic && <div className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-gray-400">
                  <p>Your price applies to each room. Review the room types before saving.</p>
                  {!selectionError && selections.length > 0 && <ul aria-label="Allocated room types" className="mt-2 space-y-1 text-gray-200">{selections.map(room => <li key={room.roomType}>{room.quantity} × {room.roomType}</li>)}</ul>}
                  {!selectionError && selections.length > 0 && <button type="button" onClick={useIndividualTypes} className="mt-2 min-h-9 text-left font-semibold text-gold">Set different prices by room type</button>}
                </div>}
                {!isAutomatic && lines.length === 1 && roomOptions.length > 1 && roomLimit !== undefined && Number(line.quantity) > roomLimit && <button type="button" onClick={() => roomField(line.id, "roomType", AUTOMATIC_ROOM_TYPE)} className="mt-3 min-h-10 text-left text-xs font-semibold text-gold">Split these rooms across available room types</button>}
              </div>
            ); })}
          </div>
          {!automatic && <button type="button" disabled={!form.propertyName || lines.length >= 20 || lines.length >= roomOptions.length} onClick={() => { setLines(current => [...current, newLine(crypto.randomUUID())]); setError(""); }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold disabled:opacity-40"><Plus className="h-4 w-4" /> Add another room type</button>}
          <p className="mt-3 text-xs leading-5 text-gray-400">Availability is checked again when you save, and all selected rooms are booked together.</p>
          <Field label="Meal plan"><select className={`${control} mt-2`} value={form.mealPlan} onChange={event => field("mealPlan", event.target.value)}><option value="">Choose meal plan (optional)</option>{["Room Only", "Bed & Breakfast", "Half Board", "Full Board", "All Inclusive"].map(plan => <option key={plan}>{plan}</option>)}</select></Field>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <h2 className="text-lg font-semibold">Payment & notes</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Payment status"><select className={control} value={form.paymentStatus} onChange={event => field("paymentStatus", event.target.value)}><option value="unpaid">Unpaid</option><option value="partial">Partially paid</option><option value="paid">Paid</option></select></Field>
            <Field label="External reference (optional)"><input maxLength={150} className={control} value={form.externalReference} onChange={event => field("externalReference", event.target.value)} placeholder="Booking.com / Agoda reference" /></Field>
          </div>
          <label className="mt-4 grid gap-2 text-sm text-gray-300">Booking notes<textarea rows={3} maxLength={4000} className={control} value={form.notes} onChange={event => field("notes", event.target.value)} placeholder="Arrival, transfer or payment notes" /></label>
        </section>
      </fieldset>

      <aside className="rounded-2xl border border-gold/30 bg-gold/[.06] p-5 lg:sticky lg:top-28">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold">Booking summary</p>
        <h2 className="mt-3 text-xl font-semibold">{form.guestName || "Guest booking"}</h2>
        <p className="mt-2 text-sm text-gray-400">{form.propertyName || "Choose your property"}</p>
        {nights > 0 && <p className="mt-2 text-xs text-gray-400">{form.checkIn} → {form.checkOut}</p>}
        <div className="mt-5 space-y-3 border-y border-white/10 py-4 text-sm"><p className="flex justify-between"><span className="text-gray-400">Rooms</span><strong>{roomCount}</strong></p><p className="flex justify-between"><span className="text-gray-400">Nights</span><strong>{nights || "—"}</strong></p><p className="flex justify-between"><span className="text-gray-400">Currency</span><strong>{form.currency}</strong></p></div>
        <p className="mt-4 text-xs text-gray-400">Total booking price</p>
        <p className="mt-1 text-3xl font-semibold text-gold">{bookingMoney(total, form.currency)}</p>
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-gray-400"><BellRing className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Admin reminder two days before check-in, using Maldives dates.</p>
        {(error || checkedAvailability?.error || (!checkingAvailability && checkedAvailability && selectionError)) && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{error || checkedAvailability?.error || selectionError}</p>}
        <button type="submit" disabled={saving || !options.length || !nights || !checkedAvailability || Boolean(checkedAvailability.error) || Boolean(selectionError) || !selections.length} className="btn-gold mt-5 w-full justify-center gap-2 px-3 disabled:opacity-40"><CalendarPlus className="h-4 w-4" /> {saving ? "Saving…" : checkingAvailability ? "Checking rooms…" : "Save booking"}</button>
        <p className="mt-3 text-xs leading-5 text-gray-500">Saving confirms the booking and blocks all selected rooms together.</p>
      </aside>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid min-w-0 gap-2 text-sm text-gray-300">{label}{children}</label>;
}
