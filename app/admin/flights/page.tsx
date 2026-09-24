"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Plane, Search, TicketCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RequestRow = {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  trip_type: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string | null;
  adults: number;
  children: number;
  infants: number;
  cabin: string;
  flexible_dates: boolean;
  notes: string;
  status: string;
  supplier: string;
  airline: string;
  outbound_flight: string;
  return_flight: string;
  baggage: string;
  fare_rules: string;
  base_fare: number;
  taxes: number;
  service_fee: number;
  selling_price: number;
  quote_expires_at?: string | null;
  pnr: string;
  e_ticket_numbers: string;
  admin_notes: string;
  created_at: string;
};

type Draft = {
  status: string;
  supplier: string;
  airline: string;
  outboundFlight: string;
  returnFlight: string;
  baggage: string;
  fareRules: string;
  baseFare: string;
  taxes: string;
  serviceFee: string;
  sellingPrice: string;
  quoteExpiresAt: string;
  pnr: string;
  eTicketNumbers: string;
  adminNotes: string;
};

const statuses = ["new","quoted","payment_pending","paid","ticketed","travelled","cancelled"];

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function makeDraft(row: RequestRow): Draft {
  return {
    status: row.status || "new",
    supplier: row.supplier || "",
    airline: row.airline || "",
    outboundFlight: row.outbound_flight || "",
    returnFlight: row.return_flight || "",
    baggage: row.baggage || "",
    fareRules: row.fare_rules || "",
    baseFare: String(Number(row.base_fare || 0)),
    taxes: String(Number(row.taxes || 0)),
    serviceFee: String(Number(row.service_fee || 0)),
    sellingPrice: String(Number(row.selling_price || 0)),
    quoteExpiresAt: toLocalInput(row.quote_expires_at),
    pnr: row.pnr || "",
    eTicketNumbers: row.e_ticket_numbers || "",
    adminNotes: row.admin_notes || "",
  };
}

export default function AdminFlightsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string,Draft>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const response = await fetch("/api/admin/flights", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) {
      window.location.href = "/login?next=%2Fadmin%2Fflights";
      return;
    }
    if (!response.ok) throw new Error(data.error || "Unable to load Flight Desk.");
    const nextRows = data.requests || [];
    setRows(nextRows);
    const nextDrafts: Record<string,Draft> = {};
    nextRows.forEach((row: RequestRow) => { nextDrafts[row.id] = makeDraft(row); });
    setDrafts(nextDrafts);
  }

  useEffect(() => {
    load().catch(reason => setMessage(reason instanceof Error ? reason.message : "Unable to load Flight Desk.")).finally(() => setLoading(false));
  }, []);

  function update(id: string, key: keyof Draft, value: string) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], [key]: value } }));
  }

  async function save(row: RequestRow) {
    const draft = drafts[row.id];
    if (!draft) return;
    setBusy(row.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/flights", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          status: draft.status,
          supplier: draft.supplier,
          airline: draft.airline,
          outboundFlight: draft.outboundFlight,
          returnFlight: draft.returnFlight,
          baggage: draft.baggage,
          fareRules: draft.fareRules,
          baseFare: Number(draft.baseFare || 0),
          taxes: Number(draft.taxes || 0),
          serviceFee: Number(draft.serviceFee || 0),
          sellingPrice: Number(draft.sellingPrice || 0),
          quoteExpiresAt: draft.quoteExpiresAt,
          pnr: draft.pnr,
          eTicketNumbers: draft.eTicketNumbers,
          adminNotes: draft.adminNotes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update flight request.");
      setMessage("Flight request updated.");
      await load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Unable to update flight request.");
    } finally {
      setBusy("");
    }
  }

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter(row => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const haystack = [
        row.reference,row.customer_name,row.customer_email,row.customer_phone,row.origin,row.destination,
        row.airline,row.outbound_flight,row.return_flight,row.pnr
      ].join(" ").toLowerCase();
      return matchesStatus && (!search || haystack.includes(search));
    });
  }, [rows, query, statusFilter]);

  if (loading) return <main className="container py-20 text-gray-400">Loading Flight Desk...</main>;

  const openCount = rows.filter(row => !["travelled","cancelled"].includes(row.status)).length;
  const ticketedCount = rows.filter(row => row.status === "ticketed").length;
  const value = rows.filter(row => !["cancelled"].includes(row.status)).reduce((sum,row) => sum + Number(row.selling_price || 0), 0);

  return (
    <main className="container py-8 pb-24 md:py-14">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
            <Plane className="h-4 w-4" /> Tripelor Flight Desk
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Flight Requests & Ticketing</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Quote flights from your authorized airline, GDS or consolidator source, record the selling price, then track payment and ticket issuance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Open" value={String(openCount)} />
          <Stat label="Ticketed" value={String(ticketedCount)} />
          <Stat label="Quoted value" value={"$" + value.toFixed(0)} />
        </div>
      </div>

      {message && <p className="mt-5 rounded-xl border border-gold/20 bg-gold/[.05] p-4 text-sm text-white/80">{message}</p>}

      <div className="mt-7 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search reference, passenger, route, airline, flight or PNR" className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm outline-none focus:border-gold/40" />
        </div>
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="min-h-12 rounded-xl border border-white/10 bg-black px-4 text-sm">
          <option value="all">All statuses</option>
          {statuses.map(status => <option key={status} value={status}>{status.replace("_"," ")}</option>)}
        </select>
      </div>

      <section className="mt-6 grid gap-5">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-10 text-center text-gray-500">No flight requests match these filters.</div>
        ) : visible.map(row => {
          const draft = drafts[row.id] || makeDraft(row);
          const profit = Number(draft.sellingPrice || 0) - Number(draft.baseFare || 0) - Number(draft.taxes || 0);
          return (
            <article key={row.id} className="rounded-[1.5rem] border border-white/10 bg-white/[.025] p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold">{row.reference}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] capitalize text-gray-300">{row.status.replace("_"," ")}</span>
                    {row.flexible_dates && <span className="rounded-full border border-gold/20 bg-gold/[.05] px-3 py-1 text-[10px] text-gold">Flexible dates</span>}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold">{row.customer_name}</h2>
                  <p className="mt-1 text-sm text-gray-400">{row.customer_email}{row.customer_phone ? " · " + row.customer_phone : ""}</p>
                  <p className="font-display mt-4 text-3xl">{row.origin} → {row.destination}</p>
                  <p className="mt-2 text-sm text-gray-400">
                    {row.departure_date}{row.return_date ? " → " + row.return_date : ""} · {row.trip_type} · {row.cabin}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{row.adults} adult(s) · {row.children} child(ren) · {row.infants} infant(s)</p>
                  {row.notes && <p className="mt-3 max-w-3xl text-xs leading-5 text-gray-500">Customer note: {row.notes}</p>}
                </div>
                <p className="text-[10px] text-gray-600">{new Date(row.created_at).toLocaleString()}</p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                <AdminField label="Supplier / consolidator"><input value={draft.supplier} onChange={event => update(row.id,"supplier",event.target.value)} className="admin-flight-control" /></AdminField>
                <AdminField label="Airline"><input value={draft.airline} onChange={event => update(row.id,"airline",event.target.value)} className="admin-flight-control" /></AdminField>
                <AdminField label="Outbound flight"><input value={draft.outboundFlight} onChange={event => update(row.id,"outboundFlight",event.target.value.toUpperCase())} className="admin-flight-control" /></AdminField>
                <AdminField label="Return flight"><input value={draft.returnFlight} onChange={event => update(row.id,"returnFlight",event.target.value.toUpperCase())} className="admin-flight-control" /></AdminField>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <AdminField label="Base fare"><Money value={draft.baseFare} onChange={value => update(row.id,"baseFare",value)} /></AdminField>
                <AdminField label="Taxes"><Money value={draft.taxes} onChange={value => update(row.id,"taxes",value)} /></AdminField>
                <AdminField label="Service fee"><Money value={draft.serviceFee} onChange={value => update(row.id,"serviceFee",value)} /></AdminField>
                <AdminField label="Tripelor selling price"><Money value={draft.sellingPrice} onChange={value => update(row.id,"sellingPrice",value)} /></AdminField>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Info label="Calculated gross margin" value={"USD " + profit.toFixed(2)} />
                <Info label="Selling price" value={"USD " + Number(draft.sellingPrice || 0).toFixed(2)} />
                <Info label="Cost + taxes" value={"USD " + (Number(draft.baseFare || 0) + Number(draft.taxes || 0)).toFixed(2)} />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <AdminField label="Baggage allowance"><textarea value={draft.baggage} onChange={event => update(row.id,"baggage",event.target.value)} className="admin-flight-control min-h-24" /></AdminField>
                <AdminField label="Fare rules / changes / refunds"><textarea value={draft.fareRules} onChange={event => update(row.id,"fareRules",event.target.value)} className="admin-flight-control min-h-24" /></AdminField>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <AdminField label="Quote expires"><input type="datetime-local" value={draft.quoteExpiresAt} onChange={event => update(row.id,"quoteExpiresAt",event.target.value)} className="admin-flight-control" /></AdminField>
                <AdminField label="Airline PNR"><input value={draft.pnr} onChange={event => update(row.id,"pnr",event.target.value.toUpperCase())} className="admin-flight-control" /></AdminField>
                <AdminField label="E-ticket number(s)"><textarea value={draft.eTicketNumbers} onChange={event => update(row.id,"eTicketNumbers",event.target.value)} className="admin-flight-control min-h-14" /></AdminField>
                <AdminField label="Workflow status">
                  <select value={draft.status} onChange={event => update(row.id,"status",event.target.value)} className="admin-flight-control">
                    {statuses.map(status => <option key={status} value={status}>{status.replace("_"," ")}</option>)}
                  </select>
                </AdminField>
              </div>

              <AdminField label="Internal Flight Desk notes">
                <textarea value={draft.adminNotes} onChange={event => update(row.id,"adminNotes",event.target.value)} className="admin-flight-control mt-2 min-h-24" />
              </AdminField>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
                <p className="text-xs leading-5 text-gray-500">Moving to Quoted, Paid or Ticketed can email the customer when email delivery is configured. Ticketed requires PNR and e-ticket number(s).</p>
                <button type="button" onClick={() => save(row)} disabled={busy === row.id} className="btn-gold disabled:opacity-40">
                  {draft.status === "ticketed" ? <TicketCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  {busy === row.id ? "Saving..." : "Save Flight"}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-[10px] font-semibold uppercase tracking-[.12em] text-gray-500">{label}<div className="mt-2">{children}</div></label>;
}

function Money({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input type="number" min="0" step="0.01" value={value} onChange={event => onChange(event.target.value)} className="admin-flight-control" />;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[.035] p-3"><p className="text-[9px] uppercase tracking-[.1em] text-gray-500">{label}</p><p className="mt-1 text-sm font-semibold text-gray-200">{value}</p></div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[.025] px-4 py-3"><p className="text-[9px] uppercase tracking-[.1em] text-gray-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
