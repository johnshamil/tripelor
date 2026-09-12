export type Room = { name: string; capacity: number; totalRooms: number; amenities: string; mealPlan: string; sellingRate: number; contractedRate: number };
export type ManagedProperty = { id: string; slug: string; status: "draft" | "published"; updated_at: string; name: string; island: string; description: string; photos: string[]; amenities: string; rooms: Room[]; taxes: string; transfers: string; cancellation: string; payment: string; partnerName: string; partnerEmail: string; partnerPhone: string };
export type PublicProperty = Omit<ManagedProperty, "partnerName" | "partnerEmail" | "partnerPhone" | "rooms"> & { rooms: Omit<Room,"contractedRate">[] };
export function publicProperty(p: ManagedProperty): PublicProperty {
  return { id:p.id, slug:p.slug, status:p.status, updated_at:p.updated_at, name:p.name, island:p.island, description:p.description, photos:p.photos, amenities:p.amenities, taxes:p.taxes, transfers:p.transfers, cancellation:p.cancellation, payment:p.payment, rooms:p.rooms.map(r=>({name:r.name,capacity:r.capacity,totalRooms:r.totalRooms,amenities:r.amenities,mealPlan:r.mealPlan,sellingRate:r.sellingRate})) };
}
export function validateProperty(input: any) {
  const text = (v: unknown, max=5000) => { if(typeof v!=="string" || v.length>max) throw new Error("Please shorten the text or complete the missing fields."); return v.trim(); };
  const money = (v: unknown) => { if(typeof v!=="number" || !Number.isFinite(v) || v<0 || v>1000000) throw new Error("Rates must be valid positive amounts in USD."); return v; };
  if(!input || !["draft","published"].includes(input.status)) throw new Error("Choose draft or published.");
  const name=text(input.name,150), slug=text(input.slug,100);
  if(!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Enter a name and a URL using lowercase letters, numbers and hyphens.");
  if(["uhoos-lavish-oasis","masfalhi-view-inn","rivethi-beach-hotel"].includes(slug)) throw new Error("This URL belongs to an existing property. Choose another URL.");
  if(!Array.isArray(input.rooms)||input.rooms.length>40||!Array.isArray(input.photos)||input.photos.length>20) throw new Error("Use up to 40 room rates and 20 photographs.");
  const rooms:Room[]=input.rooms.map((r:any)=>{ const capacity=Number(r.capacity), totalRooms=Number(r.totalRooms); if(!Number.isInteger(capacity)||capacity<1||capacity>100) throw new Error("Guest capacity must be between 1 and 100."); if(!Number.isInteger(totalRooms)||totalRooms<0||totalRooms>100) throw new Error("Rooms available must be between 0 and 100."); return {name:text(r.name,150),capacity,totalRooms,amenities:text(r.amenities),mealPlan:text(r.mealPlan,100),sellingRate:money(r.sellingRate),contractedRate:money(r.contractedRate)}; });
  const photos=input.photos.map((p:unknown)=>{ const s=text(p,200); if(!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s)) throw new Error("Use uploaded photographs."); return s; });
  const data={ name, island:text(input.island,200), description:text(input.description), photos, rooms, amenities:text(input.amenities), taxes:text(input.taxes), transfers:text(input.transfers), cancellation:text(input.cancellation), payment:text(input.payment), partnerName:text(input.partnerName,200), partnerEmail:text(input.partnerEmail,250), partnerPhone:text(input.partnerPhone,80) };
  if(data.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.partnerEmail)) throw new Error("Enter a valid partner email.");
  if(input.status==="published" && (!data.island||!data.description||!photos.length||!rooms.length||rooms.some(r=>!r.name||!r.mealPlan||r.sellingRate<=0||r.totalRooms<1)||!data.taxes||!data.transfers||!data.cancellation||!data.payment)) throw new Error("Before publishing, add an island, description, photo, room name, meal plan, selling rate, room inventory and booking conditions.");
  return {slug,status:input.status as ManagedProperty["status"],data};
}
