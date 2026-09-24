"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Luggage, Plane, ShieldCheck, TicketCheck } from "lucide-react";
import { useEffect, useState } from "react";

type FlightRequest = {
  id: string;
  reference: string;
  trip_type: "one-way" | "round-trip";
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin: string;
  status: string;
  airline?: string | null;
  outbound_flight?: string | null;
  return_flight?: string | null;
  baggage?: string | null;
  fare_rules?: string | null;
  selling_price?: number | null;
  quote_expires_at?: string | null;
  pnr?: string | null;
  e_ticket_numbers?: string | null;
  created_at: string;
};

function tone(status: string) {
  if (status === "ticketed" || status === "travelled") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (status === "paid") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
  if (status === "quoted" || status === "payment_pending") return "border-gold/30 bg-gold/10 text-gold";
  if (status === "cancelled") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-white/10 bg-white/[.04] text-gray-300";
}

function label(status: string) {
  const labels: Record<string,string> = {
    new: "Fare request received",
    quoted: "Quote ready",
    payment_pending: "Payment pending",
    paid: "Paid · awaiting ticketing",
    ticketed: "Ticket issued",
    travelled: "Travel completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export default function AccountFlightsPage() {
  const [requests, setRequests] = useState<FlightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/account/flights", { cache: "no-store" });
        const data = await response.json();
        if (response.status === 401) {
          window.location.href = "/login?next=%2Faccount%2Fflights";
          return;
        }
        if (!response.ok) throw new Error(data.error || "Unable to load your flights.");
        setRequests(data.requests || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your flights.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="container py-20 text-gray-400">Loading My Flights...</main>;

  return (
    <main className="container py-8 pb-24 md:py-14">
      <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to My Tripelor
      </Link>

      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
            <Plane className="h-4 w-4" /> Flights by Tripelor
          </p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">My Flights</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400">
            Track fare requests, quotes, payment, PNR and e-ticket details in one place.
          </p>
        </div>
        <Link href="/flights" className="btn-gold">Request a Flight <ArrowRight className="h-4 w-4" /></Link>
      </div>

      {error && <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}

      {requests.length === 0 ? (
        <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[.025] p-8 text-center">
          <Plane className="mx-auto h-8 w-8 text-gold" />
          <h2 className="font-display mt-4 text-3xl">No flight requests yet.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">
            Send your route, dates and passenger details. Tripelor will check an authorized fare source and send you a quote.
          </p>
          <Link href="/flights" className="btn-gold mt-6">Request My Fare</Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-5">
          {requests.map((request) => {
            const ticketed = request.status === "ticketed" || request.status === "travelled";
            const quoted = Number(request.selling_price || 0) > 0;
            const expires = request.quote_expires_at ? new Date(request.quote_expires_at) : null;
            const expired = Boolean(expires && expires.getTime() < Date.now() && request.status === "quoted");
            const whatsapp = "https://wa.me/9609429403?text=" + encodeURIComponent("Hello Tripelor, I need help with flight request " + request.reference + ".");
            return (
              <article key={request.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.025]">
                <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[1fr_280px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold">{request.reference}</span>
                      <span className={"rounded-full border px-3 py-1.5 text-[10px] font-semibold " + tone(request.status)}>{label(request.status)}</span>
                      {expired && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] text-red-300">Quote expired</span>}
                    </div>

                    <h2 className="font-display mt-5 text-3xl">{request.origin} → {request.destination}</h2>
                    <p className="mt-2 text-sm text-gray-400">
                      {request.trip_type === "round-trip" ? "Round-trip" : "One-way"} · {request.cabin} · {request.adults} adult(s), {request.children} child(ren), {request.infants} infant(s)
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Info label="Departure" value={request.departure_date} />
                      <Info label="Return" value={request.return_date || "One-way"} />
                      <Info label="Airline" value={request.airline || "Checking fare"} />
                      <Info label="Flight" value={request.outbound_flight || "To be confirmed"} />
                    </div>

                    {quoted && (
                      <div className="mt-5 rounded-xl border border-gold/20 bg-gold/[.05] p-5">
                        <p className="text-[9px] uppercase tracking-[.15em] text-gray-500">Tripelor selling price</p>
                        <p className="font-display mt-1 text-3xl text-gold">USD {Number(request.selling_price).toFixed(2)}</p>
                        {expires && <p className="mt-2 text-xs text-gray-400">Quote valid until {expires.toLocaleString()}</p>}
                        {request.baggage && <p className="mt-4 flex gap-2 text-sm leading-6 text-gray-300"><Luggage className="mt-1 h-4 w-4 shrink-0 text-gold" /> {request.baggage}</p>}
                        {request.fare_rules && <details className="mt-4 text-sm leading-6 text-gray-400"><summary className="cursor-pointer font-semibold text-white">Fare rules</summary><p className="mt-3 whitespace-pre-line">{request.fare_rules}</p></details>}
                      </div>
                    )}

                    {ticketed && (
                      <div className="mt-5 rounded-xl border border-emerald-500/25 bg-emerald-500/[.06] p-5">
                        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><TicketCheck className="h-5 w-5" /> Ticket issued</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <Info label="Airline PNR" value={request.pnr || "—"} />
                          <Info label="E-ticket number(s)" value={request.e_ticket_numbers || "—"} />
                        </div>
                        <p className="mt-4 flex gap-2 text-xs leading-5 text-gray-400"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> Verify passenger names, dates, flight numbers and baggage immediately after issuance.</p>
                      </div>
                    )}
                  </div>

                  <aside className="h-fit rounded-xl border border-white/10 bg-black/20 p-5">
                    <CalendarDays className="h-5 w-5 text-gold" />
                    <p className="mt-3 text-[9px] uppercase tracking-[.15em] text-gray-500">Created</p>
                    <p className="mt-1 text-sm text-gray-300">{new Date(request.created_at).toLocaleString()}</p>
                    <a href={whatsapp} className="btn-outline mt-5 w-full justify-center">Contact Flight Desk</a>
                  </aside>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[.035] p-4">
      <p className="text-[9px] uppercase tracking-[.14em] text-gray-500">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-semibold text-gray-200">{value}</p>
    </div>
  );
}
