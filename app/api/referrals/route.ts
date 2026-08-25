import crypto from "crypto";

const url=process.env.SUPABASE_URL?.replace(/\/$/,"");
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers={apikey:key||"",Authorization:`Bearer ${key||""}`,"Content-Type":"application/json"};
function codeFor(email:string){return `TRP${crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex").slice(0,7).toUpperCase()}`}

export async function GET(req:Request){
 if(!url||!key)return Response.json({error:"Referral service not configured"},{status:500});
 const u=new URL(req.url),email=(u.searchParams.get("email")||"").trim().toLowerCase();
 if(!email)return Response.json({error:"Email required"},{status:400});
 const code=codeFor(email);
 await fetch(`${url}/rest/v1/referral_codes?on_conflict=owner_email`,{method:"POST",headers:{...headers,Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({code,owner_email:email})});
 const r=await fetch(`${url}/rest/v1/referrals?select=status,reward_points,discount_usd,created_at&code=eq.${encodeURIComponent(code)}&order=created_at.desc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
 const refs=r.ok?await r.json():[];
 return Response.json({code,discountUsd:20,rewardPoints:200,referrals:refs});
}

export async function POST(req:Request){
 if(!url||!key)return Response.json({error:"Referral service not configured"},{status:500});
 const b=await req.json(),code=String(b.code||"").trim().toUpperCase();
 if(!code)return Response.json({valid:false,error:"Enter a referral code."},{status:400});
 const r=await fetch(`${url}/rest/v1/referral_codes?select=code,owner_email&code=eq.${encodeURIComponent(code)}&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
 const rows=r.ok?await r.json():[];
 if(!rows.length)return Response.json({valid:false,error:"Referral code not found."},{status:404});
 return Response.json({valid:true,code,discountUsd:20,rewardPoints:200});
}
