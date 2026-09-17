"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { QuotedLine } from "@/lib/trip-cart";

type Booking = { id: string; booking_reference: string; status: string; items: QuotedLine[]; estimated_total: number; guest_name: string; guest_email: string; guest_phone: string; notes: string; created_at: string; notification_sent_at?: string | null };
export default function CartBookingHistory({ admin = false }: { admin?: boolean }) {
  const [requests, setRequests] = useState<Booking[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetch(`${admin ? "/api/admin/cart-bookings" : "/api/cart-booking"}?offset=${offset}`, { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load booking requests.");
      if (active) { setRequests(data.requests); setHasMore(data.hasMore); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [admin, offset, reload]);
  return <section className="container py-10 pb-28 md:py-16">
    <Link href={admin ? "/admin" : "/account"} className="inline-flex min-h-11 items-center text-sm text-gold">← {admin ? "Admin home" : "My account"}</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm uppercase tracking-[.2em] text-gold">Packages & excursions</p><h1 className="font-display mt-3 text-4xl">{admin ? "Cart booking requests" : "My booking requests"}</h1></div><button type="button" onClick={() => setReload(value => value + 1)} disabled={loading} className="btn-outline min-h-11">Refresh</button></div>
    <p className="mt-4 max-w-3xl leading-7 text-gray-300">{admin ? "Review each customer’s combined selection, dates and contact details. Requests need availability and payment confirmation before a booking is final." : "Your selected packages and excursions, together in one request. Tripelor will contact you to confirm availability and payment details."}</p>
    {loading ? <p role="status" className="py-10 text-gray-300">Loading booking requests…</p> : error ? <p role="alert" className="mt-8 rounded-xl border border-red-400/30 p-5 text-red-200">{error}</p> : requests.length === 0 ? <div className="card mt-8 p-8"><h2 className="text-2xl">No booking requests yet</h2>{!admin && <Link href="/island-adventures" className="btn-gold mt-5">Explore packages & excursions</Link>}</div> : <div className="mt-8 space-y-6">{requests.map(request => <article key={request.id} className="card min-w-0 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="break-all text-xl font-semibold text-gold">{request.booking_reference}</h2><p className="mt-2 text-sm text-gray-400">Requested {new Date(request.created_at).toLocaleDateString("en-GB", { timeZone: "Indian/Maldives" })}</p></div><span className="rounded-full border border-gold/30 px-3 py-2 text-sm text-gold">{request.status === "pending" ? "Awaiting confirmation" : request.status === "confirmed" ? "Confirmed" : "Cancelled"}</span></div>
      {admin && <div className="mt-5 space-y-1 border-y border-white/10 py-4 text-sm"><p className="font-semibold">{request.guest_name}</p><p className="break-all text-gray-300">{request.guest_email}</p><p className="text-gray-300">{request.guest_phone}</p>{!request.notification_sent_at && <p className="pt-2 text-gold">Saved here; email notification has not been confirmed.</p>}</div>}
      <ul className="mt-5 divide-y divide-white/10">{request.items.map(item => <li key={item.productId} className="py-4 first:pt-0"><div className="flex flex-wrap justify-between gap-3"><h3 className="font-semibold">{item.name}</h3><strong>USD {item.lineTotal.toLocaleString("en-US")}</strong></div><p className="mt-2 text-sm text-gray-300">{item.quantity} {item.unit === "couple" ? item.quantity === 1 ? "couple" : "couples" : item.quantity === 1 ? "guest" : "guests"} × USD {item.unitPrice} {item.duration ? `· ${item.duration}` : ""}</p><p className="mt-1 text-sm text-gray-300">{item.nights ? "Check-in" : "Preferred date"}: {item.date}{item.checkOut ? ` · Check-out: ${item.checkOut}` : ""}</p><details className="mt-2 text-sm text-gray-400"><summary className="min-h-10 cursor-pointer py-2">Included in this request</summary><ul className="list-disc space-y-1 pl-5">{item.inclusions.map(text => <li key={text}>{text}</li>)}</ul></details></li>)}</ul>
      {request.notes && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-gray-300"><strong>Notes:</strong> {request.notes}</p>}
      <p className="mt-5 border-t border-white/10 pt-4 text-right text-lg">Estimated total: <strong className="text-gold">USD {Number(request.estimated_total).toLocaleString("en-US")}</strong></p>
    </article>)}</div>}
    {!loading && !error && (offset > 0 || hasMore) && <div className="mt-6 flex justify-between gap-4"><button type="button" disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))} className="btn-outline disabled:opacity-40">Previous</button><button type="button" disabled={!hasMore} onClick={() => setOffset(value => value + 20)} className="btn-outline disabled:opacity-40">Next</button></div>}
  </section>;
}
