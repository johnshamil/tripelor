"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Intent = {
  id: string; bookingReference: string; currency: "USD"; amountMinor: number;
  status: string; termsVersion: string; checkoutEnabled: boolean;
};
export default function BmlPaymentPage({ params }: { params: { id: string } }) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Loading your payment request…");
  useEffect(() => {
    let active = true;
    fetch(`/api/bml/live/checkout?id=${encodeURIComponent(params.id)}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Payment request unavailable.");
        if (active) { setIntent(data); setMessage(""); }
      }).catch(e => { if (active) setMessage(e instanceof Error ? e.message : "Unable to load payment."); });
    return () => { active = false; };
  }, [params.id]);
  async function pay() {
    if (!intent || !accepted || busy || !intent.checkoutEnabled) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/bml/live/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intentId: intent.id, acceptTerms: true, termsVersion: intent.termsVersion }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to start secure checkout.");
      const redirect = new URL(data.checkoutUrl);
      if (redirect.protocol !== "https:" || !redirect.hostname.endsWith(".bankofmaldives.com.mv")) {
        throw new Error("Invalid secure payment destination.");
      }
      window.location.assign(redirect.href);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Payment was not started.");
      setBusy(false);
    }
  }
  return <main className="container mx-auto max-w-xl px-4 py-16 text-white">
    <section className="overflow-hidden rounded-2xl border border-amber-600/40 bg-[#071922] shadow-2xl">
      <header className="bg-black px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Tripelor · Secure Payment</p>
        <h1 className="mt-2 text-3xl font-semibold">Your payment request</h1>
      </header>
      <div className="space-y-5 p-6">
        {message && <p role="status" className="rounded-lg bg-white/10 p-3 text-sm">{message}</p>}
        {intent && <>
          <p>Booking reference: <strong>{intent.bookingReference}</strong></p>
          <div className="flex items-center justify-between border-y border-white/20 py-5">
            <span>Approved final amount</span>
            <strong className="text-2xl text-amber-300">{intent.currency} {(intent.amountMinor / 100).toFixed(2)}</strong>
          </div>
          <p className="text-sm text-white/70">Payment status: {intent.status === "confirmed" ? "Bank-confirmed paid" : intent.status.replace(/_/g," ")}</p>
          {intent.status === "awaiting_payment" && <>
            <div className="space-y-2 text-sm text-white/80">
              <p>Before payment, review Tripelor's <Link className="text-amber-300 underline" href="/travel-info#terms">purchase terms</Link>, <Link className="text-amber-300 underline" href="/travel-info#cancellation">cancellation and refund policy</Link>, and <Link className="text-amber-300 underline" href="/travel-info#payment-security">payment security policy</Link>.</p>
              <label className="flex items-start gap-3 rounded-lg border border-white/30 p-4">
                <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-5 w-5 accent-amber-500" />
                <span>I accept the payment terms and authorize the final amount shown above. I understand Tripelor will redirect me to BML's secure checkout.</span>
              </label>
            </div>
            <button type="button" disabled={!accepted || busy || !intent.checkoutEnabled}
              onClick={pay} className="w-full rounded-lg bg-amber-400 px-6 py-4 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? "Starting secure checkout…" : "Pay securely with BML"}
            </button>
            {!intent.checkoutEnabled && <p className="text-sm text-amber-200">Online card payments are not yet activated. No charge can be made from this page.</p>}
          </>}
          {intent.status === "initiated" && <p className="text-sm text-white/80">Your payment was started. Do not start another transaction; contact Tripelor if the bank did not return a result.</p>}
          {intent.status === "confirmed" && <p className="text-sm text-emerald-300">Bank-confirmed payment has been recorded.</p>}
        </>}
        <p className="text-xs text-white/60">Tripelor never asks for your card number or CVV. Card details are entered on Bank of Maldives' hosted payment page.</p>
        <p className="text-xs text-white/60">Questions? <a className="underline" href="mailto:bookings@tripelor.com">bookings@tripelor.com</a></p>
      </div>
    </section>
  </main>;
}
