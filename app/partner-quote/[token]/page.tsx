"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

type Brief = {
  reference: string;
  partnerName: string;
  island: string;
  startDate: string | null;
  endDate: string | null;
  datesFlexible: boolean;
  nightsMin: number;
  nightsMax: number;
  adults: number;
  children: number;
  mealPlan: string;
  requirements: string;
  status: string;
  expiresAt: string;
};

export default function PartnerQuotePage({ params }: { params: { token: string } }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [total, setTotal] = useState("");
  const [availability, setAvailability] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    fetch("/api/partner-quote/" + encodeURIComponent(params.token), { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Quotation link unavailable.");
        setBrief(data);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load request."))
      .finally(() => setLoading(false));
  }, [params.token]);

  async function submit(event: FormEvent, action: "quote" | "decline") {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/partner-quote/" + encodeURIComponent(params.token), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action, currency, wholesaleTotal: Number(total), availability,
          inclusions, exclusions, terms,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit response.");
      setSubmitted(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit response.");
    } finally { setBusy(false); }
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading quotation request...</main>;
  if (submitted) return (
    <main className="container max-w-2xl py-24 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
      <h1 className="mt-5 text-3xl font-semibold">Response received</h1>
      <p className="mt-3 text-gray-400">Thank you. Tripelor will review your response and contact you if necessary.</p>
    </main>
  );
  if (!brief) return <main className="container py-20"><p className="text-red-300">{error}</p></main>;

  return (
    <main className="container max-w-4xl py-10 pb-24">
      <Link href="/" className="text-sm font-semibold tracking-wider text-gold">TRIPELOR</Link>
      <div className="mt-6 rounded-2xl border border-gold/20 bg-white/[.025] p-6 md:p-8">
        <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold"><ShieldCheck className="h-4 w-4" /> Private B2B enquiry</p>
        <h1 className="mt-3 text-3xl font-semibold">Hello, {brief.partnerName}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">Tripelor requests your best wholesale quotation. Guest contact details are withheld. This is an enquiry, not a confirmed reservation.</p>
        <p className="mt-5 font-mono text-sm text-gold">{brief.reference}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail label="Travel window" value={brief.datesFlexible ? "Dates flexible — please propose next available dates" : brief.startDate + " to " + brief.endDate} />
          <Detail label="Length of stay" value={brief.nightsMin + "–" + brief.nightsMax + " nights"} />
          <Detail label="Guests" value={brief.adults + " adults · " + brief.children + " children"} />
          <Detail label="Meals" value={brief.mealPlan} />
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs uppercase tracking-widest text-gray-500">Holiday requirements</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-200">{brief.requirements}</p>
        </div>
        {brief.status !== "pending" ? (
          <p className="mt-6 rounded-xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold">A response has already been submitted for this link.</p>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={event => submit(event, "quote")}>
            <h2 className="text-xl font-semibold">Submit your wholesale offer</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-gray-300">Currency
                <select value={currency} onChange={event => setCurrency(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black px-4 text-white">
                  <option value="USD">USD</option><option value="MVR">MVR</option>
                </select>
              </label>
              <label className="block text-sm text-gray-300">Total B2B package price
                <input type="number" min="0.01" max="10000000" step="0.01" required value={total} onChange={event => setTotal(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/15 bg-black/40 px-4 text-white" placeholder="Total for all guests" />
              </label>
            </div>
            <Field label="Room availability and dates" value={availability} onChange={setAvailability} required placeholder="Available room, arrival/departure dates..." />
            <Field label="Inclusions (rooms, meals, transfers, taxes, excursions)" value={inclusions} onChange={setInclusions} required placeholder="List each included service and any conditions..." />
            <Field label="Exclusions or additional costs" value={exclusions} onChange={setExclusions} placeholder="Green Tax, GST, extra excursions..." />
            <Field label="Validity, cancellation and payment terms" value={terms} onChange={setTerms} placeholder="Quote validity, deposit requirements..." />
            {error && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="btn-gold min-h-12 px-6 disabled:opacity-50">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit quotation
              </button>
              <button type="button" disabled={busy} onClick={() => {
                if (window.confirm("Confirm that your property cannot offer availability?")) {
                  const syntheticEvent = { preventDefault() {} } as FormEvent;
                  void submit(syntheticEvent, "decline");
                }
              }} className="btn-outline min-h-12 px-5 disabled:opacity-50">No availability</button>
            </div>
          </form>
        )}
        <p className="mt-7 text-xs text-gray-500">This secure link is for the intended guesthouse only. Do not forward it. Expires {new Date(brief.expiresAt).toLocaleDateString("en-GB")}.</p>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function Field({ label, value, onChange, placeholder, required = false }: {
  label: string; value: string; onChange: (next: string) => void; placeholder: string; required?: boolean;
}) {
  return <label className="block text-sm text-gray-300">{label}
    <textarea value={value} required={required} onChange={event => onChange(event.target.value)} placeholder={placeholder}
      rows={3} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-4 text-sm text-white outline-none focus:border-gold/40" />
  </label>;
}
