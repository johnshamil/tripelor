"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, ClipboardCopy, FileText, Mail, Plus, Send, ShieldCheck } from "lucide-react";

type Partner = { id: string; name: string; island: string; email: string; active: boolean };
type Enquiry = {
  id: string; reference: string; guest_name: string; guest_email: string; guest_phone: string;
  start_date: string; end_date: string; nights_min: number; nights_max: number;
  adults: number; children: number; budget_usd: number; meal_plan: string;
  requirements: string; status: string; created_at: string;
};
type Forward = {
  id: string; enquiry_id: string; partner_id: string; secure_token: string;
  status: string; email_status: string; expires_at: string;
  currency: string; wholesale_total: number | null;
  availability: string; inclusions: string; exclusions: string; terms: string;
};
type EnquiryForm = {
  guestName: string; guestEmail: string; guestPhone: string; startDate: string;
  endDate: string; nightsMin: string; nightsMax: string; adults: string; children: string;
  budgetUsd: string; mealPlan: string; requirements: string;
};
const blank: EnquiryForm = {
  guestName: "", guestEmail: "", guestPhone: "", startDate: "", endDate: "",
  nightsMin: "7", nightsMax: "10", adults: "2", children: "0",
  budgetUsd: "", mealPlan: "Full Board", requirements: "",
};
const amy: EnquiryForm = {
  guestName: "Amy", guestEmail: "", guestPhone: "", startDate: "2026-12-19",
  endDate: "2027-01-02", nightsMin: "7", nightsMax: "10", adults: "2",
  children: "0", budgetUsd: "3297", mealPlan: "Half Board or Full Board",
  requirements: "Two adults travelling from Doha during school holidays. Budget covers international return flights, accommodation, meals, airport and island transfers, and snorkelling. Priority: beginner-friendly snorkelling from a good house reef, plus guided trips for nurse sharks, reef sharks, turtles, colourful coral reefs, and whale sharks or manta rays where available. Dates flexible within travel window.",
};

export default function PartnerEnquiriesAdminPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [requests, setRequests] = useState<Forward[]>([]);
  const [form, setForm] = useState<EnquiryForm>(blank);
  const [partner, setPartner] = useState({ name: "", island: "", email: "" });
  const [selectedEnquiryId, setSelectedEnquiryId] = useState("");
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [markup, setMarkup] = useState("20");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch("/api/admin/partner-enquiries", { cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) {
      window.location.href = "/login?next=%2Fadmin%2Fpartner-enquiries";
      return;
    }
    if (!response.ok) throw new Error(data.error || "Unable to load partner enquiries.");
    setPartners(data.partners || []);
    setEnquiries(data.enquiries || []);
    setRequests(data.requests || []);
  }
  useEffect(() => {
    load().catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load data."))
      .finally(() => setLoading(false));
  }, []);

  const selectedEnquiry = enquiries.find(item => item.id === selectedEnquiryId);
  const selectedRequests = useMemo(
    () => requests.filter(item => item.enquiry_id === selectedEnquiryId),
    [requests, selectedEnquiryId],
  );

  async function post(payload: unknown, method = "POST") {
    const response = await fetch("/api/admin/partner-enquiries", {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to save changes.");
    return data;
  }

  async function addPartner(event: FormEvent) {
    event.preventDefault(); setBusy("partner"); setError(""); setMessage("");
    try {
      await post({ action: "add-partner", ...partner });
      setPartner({ name: "", island: "", email: "" });
      await load(); setMessage("Partner saved. Select them when forwarding an enquiry.");
    } catch (reason) { setError(getError(reason)); }
    finally { setBusy(""); }
  }

  async function addEnquiry(event: FormEvent) {
    event.preventDefault(); setBusy("enquiry"); setError(""); setMessage("");
    try {
      const data = await post({
        action: "add-enquiry", ...form,
        nightsMin: Number(form.nightsMin), nightsMax: Number(form.nightsMax),
        adults: Number(form.adults), children: Number(form.children),
        budgetUsd: Number(form.budgetUsd || 0),
      });
      setForm(blank); await load(); setSelectedEnquiryId(data.enquiry.id);
      setMessage("Enquiry " + data.enquiry.reference + " saved. Choose partner guesthouses below.");
    } catch (reason) { setError(getError(reason)); }
    finally { setBusy(""); }
  }

  async function forwardEnquiry() {
    if (!selectedEnquiryId || selectedPartnerIds.length === 0) return;
    setBusy("forward"); setError(""); setMessage("");
    try {
      const data = await post({
        action: "forward", enquiryId: selectedEnquiryId, partnerIds: selectedPartnerIds,
      });
      await load();
      const delivered = (data.forwarded || []).filter((item: any) => item.emailStatus === "sent").length;
      const manual = (data.forwarded || []).length - delivered;
      setMessage("Partner requests prepared: " + delivered + " emailed, " + manual +
        " requiring manual forwarding or follow-up. Copy any unsent link below.");
      setSelectedPartnerIds([]);
    } catch (reason) { setError(getError(reason)); }
    finally { setBusy(""); }
  }

  async function closeEnquiry() {
    if (!selectedEnquiryId) return;
    setBusy("close"); setError(""); setMessage("");
    try {
      await post({ id: selectedEnquiryId, status: "closed" }, "PATCH");
      await load(); setMessage("Enquiry marked as closed.");
    } catch (reason) { setError(getError(reason)); }
    finally { setBusy(""); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); setMessage("Copied to clipboard."); }
    catch { setError("Clipboard unavailable. Select and copy the link shown below."); }
  }

  async function createDraft(request: Forward, guestPrice: number, target: Enquiry, partnerName: string) {
    setBusy(request.id); setError(""); setMessage("");
    try {
      if (!Number.isFinite(guestPrice) || guestPrice <= 0) throw new Error("Enter a valid markup.");
      const response = await fetch("/api/admin/quotations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: target.guest_name, customerEmail: target.guest_email,
          customerPhone: target.guest_phone, propertyName: partnerName,
          roomName: "Holiday Package", mealPlan: target.meal_plan,
          adults: target.adults, children: target.children, rooms: 1,
          currency: request.currency,
          items: [{
            category: "other", label: "Holiday package – " + partnerName,
            details: "Supplier inclusion details are in the quotation notes.",
            quantity: 1, unitPrice: guestPrice,
          }],
          notes: [
            "Travel window: " + target.start_date + " to " + target.end_date,
            "Nights: " + target.nights_min + "–" + target.nights_max,
            "Inclusions: " + request.inclusions,
            "Exclusions: " + request.exclusions,
            "Availability: " + request.availability,
          ].join("\n").slice(0, 3000),
          terms: ("Subject to supplier reconfirmation and payment. " + request.terms).slice(0, 5000),
          validHours: 48,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create a draft quotation.");
      setMessage("Draft " + data.quotation.reference +
        " created. Open Quotations to review taxes, flight costs and terms before sharing.");
    } catch (reason) { setError(getError(reason)); }
    finally { setBusy(""); }
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading partner enquiries...</main>;

  const markupNumber = Number(markup);
  const validMarkup = Number.isFinite(markupNumber) && markupNumber >= 0 && markupNumber <= 500;

  return (
    <main className="container py-8 pb-24 md:py-14">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
      <div className="mt-5">
        <p className="eyebrow flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Tripelor Partner Desk</p>
        <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Partner Enquiries</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">Send holiday requirements to selected partner properties, compare wholesale offers and prepare customer quotations. Guest contact details are never included in partner requests.</p>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold">{message}</p>}

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-semibold"><Plus className="h-5 w-5 text-gold" /> New guest enquiry</h2>
            <button type="button" onClick={() => setForm(amy)} className="text-xs font-semibold text-gold hover:text-white">Prefill Amy's enquiry</button>
          </div>
          <form onSubmit={addEnquiry} className="mt-5 grid gap-3 sm:grid-cols-2">
            <Input label="Guest name" required value={form.guestName} onChange={value => setForm({ ...form, guestName: value })} />
            <Input label="Guest email (admin only)" type="email" value={form.guestEmail} onChange={value => setForm({ ...form, guestEmail: value })} />
            <Input label="WhatsApp (admin only)" value={form.guestPhone} onChange={value => setForm({ ...form, guestPhone: value })} />
            <Input label="Total holiday budget, USD" type="number" min="0" value={form.budgetUsd} onChange={value => setForm({ ...form, budgetUsd: value })} />
            <Input label="Earliest arrival" required type="date" value={form.startDate} onChange={value => setForm({ ...form, startDate: value })} />
            <Input label="Latest departure" required type="date" value={form.endDate} onChange={value => setForm({ ...form, endDate: value })} />
            <Input label="Minimum nights" required type="number" min="1" max="60" value={form.nightsMin} onChange={value => setForm({ ...form, nightsMin: value })} />
            <Input label="Maximum nights" required type="number" min="1" max="60" value={form.nightsMax} onChange={value => setForm({ ...form, nightsMax: value })} />
            <Input label="Adults" required type="number" min="1" value={form.adults} onChange={value => setForm({ ...form, adults: value })} />
            <Input label="Children" required type="number" min="0" value={form.children} onChange={value => setForm({ ...form, children: value })} />
            <div className="sm:col-span-2"><Input label="Meal preference" value={form.mealPlan} onChange={value => setForm({ ...form, mealPlan: value })} /></div>
            <label className="text-sm text-gray-300 sm:col-span-2">Requirements (shared with partners)
              <textarea required minLength={5} maxLength={4000} rows={5} value={form.requirements} onChange={event => setForm({ ...form, requirements: event.target.value })}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 p-3 text-sm text-white" placeholder="Describe destination, snorkelling, transfers, room requirements..." />
            </label>
            <button disabled={busy !== ""} className="btn-gold min-h-11 sm:col-span-2 disabled:opacity-40">Save enquiry</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Building2 className="h-5 w-5 text-gold" /> Partner guesthouses</h2>
          <p className="mt-2 text-sm text-gray-400">Save a guesthouse's confirmed reservations email before sending requests.</p>
          <form onSubmit={addPartner} className="mt-5 space-y-3">
            <Input label="Property name" required value={partner.name} onChange={value => setPartner({ ...partner, name: value })} />
            <Input label="Island / atoll" value={partner.island} onChange={value => setPartner({ ...partner, island: value })} />
            <Input label="Reservations email" required type="email" value={partner.email} onChange={value => setPartner({ ...partner, email: value })} />
            <button disabled={busy !== ""} className="btn-outline min-h-11 w-full disabled:opacity-40"><Plus className="mr-2 h-4 w-4" /> Add partner</button>
          </form>
          <p className="mt-5 text-xs text-gray-500">{partners.length} partner contacts saved.</p>
          <div className="mt-3 max-h-44 space-y-2 overflow-auto">
            {partners.map(item => <div key={item.id} className="rounded-lg border border-white/10 p-3 text-xs">
              <p className="font-semibold text-white">{item.name}</p><p className="mt-1 text-gray-500">{item.island} · {item.email}</p>
            </div>)}
          </div>
        </section>
      </div>

      <section className="mt-7 rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-7">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Forward enquiries to partners</h2>
            <p className="mt-1 text-sm text-gray-400">Select an enquiry and up to 10 partner properties.</p>
          </div>
          <label className="min-w-[250px] text-xs text-gray-400">Select enquiry
            <select value={selectedEnquiryId} onChange={event => {
              setSelectedEnquiryId(event.target.value); setSelectedPartnerIds([]);
            }} className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-black px-3 text-sm text-white">
              <option value="">Choose enquiry</option>
              {enquiries.map(item => <option key={item.id} value={item.id}>{item.reference} · {item.guest_name} ({item.status})</option>)}
            </select>
          </label>
        </div>
        {selectedEnquiry && (
          <>
            <div className="mt-5 rounded-xl border border-gold/15 bg-gold/[.04] p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <p className="font-semibold">{selectedEnquiry.guest_name} · {selectedEnquiry.nights_min}–{selectedEnquiry.nights_max} nights · {selectedEnquiry.start_date} to {selectedEnquiry.end_date}</p>
                <span className="text-xs uppercase text-gold">{selectedEnquiry.status}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400">{selectedEnquiry.requirements}</p>
              <p className="mt-2 text-xs text-gray-500">Guest email and telephone remain admin-only.</p>
            </div>

            {selectedEnquiry.status !== "closed" && (
              <>
                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {partners.filter(item => item.active).map(item => (
                    <label key={item.id} className="flex cursor-pointer gap-3 rounded-xl border border-white/10 p-3 text-sm">
                      <input type="checkbox" className="accent-amber-400" checked={selectedPartnerIds.includes(item.id)}
                        disabled={!selectedPartnerIds.includes(item.id) && selectedPartnerIds.length >= 10}
                        onChange={event => setSelectedPartnerIds(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} />
                      <span><span className="block font-semibold">{item.name}</span><span className="text-xs text-gray-500">{item.island}</span></span>
                    </label>
                  ))}
                </div>
                <button type="button" disabled={busy !== "" || !selectedPartnerIds.length}
                  onClick={forwardEnquiry} className="btn-gold mt-4 min-h-12 px-6 disabled:opacity-40">
                  <Send className="mr-2 h-4 w-4" /> Forward to {selectedPartnerIds.length} partner(s)
                </button>
              </>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Partner replies ({selectedRequests.length})</h3>
              <div className="flex items-center gap-3">
                <label className="text-xs text-gray-400">Customer markup %
                  <input type="number" min="0" max="500" step="0.5" value={markup} onChange={event => setMarkup(event.target.value)}
                    className="ml-2 w-20 rounded-lg border border-white/15 bg-black p-2 text-white" />
                </label>
                {selectedEnquiry.status !== "closed" &&
                  <button type="button" disabled={busy !== ""} onClick={closeEnquiry} className="text-xs text-gray-500 underline">Close enquiry</button>}
              </div>
            </div>
            {selectedRequests.length === 0 ? <p className="mt-4 text-sm text-gray-500">No partner requests yet.</p> :
              <div className="mt-4 space-y-3">{selectedRequests.map(item => {
                const property = partners.find(value => value.id === item.partner_id);
                const supplierTotal = Number(item.wholesale_total || 0);
                const sellingTotal = validMarkup ? Math.round(supplierTotal * (1 + markupNumber / 100) * 100) / 100 : 0;
                const link = typeof window === "undefined" ? "" : window.location.origin + "/partner-quote/" + item.secure_token;
                return (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{property?.name || "Partner"}</p>
                        <p className="mt-1 text-xs text-gray-500">Reply: {item.status} · Email: {item.email_status} · Expires {new Date(item.expires_at).toLocaleDateString("en-GB")}</p>
                      </div>
                      <button type="button" onClick={() => copy(link)} className="btn-outline min-h-10 px-4 text-xs"><ClipboardCopy className="mr-2 h-4 w-4" /> Copy supplier link</button>
                    </div>
                    <input readOnly aria-label="Supplier quotation link" value={link}
                      className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-xs text-gray-400" />
                    {item.email_status !== "sent" && property?.email &&
                      <a className="mt-2 inline-flex items-center gap-1 text-xs text-gold underline" href={
                        "mailto:" + property.email + "?subject=" + encodeURIComponent("Tripelor B2B enquiry " + selectedEnquiry.reference) +
                        "&body=" + encodeURIComponent("Dear " + property.name + ",\n\nPlease review our anonymous holiday enquiry and submit your best quotation at:\n" + link + "\n\nRegards,\nTripelor")
                      }><Mail className="h-3 w-3" /> Open manual email</a>}
                    {item.status === "quoted" && (
                      <div className="mt-4 rounded-xl border border-gold/20 p-4">
                        <p className="text-sm font-semibold text-gold">Supplier B2B: {item.currency} {supplierTotal.toFixed(2)}</p>
                        <p className="mt-1 text-lg font-semibold">Suggested guest price: {item.currency} {sellingTotal.toFixed(2)}</p>
                        <p className="mt-1 text-xs text-gray-500">Markup {validMarkup ? markupNumber : "invalid"}%. This price excludes any Tripelor-added flights, taxes or service fees not included by the supplier.</p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-gray-300"><strong>Availability:</strong> {item.availability}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300"><strong>Includes:</strong> {item.inclusions}</p>
                        {item.exclusions && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-400"><strong>Excludes:</strong> {item.exclusions}</p>}
                        {item.terms && <p className="mt-2 whitespace-pre-wrap text-xs text-gray-500"><strong>Terms:</strong> {item.terms}</p>}
                        <button type="button" disabled={busy !== "" || !validMarkup} onClick={() => createDraft(item, sellingTotal, selectedEnquiry, property?.name || "Partner property")}
                          className="btn-gold mt-4 min-h-11 px-4 text-xs disabled:opacity-40"><FileText className="mr-2 h-4 w-4" /> Create customer quotation draft</button>
                      </div>
                    )}
                  </div>
                );
              })}</div>}
          </>
        )}
      </section>
      <p className="mt-5 text-xs text-gray-500">Before sharing any customer quotation, confirm current availability, supplier taxes, international airfare and cancellation conditions. Guesthouse offers are not confirmed bookings.</p>
      <Link href="/admin/quotations" className="mt-4 inline-flex items-center gap-2 text-sm text-gold underline">Open Customer Quotations</Link>
    </main>
  );
}
function getError(reason: unknown) {
  return reason instanceof Error ? reason.message : "Unable to complete request.";
}
function Input({ label, value, onChange, type = "text", required = false, min, max }: {
  label: string; value: string; onChange: (text: string) => void;
  type?: string; required?: boolean; min?: string; max?: string;
}) {
  return <label className="block text-sm text-gray-300">{label}
    <input type={type} required={required} min={min} max={max} value={value} onChange={event => onChange(event.target.value)}
      className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white outline-none focus:border-gold/40" />
  </label>;
}
