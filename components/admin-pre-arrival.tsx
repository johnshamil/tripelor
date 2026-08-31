"use client";

import {CheckCircle2, Clock3, Headphones, MessageCircle, Plane, Ship, Sparkles, Utensils, Waves} from "lucide-react";
import {useEffect, useMemo, useState} from "react";

type ConciergeRequest = {
  reservation_id: string;
  guest_email: string;
  guest_name?: string | null;
  booking_reference?: string | null;
  property_name: string;
  check_in: string;
  check_out: string;
  flight_number?: string | null;
  arrival_time?: string | null;
  transfer_preference?: string | null;
  bed_preference?: string | null;
  dietary?: string | null;
  celebration?: string | null;
  interests?: string[] | null;
  special_request?: string | null;
  status?: string | null;
  submitted_at?: string | null;
};

const statuses = ["new", "reviewing", "confirmed", "completed"] as const;

function badge(status?: string | null) {
  const value = String(status || "new").toLowerCase();
  if (value === "completed") return "border-emerald-300/25 bg-emerald-400/10 text-emerald-200";
  if (value === "confirmed") return "border-sky-300/25 bg-sky-400/10 text-sky-200";
  if (value === "reviewing") return "border-amber-300/25 bg-amber-400/10 text-amber-100";
  return "border-gold/30 bg-gold/10 text-gold";
}

function prettyDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {day: "2-digit", month: "short", year: "numeric"}).format(new Date(`${value}T00:00:00Z`));
}

export default function AdminPreArrival() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const r = await fetch("/api/admin/pre-arrival", {cache: "no-store"});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Unable to load concierge requests.");
    setRequests(data.requests || []);
  }

  useEffect(() => {
    load().catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load concierge requests.")).finally(() => setLoading(false));
  }, []);

  async function changeStatus(reservationId: string, status: string) {
    setBusy(reservationId);
    setError("");
    try {
      const r = await fetch("/api/admin/pre-arrival", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({reservationId, status}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to update concierge request.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update concierge request.");
    } finally {
      setBusy("");
    }
  }

  const openCount = useMemo(
    () => requests.filter(item => !["completed"].includes(String(item.status || "new").toLowerCase())).length,
    [requests],
  );

  return (
    <section id="pre-arrival-concierge" className="mt-10 overflow-hidden rounded-[2rem] border border-gold/20 bg-[radial-gradient(circle_at_top_right,rgba(201,168,106,.12),transparent_36%)]">
      <div className="flex flex-col gap-5 border-b border-white/10 p-6 md:flex-row md:items-end md:justify-between md:p-8">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-gold">
            <Headphones className="h-4 w-4" /> Guest Experience
          </p>
          <h2 className="font-display mt-2 text-3xl md:text-4xl">Pre-Arrival Concierge</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Review flight details, transfers, room preferences, dietary notes and island experiences before each guest arrives.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="border border-white/10 bg-white/[.03] px-5 py-3">
            <p className="font-display text-2xl text-gold">{requests.length}</p>
            <p className="text-[9px] uppercase tracking-[.16em] text-gray-500">Total</p>
          </div>
          <div className="border border-white/10 bg-white/[.03] px-5 py-3">
            <p className="font-display text-2xl text-white">{openCount}</p>
            <p className="text-[9px] uppercase tracking-[.16em] text-gray-500">Open</p>
          </div>
        </div>
      </div>

      {error && <div className="m-6 border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200 md:mx-8">{error}</div>}

      {loading ? (
        <p className="p-8 text-sm text-gray-500">Loading concierge requests...</p>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center md:p-12">
          <Sparkles className="mx-auto h-7 w-7 text-gold" />
          <p className="mt-3 text-gray-400">No pre-arrival requests have been submitted yet.</p>
        </div>
      ) : (
        <div className="grid gap-px bg-white/10 lg:grid-cols-2">
          {requests.map(item => {
            const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Tripelor concierge follow-up for ${item.guest_name || item.guest_email} · ${item.property_name} · ${item.booking_reference || item.reservation_id}`)}`;
            return (
              <article key={item.reservation_id} className="bg-[#071922] p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[.2em] text-gold">{item.booking_reference || "Booking reference pending"}</p>
                    <h3 className="mt-2 text-xl font-semibold">{item.guest_name || "Tripelor Guest"}</h3>
                    <p className="mt-1 text-sm text-gray-500">{item.guest_email}</p>
                  </div>
                  <span className={`border px-3 py-2 text-[9px] font-semibold uppercase tracking-[.14em] ${badge(item.status)}`}>
                    {item.status || "new"}
                  </span>
                </div>

                <div className="mt-5 border-y border-white/10 py-4">
                  <p className="font-semibold">{item.property_name}</p>
                  <p className="mt-1 text-xs text-gray-500">{prettyDate(item.check_in)} → {prettyDate(item.check_out)}</p>
                </div>

                <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                  <Info icon={Plane} label="Flight" value={[item.flight_number, item.arrival_time].filter(Boolean).join(" · ") || "Not provided"} />
                  <Info icon={Ship} label="Transfer" value={item.transfer_preference || "Not provided"} />
                  <Info icon={Utensils} label="Dietary" value={item.dietary || "No dietary note"} />
                  <Info icon={Waves} label="Experiences" value={item.interests?.length ? item.interests.join(", ") : "No experiences selected"} />
                </div>

                {(item.bed_preference || item.celebration || item.special_request) && (
                  <div className="mt-5 space-y-3 border border-white/10 bg-white/[.025] p-4 text-sm">
                    {item.bed_preference && <Detail label="Bed preference" value={item.bed_preference} />}
                    {item.celebration && <Detail label="Celebration" value={item.celebration} />}
                    {item.special_request && <Detail label="Special request" value={item.special_request} />}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {statuses.map(status => (
                    <button
                      key={status}
                      disabled={busy === item.reservation_id || status === String(item.status || "new").toLowerCase()}
                      onClick={() => changeStatus(item.reservation_id, status)}
                      className="border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-gray-400 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {status === "completed" && <CheckCircle2 className="mr-1 inline h-3 w-3" />}
                      {status}
                    </button>
                  ))}
                  <a href={whatsapp} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-2 border border-gold/25 bg-gold/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-gold">
                    <MessageCircle className="h-3.5 w-3.5" /> Follow up
                  </a>
                </div>

                {item.submitted_at && (
                  <p className="mt-4 flex items-center gap-2 text-[10px] text-gray-600">
                    <Clock3 className="h-3 w-3" /> Submitted {new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(new Date(item.submitted_at))}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Info({icon: Icon, label, value}: {icon: typeof Plane; label: string; value: string}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <div>
        <p className="text-[9px] uppercase tracking-[.16em] text-gray-600">{label}</p>
        <p className="mt-1 leading-5 text-gray-300">{value}</p>
      </div>
    </div>
  );
}

function Detail({label, value}: {label: string; value: string}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[.16em] text-gray-600">{label}</p>
      <p className="mt-1 leading-5 text-gray-300">{value}</p>
    </div>
  );
}
