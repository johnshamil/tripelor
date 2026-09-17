"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, BellOff, ArrowLeft } from 'lucide-react';
import { AlertRoom, AvailabilityAlert, maldivesDate, validateAlertSelection } from '@/lib/availability-alerts';

export default function AvailabilityAlertManager() {
  const [alerts, setAlerts] = useState<AvailabilityAlert[]>([]), [rooms, setRooms] = useState<AlertRoom[]>([]);
  const [propertyName, setProperty] = useState(''), [roomType, setRoom] = useState('');
  const [checkIn, setCheckIn] = useState(''), [checkOut, setCheckOut] = useState('');
  const [email, setEmail] = useState(''), [message, setMessage] = useState(''), [bookingHref, setBookingHref] = useState('');
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  async function load(initial = false) {
    const response = await fetch('/api/account/availability-alerts', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to load alerts.');
    setAlerts(result.alerts); setRooms(result.rooms); setEmail(result.email);
    if (initial) {
      const params = new URLSearchParams(window.location.search);
      const selected = result.rooms.find((room: AlertRoom) => room.propertyName === params.get('property') && room.roomType === params.get('roomType')) || result.rooms[0];
      if (selected) { setProperty(selected.propertyName); setRoom(selected.roomType); }
      setCheckIn(params.get('checkIn') || ''); setCheckOut(params.get('checkOut') || '');
    }
  }
  useEffect(() => { load(true).catch(e => setMessage(e.message)).finally(() => setLoading(false)); }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setMessage(''); setBookingHref(''); setBusy(true);
    try {
      const selection = validateAlertSelection({ propertyName, roomType, checkIn, checkOut, rooms: 1 });
      const response = await fetch('/api/account/availability-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save alert.');
      if (result.available) { setMessage('Good news — your preferred room is already available for these dates.'); setBookingHref(result.bookingHref); }
      else { setMessage(`Alert saved. We’ll email ${result.email} when your room becomes available.`); await load(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  async function cancel(id: string) {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/availability-alerts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error((await response.json()).error || 'Unable to cancel alert.');
      await load(); setMessage('Alert cancelled.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const field = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-white/15 bg-black px-3 py-3 text-white';
  const pretty = (value: string) => new Date(value + 'T00:00:00Z').toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  return <main className="container max-w-4xl py-10 pb-24 md:py-16">
    <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400"><ArrowLeft className="h-4 w-4" />My account</Link>
    <p className="mt-6 text-xs uppercase tracking-[.24em] text-gold">Your preferred stay</p>
    <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold sm:text-4xl"><Bell className="h-7 w-7 shrink-0 text-gold" />Availability alerts</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">Room unavailable? Save your dates and we’ll send one email when it becomes available. You can cancel any time. Rooms and prices remain subject to confirmation.</p>
    {loading ? <p className="mt-8" role="status">Loading your alerts…</p> : <>
      <form onSubmit={save} className="card mt-8 p-5 sm:p-7">
        <h2 className="text-xl font-semibold">Watch a room</h2>
        <p className="mt-2 break-words text-sm text-gray-400">Send my alert to {email || 'my confirmed account email'}.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-sm">Property<select required className={field} value={propertyName} onChange={e => { setProperty(e.target.value); setRoom(rooms.find(r => r.propertyName === e.target.value)?.roomType || ''); }}>{Array.from(new Set(rooms.map(r => r.propertyName))).map(name => <option key={name}>{name}</option>)}</select></label>
          <label className="min-w-0 text-sm">Room<select required className={field} value={roomType} onChange={e => setRoom(e.target.value)}>{rooms.filter(r => r.propertyName === propertyName).map(r => <option key={r.roomType}>{r.roomType}</option>)}</select></label>
          <label className="min-w-0 text-sm">Check-in<input required type="date" min={maldivesDate()} className={field} value={checkIn} onChange={e => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(''); }} /></label>
          <label className="min-w-0 text-sm">Check-out<input required type="date" min={checkIn || maldivesDate()} className={field} value={checkOut} onChange={e => setCheckOut(e.target.value)} /></label>
        </div>
        <button disabled={busy || !rooms.length} className="btn-gold mt-6 min-h-12 w-full gap-2 normal-case tracking-normal disabled:opacity-50"><Bell className="h-4 w-4" />{busy ? 'Saving…' : 'Notify me if it becomes available'}</button>
        <p className="mt-3 text-xs leading-5 text-gray-500">We check regularly until your arrival date. Up to 10 active alerts per account.</p>
      </form>
      {message && <div role="status" className="mt-5 rounded-xl border border-gold/30 p-4 text-sm leading-6">{message}{bookingHref && <Link href={bookingHref} className="mt-2 block font-semibold text-gold underline">View room and book →</Link>}</div>}
      <section className="mt-9"><h2 className="text-xl font-semibold">My alerts</h2>
        {!alerts.length ? <p className="mt-4 rounded-2xl border border-white/10 p-6 text-sm text-gray-400">Your saved alerts will appear here.</p> : <div className="mt-4 grid gap-4">{alerts.map(alert => {
          const status = alert.status === 'active' && alert.check_in < maldivesDate() ? 'expired' : alert.status;
          return <article key={alert.id} className="rounded-2xl border border-white/10 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold">{alert.room_type}</h3><p className="mt-1 text-sm text-gray-400">{alert.property_name}</p></div><span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gold">{status === 'active' ? 'Watching' : status === 'notified' ? 'Email sent' : status === 'expired' ? 'Dates passed' : 'Cancelled'}</span></div><p className="mt-4 text-sm">{pretty(alert.check_in)} – {pretty(alert.check_out)}</p>{status === 'active' && <button type="button" disabled={busy} onClick={() => cancel(alert.id)} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 underline underline-offset-4 disabled:opacity-50"><BellOff className="h-4 w-4" />Cancel alert</button>}</article>;
        })}</div>}
      </section>
    </>}
  </main>;
}
