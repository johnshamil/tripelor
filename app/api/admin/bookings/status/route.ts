import { isAdminEmail, requireUser } from "@/lib/auth-server";

function config(){const url=process.env.SUPABASE_URL?.replace(/\/$/,"");const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Booking database is not configured.");return{url,key};}

export async function POST(request:Request){
  try{
    const user=await requireUser();
    if(!isAdminEmail(user.email))return Response.json({error:"Admin access required."},{status:403});
    const {reservationId,status}=await request.json();
    if(!reservationId||!status)return Response.json({error:"Reservation and status are required."},{status:400});
    const {url,key}=config();
    const headers={apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json"};

    if(status==="completed"){
      const r=await fetch(`${url}/rest/v1/rpc/complete_reservation_award_points`,{method:"POST",headers,body:JSON.stringify({p_reservation_id:reservationId}),cache:"no-store"});
      const text=await r.text();const data=text?JSON.parse(text):null;
      if(!r.ok)throw new Error(data?.message||data?.error||"Unable to complete reservation.");
      const result=Array.isArray(data)?data[0]:data;
      return Response.json({success:true,status:"completed",loyalty:result});
    }

    if(!["pending","confirmed","cancelled"].includes(status))return Response.json({error:"Invalid booking status."},{status:400});
    const r=await fetch(`${url}/rest/v1/reservations?id=eq.${encodeURIComponent(reservationId)}`,{method:"PATCH",headers:{...headers,Prefer:"return=representation"},body:JSON.stringify({status}),cache:"no-store"});
    const text=await r.text();const data=text?JSON.parse(text):[];
    if(!r.ok)throw new Error(data?.message||"Unable to update reservation.");
    return Response.json({success:true,reservation:data?.[0]||null});
  }catch(e){
    if(e instanceof Error&&e.message==="UNAUTHORIZED")return Response.json({error:"Please log in."},{status:401});
    return Response.json({error:e instanceof Error?e.message:"Unable to update reservation."},{status:500});
  }
}
