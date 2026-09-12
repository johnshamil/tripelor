"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock3, Eye, Loader2, MessageSquare, X } from "lucide-react";
import type { ManagedProperty } from "@/lib/property-model";

type SubmissionRow = {
  id: string;
  property_id: string;
  partner_email: string;
  data: Partial<ManagedProperty>;
  note: string;
  created_at: string;
  property: ManagedProperty;
};

export default function PropertySubmissionInbox({ onApproved }: { onApproved?: (property: ManagedProperty) => void }) {
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [openId, setOpenId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/properties/submissions", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load partner submissions.");
      setRows(result.submissions || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load partner submissions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function review(row: SubmissionRow, action: "approve" | "reject") {
    setBusyId(row.id);
    setError("");
    try {
      const response = await fetch("/api/admin/properties/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, action, reviewerNote: notes[row.id] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to review this submission.");
      if (action === "approve" && result.property) onApproved?.(result.property as ManagedProperty);
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review this submission.");
    } finally {
      setBusyId("");
    }
  }

  return <section className="mt-8 rounded-2xl border border-gold/20 bg-gold/[.04] p-5 md:p-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold"><Clock3 className="h-4 w-4" /> Partner review queue</p><h2 className="mt-2 text-2xl font-semibold">Guesthouse updates{rows.length > 0 && <span className="ml-2 rounded-full bg-gold px-2.5 py-1 align-middle text-xs text-[#071922]">{rows.length}</span>}</h2><p className="mt-1 text-sm text-gray-400">Review proposed partner changes before they replace the live listing.</p></div>{!loading && rows.length > 0 && <p className="text-xs text-gold">Nothing is published automatically.</p>}</div>
    {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
    {loading ? <p className="mt-5 text-sm text-gray-500">Checking for pending updates...</p> : !rows.length ? <p className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-gray-500">No pending partner updates.</p> : <div className="mt-5 space-y-3">{rows.map((row) => {
      const data = row.data || {};
      const open = openId === row.id;
      return <article key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-[10px] uppercase tracking-[.18em] text-gold">{row.property.island || "Island not set"}</p><h3 className="mt-1 text-lg font-semibold">{data.name || row.property.name || "Untitled property"}</h3><p className="mt-1 text-xs text-gray-500">{row.partner_email} · submitted {new Date(row.created_at).toLocaleDateString()}</p></div><button type="button" onClick={() => setOpenId(open ? "" : row.id)} className="btn-outline gap-2 self-start px-3 py-2 text-xs"><Eye className="h-3.5 w-3.5" /> {open ? "Hide proposal" : "View proposal"}{open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button></div>{row.note && <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/10 bg-white/[.025] p-3 text-sm leading-6 text-gray-300"><MessageSquare className="mt-1 h-4 w-4 shrink-0 text-gold" />{row.note}</p>}{open && <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 text-sm text-gray-400 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-[.16em] text-gray-500">Proposed content</p><p className="mt-2 line-clamp-4 leading-6">{data.description || "No description supplied."}</p></div><div><p className="text-xs uppercase tracking-[.16em] text-gray-500">Commercial update</p><p className="mt-2 leading-6">{Array.isArray(data.rooms) ? data.rooms.length : 0} room rates · {Array.isArray(data.seasonalRates) ? data.seasonalRates.length : 0} seasonal rates · {Array.isArray(data.inventoryRules) ? data.inventoryRules.length : 0} inventory rules · {Array.isArray(data.photos) ? data.photos.length : 0} photos</p></div></div>}<textarea value={notes[row.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))} rows={2} placeholder="Optional note to keep with this decision" className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 outline-none transition focus:border-gold"/><div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => review(row, "reject")} disabled={busyId === row.id} className="btn-outline gap-2 border-red-400/30 text-red-200 hover:bg-red-500/10 disabled:opacity-50">{busyId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject</button><button type="button" onClick={() => review(row, "approve")} disabled={busyId === row.id} className="btn-gold gap-2 disabled:opacity-50">{busyId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve update</button></div></article>;
    })}</div>}
  </section>;
}
