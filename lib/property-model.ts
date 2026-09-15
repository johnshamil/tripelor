export const legacyPropertySlugs = ["uhoos-lavish-oasis", "masfalhi-view-inn", "rivethi-beach-hotel"] as const;

export function isLegacyPhotoPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/api/") && !value.includes("..");
}

export function propertyPhotoUrl(photo: string) {
  return isLegacyPhotoPath(photo) ? photo : `/api/property-photo/${encodeURIComponent(photo)}`;
}

export type Room = { name: string; capacity: number; totalRooms: number; amenities: string; mealPlan: string; sellingRate: number; contractedRate: number; photos?: string[]; bathroomPhotos?: string[] };
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
export type PropertyExperience = { wishlistTags?: string[]; id: string; name: string; description: string; duration: string; price: number; priceUnit: string; inclusions: string; photos: string[]; enabled: boolean };
export type PropertyArrival = { meetingPoint: string; contactName: string; contactDetails: string; journeyTime: string; lateArrival: string; islandWelcome: string };
export function normalizePropertyArrival(value: unknown): PropertyArrival {
  const input = value == null ? {} : value;
  if(typeof input !== "object" || Array.isArray(input)) throw new Error("Enter valid arrival details.");
  const result = {} as PropertyArrival;
  for(const key of ["meetingPoint", "contactName", "contactDetails", "journeyTime", "lateArrival", "islandWelcome"] as const) {
    const field = (input as Record<string, unknown>)[key] ?? "";
    if(typeof field !== "string" || field.length > 2000) throw new Error("Arrival details must be text with up to 2,000 characters per field.");
    result[key] = field.trim();
  }
  return result;
}
export const propertyKnowFields = [
  { key: "beach", label: "Beach access", hint: "Distance or walking time to the beach, and whether a designated bikini beach is available." },
  { key: "wifi", label: "Wi-Fi", hint: "Where Wi-Fi is available, any charges and confirmed limitations." },
  { key: "accessibility", label: "Stairs & accessibility", hint: "Steps, lifts, ground-floor rooms and bathroom access. Describe confirmed facilities." },
  { key: "family", label: "Families & extra beds", hint: "Cots, extra beds, age limits, charges and which rooms can accommodate them." },
  { key: "meals", label: "Meals & dietary requests", hint: "Where meals are served and which dietary requests can be arranged." },
  { key: "checkIn", label: "Check-in", hint: "Local check-in time and early check-in conditions." },
  { key: "checkOut", label: "Check-out", hint: "Local check-out time and late check-out conditions." },
] as const;
export type PropertyKnowDetails = Record<(typeof propertyKnowFields)[number]["key"], string>;
export function normalizePropertyKnowDetails(value: unknown): PropertyKnowDetails {
  const input = value == null ? {} : value;
  if(typeof input !== "object" || Array.isArray(input)) throw new Error("Enter valid Know Before You Book details.");
  const result = {} as PropertyKnowDetails;
  for(const { key, label } of propertyKnowFields) {
    const field = (input as Record<string, unknown>)[key] ?? "";
    if(typeof field !== "string" || field.length > 2000) throw new Error(label + " must be text with up to 2,000 characters.");
    result[key] = field.trim();
  }
  return result;
}
export type PropertyHost = { enabled: boolean; name: string; introduction: string; photo: string; audio: string; transcript: string };
export function normalizePropertyHost(value: unknown): PropertyHost {
  const input = value == null ? {} : value;
  if(typeof input !== "object" || Array.isArray(input)) throw new Error("Enter valid host information.");
  const raw=input as Record<string, unknown>;
  const read=(key:string,max:number)=>{const v=raw[key] ?? "";if(typeof v!=="string" || v.length>max)throw new Error("Please shorten the host " + key + ".");return v.trim();};
  const host={enabled:raw.enabled===true,name:read("name",120),introduction:read("introduction",2000),photo:read("photo",150),audio:read("audio",150),transcript:read("transcript",5000)};
  if(host.photo && !/^profiles\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(host.photo)) throw new Error("Use an uploaded host photograph.");
  if(host.audio && !/^profiles\/[0-9a-f-]{36}\.(mp3|m4a|ogg|webm|wav)$/.test(host.audio)) throw new Error("Use an uploaded host voice message.");
  return host;
}
export type ManagedProperty = {
  host?: PropertyHost;
  knowBeforeBooking?: PropertyKnowDetails;
  arrival?: PropertyArrival;
  wishlistTags?: string[];
  experiences?: PropertyExperience[];
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
  const host=normalizePropertyHost(p.host);
  return {
    host:host.enabled ? host : undefined,
    knowBeforeBooking:normalizePropertyKnowDetails(p.knowBeforeBooking),
    arrival:normalizePropertyArrival(p.arrival),
    wishlistTags:p.wishlistTags || [],
    experiences:(p.experiences || []).filter(e=>e.enabled).map(e=>({wishlistTags:e.wishlistTags || [],id:e.id,name:e.name,description:e.description,duration:e.duration,price:e.price,priceUnit:e.priceUnit,inclusions:e.inclusions,photos:e.photos,enabled:true})),
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
    rooms:p.rooms.map(r=>({name:r.name,capacity:r.capacity,totalRooms:r.totalRooms,amenities:r.amenities,mealPlan:r.mealPlan,sellingRate:r.sellingRate,photos:Array.isArray(r.photos)?r.photos:[],bathroomPhotos:Array.isArray(r.bathroomPhotos)?r.bathroomPhotos:[]})),
    seasonalRates:(p.seasonalRates || []).map(r=>({id:r.id,name:r.name,startDate:r.startDate,endDate:r.endDate,roomName:r.roomName,mealPlan:r.mealPlan,sellingRate:r.sellingRate})),
  };
}
export function validateProperty(input: any) {
  const text = (v: unknown, max=5000) => { if(typeof v!=="string" || v.length>max) throw new Error("Please shorten the text or complete the missing fields."); return v.trim(); };
  const money = (v: unknown) => { if(typeof v!=="number" || !Number.isFinite(v) || v<0 || v>1000000) throw new Error("Rates must be valid amounts in USD."); return v; };
  const date = (v: unknown) => { const value=text(v,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00Z`).getTime())) throw new Error("Use valid start and end dates."); return value; };
  const rowId = (v: unknown, index: number) => { const value=text(v,100); return value || `row-${index + 1}`; };
  const photosForSection = (value: unknown, max: number, allowLegacy = false) => {
    const list = value == null ? [] : value;
    if(!Array.isArray(list) || list.length > max) throw new Error(`Use up to ${max} photographs in each section.`);
    return list.map((p: unknown) => {
      const s=text(p,200);
      if(!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(s) && !(allowLegacy && isLegacyPhotoPath(s))) throw new Error("Use uploaded photographs.");
      return s;
    });
  };
  if(!input || !["draft","published"].includes(input.status)) throw new Error("Choose draft or published.");
  const name=text(input.name,150), slug=text(input.slug,100);
  if(!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Enter a name and a URL using lowercase letters, numbers and hyphens.");
  const legacySlug = legacyPropertySlugs.includes(slug as (typeof legacyPropertySlugs)[number]);
  if(legacySlug && !input.id) throw new Error("This URL belongs to an existing property. Choose another URL.");
  if(!Array.isArray(input.rooms)||input.rooms.length>40) throw new Error("Use up to 40 room rates.");
  const rooms:Room[]=input.rooms.map((r:any)=>{ const capacity=Number(r.capacity), totalRooms=Number(r.totalRooms); if(!Number.isInteger(capacity)||capacity<1||capacity>100) throw new Error("Guest capacity must be between 1 and 100."); if(!Number.isInteger(totalRooms)||totalRooms<0||totalRooms>100) throw new Error("Rooms available must be between 0 and 100."); return {name:text(r.name,150),capacity,totalRooms,amenities:text(r.amenities),mealPlan:text(r.mealPlan,100),sellingRate:money(r.sellingRate),contractedRate:money(r.contractedRate),photos:photosForSection(r.photos,20),bathroomPhotos:photosForSection(r.bathroomPhotos,20)}; });
  const photos=photosForSection(input.photos,20,legacySlug);
  if(!Array.isArray(input.seasonalRates)||input.seasonalRates.length>100||!Array.isArray(input.inventoryRules)||input.inventoryRules.length>100) throw new Error("Use up to 100 seasonal rates and 100 inventory rules.");
  const seasonalRates:SeasonalRate[]=input.seasonalRates.map((r:any,index:number)=>{ const startDate=date(r.startDate), endDate=date(r.endDate); if(endDate<startDate) throw new Error("A seasonal rate end date must be after its start date."); return {id:rowId(r.id,index),name:text(r.name,120),startDate,endDate,roomName:text(r.roomName,150),mealPlan:text(r.mealPlan,100),sellingRate:money(r.sellingRate),contractedRate:money(r.contractedRate)}; });
  const inventoryRules:InventoryRule[]=input.inventoryRules.map((r:any,index:number)=>{ const startDate=date(r.startDate), endDate=date(r.endDate), roomsAvailable=Number(r.roomsAvailable); if(endDate<startDate) throw new Error("An inventory rule end date must be after its start date."); if(!Number.isInteger(roomsAvailable)||roomsAvailable<0||roomsAvailable>100) throw new Error("Inventory must be a whole number between 0 and 100."); return {id:rowId(r.id,index),roomName:text(r.roomName,150),startDate,endDate,roomsAvailable,stopSale:Boolean(r.stopSale),note:text(r.note,500)}; });
  const tags = (value:unknown):string[] => {
    if(value == null) return [];
    if(!Array.isArray(value) || value.length>12) throw new Error("Use up to 12 wishlist tags per property or experience.");
    const values=value.map(v=>text(v,40).replace(/\s+/g," ")).filter(Boolean);
    return Array.from(new Map(values.map(v=>[v.toLowerCase(),v])).values());
  };
  const wishlistTags=tags(input.wishlistTags);
  const rawExperiences = input.experiences ?? [];
  if (!Array.isArray(rawExperiences) || rawExperiences.length > 30) throw new Error("Use up to 30 experiences per property.");
  const experiences: PropertyExperience[] = rawExperiences.map((e:any,index:number) => {
    const experience = { wishlistTags:tags(e.wishlistTags), id:rowId(e.id,index), name:text(e.name,150), description:text(e.description,2000), duration:text(e.duration,100), price:money(e.price), priceUnit:text(e.priceUnit,60), inclusions:text(e.inclusions,2000), photos:photosForSection(e.photos,20), enabled:e.enabled === true };
    if(experience.enabled && (!experience.name || !experience.description || !experience.duration || !experience.priceUnit || !experience.inclusions || !experience.photos.length)) throw new Error(`Complete the name, description, duration, price unit, inclusions and photo for experience ${index+1}, or hide it while editing.`);
    return experience;
  });
  if (new Set(experiences.map(e=>e.id)).size !== experiences.length) throw new Error("Experience IDs must be unique.");
  const data={ host:normalizePropertyHost(input.host), knowBeforeBooking:normalizePropertyKnowDetails(input.knowBeforeBooking), arrival:normalizePropertyArrival(input.arrival), wishlistTags, experiences, name, island:text(input.island,200), description:text(input.description), photos, rooms, seasonalRates, inventoryRules, amenities:text(input.amenities), taxes:text(input.taxes), transfers:text(input.transfers), cancellation:text(input.cancellation), payment:text(input.payment), partnerName:text(input.partnerName,200), partnerEmail:text(input.partnerEmail,250), partnerPhone:text(input.partnerPhone,80) };
  if(input.status==="published" && data.host.enabled && (!data.host.name || !data.host.introduction || !data.host.photo || (data.host.audio && !data.host.transcript))) throw new Error("Complete the host name, introduction, photograph and voice transcript, or hide the host section while editing.");
  if(data.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.partnerEmail)) throw new Error("Enter a valid partner email.");
  if(input.status==="published" && (!data.island||!data.description||!photos.length||!rooms.length||rooms.some(r=>!r.name||!r.mealPlan||r.sellingRate<=0||r.totalRooms<1)||!data.taxes||!data.transfers||!data.cancellation||!data.payment)) throw new Error("Before publishing, add an island, description, photo, room name, meal plan, selling rate, room inventory and booking conditions.");
  return {slug,status:input.status as ManagedProperty["status"],data};
}
