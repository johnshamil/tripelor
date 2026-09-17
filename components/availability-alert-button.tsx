"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { AlertSelection, alertSetupHref } from '@/lib/availability-alerts';

export default function AvailabilityAlertButton({ selection, light = false }: { selection: AlertSelection; light?: boolean }) {
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [message, setMessage] = useState('');
  const [bookingHref, setBookingHref] = useState('');
  async function subscribe() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/availability-alerts', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection) });
      const result = await response.json();
      if (response.status === 401) { window.location.href = '/login?next=' + encodeURIComponent(alertSetupHref(selection)); return; }
      if (!response.ok) throw new Error(result.error || 'Unable to save the alert.');
      if (result.available) { setBookingHref(result.bookingHref); setMessage('Good news — this room is available now.'); }
      else { setSaved(true); setMessage(`We’ll email ${result.email} when this room is available for your dates.`); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className={`mt-4 rounded-2xl border p-4 sm:p-5 ${light ? 'border-[#c9b88f] bg-[#f8f2e7] text-[#40515a]' : 'border-gold/25 bg-gold/5 text-gray-300'}`}>
    {saved ? <p className="flex items-start gap-2 text-sm" role="status"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</p>
      : <><button type="button" onClick={subscribe} disabled={busy} className="btn-gold min-h-12 w-full gap-2 normal-case tracking-normal disabled:opacity-60"><Bell className="h-4 w-4 shrink-0" />{busy ? 'Saving alert…' : 'Notify me if it becomes available'}</button>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}</>}
    {bookingHref && <Link href={bookingHref} className="mt-3 inline-block min-h-11 py-2 text-sm font-semibold underline">View availability and book</Link>}
    <p className="mt-3 text-xs leading-5">One email for this room and these dates. An alert does not reserve a room.</p>
    <Link href="/account/availability-alerts" className="mt-2 inline-block min-h-11 py-2 text-xs underline underline-offset-4">Manage my alerts</Link>
  </div>;
}
