import { currentUser, isAdminEmail } from "@/lib/auth-server";
import { ManagedProperty, publicProperty } from "@/lib/property-model";
import { legacyPropertySeeds } from "@/lib/legacy-property-import";
export function propertyConfig(){ const url=process.env.SUPABASE_URL?.replace(/\/$/,""), key=process.env.SUPABASE_SERVICE_ROLE_KEY; if(!url||!key) throw new Error("Property storage is not configured."); return {url,key}; }
export async function propertyDB(path:string, init:RequestInit={}) { const {url,key}=propertyConfig(); const r=await fetch(`${url}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",Prefer:"return=representation",...init.headers},cache:"no-store"}); if(!r.ok){const e=await r.json(); if(e.code==="23505") throw new Error("That property URL is already in use."); throw new Error("Unable to save or load properties. Please try again.");} return r.status===204?null:r.json(); }
export async function propertyAdmin(){const u=await currentUser(); if(!u) throw new Error("UNAUTHORIZED"); if(!isAdminEmail(u.email)) throw new Error("FORBIDDEN"); return u;}
export function sameOrigin(r:Request){const origin=r.headers.get("origin"); if(!origin || origin!==new URL(r.url).origin) throw new Error("FORBIDDEN");}
export function propertyError(e:unknown){const m=e instanceof Error?e.message:"Unable to complete this action."; return Response.json({error:m==="UNAUTHORIZED"?"Please sign in.":m==="FORBIDDEN"?"Admin access required.":m},{status:m==="UNAUTHORIZED"?401:m==="FORBIDDEN"?403:400});}
function unpack(row:any):ManagedProperty {
  const rooms = Array.isArray(row.data?.rooms)
    ? row.data.rooms.map((room:any) => ({
        ...room,
        photos: Array.isArray(room.photos) ? room.photos : [],
        bathroomPhotos: Array.isArray(room.bathroomPhotos) ? room.bathroomPhotos : [],
      }))
    : [];
  return {
    ...row.data,
    photos: Array.isArray(row.data?.photos) ? row.data.photos : [],
    rooms,
    seasonalRates: Array.isArray(row.data?.seasonalRates) ? row.data.seasonalRates : [],
    inventoryRules: Array.isArray(row.data?.inventoryRules) ? row.data.inventoryRules : [],
    id: row.id,
    slug: row.slug,
    status: row.status,
    updated_at: row.updated_at,
  };
}
export async function managedProperties(): Promise<ManagedProperty[]>{return (await propertyDB("managed_properties?select=*&order=updated_at.desc")).map(unpack) as ManagedProperty[];}
export async function ensureLegacyProperties() {
  const existing = new Set<string>((await propertyDB("managed_properties?select=slug")).map((row: any) => row.slug));
  for (const seed of legacyPropertySeeds) {
    if (existing.has(seed.slug)) continue;
    await propertyDB("managed_properties", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ slug: seed.slug, status: "draft", data: seed.data }),
    });
    existing.add(seed.slug);
  }
}

export async function publishedProperties(): Promise<import("@/lib/property-model").PublicProperty[]>{try{return (await propertyDB("managed_properties?select=*&status=eq.published&order=created_at.desc")).map((r:any)=>publicProperty(unpack(r)));}catch{return [];}}
export async function findProperty(slug:string, preview=false): Promise<import("@/lib/property-model").PublicProperty|null>{if(!/^[a-z0-9-]+$/.test(slug)) return null; try {const rows=await propertyDB(`managed_properties?select=*&slug=eq.${encodeURIComponent(slug)}${preview?"":"&status=eq.published"}&limit=1`); return rows[0]?publicProperty(unpack(rows[0])):null;} catch{return null;}}
