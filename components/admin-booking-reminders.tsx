"use client";

import Link from "next/link";
import { BellRing, Check, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { bookingMoney } from "@/lib/manual-booking";

type Reminder = { id: string; readAt: string | null; guestName: string; reference: string; propertyName: string; checkIn: string; rooms: number; roomTypes: string; daysUntilArrival: number; amount: number; currency: string };
export default function AdminBookingReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/admin/booking-reminders", { cache: "no-store", signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load arrival reminders.");
    setReminders(result.reminders || []); setEmailEnabled(result.emailEnabled); setError(""); setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      load(controller.signal).catch(problem => {
        if (!controller.signal.aborted) { setError(problem.message || "Unable to load reminders."); setLoading(false); }
      });
    };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);

  async function markRead(id: string) {
    setBusy(id); setError("");
    try {
      const response = await fetch("/api/admin/booking-reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update reminder.");
      setReminders(current => current.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Unable to update reminder."); }
    finally { setBusy(""); }
  }

  return (
    <section id="arrival-reminders" className="mt-6 rounded-2xl border border-gold/30 bg-gold/[.05] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="flex items-center gap-2 text-lg font-semibold"><BellRing className="h-5 w-5 text-gold" /> Arrival reminders <span className="rounded-full bg-gold px-2 py-0.5 text-xs text-black">{reminders.filter(item => !item.readAt).length} unread</span></h2><p className="mt-1 text-xs leading-5 text-gray-400">Bookings arriving in the next two days · Maldives time. Reminders also go to the admin email.</p></div>
        <button type="button" disabled={loading} onClick={() => { setLoading(true); load().catch(problem => { setError(problem.message); setLoading(false); }); }} className="inline-flex min-h-11 items-center gap-2 text-sm text-gold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
      {!emailEnabled && <p className="mt-3 text-xs text-amber-200">Arrival reminders are available here. Admin email delivery still needs configuration.</p>}
      {loading && !reminders.length ? <p className="mt-4 text-sm text-gray-400">Loading arrival reminders…</p> : !reminders.length && !error ? <p className="mt-4 text-sm text-gray-400">No bookings are arriving in the next two days.</p> : (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">{reminders.map(item => <article key={item.id} className={`rounded-xl border p-4 ${item.readAt ? "border-white/10 bg-black/10" : "border-gold/30 bg-gold/[.04]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold text-gold">{item.daysUntilArrival === 0 ? "Arrival today" : item.daysUntilArrival === 1 ? "Arrival tomorrow" : "Arrival in 2 days"}</p><h3 className="mt-1 font-semibold">{item.guestName}</h3></div><span className="text-xs text-gray-400">{item.checkIn}</span></div>
          <p className="mt-2 text-sm text-gray-300">{item.propertyName} · {item.rooms} room{item.rooms === 1 ? "" : "s"}</p><p className="mt-1 text-xs leading-5 text-gray-400">{item.roomTypes}</p>
          <p className="mt-2 text-xs text-gray-400">{item.reference} · {bookingMoney(item.amount, item.currency)}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><Link href="/admin#bookings" className="inline-flex min-h-10 items-center text-xs font-semibold text-gold">View bookings →</Link>{item.readAt ? <span className="flex items-center gap-1 text-xs text-gray-500"><Check className="h-3 w-3" /> Read</span> : <button type="button" disabled={!!busy} onClick={() => markRead(item.id)} className="min-h-10 text-xs text-gray-300 hover:text-white disabled:opacity-40">{busy === item.id ? "Updating…" : "Mark as read"}</button>}</div>
        </article>)}</div>
      )}
    </section>
  );
}
