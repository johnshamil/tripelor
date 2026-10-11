"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarPlus, RefreshCw } from "lucide-react";
import { calendarRoomOccupancy, maldivesToday, ManualRoomOption } from "@/lib/manual-booking";

const iso = (date: Date) => date.toISOString().slice(0, 10);
export default function RoomCalendarAdmin() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<ManualRoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [month, setMonth] = useState(() => `${maldivesToday().slice(0, 7)}-01`);
  const [property, setProperty] = useState("");
  const days = useMemo(() => {
    const start = new Date(`${month}T00:00:00Z`);
    const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    return Array.from({ length: last }, (_, index) => iso(new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), index + 1))));
  }, [month]);
  const load = useCallback(async (signal?: AbortSignal) => {
    const next = new Date(`${month}T00:00:00Z`); next.setUTCMonth(next.getUTCMonth() + 1);
    const responses = await Promise.all([fetch(`/api/admin/bookings?from=${month}&to=${iso(next)}`, { cache: "no-store", signal }), fetch("/api/admin/manual-bookings", { cache: "no-store", signal })]);
    const [bookingsResult, roomsResult] = await Promise.all(responses.map(response => response.json()));
    if (responses.some(response => response.status === 401)) { location.href = "/login?next=%2Fadmin%2Froom-calendar"; return; }
    if (!responses[0].ok || !responses[1].ok) throw new Error(bookingsResult.error || roomsResult.error || "Unable to load room calendar.");
    setBookings(bookingsResult.bookings || []); setRooms(roomsResult.rooms || []); setMessage("");
  }, [month]);

  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    load(controller.signal).catch(problem => { if (!controller.signal.aborted) setMessage(problem.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [load]);

  function changeMonth(offset: number) {
    const date = new Date(`${month}T00:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset); setMonth(iso(date));
  }

  return <main className="container py-8 pb-28 md:py-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="flex items-center gap-2 text-xs uppercase tracking-[.22em] text-gold"><CalendarDays className="h-4 w-4" /> Tripelor Admin</p><h1 className="mt-2 text-3xl font-semibold">Room Calendar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">Saved room occupancy across website, direct and external bookings.</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin/manual-bookings" className="btn-gold gap-2"><CalendarPlus className="h-4 w-4" /> Manual Booking</Link><Link href="/admin" className="btn-outline">Admin Dashboard</Link></div>
    </div>
    {message && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 p-4 text-sm text-red-200">{message}</p>}
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4"><label className="grid gap-2 text-sm text-gray-400">Property<select value={property} onChange={event => setProperty(event.target.value)} className="min-h-11 rounded-xl border border-white/10 bg-black px-3 text-white"><option value="">All properties</option>{Array.from(new Set(rooms.map(room => room.propertyName))).map(name => <option key={name}>{name}</option>)}</select></label>
        <div className="grid grid-cols-[44px_1fr_44px_44px] items-center gap-2"><button type="button" aria-label="Previous month" className="btn-outline px-0" onClick={() => changeMonth(-1)}>←</button><strong className="min-w-0 text-center text-sm">{new Date(`${month}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}</strong><button type="button" aria-label="Next month" className="btn-outline px-0" onClick={() => changeMonth(1)}>→</button><button type="button" aria-label="Refresh calendar" disabled={loading} className="btn-outline px-0" onClick={() => { setLoading(true); load().catch(problem => setMessage(problem.message)).finally(() => setLoading(false)); }}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
      </div>
      <p className="mt-4 text-xs leading-5 text-gray-400">Each day shows booked rooms / inventory. Red means all rooms are booked; amber means some are booked. Checkout day is excluded. Availability rules are checked when saving a booking.</p>
      <p className="mt-2 text-xs text-gray-500 sm:hidden">Swipe to see all dates →</p>
      {loading ? <p className="py-8 text-sm text-gray-400">Loading calendar…</p> : <div className="mt-4 overflow-x-auto rounded-xl border border-white/5"><table className="min-w-max border-separate border-spacing-1 text-xs"><thead><tr><th className="sticky left-0 z-20 min-w-[170px] bg-[#06151c] p-2 text-left">Property / room type</th>{days.map(day => <th key={day} className="w-12 p-1 text-center text-gray-400">{Number(day.slice(-2))}</th>)}</tr></thead><tbody>{rooms.filter(room => !property || room.propertyName === property).map(room => <tr key={`${room.propertyName}/${room.roomType}`}><td className="sticky left-0 z-10 max-w-[240px] bg-[#06151c] p-2"><strong className="block truncate">{room.roomType}</strong><span className="mt-1 block truncate text-[10px] text-gray-500">{room.propertyName}</span></td>{days.map(day => {
        const count = calendarRoomOccupancy(bookings, room.propertyName, room.roomType, day);
        return <td key={day} title={`${day}: ${count} rooms booked of ${room.totalRooms}`} className={`h-10 min-w-12 rounded-md border text-center ${count >= room.totalRooms ? "border-red-400/30 bg-red-400/15 text-red-200" : count ? "border-amber-400/25 bg-amber-400/10 text-amber-200" : "border-white/5 bg-white/[.02] text-gray-500"}`}>{count}/{room.totalRooms}</td>;
      })}</tr>)}</tbody></table></div>}
    </section>
  </main>;
}
