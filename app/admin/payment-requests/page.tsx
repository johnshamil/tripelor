"use client";
import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: string; booking_reference: string; property_name: string;
  guest_name: string; guest_email: string; currency: string; estimated_total: number;
  status: string; payment_status: string;
};

export default function AdminPaymentRequests() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [approved, setApproved] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [requestKey, setRequestKey] = useState("");
  useEffect(() => {
    fetch("/api/admin/bookings", { cache: "no-store" })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Admin sign-in is required.");
        setBookings((body.bookings || []).filter((b: Booking) =>
          b.status === "confirmed" && b.currency === "USD" && b.payment_status !== "paid" &&
          !!b.booking_reference && !!b.guest_email
        ));
      })
      .catch(e => setError(e instanceof Error ? e.message : "Unable to load bookings."));
  }, []);
  const selected = useMemo(() => bookings.find(b => b.id === selectedId), [bookings, selectedId]);
  function choose(id: string) {
    setSelectedId(id); setPaymentLink(""); setApproved(false); setRequestKey(crypto.randomUUID());
    const booking = bookings.find(b => b.id === id);
    setFinalAmount(booking && Number.isFinite(Number(booking.estimated_total)) && Number(booking.estimated_total) > 0
      ? Number(booking.estimated_total).toFixed(2) : "");
  }
  async function createLink() {
    if (!selected || !approved || pending) return;
    const n = Number(finalAmount);
    if (!/^\d+(?:\.\d{1,2})?$/.test(finalAmount.trim()) ||
        !Number.isFinite(n) || n <= 0 || n > 1000000) {
      setError("Enter the final approved amount in USD, using at most two decimal places.");
      return;
    }
    setPending(true); setError("");
    try {
      const response = await fetch("/api/admin/bml-live/approve", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: "reservation", bookingId: selected.id,
          finalAmountMinor: Math.round(n * 100), idempotencyKey: requestKey, approveFinalPrice: true
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create payment request.");
      setPaymentLink(new URL(body.paymentUrl, window.location.origin).href);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save payment link."); }
    finally { setPending(false); }
  }
  return <main className="container mx-auto max-w-3xl px-4 py-12 text-white">
    <h1 className="text-3xl font-semibold">BML USD payment requests</h1>
    <p className="mt-3 text-white/75">Only create a payment link after confirming availability and the final guest price. Creating a link does not charge a card. Live checkout stays disabled until Tripelor completes security testing.</p>
    <section className="mt-8 space-y-5 rounded-2xl border border-amber-600/30 bg-[#071922] p-6">
      {error && <p role="alert" className="rounded-lg bg-red-900/50 p-3">{error}</p>}
      <label className="block space-y-2">
        <span className="font-semibold">Confirmed USD reservation</span>
        <select value={selectedId} onChange={e => choose(e.target.value)}
          className="w-full rounded-lg border border-white/40 bg-[#102c34] p-3 text-white">
          <option value="">Select a confirmed booking…</option>
          {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_reference} — {b.guest_name} — {b.property_name}</option>)}
        </select>
      </label>
      {selected && <>
        <div className="rounded-lg border border-white/20 p-4 text-sm">
          <p>Guest: <strong>{selected.guest_name}</strong> ({selected.guest_email})</p>
          <p className="mt-2">Booking: <strong>{selected.booking_reference}</strong></p>
          <p className="mt-2">Previous estimate: USD {Number(selected.estimated_total || 0).toFixed(2)}</p>
        </div>
        <label className="block space-y-2">
          <span className="font-semibold">Final approved USD amount</span>
          <input value={finalAmount} onChange={e => { setFinalAmount(e.target.value); setApproved(false); setPaymentLink(""); }}
            inputMode="decimal" placeholder="0.00"
            className="w-full rounded-lg border border-white/40 bg-[#102c34] p-3 text-white" />
          <span className="block text-xs text-white/70">Verify this final figure with the supplier. It can differ from the preliminary estimate.</span>
        </label>
        <label className="flex items-start gap-3 rounded-lg border border-white/30 p-4 text-sm">
          <input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} className="mt-1 h-5 w-5" />
          <span>I personally reviewed the guest, dates, room availability, approved final USD amount and cancellation conditions. I authorize creating a payment request for this booking.</span>
        </label>
        <button type="button" disabled={!approved || pending || !!paymentLink} onClick={createLink}
          className="w-full rounded-lg bg-amber-400 p-4 font-semibold text-black disabled:opacity-50">
          {pending ? "Creating…" : "Create guest payment link"}
        </button>
      </>}
      {paymentLink && <div role="status" className="rounded-lg border border-emerald-400/40 p-4">
        <p className="font-semibold text-emerald-300">Payment request saved — no card charged</p>
        <a className="mt-3 block break-all text-amber-300 underline" href={paymentLink}>{paymentLink}</a>
        <button type="button" onClick={() => navigator.clipboard.writeText(paymentLink)}
          className="mt-3 rounded-md border border-white/30 px-4 py-2 text-sm">Copy payment link</button>
      </div>}
    </section>
  </main>;
}
