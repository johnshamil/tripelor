export type Room = { name: string; capacity: number; totalRooms: number; amenities: string; mealPlan: string; sellingRate: number; contractedRate: number };
export type SeasonalRate = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  roomName: string;
  mealPlan: string;
  sellingRate: number;
  contractedRate: number;
};
export type InventoryRule = {
  id: string;
  roomName: string;
  startDate: string;
  endDate: string;
  roomsAvailable: number;
  stopSale: boolean;
  note: string;
};
export type ManagedProperty = {
  id: string;
  slug: string;
  status: "draft" | "published";
  updated_at: string;
  name: string;
  island: string;
  description: string;
  photos: string[];
  amenities: string;
  rooms: Room[];
  seasonalRates: SeasonalRate[];
  inventoryRules: InventoryRule[];
  taxes: string;
  transfers: string;
  cancellation: string;
  payment: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
};
export type PublicProperty = Omit<ManagedProperty, "partnerName" | "partnerEmail" | "partnerPhone" | "rooms" | "seasonalRates" | "inventoryRules"> & {
  rooms: Omit<Room, "contractedRate">[];
  seasonalRates: Omit<SeasonalRate, "contractedRate">[];
  inventoryRules: Omit<InventoryRule, "note">[];
};
type RateSource = { rooms: Array<{ name: string; mealPlan?: string; sellingRate: number }>; seasonalRates?: Array<{ name: string; startDate: string; endDate: string; roomName: string; mealPlan: string; sellingRate: number }> };
export function seasonalRateForDate(property: RateSource, roomName: string, mealPlan: string, date: string) {
  if(!date) return null;
  return (property.seasonalRates || [])
    .filter(rate => rate.roomName.toLowerCase() === roomName.toLowerCase() && rate.mealPlan.toLowerCase() === mealPlan.toLowerCase() && date >= rate.startDate && date <= rate.endDate)
    .sort((a,b) => ((Date.parse(`${a.endDate}T00:00:00Z`) - Date.parse(`${a.startDate}T00:00:00Z`)) - (Date.parse(`${b.endDate}T00:00:00Z`) - Date.parse(`${b.startDate}T00:00:00Z`))) || b.startDate.localeCompare(a.startDate))[0] || null;
}
export function propertyRateForDate(property: RateSource, roomName: string, mealPlan: string, date: string) {
  const room = property.rooms.find(item => item.name.toLowerCase() === roomName.toLowerCase() && (!item.mealPlan || item.mealPlan.toLowerCase() === mealPlan.toLowerCase())) || property.rooms.find(item => item.name.toLowerCase() === roomName.toLowerCase());
  return seasonalRateForDate(property, roomName, mealPlan, date)?.sellingRate ?? room?.sellingRate ?? 0;
}
export function publicProperty(p: ManagedProperty): PublicProperty {
  return {
    id:p.id,
    slug:p.slug,
    status:p.status,
    updated_at:p.updated_at,
    name:p.name,
    island:p.island,
    description:p.description,
    photos:p.photos,
    amenities:p.amenities,
    taxes:p.taxes,
    transfers:p.transfers,
    cancellation:p.cancellation,
    payment:p.payment,
    inventoryRules:(p.inventoryRules || []).map(r=>({id:r.id,roomName:r.roomName,startDate:r.startDate,endDate:r.endDate,roomsAvailable:r.roomsAvailable,stopSale:r.stopSale})),
    rooms:p.rooms.map(r=>({name:r.name,capacity:r.capacity,totalRooms:r.totalRooms,amenities:r.amenities,mealPlan:r.mealPlan,sellingRate:r.sellingRate})),
    seasonalRates:(p.seasonalRates || []).map(r=>({id:r.id,name:r.name,startDate:r.startDate,endDate:r.endDate,roomName:r.roomName,mealPlan:r.mealPlan,sellingRate:r.sellingRate})),
  };
}
export function validateProperty(input: any) {
  const text = (v: unknown, max=5000) => { if(typeof v!=="string" || v.length>max) throw new Error("Please shorten the text or complete the missing fields."); return v.trim(); };
  const money = (v: unknown) => { if(typeof v!=="number" || !Number.isFinite(v) || v<0 || v>1000000) throw new Error("Rates must be valid amounts in USD."); return v; };
  const date = (v: unknown) => { const value=text(v,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) throw new Error("Use valid start and end dates."); return value; };
  const rowId = (v: unknown, index: number) => { const value=text(v,100); return value || `row-${index + 1}`; };
  if(!input || !["draft","published"].includes(input.status)) throw new Error("Choose draft or published.");
  const name=text(input.name,150), slug=text(input.slug,100);
  if(!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Enter a name and a URL using lowercase letters, numbers and hyphens.");
  if(["uhoos-lavish-oasis","masfalhi-view-inn","rivethi-beach-hotel"].includes(slug)) throw new Error("This URL belongs to an existing property. Choose another URL.");
  if(!Array.isArray(input.rooms)||input.rooms.length>40||!Array.isArray(input.photos)||input.photos.length>20) throw new Error("Use up to 40 room rates and 20 photographs.");
  const rooms:Room[]=input.rooms.map((r:any)=>{ const capacity=Number(r.capacity), totalRooms=Number(r.totalRooms); if(!Number.isInteger(capacity)||capacity<1||capacity>100) throw new Error("Guest capacity must be between 1 and 100."); if(!Number.isInteger(totalRooms)||totalRooms<0||totalRooms>100) throw new Error("Rooms available must be between 0 and 100."); return {name:text(r.name,150),capacity,totalRooms,amenities:text(r.amenities),mealPlan:text(r.mealPlan,100),sellingRate:money(r.sellingRate),contractedRate:money(r.contractedRate)}; });
  const photos=input.photos.map((p:unknown)=>{ const s=text(p,200); if(!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s)) throw new Error("Use uploaded photographs."); return s; });
  if(!Array.isArray(input.seasonalRates)||input.seasonalRates.length>100||!Array.isArray(input.inventoryRules)||input.inventoryRules.length>100) throw new Error("Use up to 100 seasonal rates and 100 inventory rules.");
  const seasonalRates:SeasonalRate[]=input.seasonalRates.map((r:any,index:number)=>{ const startDate=date(r.startDate), endDate=date(r.endDate); if(endDate<startDate) throw new Error("A seasonal rate end date must be after its start date."); return {id:rowId(r.id,index),name:text(r.name,120),startDate,endDate,roomName:text(r.roomName,150),mealPlan:text(r.mealPlan,100),sellingRate:money(r.sellingRate),contractedRate:money(r.contractedRate)}; });
  const inventoryRules:InventoryRule[]=input.inventoryRules.map((r:any,index:number)=>{ const startDate=date(r.startDate), endDate=date(r.endDate), roomsAvailable=Number(r.roomsAvailable); if(endDate<startDate) throw new Error("An inventory rule end date must be after its start date."); if(!Number.isInteger(roomsAvailable)||roomsAvailable<0||roomsAvailable>100) throw new Error("Inventory must be a whole number between 0 and 100."); return {id:rowId(r.id,index),roomName:text(r.roomName,150),startDate,endDate,roomsAvailable,stopSale:Boolean(r.stopSale),note:text(r.note,500)}; });
  const data={ name, island:text(input.island,200), description:text(input.description), photos, rooms, seasonalRates, inventoryRules, amenities:text(input.amenities), taxes:text(input.taxes), transfers:text(input.transfers), cancellation:text(input.cancellation), payment:text(input.payment), partnerName:text(input.partnerName,200), partnerEmail:text(input.partnerEmail,250), partnerPhone:text(input.partnerPhone,80) };
  if(data.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.partnerEmail)) throw new Error("Enter a valid partner email.");
  if(input.status==="published" && (!data.island||!data.description||!photos.length||!rooms.length||rooms.some(r=>!r.name||!r.mealPlan||r.sellingRate<=0||r.totalRooms<1)||!data.taxes||!data.transfers||!data.cancellation||!data.payment)) throw new Error("Before publishing, add an island, description, photo, room name, meal plan, selling rate, room inventory and booking conditions.");
  return {slug,status:input.status as ManagedProperty["status"],data};
}
