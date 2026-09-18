"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { AlertSelection, alertSetupHref } from '@/lib/availability-alerts';
import { useSiteLanguage } from '@/components/use-site-language';

export default function AvailabilityAlertButton({ selection, light = false }: { selection: AlertSelection; light?: boolean }) {
  const locale = useSiteLanguage();
  const copy = locale === 'it'
    ? { unable:'Impossibile salvare l’avviso.', available:'Buone notizie — questa camera è disponibile ora.', email:(email:string)=>`Ti invieremo un’email a ${email} quando questa camera sarà disponibile per le tue date.`, retry:'Riprova.', saving:'Salvataggio avviso…', notify:'Avvisami quando torna disponibile', book:'Vedi disponibilità e prenota', note:'Un’unica email per questa camera e queste date. L’avviso non riserva la camera.', manage:'Gestisci i miei avvisi' }
    : locale === 'ru'
      ? { unable:'Не удалось сохранить уведомление.', available:'Хорошие новости — этот номер доступен прямо сейчас.', email:(email:string)=>`Мы отправим письмо на ${email}, когда номер появится на ваши даты.`, retry:'Попробуйте ещё раз.', saving:'Сохраняем уведомление…', notify:'Сообщить, когда появится номер', book:'Проверить доступность и забронировать', note:'Одно письмо для этого номера и этих дат. Уведомление не резервирует номер.', manage:'Мои уведомления' }
      : { unable:'Unable to save the alert.', available:'Good news — this room is available now.', email:(email:string)=>`We’ll email ${email} when this room is available for your dates.`, retry:'Please try again.', saving:'Saving alert…', notify:'Notify me if it becomes available', book:'View availability and book', note:'One email for this room and these dates. An alert does not reserve a room.', manage:'Manage my alerts' };
  const [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [message, setMessage] = useState('');
  const [bookingHref, setBookingHref] = useState('');
  async function subscribe() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/availability-alerts', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(selection) });
      const result = await response.json();
      if (response.status === 401) { window.location.href = '/login?next=' + encodeURIComponent(alertSetupHref(selection)); return; }
      if (!response.ok) throw new Error(result.error || copy.unable);
      if (result.available) { setBookingHref(result.bookingHref); setMessage(copy.available); }
      else { setSaved(true); setMessage(copy.email(result.email)); }
    } catch (error) { setMessage(error instanceof Error ? error.message : copy.retry); }
    finally { setBusy(false); }
  }
  return <div className={`mt-4 rounded-2xl border p-4 sm:p-5 ${light ? 'border-[#c9b88f] bg-[#f8f2e7] text-[#40515a]' : 'border-gold/25 bg-gold/5 text-gray-300'}`}>
    {saved ? <p className="flex items-start gap-2 text-sm" role="status"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</p>
      : <><button type="button" onClick={subscribe} disabled={busy} className="btn-gold min-h-12 w-full gap-2 normal-case tracking-normal disabled:opacity-60"><Bell className="h-4 w-4 shrink-0" />{busy ? copy.saving : copy.notify}</button>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}</>}
    {bookingHref && <Link href={bookingHref} className="mt-3 inline-block min-h-11 py-2 text-sm font-semibold underline">{copy.book}</Link>}
    <p className="mt-3 text-xs leading-5">{copy.note}</p>
    <Link href="/account/availability-alerts" className="mt-2 inline-block min-h-11 py-2 text-xs underline underline-offset-4">{copy.manage}</Link>
  </div>;
}
