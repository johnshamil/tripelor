"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { InventoryRule, ManagedProperty, Room, SeasonalRate } from "@/lib/property-model";
import PropertySubmissionInbox from "@/components/property-submission-inbox";

type FormRoom = Room;
type FormState = Omit<ManagedProperty, "id" | "updated_at"> & { id?: string; updated_at?: string };
type PhotoTarget =
  | { kind: "property" }
  | { kind: "room"; roomIndex: number }
  | { kind: "bathroom"; roomIndex: number };

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const emptyRoom = (): FormRoom => ({ name: "", capacity: 2, amenities: "", mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0, totalRooms: 1, photos: [], bathroomPhotos: [] });
const emptySeasonalRate = (): SeasonalRate => ({ id: crypto.randomUUID(), name: "", startDate: "", endDate: "", roomName: "", mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0 });
const emptyInventoryRule = (): InventoryRule => ({ id: crypto.randomUUID(), roomName: "", startDate: "", endDate: "", roomsAvailable: 0, stopSale: false, note: "" });
const emptyForm = (): FormState => ({
  slug: "", status: "draft", name: "", island: "", description: "", photos: [], amenities: "", rooms: [emptyRoom()],
  seasonalRates: [], inventoryRules: [],
  taxes: "", transfers: "", cancellation: "", payment: "", partnerName: "", partnerEmail: "", partnerPhone: "",
});

export default function PropertyDashboard() {
  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ rooms: true, seasonal: true, inventory: true, commercial: true, partner: true });

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/properties", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load properties.");
      setProperties(result.properties || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load properties."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const sortedProperties = useMemo(() => [...properties].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))), [properties]);
  const update = <K extends keyof FormState,>(key: K, value: FormState[K]) => setForm(current => current ? { ...current, [key]: value } : current);
  const updateRoom = (index: number, key: keyof FormRoom, value: string | number) => setForm(current => current ? { ...current, rooms: current.rooms.map((room, i) => i === index ? { ...room, [key]: value } : room) } : current);
  const updateSeasonalRate = (index: number, key: keyof SeasonalRate, value: string | number) => setForm(current => current ? { ...current, seasonalRates: current.seasonalRates.map((rate, i) => i === index ? { ...rate, [key]: value } : rate) } : current);
  const updateInventoryRule = (index: number, key: keyof InventoryRule, value: string | number | boolean) => setForm(current => current ? { ...current, inventoryRules: current.inventoryRules.map((rule, i) => i === index ? { ...rule, [key]: value } : rule) } : current);

  function openNew() { setForm(emptyForm()); setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function edit(property: ManagedProperty) { setForm(JSON.parse(JSON.stringify(property))); setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function closeForm() { setForm(null); setNotice(""); setError(""); }
  function toggle(section: string) { setOpenSections(value => ({ ...value, [section]: !value[section] })); }

  async function uploadPhotos(files: FileList | null, target: PhotoTarget) {
    if (!files?.length || !form) return;
    setUploading(true); setError("");
    try {
      const added: string[] = [];
      for (const file of Array.from(files)) {
        const extension = file.name.toLowerCase().split(".").pop() || "";
        const contentType = file.type.toLowerCase() || ({
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        } as Record<string, string>)[extension] || "";
        if (!["image/jpeg", "image/png", "image/webp"].includes(contentType) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
          throw new Error("Choose JPG, PNG or WebP photographs up to 10 MB each.");
        }
        const signResponse = await fetch("/api/admin/properties/photos/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType, size: file.size }),
        });
        const signResult = await signResponse.json();
        if (!signResponse.ok || typeof signResult.signedUrl !== "string" || typeof signResult.photo !== "string") {
          throw new Error(signResult.error || "Photo upload failed.");
        }
        const uploadResponse = await fetch(signResult.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!uploadResponse.ok) throw new Error("Photo upload failed. Please try again.");
        added.push(signResult.photo);
      }
      setForm(current => {
        if (!current) return current;
        if (target.kind === "property") return { ...current, photos: [...(current.photos || []), ...added] };
        return {
          ...current,
          rooms: current.rooms.map((room, index) => {
            if (index !== target.roomIndex) return room;
            if (target.kind === "room") return { ...room, photos: [...(room.photos || []), ...added] };
            return { ...room, bathroomPhotos: [...(room.bathroomPhotos || []), ...added] };
          }),
        };
      });
      const section = target.kind === "property"
        ? "the property"
        : target.kind === "room"
          ? `Room ${target.roomIndex + 1}`
          : `Room ${target.roomIndex + 1} toilet / bathroom`;
      setNotice(`${added.length} photo${added.length === 1 ? "" : "s"} uploaded to ${section}. Save the property to keep the changes.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Photo upload failed."); }
    finally { setUploading(false); }
  }

  async function save() {
    if (!form) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save property.");
      const saved = result.property as ManagedProperty;
      setProperties(current => [saved, ...current.filter(property => property.id !== saved.id)]);
      setForm(JSON.parse(JSON.stringify(saved)));
      setNotice(saved.status === "published" ? "Property published. It is now available on the public Stays page." : "Draft saved. You can publish it when all details are ready.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save property."); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="container py-20 text-gray-400">Loading property management...</main>;
  return <main className="container py-8 pb-28 md:py-14">
    <div className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Partner inventory</p><h1 className="mt-3 text-3xl font-semibold md:text-5xl">Property management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">Add guesthouses and hotels once, keep partner terms private, and publish approved stays to Tripelor.</p></div>
      {!form && <button type="button" onClick={openNew} className="btn-gold gap-2"><Plus className="h-4 w-4" /> Add Property</button>}
    </div>
    {notice && !form && <Notice tone="success">{notice}</Notice>}
    {error && !form && <Notice tone="error">{error}</Notice>}
    {!form && <PropertySubmissionInbox onApproved={(property) => setProperties((current) => [property, ...current.filter((item) => item.id !== property.id)])} />}
    {form ? <PropertyForm form={form} update={update} updateRoom={updateRoom} updateSeasonalRate={updateSeasonalRate} updateInventoryRule={updateInventoryRule} setForm={setForm} openSections={openSections} toggle={toggle} onUpload={uploadPhotos} uploading={uploading} saving={saving} onSave={save} onCancel={closeForm} notice={notice} error={error} /> : <PropertyList properties={sortedProperties} onEdit={edit} onNew={openNew} />}
  </main>;
}

function Notice({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) { return <div className={`mt-5 rounded-xl border p-4 text-sm ${tone === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{children}</div>; }

function PropertyList({ properties, onEdit, onNew }: { properties: ManagedProperty[]; onEdit: (property: ManagedProperty) => void; onNew: () => void }) {
  if (!properties.length) return <section className="mt-8 rounded-2xl border border-white/10 bg-white/[.025] p-8 text-center"><BuildingIcon /><h2 className="mt-4 text-2xl font-semibold">No properties added yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">Create your first guesthouse or hotel and publish it when the photos, rates and conditions are ready.</p><button type="button" onClick={onNew} className="btn-gold mt-6 gap-2"><Plus className="h-4 w-4" /> Add Property</button></section>;
  return <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{properties.map(property => <article key={property.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
    <div className="relative aspect-[16/9] bg-[#0b2028]">{property.photos[0] ? <img src={propertyPhotoUrl(property.photos[0])} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-600"><ImagePlus className="h-8 w-8" /></div>}<span className={`absolute left-3 top-3 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] ${property.status === "published" ? "border-emerald-400/30 bg-emerald-950/80 text-emerald-200" : "border-amber-400/30 bg-amber-950/80 text-amber-200"}`}>{property.status}</span></div>
    <div className="p-5"><p className="text-[10px] uppercase tracking-[.18em] text-gold">{property.island || "Island not set"}</p><h2 className="mt-2 text-xl font-semibold">{property.name || "Untitled property"}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-400">{property.description || "No description yet."}</p><div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-gray-500"><span>{property.rooms.length} room rate{property.rooms.length === 1 ? "" : "s"}</span><span>{property.photos.length} photo{property.photos.length === 1 ? "" : "s"}</span></div><button type="button" onClick={() => onEdit(property)} className="btn-outline mt-5 w-full justify-center gap-2"><Pencil className="h-4 w-4" /> Edit property</button></div>
  </article>)}</section>;
}

function BuildingIcon() { return <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold"><Upload className="h-6 w-6" /></div>; }

function PropertyForm({ form, update, updateRoom, updateSeasonalRate, updateInventoryRule, setForm, openSections, toggle, onUpload, uploading, saving, onSave, onCancel, notice, error }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; updateRoom: (index: number, key: keyof FormRoom, value: string | number) => void; updateSeasonalRate: (index: number, key: keyof SeasonalRate, value: string | number) => void; updateInventoryRule: (index: number, key: keyof InventoryRule, value: string | number | boolean) => void; setForm: React.Dispatch<React.SetStateAction<FormState | null>>; openSections: Record<string, boolean>; toggle: (section: string) => void; onUpload: (files: FileList | null, target: PhotoTarget) => void; uploading: boolean; saving: boolean; onSave: () => void; onCancel: () => void; notice: string; error: string }) {
  const roomCount = form.rooms.length;
  function removeRoomPhoto(roomIndex: number, key: "photos" | "bathroomPhotos", photo: string) {
    setForm(current => current ? {
      ...current,
      rooms: current.rooms.map((room, index) => {
        if (index !== roomIndex) return room;
        if (key === "photos") return { ...room, photos: (room.photos || []).filter((item) => item !== photo) };
        return { ...room, bathroomPhotos: (room.bathroomPhotos || []).filter((item) => item !== photo) };
      }),
    } : current);
  }
  return <section className="mt-8 max-w-6xl">
    <div className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-gold/[.05] p-5 md:flex-row md:items-center md:justify-between md:p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">{form.id ? "Edit property" : "New property"}</p><h2 className="mt-2 text-2xl font-semibold">{form.name || "Untitled property"}</h2><p className="mt-1 text-sm text-gray-400">Save as a draft while collecting details, then publish when the page is ready.</p></div><div className="flex gap-2"><button type="button" onClick={onCancel} className="btn-outline gap-2"><X className="h-4 w-4" /> Cancel</button><button type="button" onClick={onSave} disabled={saving || uploading} className="btn-gold gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{form.status === "published" ? "Save & Publish" : "Save Draft"}</button></div></div>
    {notice && <Notice tone="success">{notice}</Notice>}{error && <Notice tone="error">{error}</Notice>}
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <Panel title="Property details" subtitle="The information guests will see." open={true} onToggle={() => {}} collapsible={false}>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Property name" value={form.name} onChange={v => update("name", v)} placeholder="e.g. Coral Garden Guesthouse"/><Field label="Island / location" value={form.island} onChange={v => update("island", v)} placeholder="e.g. V. Felidhoo, Maldives"/><Field label="Public URL" value={form.slug} onChange={v => update("slug", v.toLowerCase().replace(/\s+/g, "-"))} placeholder="coral-garden-guesthouse" hint="Lowercase letters, numbers and hyphens."/></div><TextArea label="Description" value={form.description} onChange={v => update("description", v)} placeholder="Describe the stay, location and guest experience."/><TextArea label="Amenities" value={form.amenities} onChange={v => update("amenities", v)} placeholder="Wi-Fi, breakfast, beach access, air conditioning..." hint="Separate amenities with commas."/>
        </Panel>
        <Panel title={`Rooms & rates · ${roomCount}`} subtitle="Add room types, capacity, meal plans and your margin." open={openSections.rooms} onToggle={() => toggle("rooms")}>
          <div className="space-y-4">{form.rooms.map((room, index) => <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Room rate {String(index + 1).padStart(2, "0")}</p>{form.rooms.length > 1 && <button type="button" onClick={() => setForm(current => current ? { ...current, rooms: current.rooms.filter((_, i) => i !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove room"><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Room type" value={room.name} onChange={v => updateRoom(index, "name", v)} placeholder="Deluxe Double Room"/><NumberField label="Guest capacity" value={room.capacity} onChange={v => updateRoom(index, "capacity", v)} min={1} max={100}/><NumberField label="Rooms available" value={room.totalRooms} onChange={v => updateRoom(index, "totalRooms", v)} min={0} max={100} hint="Use 0 for a draft; set the sellable inventory before publishing."/><Field label="Meal plan" value={room.mealPlan} onChange={v => updateRoom(index, "mealPlan", v)} placeholder="Bed & Breakfast"/><NumberField label="Partner rate (USD)" value={room.contractedRate} onChange={v => updateRoom(index, "contractedRate", v)} min={0} max={1000000}/><NumberField label="Tripelor selling rate (USD)" value={room.sellingRate} onChange={v => updateRoom(index, "sellingRate", v)} min={0} max={1000000}/></div><TextArea label="Room amenities / notes" value={room.amenities} onChange={v => updateRoom(index, "amenities", v)} placeholder="King bed, balcony, private bathroom..."/><div className="mt-5 grid gap-4 lg:grid-cols-2"><PhotoUploadBox label={"Add Room " + (index + 1) + " photos"} helper="Photos of this room rate section." photos={room.photos || []} uploading={uploading} onUpload={(files) => onUpload(files, { kind: "room", roomIndex: index })} onRemove={(photo) => removeRoomPhoto(index, "photos", photo)}/><PhotoUploadBox label={"Add Room " + (index + 1) + " toilet / bathroom photos"} helper="Show the private toilet or bathroom for this room." photos={room.bathroomPhotos || []} uploading={uploading} onUpload={(files) => onUpload(files, { kind: "bathroom", roomIndex: index })} onRemove={(photo) => removeRoomPhoto(index, "bathroomPhotos", photo)}/></div><p className="mt-3 text-xs text-gray-500">Your partner rate and selling rate are private admin information.</p></div>)}</div><button type="button" onClick={() => setForm(current => current ? { ...current, rooms: [...current.rooms, emptyRoom()] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add room rate</button>
        </Panel>
        <Panel title={`Seasonal rates · ${form.seasonalRates.length}`} subtitle="Set date-based prices for high season, offers and blackout periods." open={openSections.seasonal} onToggle={() => toggle("seasonal")}>
          <div className="space-y-4">{form.seasonalRates.map((rate, index) => <div key={rate.id || index} className="rounded-2xl border border-gold/20 bg-gold/[.035] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Season {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => setForm(current => current ? { ...current, seasonalRates: current.seasonalRates.filter((_, i) => i !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" aria-label="Remove seasonal rate"><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Season name" value={rate.name} onChange={v => updateSeasonalRate(index, "name", v)} placeholder="High season 2026"/><label className="grid gap-2 text-sm"><span className="font-medium text-white/85">Room type</span><select value={rate.roomName} onChange={e => updateSeasonalRate(index, "roomName", e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold"><option value="">Choose a room</option>{form.rooms.filter(room => room.name).map(room => <option key={room.name} value={room.name}>{room.name}</option>)}</select></label><Field label="Start date" type="date" value={rate.startDate} onChange={v => updateSeasonalRate(index, "startDate", v)}/><Field label="End date" type="date" value={rate.endDate} onChange={v => updateSeasonalRate(index, "endDate", v)}/><Field label="Meal plan" value={rate.mealPlan} onChange={v => updateSeasonalRate(index, "mealPlan", v)} placeholder="Bed & Breakfast"/><NumberField label="Partner rate (USD)" value={rate.contractedRate} onChange={v => updateSeasonalRate(index, "contractedRate", v)} min={0} max={1000000}/><NumberField label="Tripelor selling rate (USD)" value={rate.sellingRate} onChange={v => updateSeasonalRate(index, "sellingRate", v)} min={0} max={1000000}/></div><p className="mt-3 text-xs text-gray-500">The end date is included. If seasons overlap, the more specific date range is used.</p></div>)}</div><button type="button" onClick={() => setForm(current => current ? { ...current, seasonalRates: [...current.seasonalRates, { ...emptySeasonalRate(), roomName: current.rooms.find(room => room.name)?.name || "" }] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add seasonal rate</button>
        </Panel>
      </div>
      <div className="space-y-5">
        <Panel title="Property photographs" subtitle="Shown across the property's public page." open={true} onToggle={() => {}} collapsible={false}>
          <PhotoUploadBox
            label="Add property photos"
            helper="Choose multiple JPG, PNG or WebP images up to 10 MB each."
            photos={form.photos}
            uploading={uploading}
            onUpload={(files) => onUpload(files, { kind: "property" })}
            onRemove={(photo) => update("photos", form.photos.filter((item) => item !== photo))}
            cover
          />
        </Panel>
        <Panel title="Booking conditions" subtitle="Shown on the public property page." open={openSections.commercial} onToggle={() => toggle("commercial")}><TextArea label="Taxes & service charges" value={form.taxes} onChange={v => update("taxes", v)} placeholder="e.g. 10% service charge and 17% GST included / excluded."/><TextArea label="Transfer options" value={form.transfers} onChange={v => update("transfers", v)} placeholder="e.g. Speedboat, public ferry, airport transfer details."/><TextArea label="Cancellation conditions" value={form.cancellation} onChange={v => update("cancellation", v)} placeholder="Explain notice periods and non-refundable amounts."/><TextArea label="Payment conditions" value={form.payment} onChange={v => update("payment", v)} placeholder="e.g. Payment is due after Tripelor confirms availability."/></Panel>
        <Panel title="Partner contact & commercial terms" subtitle="Only visible to your admin account." open={openSections.partner} onToggle={() => toggle("partner")}><Field label="Partner / property manager" value={form.partnerName} onChange={v => update("partnerName", v)} placeholder="Manager name"/><Field label="Partner email" value={form.partnerEmail} onChange={v => update("partnerEmail", v)} placeholder="manager@example.com" type="email"/><Field label="Partner phone / WhatsApp" value={form.partnerPhone} onChange={v => update("partnerPhone", v)} placeholder="+960 ..."/><p className="mt-3 text-xs leading-5 text-gray-500">Contracted rates, partner contacts and unpublished drafts are never sent to public visitors.</p></Panel>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Publishing</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => update("status", "draft")} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.status === "draft" ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-gray-500"}`}>Save as draft</button><button type="button" onClick={() => update("status", "published")} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.status === "published" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-gray-500"}`}>Publish live</button></div><p className="mt-3 text-xs leading-5 text-gray-500">Publishing makes the property visible on the Stays page and its public property link.</p></div>
      </div>
    </div>
  </section>;
}

function PhotoUploadBox({ label, helper, photos, uploading, onUpload, onRemove, cover = false }: { label: string; helper: string; photos: string[]; uploading: boolean; onUpload: (files: FileList | null) => void; onRemove: (photo: string) => void; cover?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gold/35 bg-gold/[.04] p-5 text-center transition hover:bg-gold/[.08]"><ImagePlus className="h-6 w-6 text-gold"/><span className="mt-3 text-sm font-semibold">{uploading ? "Uploading..." : label}</span><span className="mt-1 text-xs leading-5 text-gray-500">{helper}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(event) => { onUpload(event.target.files); event.currentTarget.value = ""; }}/></label>{photos.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{photos.map((photo, index) => <div key={photo} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10"><img src={propertyPhotoUrl(photo)} alt={`${label} ${index + 1}`} className="h-full w-full object-cover"/><button type="button" onClick={() => onRemove(photo)} className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition group-hover:opacity-100" aria-label={`Remove ${label} photo ${index + 1}`}><X className="h-3 w-3"/></button>{cover && index === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-1 text-[9px] uppercase tracking-[.1em] text-gold">Cover</span>}</div>)}</div>}</div>;
}

function Panel({ title, subtitle, open, onToggle, children, collapsible = true }: { title: string; subtitle: string; open: boolean; onToggle: () => void; children: React.ReactNode; collapsible?: boolean }) { return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6"><button type="button" onClick={onToggle} disabled={!collapsible} className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-default"><span><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-xs text-gray-500">{subtitle}</p></span>{collapsible && (open ? <ChevronUp className="mt-1 h-5 w-5 text-gold" /> : <ChevronDown className="mt-1 h-5 w-5 text-gray-500" />)}</button>{open && <div className="mt-5">{children}</div>}</section>; }
function Field({ label, value, onChange, placeholder, hint, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string; type?: string }) { return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
function NumberField({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; hint?: string }) { return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type="number" min={min} max={max} step="0.01" value={value} onChange={e => onChange(Number(e.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
function TextArea({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string }) { return <label className="mt-4 grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-6 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
