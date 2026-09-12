"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Send, Trash2, Upload, X } from "lucide-react";
import type { InventoryRule, ManagedProperty, Room, SeasonalRate } from "@/lib/property-model";

type Submission = {
  id: string;
  property_id: string;
  data: Partial<ManagedProperty>;
  note: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type FormState = ManagedProperty;

const blankRoom = (): Room => ({ name: "", capacity: 2, totalRooms: 1, amenities: "", mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0 });
const blankSeason = (roomName = ""): SeasonalRate => ({ id: crypto.randomUUID(), name: "", startDate: "", endDate: "", roomName, mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0 });
const blankInventory = (roomName = ""): InventoryRule => ({ id: crypto.randomUUID(), roomName, startDate: "", endDate: "", roomsAvailable: 0, stopSale: false, note: "" });

function formFor(property: ManagedProperty, submission?: Submission) {
  const source = submission?.data || property;
  return {
    ...property,
    ...source,
    id: property.id,
    slug: property.slug,
    status: property.status,
    updated_at: property.updated_at,
    name: typeof source.name === "string" ? source.name : property.name || "",
    island: typeof source.island === "string" ? source.island : property.island || "",
    description: typeof source.description === "string" ? source.description : property.description || "",
    photos: Array.isArray(source.photos) ? source.photos : [],
    amenities: typeof source.amenities === "string" ? source.amenities : property.amenities || "",
    rooms: Array.isArray(source.rooms) ? source.rooms.map((room) => ({ ...blankRoom(), ...room })) : [],
    seasonalRates: Array.isArray(source.seasonalRates) ? source.seasonalRates.map((rate) => ({ ...blankSeason(), ...rate })) : [],
    inventoryRules: Array.isArray(source.inventoryRules) ? source.inventoryRules.map((rule) => ({ ...blankInventory(), ...rule })) : [],
    taxes: typeof source.taxes === "string" ? source.taxes : property.taxes || "",
    transfers: typeof source.transfers === "string" ? source.transfers : property.transfers || "",
    cancellation: typeof source.cancellation === "string" ? source.cancellation : property.cancellation || "",
    payment: typeof source.payment === "string" ? source.payment : property.payment || "",
    partnerName: typeof source.partnerName === "string" ? source.partnerName : property.partnerName || "",
    partnerEmail: property.partnerEmail || "",
    partnerPhone: typeof source.partnerPhone === "string" ? source.partnerPhone : property.partnerPhone || "",
  } satisfies FormState;
}

export default function PartnerPropertyDashboard() {
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<FormState | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ details: true, rooms: true, seasonal: false, inventory: false, conditions: false, contact: false });

  const activeProperty = useMemo(() => properties.find((property) => property.id === selectedId) || null, [properties, selectedId]);
  const pending = useMemo(() => submissions.find((submission) => submission.property_id === selectedId && submission.status === "pending"), [submissions, selectedId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/partner/properties", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load your property.");
      const nextProperties = (result.properties || []) as ManagedProperty[];
      setProperties(nextProperties);
      setSubmissions((result.submissions || []) as Submission[]);
      setSelectedId((current) => current && nextProperties.some((property) => property.id === current) ? current : nextProperties[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load your property.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!activeProperty) {
      setForm(null);
      setReviewNote("");
      return;
    }
    setForm(formFor(activeProperty, pending));
    setReviewNote(pending?.note || "");
    setNotice("");
  }, [activeProperty, pending]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => current ? { ...current, [key]: value } : current);
  const updateRoom = (index: number, key: keyof Room, value: string | number) => setForm((current) => current ? { ...current, rooms: current.rooms.map((room, item) => item === index ? { ...room, [key]: value } : room) } : current);
  const updateSeason = (index: number, key: keyof SeasonalRate, value: string | number) => setForm((current) => current ? { ...current, seasonalRates: current.seasonalRates.map((rate, item) => item === index ? { ...rate, [key]: value } : rate) } : current);
  const updateInventory = (index: number, key: keyof InventoryRule, value: string | number | boolean) => setForm((current) => current ? { ...current, inventoryRules: current.inventoryRules.map((rule, item) => item === index ? { ...rule, [key]: value } : rule) } : current);
  const toggle = (section: string) => setOpenSections((current) => ({ ...current, [section]: !current[section] }));

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length || !form) return;
    setUploading(true);
    setError("");
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("propertyId", form.id);
        body.set("photo", file);
        const response = await fetch("/api/partner/properties/photos", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Photo upload failed.");
        added.push(result.photo);
      }
      update("photos", [...(form.photos || []), ...added]);
      setNotice(`${added.length} photo${added.length === 1 ? "" : "s"} uploaded. Submit the changes when the gallery is ready.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Photo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!form) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/partner/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "draft", reviewNote }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to submit your changes.");
      setNotice("Changes submitted. Tripelor will review them before anything is published.");
      await load();
      if (result.submission?.id) setSubmissions((current) => [result.submission, ...current.filter((item) => item.id !== result.submission.id)]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading partner portal...</main>;

  return <main className="container py-8 pb-28 md:py-14">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Tripelor partner portal</p>
        <h1 className="mt-3 text-3xl font-semibold md:text-5xl">Keep your property up to date</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Update the guesthouse details, rooms, rates and photographs Tripelor has on file. Every change is reviewed before it reaches guests.</p>
      </div>
      {properties.length > 0 && <div className="rounded-2xl border border-gold/20 bg-gold/[.05] px-4 py-3 text-xs text-gold"><p className="font-semibold uppercase tracking-[.16em]">Partner access</p><p className="mt-1 text-white/70">{form?.partnerEmail || activeProperty?.partnerEmail}</p></div>}
    </div>

    {error && <Notice tone="error">{error}</Notice>}
    {!properties.length ? <EmptyState /> : <>
      {properties.length > 1 && <div className="mt-7 flex flex-wrap gap-2">{properties.map((property) => <button key={property.id} type="button" onClick={() => setSelectedId(property.id)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${property.id === selectedId ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-gray-400 hover:border-gold/40"}`}>{property.name || "Untitled property"}</button>)}</div>}
      {form && <>
        {pending && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[.06] p-4 text-sm text-amber-100"><Send className="mt-0.5 h-4 w-4 shrink-0" /><p><strong>Changes pending review.</strong><span className="ml-1 text-amber-100/70">You can keep editing this proposal; Tripelor will only publish approved information.</span></p></div>}
        {notice && <Notice tone="success">{notice}</Notice>}
        <PartnerForm form={form} pending={Boolean(pending)} reviewNote={reviewNote} setReviewNote={setReviewNote} update={update} updateRoom={updateRoom} updateSeason={updateSeason} updateInventory={updateInventory} setForm={setForm} openSections={openSections} toggle={toggle} onUpload={uploadPhotos} uploading={uploading} saving={saving} onSubmit={submit} />
      </>}
    </>}
  </main>;
}

function EmptyState() {
  return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-8 text-center md:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold"><Upload className="h-6 w-6" /></div><h2 className="mt-4 text-2xl font-semibold">No property is assigned to this email</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">Ask Tripelor to add this sign-in email under your property’s Partner contact details, then sign in again.</p></section>;
}

function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return <div className={`mt-5 rounded-xl border p-4 text-sm ${tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{children}</div>;
}

function PartnerForm({ form, pending, reviewNote, setReviewNote, update, updateRoom, updateSeason, updateInventory, setForm, openSections, toggle, onUpload, uploading, saving, onSubmit }: { form: FormState; pending: boolean; reviewNote: string; setReviewNote: (value: string) => void; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; updateRoom: (index: number, key: keyof Room, value: string | number) => void; updateSeason: (index: number, key: keyof SeasonalRate, value: string | number) => void; updateInventory: (index: number, key: keyof InventoryRule, value: string | number | boolean) => void; setForm: React.Dispatch<React.SetStateAction<FormState | null>>; openSections: Record<string, boolean>; toggle: (section: string) => void; onUpload: (files: FileList | null) => void; uploading: boolean; saving: boolean; onSubmit: () => void }) {
  return <section className="mt-8 max-w-6xl">
    <div className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-gold/[.05] p-5 md:flex-row md:items-center md:justify-between md:p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">{pending ? "Pending proposal" : "Your property"}</p><h2 className="mt-2 text-2xl font-semibold">{form.name || "Untitled property"}</h2><p className="mt-1 text-sm text-gray-400">The Tripelor team reviews every partner update before publication.</p></div><button type="button" onClick={onSubmit} disabled={saving || uploading} className="btn-gold gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "Update submission" : "Submit for review"}</button></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <Panel title="Property details" subtitle="Help guests understand the location and experience." open={openSections.details} onToggle={() => toggle("details")}><div className="grid gap-4 md:grid-cols-2"><Field label="Property name" value={form.name} onChange={(value) => update("name", value)} placeholder="e.g. Coral Garden Guesthouse"/><Field label="Island / location" value={form.island} onChange={(value) => update("island", value)} placeholder="e.g. Dhigurah"/></div><TextArea label="Description" value={form.description} onChange={(value) => update("description", value)} placeholder="Describe the stay, location and guest experience."/><TextArea label="Amenities" value={form.amenities} onChange={(value) => update("amenities", value)} placeholder="Wi-Fi, breakfast, beach access, air conditioning..." hint="Separate amenities with commas."/><p className="mt-4 text-xs text-gray-500">Public URL: <span className="text-gray-300">/stays/{form.slug}</span> · URL changes are handled by Tripelor.</p></Panel>

        <Panel title={`Rooms & rates · ${form.rooms.length}`} subtitle="Share the room categories, capacity, meal plans and rates you want Tripelor to review." open={openSections.rooms} onToggle={() => toggle("rooms")}><div className="space-y-4">{form.rooms.map((room, index) => <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Room {String(index + 1).padStart(2, "0")}</p>{form.rooms.length > 1 && <button type="button" onClick={() => setForm((current) => current ? { ...current, rooms: current.rooms.filter((_, item) => item !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove room"><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Room type" value={room.name} onChange={(value) => updateRoom(index, "name", value)} placeholder="Deluxe Double Room"/><NumberField label="Guest capacity" value={Number(room.capacity || 0)} onChange={(value) => updateRoom(index, "capacity", value)} min={1} max={100}/><NumberField label="Rooms available" value={Number(room.totalRooms || 0)} onChange={(value) => updateRoom(index, "totalRooms", value)} min={0} max={100}/><Field label="Meal plan" value={room.mealPlan} onChange={(value) => updateRoom(index, "mealPlan", value)} placeholder="Bed & Breakfast"/><NumberField label="Contracted rate (USD)" value={Number(room.contractedRate || 0)} onChange={(value) => updateRoom(index, "contractedRate", value)} min={0} max={1000000}/><NumberField label="Suggested selling rate (USD)" value={Number(room.sellingRate || 0)} onChange={(value) => updateRoom(index, "sellingRate", value)} min={0} max={1000000}/></div><TextArea label="Room amenities / notes" value={room.amenities} onChange={(value) => updateRoom(index, "amenities", value)} placeholder="King bed, balcony, private bathroom..."/></div>)}</div><button type="button" onClick={() => setForm((current) => current ? { ...current, rooms: [...current.rooms, blankRoom()] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add room</button></Panel>

        <Panel title={`Seasonal rates · ${form.seasonalRates.length}`} subtitle="Suggest high-season prices, offers or special date ranges." open={openSections.seasonal} onToggle={() => toggle("seasonal")}><div className="space-y-4">{form.seasonalRates.map((rate, index) => <div key={rate.id || index} className="rounded-2xl border border-gold/20 bg-gold/[.035] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Season {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setForm((current) => current ? { ...current, seasonalRates: current.seasonalRates.filter((_, item) => item !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove seasonal rate"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Season name" value={rate.name} onChange={(value) => updateSeason(index, "name", value)} placeholder="High season 2026"/><RoomSelect rooms={form.rooms} value={rate.roomName} onChange={(value) => updateSeason(index, "roomName", value)}/><Field label="Start date" type="date" value={rate.startDate} onChange={(value) => updateSeason(index, "startDate", value)}/><Field label="End date" type="date" value={rate.endDate} onChange={(value) => updateSeason(index, "endDate", value)}/><Field label="Meal plan" value={rate.mealPlan} onChange={(value) => updateSeason(index, "mealPlan", value)} placeholder="Bed & Breakfast"/><NumberField label="Contracted rate (USD)" value={Number(rate.contractedRate || 0)} onChange={(value) => updateSeason(index, "contractedRate", value)} min={0} max={1000000}/><NumberField label="Suggested selling rate (USD)" value={Number(rate.sellingRate || 0)} onChange={(value) => updateSeason(index, "sellingRate", value)} min={0} max={1000000}/></div></div>)}</div><button type="button" onClick={() => setForm((current) => current ? { ...current, seasonalRates: [...current.seasonalRates, blankSeason(current.rooms.find((room) => room.name)?.name || "")] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add seasonal rate</button></Panel>
      </div>

      <div className="space-y-5">
        <Panel title="Photographs" subtitle="Upload JPG, PNG or WebP images under 3 MB." open={true} onToggle={() => {}} collapsible={false}><label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gold/35 bg-gold/[.04] p-7 text-center transition hover:bg-gold/[.08]"><ImagePlus className="h-7 w-7 text-gold"/><span className="mt-3 text-sm font-semibold">{uploading ? "Uploading..." : "Add property photographs"}</span><span className="mt-1 text-xs text-gray-500">Photos are included in your next review submission</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(event) => { onUpload(event.target.files); event.currentTarget.value = ""; }}/></label>{form.photos.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-3">{form.photos.map((photo, index) => <div key={photo} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"><img src={`/api/property-photo/${photo}`} alt={`Property photo ${index + 1}`} className="h-full w-full object-cover"/><button type="button" onClick={() => update("photos", form.photos.filter((item) => item !== photo))} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white opacity-0 transition group-hover:opacity-100" aria-label="Remove photo"><X className="h-3.5 w-3.5" /></button>{index === 0 && <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[9px] uppercase tracking-[.1em] text-gold">Cover</span>}</div>)}</div> : <p className="mt-4 text-center text-xs text-gray-500">No photographs uploaded yet.</p>}</Panel>

        <Panel title={`Inventory & stop-sale · ${form.inventoryRules.length}`} subtitle="Tell Tripelor about date ranges with limited rooms or no sales." open={openSections.inventory} onToggle={() => toggle("inventory")}><div className="space-y-4">{form.inventoryRules.map((rule, index) => <div key={rule.id || index} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Rule {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setForm((current) => current ? { ...current, inventoryRules: current.inventoryRules.filter((_, item) => item !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove inventory rule"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><RoomSelect rooms={form.rooms} value={rule.roomName} onChange={(value) => updateInventory(index, "roomName", value)}/><NumberField label="Rooms available" value={Number(rule.roomsAvailable || 0)} onChange={(value) => updateInventory(index, "roomsAvailable", value)} min={0} max={100}/><Field label="Start date" type="date" value={rule.startDate} onChange={(value) => updateInventory(index, "startDate", value)}/><Field label="End date" type="date" value={rule.endDate} onChange={(value) => updateInventory(index, "endDate", value)}/></div><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={Boolean(rule.stopSale)} onChange={(event) => updateInventory(index, "stopSale", event.currentTarget.checked)} className="h-4 w-4 accent-[#d9bd7b]"/><span><strong>Stop sale</strong><span className="ml-2 text-xs text-gray-500">Block new bookings for this range</span></span></label><TextArea label="Note for Tripelor" value={rule.note} onChange={(value) => updateInventory(index, "note", value)} placeholder="e.g. Owner use, maintenance, local event..."/></div>)}</div><button type="button" onClick={() => setForm((current) => current ? { ...current, inventoryRules: [...current.inventoryRules, blankInventory(current.rooms.find((room) => room.name)?.name || "")] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add inventory rule</button></Panel>

        <Panel title="Guest booking conditions" subtitle="Give the Tripelor team the operational details guests should see." open={openSections.conditions} onToggle={() => toggle("conditions")}><TextArea label="Taxes & service charges" value={form.taxes} onChange={(value) => update("taxes", value)} placeholder="e.g. 10% service charge and 17% GST included / excluded."/><TextArea label="Transfer options" value={form.transfers} onChange={(value) => update("transfers", value)} placeholder="Speedboat, public ferry, airport transfer details and schedules."/><TextArea label="Cancellation / no-show policy" value={form.cancellation} onChange={(value) => update("cancellation", value)} placeholder="Explain notice periods and non-refundable amounts."/><TextArea label="Payment conditions" value={form.payment} onChange={(value) => update("payment", value)} placeholder="e.g. Payment is due after Tripelor confirms availability."/></Panel>

        <Panel title="Partner contact" subtitle="Tripelor uses this information to confirm rates and availability." open={openSections.contact} onToggle={() => toggle("contact")}><Field label="Partner / property manager" value={form.partnerName} onChange={(value) => update("partnerName", value)} placeholder="Manager name"/><Field label="Partner email" value={form.partnerEmail} onChange={() => {}} readOnly type="email" hint="This sign-in email is managed by Tripelor."/><Field label="Partner phone / WhatsApp" value={form.partnerPhone} onChange={(value) => update("partnerPhone", value)} placeholder="+960 ..."/><TextArea label="Note to Tripelor" value={reviewNote} onChange={setReviewNote} placeholder="Add rate validity, blackout dates, honeymoon offers, transfer notes or anything the team should confirm." hint="This note is private to the Tripelor review team."/></Panel>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.04] p-5"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Review before sending</p><p className="mt-3 text-sm leading-6 text-gray-400">Your update stays private until Tripelor approves it. The current live listing remains unchanged while your proposal is being reviewed.</p><button type="button" onClick={onSubmit} disabled={saving || uploading} className="btn-gold mt-5 w-full justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "Update submission" : "Submit changes for review"}</button></div>
      </div>
    </div>
  </section>;
}

function Panel({ title, subtitle, open, onToggle, children, collapsible = true }: { title: string; subtitle: string; open: boolean; onToggle: () => void; children: React.ReactNode; collapsible?: boolean }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6"><button type="button" onClick={onToggle} disabled={!collapsible} className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-default"><span><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-xs text-gray-500">{subtitle}</p></span>{collapsible && (open ? <ChevronUp className="mt-1 h-5 w-5 text-gold" /> : <ChevronDown className="mt-1 h-5 w-5 text-gray-500" />)}</button>{open && <div className="mt-5">{children}</div>}</section>;
}

function RoomSelect({ rooms, value, onChange }: { rooms: Room[]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">Room type</span><select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold"><option value="">Choose a room</option>{rooms.filter((room) => room.name).map((room) => <option key={room.name} value={room.name}>{room.name}</option>)}</select></label>;
}

function Field({ label, value, onChange, placeholder, hint, type = "text", readOnly = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string; type?: string; readOnly?: boolean }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} readOnly={readOnly} className={`rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold ${readOnly ? "cursor-not-allowed text-gray-500" : ""}`} />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>;
}

function NumberField({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; hint?: string }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type="number" min={min} max={max} step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>;
}

function TextArea({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string }) {
  return <label className="mt-4 grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-6 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>;
}
