"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail, MessageCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  reference: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  travel_month: string;
  adults: number;
  children: number;
  nights: number;
  budget_usd: number;
  deal_type: string;
  destination: string;
  revealed_property: string;
  revealed_room: string;
  estimated_total: number;
  marketing_consent: boolean;
  status: "new" | "contacted" | "quoted" | "booked" | "closed";
  created_at: string;
};

const statuses: Lead["status"][] = ["new","contacted","quoted","booked","closed"];

export default function SecretDealLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const response = await fetch("/api/admin/secret-deal-leads", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) {
      window.location.href = "/login?next=%2Fadmin%2Fsecret-deal-leads";
      return;
    }
    if (!response.ok) throw new Error(data.error || "Unable to load Secret Deal leads.");
    setLeads(data.leads || []);
  }

  useEffect(() => {
    load().catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load leads.")).finally(() => setLoading(false));
  }, []);

  async function setStatus(id: string, status: Lead["status"]) {
    setBusy(id);
    setError("");
    try {
      const response = await fetch("/api/admin/secret-deal-leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update lead.");
      setLeads(current => current.map(item => item.id === id ? { ...item, status } : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update lead.");
    } finally {
      setBusy("");
    }
  }

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return leads.filter(lead => !search || [
      lead.reference,
      lead.name,
      lead.email,
      lead.whatsapp,
      lead.country,
      lead.deal_type,
      lead.destination,
      lead.revealed_property,
      lead.revealed_room,
    ].join(" ").toLowerCase().includes(search));
  }, [leads, query]);

  if (loading) return <main className="container py-20 text-gray-400">Loading Secret Deal leads...</main>;

  return (
    <main className="container py-8 pb-24 md:py-14">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Customer acquisition</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Secret Deal Leads</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Visitors who unlocked private Tripelor offers. Follow up quickly while their travel intent is fresh.</p>
        </div>
        <div className="rounded-xl border border-gold/20 bg-gold/[.05] px-5 py-4">
          <p className="text-[10px] uppercase tracking-[.18em] text-gray-500">Total leads</p>
          <p className="mt-1 text-3xl font-semibold text-gold">{leads.length}</p>
        </div>
      </div>

      {error && <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}

      <div className="relative mt-7">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, country, property, deal type or reference" className="min-h-12 w-full rounded-xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm outline-none focus:border-gold/40" />
      </div>

      <section className="mt-6 grid gap-4">
        {visible.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[.02] p-10 text-center text-gray-500">No Secret Deal leads yet.</div>
        ) : visible.map(lead => {
          const whatsappHref = lead.whatsapp
            ? `https://wa.me/${lead.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${lead.name}, this is Tripelor regarding your Secret Deal request ${lead.reference}.`)}`
            : "";
          return (
            <article key={lead.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-gold">{lead.reference}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] capitalize text-gray-300">{lead.status}</span>
                    {lead.marketing_consent && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] text-emerald-300">Deal drops opt-in</span>}
                  </div>

                  <h2 className="mt-3 text-xl font-semibold">{lead.name}</h2>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400">
                    {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-gold" /> {lead.email}</a>}
                    {lead.whatsapp && <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4 text-gold" /> {lead.whatsapp}</a>}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Info label="Travel" value={`${lead.adults} adult(s) · ${lead.children} child(ren) · ${lead.nights} nights`} />
                    <Info label="Month / Country" value={`${lead.travel_month || "Flexible"} · ${lead.country || "—"}`} />
                    <Info label="Budget" value={Number(lead.budget_usd) ? `USD ${Number(lead.budget_usd).toFixed(2)}` : "Flexible"} />
                    <Info label="Deal" value={`${lead.deal_type} · ${lead.destination}`} />
                  </div>

                  <div className="mt-4 rounded-xl border border-gold/15 bg-gold/[.04] p-4">
                    <p className="text-[9px] uppercase tracking-[.16em] text-gray-500">Top unlocked option</p>
                    <p className="mt-2 font-semibold">{lead.revealed_property || "No automatic match"}{lead.revealed_room ? ` · ${lead.revealed_room}` : ""}</p>
                    {Number(lead.estimated_total) > 0 && <p className="mt-1 text-sm text-gold">Starting estimate: USD {Number(lead.estimated_total).toFixed(2)}</p>}
                    <p className="mt-2 text-xs text-gray-500">Confirm property availability, taxes and the final Tripelor selling price before quoting.</p>
                  </div>
                </div>

                <div className="flex min-w-[180px] flex-col gap-2">
                  {statuses.map(status => (
                    <button key={status} type="button" disabled={busy === lead.id || lead.status === status} onClick={() => setStatus(lead.id, status)} className={`min-h-10 rounded-full border px-4 text-xs font-semibold capitalize disabled:opacity-35 ${lead.status === status ? "border-gold bg-gold text-black" : "border-white/10 text-gray-400 hover:border-gold/30 hover:text-white"}`}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-[10px] text-gray-600">{new Date(lead.created_at).toLocaleString()}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[.035] p-3">
      <p className="text-[9px] uppercase tracking-[.1em] text-gray-500">{label}</p>
      <p className="mt-1 text-xs leading-5 text-gray-300">{value}</p>
    </div>
  );
}
