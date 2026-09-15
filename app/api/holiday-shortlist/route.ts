import { createHash, createHmac, randomBytes } from "crypto";
import { propertyConfig, publishedProperties } from "@/lib/property-store";
import { shortlistSlugs, shortlistText, shortlistVote } from "@/lib/holiday-shortlist";
import type { ShortlistPerson } from "@/lib/holiday-shortlist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
class Problem extends Error { constructor(message: string, public status=400) { super(message); } }
function validate<T>(check:()=>T):T { try{return check();}catch(e){throw new Problem(e instanceof Error?e.message:"Check your input.");} }
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const validToken=(value:unknown):value is string=>typeof value==="string" && /^[a-f0-9]{64}$/.test(value);
type Person=ShortlistPerson & { key: string };
type Row={id:string;share_hash:string;owner_hash:string;title:string;slugs:string[];participants:Person[];version:number;expires_at:string;closed:boolean};
async function db(query:string, init:RequestInit={}) {
  const {url,key}=propertyConfig();
  const res=await fetch(url+"/rest/v1/holiday_shortlists"+query,{...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},cache:"no-store"});
  if(!res.ok) throw new Problem("Unable to load or save your shortlist. Please try again.",503);
  return res.status===204 ? [] : res.json();
}
async function view(row:Row, browser:string) {
  const properties=(await publishedProperties()).filter(p=>row.slugs.includes(p.slug));
  const clean=(p:Person):ShortlistPerson=>({name:p.name,votes:p.votes.map(v=>({slug:v.slug,choice:v.choice,question:v.question}))});
  const mine=row.participants.find(p=>p.key===browser);
  return {title:row.title,slugs:row.slugs,version:row.version,expiresAt:row.expires_at,isOwner:row.owner_hash===browser,properties,people:row.participants.map(clean),mine:mine?clean(mine):null};
}
export async function POST(req:Request) {
  let cookie="";
  const respond=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer",...(cookie?{"Set-Cookie":cookie}:{})}});
  try {
    if(req.headers.get("origin")!==new URL(req.url).origin) throw new Problem("Please use the shortlist on Tripelor.",403);
    const raw=await req.text();
    if(raw.length>5000) throw new Problem("Please shorten your request.");
    let b:any; try {b=JSON.parse(raw);} catch {throw new Problem("Invalid request.");}
    if(!b || typeof b!=="object" || Array.isArray(b)) throw new Problem("Invalid request.");
    const existing=req.headers.get("cookie")?.split(";").map(v=>v.trim()).find(v=>v.startsWith("tripelor_shortlist_browser="))?.split("=")[1];
    const secret=validToken(existing)?existing:randomBytes(32).toString("hex");
    cookie="tripelor_shortlist_browser="+secret+"; Path=/; HttpOnly; SameSite=Lax; Max-Age=2678400"+(new URL(req.url).protocol==="https:"?"; Secure":"");
    const browser=hash(secret);
    if(b.action==="start") {
      const title=validate(()=>shortlistText(b.title,80,"Shortlist name"));
      if(!title) throw new Problem("Give your shortlist a name.");
      const properties=await publishedProperties();
      const slugs=validate(()=>shortlistSlugs(b.slugs,properties));
      const ip=req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const networkHash=createHmac("sha256",propertyConfig().key).update(ip).digest("hex");
      const recent=await db("?select=id&or=(owner_hash.eq."+browser+",network_hash.eq."+networkHash+")&created_at=gt."+encodeURIComponent(new Date(Date.now()-86400000).toISOString())+"&limit=10");
      if(recent.length>=10) throw new Problem("Several shortlists were created today. Please use an existing link or try tomorrow.",429);
      const token=randomBytes(32).toString("hex");
      const rows=await db("",{method:"POST",body:JSON.stringify({title,slugs,owner_hash:browser,network_hash:networkHash,share_hash:hash(token)})});
      return respond({...(await view(rows[0],browser)),token});
    }
    if(!validToken(b.token)) throw new Problem("This shortlist link is unavailable.",404);
    const rows:Row[]=await db("?share_hash=eq."+hash(b.token)+"&closed=eq.false&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&limit=1");
    const row=rows[0];
    if(!row) throw new Problem("This shortlist has expired, was closed, or the link is incomplete.",404);
    if(b.action==="read") return respond(await view(row,browser));
    if(b.version!==row.version) throw new Problem("Someone just updated this shortlist. Refresh votes, then save again.",409);
    let data:Record<string,unknown>;
    if(b.action==="close") {
      if(row.owner_hash!==browser) throw new Problem("Only the creator can close this link from their original browser.",403);
      data={closed:true,participants:[]};
    } else if(b.action==="vote" || b.action==="clear") {
      const name=validate(()=>shortlistText(b.name,40,"Your display name"));
      if(!name) throw new Problem("Enter a display name for your group.");
      if(typeof b.slug!=="string" || !row.slugs.includes(b.slug)) throw new Problem("Choose a stay from this shortlist.");
      const person=row.participants.find(p=>p.key===browser);
      if(!person && row.participants.length>=30) throw new Problem("This shortlist has reached 30 participants.");
      const votes=(person?.votes || []).filter(v=>v.slug!==b.slug);
      if(b.action==="vote") votes.push(validate(()=>shortlistVote(b,row.slugs)));
      const participants=row.participants.filter(p=>p.key!==browser);
      if(votes.length) participants.push({key:browser,name,votes});
      data={participants};
    } else throw new Problem("Unknown action.");
    const updated=await db("?id=eq."+row.id+"&version=eq."+row.version+"&closed=eq.false&expires_at=gt."+encodeURIComponent(new Date().toISOString()),{method:"PATCH",body:JSON.stringify({...data,version:row.version+1})});
    if(!updated.length) throw new Problem("This shortlist changed. Refresh votes and try again.",409);
    return respond(b.action==="close"?{closed:true}:await view(updated[0],browser));
  } catch(e) {
    return respond({error:e instanceof Problem?e.message:"Unable to complete this action. Please try again."},e instanceof Problem?e.status:500);
  }
}
