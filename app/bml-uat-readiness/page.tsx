"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

type Readiness = {
  eligible: boolean;
  checks: Record<string, boolean>;
  currency: string;
  quotedAmount: number | null;
  bookingReference: string;
  message: string;
  paymentEnabled: false;
};

const labels: Record<string, string> = {
  quotationAccepted: "Quotation accepted by Tripelor",
  quotationUnexpired: "Quotation remains valid",
  bookingConfirmed: "Hotel booking confirmed",
  bookingUnpaid: "Booking has not already been paid",
  guestMatches: "Guest email matches the quotation",
  propertyMatches: "Property matches",
  datesMatch: "Check-in and check-out dates match",
  currencyMvr: "Both records use BML-enabled MVR currency",
  priceMatches: "Final booking and quotation amounts match exactly",
};

export default function BmlUatReadinessPage() {
  const [quoteToken, setQuoteToken] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Readiness | null>(null);

  async function review(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setResult(null);
    setBusy(true);
    try {
      const response = await fetch("/api/bml/uat/readiness", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteToken, bookingReference }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review booking.");
      setResult(data as Readiness);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to review booking.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-[75vh] bg-[#071922] px-5 py-12 text-white">
    <div className="mx-auto max-w-2xl">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#d9bd7b]">
        <ShieldCheck className="h-4 w-4" /> UAT only · No real charges
      </p>
      <h1 className="mt-4 font-display text-3xl md:text-4xl">Tripelor payment readiness</h1>
      <p className="mt-3 text-white/70">Review whether a quotation agrees with a confirmed booking before preparing a BML payment. This tool does not charge a card or update a reservation.</p>
      <form onSubmit={review} className="mt-8 grid gap-4 rounded-2xl border border-white/20 bg-white/5 p-6">
        <label className="grid gap-2 text-sm">
          Quotation share token (UUID)
          <input required value={quoteToken} onChange={event => setQuoteToken(event.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="rounded-lg border border-white/30 bg-[#0f2832] px-4 py-3 text-white" />
        </label>
        <label className="grid gap-2 text-sm">
          Confirmed booking reference
          <input required value={bookingReference} onChange={event => setBookingReference(event.target.value)} placeholder="TRP-..." className="rounded-lg border border-white/30 bg-[#0f2832] px-4 py-3 text-white" />
        </label>
        <button disabled={busy} className="rounded-lg bg-[#d9bd7b] px-5 py-3 font-semibold text-[#071922] disabled:opacity-60">
          {busy ? "Reviewing booking…" : "Check payment readiness"}
        </button>
        {error && <p role="alert" className="rounded-lg border border-red-300/50 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}
      </form>

      {result && <section className="mt-7 rounded-2xl border border-white/20 p-6" aria-live="polite">
        <h2 className="text-xl font-semibold">{result.eligible ? "Booking details match" : "Payment not ready"}</h2>
        <p className="mt-2 text-sm text-white/70">{result.message}</p>
        <p className="mt-4 text-lg font-semibold">{result.currency} {result.quotedAmount?.toFixed(2) ?? "—"}</p>
        <ul className="mt-5 grid gap-3">
          {Object.entries(result.checks).map(([key, passed]) => <li key={key} className="flex items-center gap-2 text-sm">
            {passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
            {labels[key] || key}
          </li>)}
        </ul>
        <p className="mt-5 border-t border-white/20 pt-4 text-sm text-amber-200">Pay Now is intentionally disabled until payment intents, idempotent webhook reconciliation, and BML production approval are completed.</p>
      </section>}

      <div className="mt-6 text-sm text-white/60">
        <Link href="/bml-uat-test" className="underline decoration-[#d9bd7b]">Return to BML UAT smoke test</Link>
      </div>
    </div>
  </main>;
}
