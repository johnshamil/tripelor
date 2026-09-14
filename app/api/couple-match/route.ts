import { createHash, randomBytes } from "crypto";
import { requireUser } from "@/lib/auth-server";
import { publishedProperties, propertyConfig } from "@/lib/property-store";
import { buildCoupleMatch, validateCouplePreferences } from "@/lib/couple-match";
import type { PublicProperty } from "@/lib/property-model";

export const dynamic = "force-dynamic";
class Problem extends Error { constructor(message:string, public status=400){super(message);} }
const hash = (token:string) => createHash("sha256").update(token).digest("hex");
const validId = (id:unknown):id is string => typeof id==="string" && /^[0-9a-f-]{36}$/.test(id);
async function db(query:string, init:RequestInit={}) {
  const {url,key}=propertyConfig();
  const r=await fetch(url+"/rest/v1/couple_matches"+query, {...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},cache:"no-store"});
  if(!r.ok) throw new Problem("Unable to load or save your match. Please try again.",503);
  return r.status===204 ? [] : r.json();
}
const response = (value:unknown,status=200) => Response.json(value,{status,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
function error(e:unknown) {
  if(e instanceof Error && e.message==="UNAUTHORIZED") return response({error:"Please sign in to continue."},401);
  return response({error:e instanceof Problem ? e.message : "Unable to complete this action. Please try again."},e instanceof Problem?e.status:500);
}
async function userId() {
  const user=await requireUser();
  if(!validId(user.id)) throw new Problem("Please sign in again.",401);
  return user.id as string;
}
async function rowFor(id:unknown) {
  if(!validId(id)) throw new Problem("This match is unavailable.",404);
  const rows=await db("?id=eq."+id+"&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&limit=1");
  if(!rows[0]) throw new Problem("This match is unavailable or has expired.",404);
  return rows[0];
}
function role(row:any, user:string) {
  if(row.owner_id===user)return "owner";
  if(row.partner_id===user)return "partner";
  throw new Problem("This match is private. Use your invitation to join.",403);
}
function view(row:any,user:string,properties:PublicProperty[]) {
  const side=role(row,user);
  const ready=Boolean(row.owner_preferences && row.partner_preferences);
  const result=ready?buildCoupleMatch(row.owner_preferences,row.partner_preferences,properties):null;
  return {id:row.id,version:row.version,side,expiresAt:row.expires_at,joined:Boolean(row.partner_id),
    own:side==="owner"?row.owner_preferences:row.partner_preferences,
    partnerReady:Boolean(side==="owner"?row.partner_preferences:row.owner_preferences),
    result,choice:result?.candidates.some(c=>c.key===row.choice)?row.choice:null};
}
async function patch(row:any,data:Record<string,unknown>) {
  const rows=await db("?id=eq."+row.id+"&version=eq."+row.version,{method:"PATCH",body:JSON.stringify({...data,version:row.version+1})});
  if(!rows[0])throw new Problem("Your partner updated this match. Refresh and try again.",409);
  return rows[0];
}
export async function GET(req:Request) {
  try {
    const user=await userId();
    const id=new URL(req.url).searchParams.get("id");
    if(!id) {
      const rows=await db("?select=id,created_at,expires_at&or=(owner_id.eq."+user+",partner_id.eq."+user+")&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&order=created_at.desc&limit=20");
      return response({matches:rows});
    }
    const row=await rowFor(id);
    role(row,user);
    return response(view(row,user,await publishedProperties()));
  }catch(e){return error(e);}
}
export async function POST(req:Request) {
  try {
    if(req.headers.get("origin")!==new URL(req.url).origin)throw new Problem("Please submit from Tripelor.",403);
    const user=await userId();
    const raw=await req.text();
    if(raw.length>12000)throw new Problem("Please shorten your request.");
    let b:any;try{b=JSON.parse(raw);}catch{throw new Problem("Invalid request.");}
    if(!b || typeof b!=="object")throw new Problem("Invalid request.");
    if(b.action==="start") {
      const recent=await db("?select=id&owner_id=eq."+user+"&created_at=gt."+encodeURIComponent(new Date(Date.now()-86400000).toISOString())+"&limit=10");
      if(recent.length>=10)throw new Problem("You have created several matches today. Continue an existing match or try tomorrow.",429);
      const token=randomBytes(32).toString("hex");
      const rows=await db("",{method:"POST",body:JSON.stringify({owner_id:user,invite_hash:hash(token)})});
      return response({...view(rows[0],user,[]),invite:token});
    }
    let row=await rowFor(b.id);
    if(b.action==="join") {
      if(row.owner_id===user)throw new Problem("Ask your partner to open the invitation using their own account.");
      if(row.partner_id===user)return response(view(row,user,await publishedProperties()));
      if(row.partner_id || typeof b.invite!=="string" || !/^[0-9a-f]{64}$/.test(b.invite) || hash(b.invite)!==row.invite_hash)throw new Problem("This invitation is invalid or has already been used.",403);
      row=await patch(row,{partner_id:user,invite_hash:hash(randomBytes(32).toString("hex"))});
      return response(view(row,user,await publishedProperties()));
    }
    const side=role(row,user);
    if(b.action==="invite") {
      if(side!=="owner" || row.partner_id)throw new Problem("An invitation is no longer needed.");
      const token=randomBytes(32).toString("hex");
      row=await patch(row,{invite_hash:hash(token)});
      return response({...view(row,user,await publishedProperties()),invite:token});
    }
    if(b.version!==row.version)throw new Problem("This match has changed. Refresh before saving.",409);
    if(b.action==="delete") {
      const rows=await db("?id=eq."+row.id+"&version=eq."+row.version,{method:"DELETE"});
      if(!rows.length)throw new Problem("This match changed. Refresh and try again.",409);
      return response({deleted:true});
    }
    const properties=await publishedProperties();
    if(b.action==="preferences") {
      let preferences;
      try{preferences=validateCouplePreferences(b.preferences,properties);}catch(e){throw new Problem(e instanceof Error?e.message:"Check your preferences.");}
      row=await patch(row,{[side==="owner"?"owner_preferences":"partner_preferences"]:preferences,choice:null});
    } else if(b.action==="choose") {
      if(!row.owner_preferences || !row.partner_preferences)throw new Problem("Both travellers need to submit their preferences.");
      const result=buildCoupleMatch(row.owner_preferences,row.partner_preferences,properties);
      if(!result.candidates.some(c=>c.key===b.choice))throw new Problem("That suggestion is no longer available. Refresh to see current options.");
      row=await patch(row,{choice:b.choice});
    } else throw new Problem("Unknown action.");
    return response(view(row,user,properties));
  }catch(e){return error(e);}
}
