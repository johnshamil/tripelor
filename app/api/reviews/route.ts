import { requireUser } from "@/lib/auth-server";
const OWNER="bookings@tripelor.com";
const REVIEW_BONUS_POINTS=100;
function esc(v:unknown){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
export async function POST(req:Request){
 try{
  const b=await req.json();
  if(!b.property||!b.name||!b.email||!b.rating||!b.review||b.permission!=="yes")return Response.json({error:"Please complete all required fields and publication permission."},{status:400});
  const rating=Math.max(1,Math.min(5,Number(b.rating)||0));const url=process.env.SUPABASE_URL?.replace(/\/$/,"");const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return Response.json({error:"Review database is not configured."},{status:500});
  const headers={apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};
  let verified=false,reservationId:string|null=null,userEmail="";
  if(b.reservationId){
   try{const user=await requireUser();userEmail=String(user.email||"").trim().toLowerCase();}catch{return Response.json({error:"Please log in to submit a verified stay review."},{status:401})}
   reservationId=String(b.reservationId);
   const rr=await fetch(`${url}/rest/v1/reservations?select=id,guest_email,property_name,check_out,status&id=eq.${encodeURIComponent(reservationId)}&limit=1`,{headers,cache:"no-store"});const rt=await rr.text();const rows=rt?JSON.parse(rt):[];const res=rows?.[0];
   if(!rr.ok||!res)return Response.json({error:"Unable to verify this stay."},{status:400});
   if(String(res.guest_email||"").toLowerCase()!==userEmail)return Response.json({error:"This reservation does not belong to your account."},{status:403});
   if(String(res.property_name)!==String(b.property))return Response.json({error:"Review property does not match this reservation."},{status:400});
   const checkout=new Date(`${res.check_out}T00:00:00`);const today=new Date();today.setHours(0,0,0,0);if(checkout>today&&String(res.status).toLowerCase()!=="completed")return Response.json({error:"Verified review points are available after checkout."},{status:400});
   verified=true;
  }
  const payload={property_name:String(b.property),guest_name:String(b.name),guest_email:verified?userEmail:String(b.email).trim().toLowerCase(),reservation_id:reservationId,verified,points_awarded:false,country:b.country?String(b.country):null,rating,review_title:b.title?String(b.title):null,review_text:String(b.review),stay_date:b.stayDate?String(b.stayDate):null,status:"approved"};
  const db=await fetch(`${url}/rest/v1/reviews`,{method:"POST",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify(payload),cache:"no-store"});const text=await db.text();const inserted=text?JSON.parse(text):[];
  if(!db.ok){if(db.status===409&&reservationId)return Response.json({error:"You have already submitted a review for this stay."},{status:409});console.error("Supabase review insert failed:",text);return Response.json({error:"Unable to save your review."},{status:500})}
  let pointsAwarded=0,pointsBalance:number|undefined;
  if(verified&&inserted?.[0]?.id){const rpc=await fetch(`${url}/rest/v1/rpc/award_verified_review_points`,{method:"POST",headers,body:JSON.stringify({p_review_id:inserted[0].id,p_points:REVIEW_BONUS_POINTS}),cache:"no-store"});const tx=await rpc.text();if(rpc.ok){const data=tx?JSON.parse(tx):[];pointsAwarded=Number(data?.[0]?.points_awarded||0);pointsBalance=Number(data?.[0]?.points_balance||0)}else console.error("Review points award failed:",tx)}
  const resendKey=process.env.RESEND_API_KEY;if(resendKey){const html=`<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto"><h1>New Tripelor Guest Review</h1><p><b>Status:</b> Published automatically</p><p><b>Verified stay:</b> ${verified?"Yes":"No"}</p><p><b>Bonus points:</b> ${pointsAwarded}</p><hr><p><b>Property:</b> ${esc(b.property)}</p><p><b>Guest:</b> ${esc(b.name)}</p><p><b>Email (private):</b> ${esc(b.email)}</p><p><b>Rating:</b> ${"★".repeat(rating)}${"☆".repeat(5-rating)}</p><p><b>Title:</b> ${esc(b.title||"No title")}</p><p>${esc(b.review).replace(/\n/g,"<br>")}</p></div>`;await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${resendKey}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Tripelor Reviews <bookings@tripelor.com>",to:[OWNER],bcc:["johnshamil87@gmail.com"],reply_to:b.email,subject:`New ${rating}-star Tripelor review - ${esc(b.name)}`,html})})}
  return Response.json({success:true,verified,pointsAwarded,pointsBalance});
 }catch(e){console.error(e);return Response.json({error:"Something went wrong while submitting your review."},{status:500})}
}
