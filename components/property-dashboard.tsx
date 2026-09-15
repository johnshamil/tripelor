"use client";
import PropertyHostEditor from "@/components/property-host-editor";
import PropertyKnowEditor from "@/components/property-know-editor";

import { useEffect, useMemo, useState, useRef } from "react";
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
import PropertyArrivalEditor from "@/components/property-arrival-editor";
import WishlistTagsEditor from "@/components/wishlist-tags-editor";
import ManagedPropertyView from "@/components/managed-property-view";
import { publicProperty, propertyPhotoUrl } from "@/lib/property-model";
import type { InventoryRule, ManagedProperty, PropertyExperience, Room, SeasonalRate } from "@/lib/property-model";
import PropertySubmissionInbox from "@/components/property-submission-inbox";

type MealRate = Pick<Room, "mealPlan" | "sellingRate" | "contractedRate">;
type FormRoom = Room & { mealRates: MealRate[] };
type FormState = Omit<ManagedProperty, "id" | "updated_at" | "rooms"> & { id?: string; updated_at?: string; rooms: FormRoom[] };
type PhotoTarget =
  | { kind: "property" }
  | { kind: "experience"; experienceId: string }
  | { kind: "room"; roomIndex: number }
  | { kind: "bathroom"; roomIndex: number };

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const emptyRoom = (): FormRoom => ({ name: "", capacity: 2, amenities: "", mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0, totalRooms: 1, photos: [], bathroomPhotos: [], mealRates: [{ mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0 }] });
const emptySeasonalRate = (): SeasonalRate => ({ id: crypto.randomUUID(), name: "", startDate: "", endDate: "", roomName: "", mealPlan: "Bed & Breakfast", sellingRate: 0, contractedRate: 0 });
const emptyInventoryRule = (): InventoryRule => ({ id: crypto.randomUUID(), roomName: "", startDate: "", endDate: "", roomsAvailable: 0, stopSale: false, note: "" });
const emptyForm = (): FormState => ({
  slug: "", status: "draft", name: "", island: "", description: "", photos: [], amenities: "", rooms: [emptyRoom()],
  experiences: [], seasonalRates: [], inventoryRules: [],
  taxes: "", transfers: "", cancellation: "", payment: "", partnerName: "", partnerEmail: "", partnerPhone: "",
});


function propertyToForm(property: ManagedProperty): FormState {
  const groups = new Map<string, FormRoom>();
  property.rooms.forEach((room, index) => {
    const key = room.name || `unnamed-${index}`;
    const rate = { mealPlan: room.mealPlan, sellingRate: room.sellingRate, contractedRate: room.contractedRate };
    const existing = groups.get(key);
    if (existing) {
      existing.mealRates.push(rate);
      existing.photos = Array.from(new Set([...(existing.photos || []), ...(room.photos || [])]));
      existing.bathroomPhotos = Array.from(new Set([...(existing.bathroomPhotos || []), ...(room.bathroomPhotos || [])]));
    } else {
      groups.set(key, { ...room, photos: [...(room.photos || [])], bathroomPhotos: [...(room.bathroomPhotos || [])], mealRates: [rate] });
    }
  });
  return { ...property, rooms: Array.from(groups.values()) };
}

function roomsForSave(rooms: FormRoom[]): Room[] {
  const names = rooms.map(room => room.name.trim().toLowerCase()).filter(Boolean);
  if (new Set(names).size !== names.length) throw new Error("Use one room editor per room name. Add meal plans inside that room.");
  return rooms.flatMap(({ mealRates, ...room }) => {
    if (!mealRates.length) throw new Error("Add at least one meal plan to each room.");
    const plans = mealRates.map(rate => rate.mealPlan.trim().toLowerCase());
    if (new Set(plans).size !== plans.length) throw new Error(`Use each meal plan only once for ${room.name || "this room"}.`);
    return mealRates.map(rate => ({ ...room, ...rate }));
  });
}


function duplicateRoomEntry(rooms: FormRoom[], index: number): FormRoom[] {
  const source = rooms[index];
  if (!source) return rooms;
  if (rooms.reduce((count, room) => count + room.mealRates.length, 0) + source.mealRates.length > 40) return rooms;
  const names = new Set(rooms.map(room => room.name.trim().toLowerCase()));
  const base = source.name.trim().slice(0, 130) || "Room";
  let name = base + " (copy)";
  let suffix = 2;
  while (names.has(name.toLowerCase())) name = base + " (copy " + suffix++ + ")";
  const duplicate: FormRoom = {
    ...source, name, totalRooms: 0, photos: [], bathroomPhotos: [],
    mealRates: source.mealRates.map(rate => ({ ...rate })),
  };
  return [...rooms, duplicate];
}

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
  function edit(property: ManagedProperty) { setForm(propertyToForm(property)); setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
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
        if (target.kind === "experience") return { ...current, experiences: (current.experiences || []).map(item => item.id === target.experienceId ? { ...item, photos: [...item.photos, ...added] } : item) };
        return {
          ...current,
          rooms: current.rooms.map((room, index) => {
            if (index !== target.roomIndex) return room;
            if (target.kind === "room") return { ...room, photos: [...(room.photos || []), ...added] };
            return { ...room, bathroomPhotos: [...(room.bathroomPhotos || []), ...added] };
          }),
        };
      });
      const section = target.kind === "experience" ? "the experience" : target.kind === "property"
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
      const response = await fetch("/api/admin/properties", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, rooms: roomsForSave(form.rooms) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save property.");
      const saved = result.property as ManagedProperty;
      setProperties(current => [saved, ...current.filter(property => property.id !== saved.id)]);
      setForm(propertyToForm(saved));
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
    {form ? <PropertyForm form={form} update={update} updateRoom={updateRoom} updateSeasonalRate={updateSeasonalRate} updateInventoryRule={updateInventoryRule} setForm={setForm} openSections={openSections} toggle={toggle} onUpload={uploadPhotos} onHostBusy={setUploading} uploading={uploading} saving={saving} onSave={save} onCancel={closeForm} notice={notice} error={error} /> : <PropertyList properties={sortedProperties} onEdit={edit} onNew={openNew} />}
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

function PropertyForm({ form, update, updateRoom, updateSeasonalRate, updateInventoryRule, setForm, openSections, toggle, onUpload, onHostBusy, uploading, saving, onSave, onCancel, notice, error }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; updateRoom: (index: number, key: keyof FormRoom, value: string | number) => void; updateSeasonalRate: (index: number, key: keyof SeasonalRate, value: string | number) => void; updateInventoryRule: (index: number, key: keyof InventoryRule, value: string | number | boolean) => void; setForm: React.Dispatch<React.SetStateAction<FormState | null>>; openSections: Record<string, boolean>; toggle: (section: string) => void; onUpload: (files: FileList | null, target: PhotoTarget) => void; onHostBusy: (busy: boolean) => void; uploading: boolean; saving: boolean; onSave: () => void; onCancel: () => void; notice: string; error: string }) {
  const [duplicateNotice, setDuplicateNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewScroll, setPreviewScroll] = useState(0);
  if (preview) {
    const previewProperty = publicProperty({
      ...form,
      id: form.id || "preview",
      updated_at: form.updated_at || "",
      rooms: form.rooms.flatMap(({ mealRates, ...room }) => mealRates.map(rate => ({ ...room, ...rate }))),
    });
    return <section className="mt-6">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-[#071922] p-4">
        <div><h2 className="font-semibold text-gold">Private property preview</h2><p className="mt-1 text-xs text-gray-400">Includes your unsaved edits. Nothing has been published. Booking is disabled here.</p></div>
        <button type="button" className="btn-gold" onClick={() => { setPreview(false); requestAnimationFrame(() => window.scrollTo({ top: previewScroll })); }}>Back to editing</button>
      </div>
      <div onClickCapture={event => {
        const link = (event.target as Element).closest("a");
        if (link && !link.getAttribute("href")?.startsWith("#")) { event.preventDefault(); event.stopPropagation(); }
      }}>
        <ManagedPropertyView property={previewProperty} preview/>
      </div>
    </section>;
  }
  function updateExperience(id:string, patch:Partial<PropertyExperience>) {
    setForm(current=>current?{...current,experiences:(current.experiences||[]).map(item=>item.id===id?{...item,...patch}:item)}:current);
  }
  const roomCount = form.rooms.length;
  const rateCount = form.rooms.reduce((count, room) => count + room.mealRates.length, 0);
  function duplicateRoom(index: number) {
    if (uploading || saving) return;
    setForm(current => current ? { ...current, rooms: duplicateRoomEntry(current.rooms, index) } : current);
    setDuplicateNotice("Room copied to the bottom of Rooms & rates. Rename it, add its photos and set Rooms available before publishing. Save the property to keep the copy.");
  }
  function updateMealRate(roomIndex:number, rateIndex:number, key:keyof MealRate, value:string|number) {
    setForm(current => current ? { ...current, rooms: current.rooms.map((room,i)=>i===roomIndex ? { ...room, mealRates: room.mealRates.map((rate,j)=>j===rateIndex ? { ...rate, [key]:value } : rate) } : room) } : current);
  }
  function addMealRate(roomIndex:number, mealPlan:string) {
    setForm(current => current ? { ...current, rooms: current.rooms.map((room,i)=>i===roomIndex ? { ...room, mealRates:[...room.mealRates,{mealPlan,sellingRate:0,contractedRate:0}] } : room) } : current);
  }
  function reorderRoomPhotos(roomIndex: number, key: "photos" | "bathroomPhotos", photos: string[]) {
    setForm(current => current ? { ...current, rooms: current.rooms.map((room, index) => index === roomIndex ? { ...room, [key]: photos } : room) } : current);
  }
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
    <div className="flex flex-col gap-4 rounded-2xl border border-gold/20 bg-gold/[.05] p-5 md:flex-row md:items-center md:justify-between md:p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">{form.id ? "Edit property" : "New property"}</p><h2 className="mt-2 text-2xl font-semibold">{form.name || "Untitled property"}</h2><p className="mt-1 text-sm text-gray-400">Save as a draft while collecting details, then publish when the page is ready.</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={saving || uploading} className="btn-outline disabled:opacity-50" onClick={() => { setPreviewScroll(window.scrollY); setPreview(true); window.scrollTo({ top: 0 }); }}>Preview Property</button><button type="button" onClick={onCancel} disabled={saving || uploading} className="btn-outline gap-2 disabled:opacity-50"><X className="h-4 w-4" /> Cancel</button><button type="button" onClick={onSave} disabled={saving || uploading} className="btn-gold gap-2 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{form.status === "published" ? "Save & Publish" : "Save Draft"}</button></div></div>
    {duplicateNotice && <div role="status"><Notice tone="success">{duplicateNotice}</Notice></div>}{notice && <Notice tone="success">{notice}</Notice>}{error && <Notice tone="error">{error}</Notice>}
    <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <Panel title="Property details" subtitle="The information guests will see." open={true} onToggle={() => {}} collapsible={false}>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Property name" value={form.name} onChange={v => update("name", v)} placeholder="e.g. Coral Garden Guesthouse"/><Field label="Island / location" value={form.island} onChange={v => update("island", v)} placeholder="e.g. V. Felidhoo, Maldives"/><Field label="Public URL" value={form.slug} onChange={v => update("slug", v.toLowerCase().replace(/\s+/g, "-"))} placeholder="coral-garden-guesthouse" hint="Lowercase letters, numbers and hyphens."/></div><TextArea label="Description" value={form.description} onChange={v => update("description", v)} placeholder="Describe the stay, location and guest experience."/><TextArea label="Amenities" value={form.amenities} onChange={v => update("amenities", v)} placeholder="Wi-Fi, breakfast, beach access, air conditioning..." hint="Separate amenities with commas."/>
          <WishlistTagsEditor tags={form.wishlistTags || []} onChange={tags=>update("wishlistTags",tags)} />
        </Panel>
        <Panel title={`Rooms & rates · ${roomCount}`} subtitle="Add room types, capacity, meal plans and your margin." open={openSections.rooms} onToggle={() => toggle("rooms")}>
          <div className="space-y-4">{form.rooms.map((room, index) => <div key={index} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Room {String(index + 1).padStart(2, "0")}</p><button type="button" onClick={() => duplicateRoom(index)} disabled={uploading || saving || rateCount + room.mealRates.length > 40} title={rateCount + room.mealRates.length > 40 ? "A property supports up to 40 meal-plan rates." : "Copy details and rates into a new room"} className="min-h-11 rounded-lg border border-gold/30 px-3 py-2 text-xs font-semibold text-gold disabled:opacity-40" aria-label={`Duplicate ${room.name || "room " + (index + 1)}`}>Duplicate Room</button>{form.rooms.length > 1 && <button type="button" onClick={() => setForm(current => current ? { ...current, rooms: current.rooms.filter((_, i) => i !== index) } : current)} className="rounded-full p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300" disabled={uploading || saving} aria-label="Remove room"><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Room type" value={room.name} onChange={v => updateRoom(index, "name", v)} placeholder="Deluxe Double Room"/><NumberField label="Guest capacity" value={room.capacity} onChange={v => updateRoom(index, "capacity", v)} min={1} max={100}/><NumberField label="Rooms available" value={room.totalRooms} onChange={v => updateRoom(index, "totalRooms", v)} min={0} max={100} hint="Use 0 for a draft; set the sellable inventory before publishing."/></div><TextArea label="Room amenities / notes" value={room.amenities} onChange={v => updateRoom(index, "amenities", v)} placeholder="King bed, balcony, private bathroom..."/><div className="mt-5 grid gap-4 lg:grid-cols-2"><PhotoUploadBox label={"Add Room " + (index + 1) + " photos"} helper="Upload once for all meal plans of this room." photos={room.photos || []} uploading={uploading} onUpload={(files) => onUpload(files, { kind: "room", roomIndex: index })} onRemove={(photo) => removeRoomPhoto(index, "photos", photo)} onReorder={(photos) => reorderRoomPhotos(index, "photos", photos)} cover/><PhotoUploadBox label={"Add Room " + (index + 1) + " toilet / bathroom photos"} helper="Show the private toilet or bathroom for this room." photos={room.bathroomPhotos || []} uploading={uploading} onUpload={(files) => onUpload(files, { kind: "bathroom", roomIndex: index })} onRemove={(photo) => removeRoomPhoto(index, "bathroomPhotos", photo)} onReorder={(photos) => reorderRoomPhotos(index, "bathroomPhotos", photos)}/></div><div className="mt-6 border-t border-white/10 pt-5">
  <h4 className="text-sm font-semibold text-gold">Meal plans & rates</h4>
  <p className="mt-2 text-xs leading-5 text-gray-400">Enter a selling price and private contracted rate for each meal plan you offer. Photos and room details above apply to all plans.</p>
  <div className="mt-4 space-y-3">{room.mealRates.map((rate, rateIndex) => <div key={rateIndex} className="rounded-xl border border-gold/20 p-4">
    <div className="flex items-start justify-between gap-2"><Field label="Meal plan" value={rate.mealPlan} onChange={v => updateMealRate(index, rateIndex, "mealPlan", v)} placeholder="Bed & Breakfast"/>{room.mealRates.length > 1 && <button type="button" onClick={() => setForm(current => current ? { ...current, rooms: current.rooms.map((item,i) => i===index ? { ...item, mealRates: item.mealRates.filter((_,j)=>j!==rateIndex) } : item) } : current)} aria-label={`Remove ${rate.mealPlan} from ${room.name || "room"}`} className="p-2 text-gray-400 hover:text-red-300"><Trash2 className="h-4 w-4"/></button>}</div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><NumberField label="Selling price (USD)" value={rate.sellingRate} onChange={v=>updateMealRate(index,rateIndex,"sellingRate",v)} min={0} max={1000000}/><NumberField label="Contracted rate (USD) · Private" value={rate.contractedRate} onChange={v=>updateMealRate(index,rateIndex,"contractedRate",v)} min={0} max={1000000}/></div>
  </div>)}</div>
  <div className="mt-4 flex flex-wrap gap-2">{[["BB","Bed & Breakfast"],["HB","Half Board"],["FB","Full Board"],["RO","Room Only"],["AI","All Inclusive"]].filter(([,name])=>!room.mealRates.some(rate=>rate.mealPlan.toLowerCase()===name.toLowerCase())).map(([label,name])=><button key={label} type="button" onClick={()=>addMealRate(index,name)} className="rounded-lg border border-gold/30 px-3 py-2 text-xs text-gold">+ {label}</button>)}<button type="button" onClick={()=>addMealRate(index,"")} className="rounded-lg border border-white/20 px-3 py-2 text-xs">+ Other plan</button></div>
  <p className="mt-3 text-xs text-gray-500">Selling prices are shown to guests. Contracted rates stay private.</p>
</div></div>)}</div><button type="button" onClick={() => setForm(current => current ? { ...current, rooms: [...current.rooms, emptyRoom()] } : current)} className="btn-outline mt-4 gap-2"><Plus className="h-4 w-4" /> Add room</button>
        </Panel>
        <Panel title={`Things to do near this stay · ${(form.experiences || []).length}`} subtitle="Add local experiences for this property. Prices are starting estimates; customers save their interest to My Tripelor." open={true} onToggle={()=>{}} collapsible={false}>
          <div className="space-y-5">{(form.experiences || []).map(experience=><div key={experience.id} className="rounded-xl border border-gold/20 p-4">
            <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={experience.enabled} onChange={e=>updateExperience(experience.id,{enabled:e.target.checked})}/>Show to customers when property is published</label><button type="button" disabled={uploading||saving} aria-label={`Remove ${experience.name || "experience"}`} onClick={()=>setForm(current=>current?{...current,experiences:(current.experiences||[]).filter(item=>item.id!==experience.id)}:current)} className="min-h-11 p-2 text-red-300"><Trash2 className="h-4 w-4"/></button></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Experience name" value={experience.name} onChange={name=>updateExperience(experience.id,{name})} placeholder="e.g. Sandbank excursion"/><Field label="Duration" value={experience.duration} onChange={duration=>updateExperience(experience.id,{duration})} placeholder="e.g. 3 hours"/><NumberField label="Starting price (USD)" value={experience.price} onChange={price=>updateExperience(experience.id,{price})} min={0} max={1000000} hint="Use 0 to display Price on request."/><Field label="Price unit" value={experience.priceUnit} onChange={priceUnit=>updateExperience(experience.id,{priceUnit})} placeholder="per person / per group"/></div>
            <WishlistTagsEditor tags={experience.wishlistTags || []} onChange={wishlistTags=>updateExperience(experience.id,{wishlistTags})} />
            <TextArea label="Description" value={experience.description} onChange={description=>updateExperience(experience.id,{description})}/><TextArea label="What's included" value={experience.inclusions} onChange={inclusions=>updateExperience(experience.id,{inclusions})} placeholder="List confirmed inclusions and any important conditions."/>
            <div className="mt-4"><PhotoUploadBox label={`Add ${experience.name || "experience"} photos`} helper="JPG, PNG or WebP up to 10 MB each. First photo is the cover." photos={experience.photos} uploading={uploading} onUpload={files=>onUpload(files,{kind:"experience",experienceId:experience.id})} onRemove={photo=>updateExperience(experience.id,{photos:experience.photos.filter(item=>item!==photo)})} onReorder={photos=>updateExperience(experience.id,{photos})} cover/></div>
          </div>)}</div>
          <button type="button" disabled={uploading||saving||(form.experiences||[]).length>=30} onClick={()=>setForm(current=>current?{...current,experiences:[...(current.experiences||[]),{id:crypto.randomUUID(),name:"",description:"",duration:"",price:0,priceUnit:"per person",inclusions:"",photos:[],enabled:false}]}:current)} className="btn-outline mt-4">+ Add experience</button>
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
            onReorder={(photos) => update("photos", photos)}
            cover
          />
        </Panel>
        <PropertyHostEditor value={form.host} onChange={value => update("host", value)} busy={uploading || saving} onBusyChange={onHostBusy}/>
        <PropertyKnowEditor value={form.knowBeforeBooking} onChange={value => update("knowBeforeBooking", value)}/>
        <PropertyArrivalEditor value={form.arrival} onChange={value => update("arrival", value)}/>
        <Panel title="Booking conditions" subtitle="Shown on the public property page." open={openSections.commercial} onToggle={() => toggle("commercial")}><TextArea label="Taxes & service charges" value={form.taxes} onChange={v => update("taxes", v)} placeholder="e.g. 10% service charge and 17% GST included / excluded."/><TextArea label="Transfer options" value={form.transfers} onChange={v => update("transfers", v)} placeholder="e.g. Speedboat, public ferry, airport transfer details."/><TextArea label="Cancellation conditions" value={form.cancellation} onChange={v => update("cancellation", v)} placeholder="Explain notice periods and non-refundable amounts."/><TextArea label="Payment conditions" value={form.payment} onChange={v => update("payment", v)} placeholder="e.g. Payment is due after Tripelor confirms availability."/></Panel>
        <Panel title="Partner contact & commercial terms" subtitle="Only visible to your admin account." open={openSections.partner} onToggle={() => toggle("partner")}><Field label="Partner / property manager" value={form.partnerName} onChange={v => update("partnerName", v)} placeholder="Manager name"/><Field label="Partner email" value={form.partnerEmail} onChange={v => update("partnerEmail", v)} placeholder="manager@example.com" type="email"/><Field label="Partner phone / WhatsApp" value={form.partnerPhone} onChange={v => update("partnerPhone", v)} placeholder="+960 ..."/><p className="mt-3 text-xs leading-5 text-gray-500">Contracted rates, partner contacts and unpublished drafts are never sent to public visitors.</p></Panel>
        <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Publishing</p><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => update("status", "draft")} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.status === "draft" ? "border-gold bg-gold/15 text-gold" : "border-white/10 text-gray-500"}`}>Save as draft</button><button type="button" onClick={() => update("status", "published")} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${form.status === "published" ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-gray-500"}`}>Publish live</button></div><p className="mt-3 text-xs leading-5 text-gray-500">Publishing makes the property visible on the Stays page and its public property link.</p></div>
      </div>
    </div>
  </section>;
}

function PhotoUploadBox({ label, helper, photos, uploading, onUpload, onRemove, onReorder, cover = false }: { label: string; helper: string; photos: string[]; uploading: boolean; onUpload: (files: FileList | null) => void; onRemove: (photo: string) => void; onReorder: (photos: string[]) => void; cover?: boolean }) {
  const dragged = useRef<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  function move(from: number, to: number) {
    if (uploading || from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    const next = [...photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onReorder(next);
    setAnnouncement(`Photo moved to position ${to + 1}.${cover && to === 0 ? " Cover selected." : ""} Save the property to keep this order.`);
  }
  const control = "min-h-11 rounded-lg border border-white/20 px-2 py-2 text-xs text-white/80 hover:border-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-30";
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gold/35 bg-gold/[.04] p-5 text-center transition hover:bg-gold/[.08]">
      <ImagePlus className="h-6 w-6 text-gold"/><span className="mt-3 text-sm font-semibold">{uploading ? "Uploading..." : label}</span><span className="mt-1 text-xs leading-5 text-gray-500">{helper}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(event) => { onUpload(event.target.files); event.currentTarget.value = ""; }}/>
    </label>
    {photos.length > 0 && <>
      <p className="mt-4 text-xs leading-5 text-gray-400">Drag photos to reorder, or use Earlier and Later. {cover && "The first photo is the cover."} Save the property to keep your changes.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{photos.map((photo, index) => <div key={photo} draggable={!uploading}
        onDragStart={event => { dragged.current = index; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(index)); }}
        onDragEnd={() => { dragged.current = null; }}
        onDragOver={event => { if (dragged.current !== null && !uploading) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
        onDrop={event => { event.preventDefault(); const from = dragged.current; dragged.current = null; if (from !== null) move(from, index); }}
        className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div className="relative aspect-square"><img draggable={false} src={propertyPhotoUrl(photo)} alt={`${label} ${index + 1}`} className="h-full w-full object-cover"/>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/80 px-3 py-1 text-xs text-gold">{cover && index === 0 ? "Cover" : `Photo ${index + 1}`}</span>
        </div>
        <div className="grid gap-2 p-2">
          {cover && <button type="button" disabled={uploading || index === 0} onClick={() => move(index, 0)} className={control} aria-label={`Set ${label} photo ${index + 1} as cover`}>{index === 0 ? "Current cover" : "Set as Cover"}</button>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={uploading || index === 0} onClick={() => move(index, index - 1)} className={control} aria-label={`Move ${label} photo ${index + 1} earlier`}>← Earlier</button>
            <button type="button" disabled={uploading || index === photos.length - 1} onClick={() => move(index, index + 1)} className={control} aria-label={`Move ${label} photo ${index + 1} later`}>Later →</button>
          </div>
          <button type="button" disabled={uploading} onClick={() => onRemove(photo)} className={control} aria-label={`Remove ${label} photo ${index + 1}`}>Remove photo</button>
        </div>
      </div>)}</div>
    </>}
    <p role="status" aria-live="polite" className="mt-2 text-xs text-gold">{announcement}</p>
  </div>;
}

function Panel({ title, subtitle, open, onToggle, children, collapsible = true }: { title: string; subtitle: string; open: boolean; onToggle: () => void; children: React.ReactNode; collapsible?: boolean }) { return <section className="rounded-2xl border border-white/10 bg-white/[.025] p-5 md:p-6"><button type="button" onClick={onToggle} disabled={!collapsible} className="flex w-full items-start justify-between gap-4 text-left disabled:cursor-default"><span><h3 className="text-lg font-semibold">{title}</h3><p className="mt-1 text-xs text-gray-500">{subtitle}</p></span>{collapsible && (open ? <ChevronUp className="mt-1 h-5 w-5 text-gold" /> : <ChevronDown className="mt-1 h-5 w-5 text-gray-500" />)}</button>{open && <div className="mt-5">{children}</div>}</section>; }
function Field({ label, value, onChange, placeholder, hint, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string; type?: string }) { return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
function NumberField({ label, value, onChange, min, max, hint }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; hint?: string }) { return <label className="grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><input type="number" min={min} max={max} step="0.01" value={value} onChange={e => onChange(Number(e.target.value))} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
function TextArea({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; hint?: string }) { return <label className="mt-4 grid gap-2 text-sm"><span className="font-medium text-white/85">{label}</span><textarea rows={3} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-6 outline-none transition focus:border-gold" />{hint && <span className="text-[11px] text-gray-500">{hint}</span>}</label>; }
