"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronUp, Clock3, Loader2, MapPin, Plus, Save, Ship, Trash2, Users } from "lucide-react";

type Schedule = { id: number; operator: string; route: string; day_of_week: number; departure_time: string; active: boolean; capacity: number; price_per_person: number; notes: string };
type TransferRequest = { id: string; request_reference: string; route: string; operator: string; guest_name: string; guest_email: string; guest_phone: string; flight_number: string; arrival_date: string; arrival_time: string; requested_departure: string | null; seats: number; price_per_person: number; total: number; notes: string; status: "pending" | "confirmed" | "declined" | "completed" | "cancelled"; admin_note: string; created_at: string };
type ScheduleForm = { id?: number; operator: string; route: string; dayOfWeek: number; departureTime: string; active: boolean; capacity: number; pricePerPerson: number; notes: string };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const blankSchedule = (): ScheduleForm => ({ operator: "Dream Speed", route: "Male to Felidhoo", dayOfWeek: 0, departureTime: "10:00", active: true, capacity: 20, pricePerPerson: 50, notes: "" });
const niceTime = (value: string | null | undefined) => value ? new Date(`2000-01-01T${value.slice(0, 5)}:00`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "TBC";
const niceDate = (value: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "TBC";

export default function TransferManager() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [openRequests, setOpenRequests] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/transfers", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load transfers.");
      setSchedules(result.schedules || []);
      setRequests(result.requests || []);
      setNotes(Object.fromEntries((result.requests || []).map((item: TransferRequest) => [item.id, item.admin_note || ""])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load transfers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const pendingCount = useMemo(() => requests.filter((request) => request.status === "pending").length, [requests]);
  const activeSchedules = useMemo(() => schedules.filter((schedule) => schedule.active), [schedules]);

  async function saveSchedule() {
    if (!scheduleForm) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "saveSchedule", ...scheduleForm }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save departure.");
      setNotice("Transfer departure saved.");
      setScheduleForm(null);
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save departure.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateSchedule(schedule: Schedule) {
    setBusyId(`schedule-${schedule.id}`); setError("");
    try {
      const response = await fetch("/api/admin/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "deleteSchedule", id: schedule.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to remove departure.");
      setSchedules((current) => current.map((item) => item.id === schedule.id ? { ...item, active: false } : item));
      setNotice("Departure deactivated. Existing requests were not changed.");
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove departure.");
    } finally {
      setBusyId("");
    }
  }

  async function updateRequest(request: TransferRequest) {
    setBusyId(request.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation: "updateRequest", id: request.id, status: request.status, adminNote: notes[request.id] || "" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update transfer request.");
      setRequests((current) => current.map((item) => item.id === request.id ? result.request : item));
      setNotice(result.emailWarning || `Transfer ${request.request_reference} updated.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update transfer request.");
    } finally {
      setBusyId("");
    }
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading transfer manager...</main>;
  return <main className="container py-8 pb-28 md:py-14">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow flex items-center gap-2"><Ship className="h-4 w-4 text-gold" /> Operations</p><h1 className="mt-3 text-3xl font-semibold md:text-5xl">Transfer Manager</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Keep speedboat departures, seat capacity and guest transfer requests in one operational view.</p></div><Link href="/admin" className="btn-outline w-full justify-center sm:w-auto">Admin dashboard</Link></div>
    {notice && <Notice tone="success">{notice}</Notice>}{error && <Notice tone="error">{error}</Notice>}
    <section className="mt-8 grid gap-4 md:grid-cols-3"><Metric label="Active departures" value={activeSchedules.length} detail="Available to the public schedule" icon={<CalendarDays className="h-5 w-5" />}/><Metric label="Pending requests" value={pendingCount} detail="Need a Tripelor decision" icon={<Clock3 className="h-5 w-5" />}/><Metric label="Requests on file" value={requests.length} detail="Latest 300 transfer requests" icon={<Users className="h-5 w-5" />}/></section>

    <section className="mt-8 rounded-2xl border border-gold/20 bg-gold/[.04] p-5 md:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Departure schedule</p><h2 className="mt-2 text-2xl font-semibold">Male → Felidhoo</h2><p className="mt-1 text-sm text-gray-400">These departures power the public Arrival Flight Assistant.</p></div><button type="button" onClick={() => setScheduleForm(blankSchedule())} className="btn-gold gap-2"><Plus className="h-4 w-4" /> Add departure</button></div>
      {scheduleForm && <ScheduleEditor form={scheduleForm} setForm={setScheduleForm} saving={saving} onSave={saveSchedule} onCancel={() => setScheduleForm(null)} />}
      <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-white/10 text-xs uppercase tracking-[.14em] text-gray-500"><tr><th className="pb-3 pr-3">Day</th><th className="pb-3 pr-3">Departure</th><th className="pb-3 pr-3">Operator / route</th><th className="pb-3 pr-3">Capacity</th><th className="pb-3 pr-3">Fare</th><th className="pb-3 text-right">Action</th></tr></thead><tbody>{schedules.map((schedule) => <tr key={schedule.id} className="border-b border-white/5"><td className="py-4 pr-3 font-semibold">{DAYS[schedule.day_of_week] || "Unknown"}</td><td className="py-4 pr-3 text-gold">{niceTime(schedule.departure_time)}</td><td className="py-4 pr-3"><p>{schedule.operator}</p><p className="mt-1 text-xs text-gray-500">{schedule.route}{!schedule.active && <span className="ml-2 text-red-300">Inactive</span>}</p></td><td className="py-4 pr-3">{schedule.capacity} seats</td><td className="py-4 pr-3">USD {Number(schedule.price_per_person || 0).toFixed(2)}</td><td className="py-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => setScheduleForm({ id: schedule.id, operator: schedule.operator, route: schedule.route, dayOfWeek: schedule.day_of_week, departureTime: schedule.departure_time.slice(0, 5), active: schedule.active, capacity: schedule.capacity, pricePerPerson: Number(schedule.price_per_person || 0), notes: schedule.notes || "" })} className="btn-outline px-3 py-2 text-xs">Edit</button>{schedule.active && <button type="button" onClick={() => deactivateSchedule(schedule)} disabled={busyId === `schedule-${schedule.id}`} className="rounded-xl border border-red-400/25 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10 disabled:opacity-50">{busyId === `schedule-${schedule.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>}</div></td></tr>)}</tbody></table>{!schedules.length && <p className="py-8 text-center text-sm text-gray-500">No departures configured yet.</p>}</div>
    </section>

    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6"><button type="button" onClick={() => setOpenRequests((value) => !value)} className="flex w-full items-start justify-between gap-4 text-left"><span><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">Guest requests</p><h2 className="mt-2 text-2xl font-semibold">Transfer inbox{pendingCount > 0 && <span className="ml-2 rounded-full bg-gold px-2.5 py-1 align-middle text-xs text-[#071922]">{pendingCount} pending</span>}</h2><p className="mt-1 text-sm text-gray-400">Confirm seats after checking the operator schedule and the flight arrival.</p></span>{openRequests ? <ChevronUp className="mt-1 h-5 w-5 text-gold" /> : <ChevronDown className="mt-1 h-5 w-5 text-gray-500" />}</button>{openRequests && <div className="mt-5 space-y-3">{requests.map((request) => <article key={request.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-gold">{request.request_reference}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.14em] ${request.status === "confirmed" ? "border-emerald-400/30 text-emerald-200" : request.status === "declined" || request.status === "cancelled" ? "border-red-400/30 text-red-200" : "border-amber-400/30 text-amber-100"}`}>{request.status}</span></div><h3 className="mt-3 text-xl font-semibold">{request.guest_name}</h3><p className="mt-1 text-sm text-gray-400">{request.guest_email} · {request.guest_phone}</p></div><div className="rounded-xl border border-white/10 bg-white/[.025] p-3 text-left lg:min-w-[210px]"><p className="text-xs text-gray-500">Arrival</p><p className="mt-1 font-semibold">{niceDate(request.arrival_date)} · {niceTime(request.arrival_time)}</p><p className="mt-1 text-sm text-gray-400">{request.flight_number || "Flight not provided"}</p></div></div><div className="mt-4 grid gap-3 text-sm text-gray-400 sm:grid-cols-2 lg:grid-cols-4"><Info label="Seats" value={`${request.seats} · USD ${Number(request.total || 0).toFixed(2)}`} /><Info label="Recommended departure" value={niceTime(request.requested_departure)} /><Info label="Route / operator" value={`${request.route} · ${request.operator}`} /><Info label="Guest note" value={request.notes || "None"} /></div><div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-[180px_1fr_auto] md:items-end"><label className="grid gap-2 text-sm"><span className="font-medium text-white/85">Update status</span><select value={request.status} onChange={(event) => setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: event.target.value as TransferRequest["status"] } : item))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-gold">{["pending", "confirmed", "declined", "completed", "cancelled"].map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 text-sm"><span className="font-medium text-white/85">Private admin note</span><textarea rows={2} value={notes[request.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} placeholder="Operator confirmation, payment or seat notes" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-6 outline-none focus:border-gold" /></label><button type="button" onClick={() => updateRequest(request)} disabled={busyId === request.id} className="btn-gold gap-2 disabled:opacity-50">{busyId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save</button></div></article>)}{!requests.length && <p className="rounded-xl border border-white/10 bg-black/10 p-4 text-sm text-gray-500">No transfer requests yet.</p>}</div>}</section>
  </main>;
}

function ScheduleEditor({ form, setForm, saving, onSave, onCancel }: { form: ScheduleForm; setForm: React.Dispatch<React.SetStateAction<ScheduleForm | null>>; saving: boolean; onSave: () => void; onCancel: () => void }) {
  return <div className="mt-5 rounded-2xl border border-gold/25 bg-black/20 p-4"><div className="grid gap-4 md:grid-cols-4"><label className="grid gap-2 text-sm"><span>Day</span><select value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: Number(event.target.value) })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="grid gap-2 text-sm"><span>Departure time</span><input type="time" value={form.departureTime} onChange={(event) => setForm({ ...form, departureTime: event.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label><label className="grid gap-2 text-sm"><span>Operator</span><input value={form.operator} onChange={(event) => setForm({ ...form, operator: event.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label><label className="grid gap-2 text-sm"><span>Route</span><input value={form.route} onChange={(event) => setForm({ ...form, route: event.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label><label className="grid gap-2 text-sm"><span>Capacity</span><input type="number" min={1} max={100} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label><label className="grid gap-2 text-sm"><span>Fare / person (USD)</span><input type="number" min={0} step="0.01" value={form.pricePerPerson} onChange={(event) => setForm({ ...form, pricePerPerson: Number(event.target.value) })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label><label className="flex items-center gap-3 self-end pb-3 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.currentTarget.checked })} className="h-4 w-4 accent-[#d9bd7b]" /> Publicly available</label><label className="grid gap-2 text-sm md:col-span-2"><span>Internal note</span><input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="e.g. Friday schedule differs" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-outline">Cancel</button><button type="button" onClick={onSave} disabled={saving} className="btn-gold gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save departure</button></div></div>;
}

function Metric({ label, value, detail, icon }: { label: string; value: number; detail: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between text-gold"><span className="text-[10px] font-semibold uppercase tracking-[.18em]">{label}</span>{icon}</div><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-gray-500">{detail}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[.02] p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 leading-5 text-gray-300">{value}</p></div>; }
function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) { return <div className={`mt-5 rounded-xl border p-4 text-sm ${tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{children}</div>; }
