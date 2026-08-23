import { requireUser } from "@/lib/auth-server";

function config(){const url=process.env.SUPABASE_URL?.replace(/\/$/,"");const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Loyalty database is not configured.");return{url,key};}

export async function GET(){
  try{
    const user=await requireUser();
    const {url,key}=config();
    const email=String(user.email||"").trim().toLowerCase();
    const enc=encodeURIComponent(email);
    const headers={apikey:key,Authorization:`Bearer ${key}`};
    const [accountRes,txRes]=await Promise.all([
      fetch(`${url}/rest/v1/loyalty_accounts?select=*&guest_email=eq.${enc}&limit=1`,{headers,cache:"no-store"}),
      fetch(`${url}/rest/v1/loyalty_transactions?select=id,transaction_type,points,description,created_at&guest_email=eq.${enc}&order=created_at.desc&limit=20`,{headers,cache:"no-store"})
    ]);
    const accountText=await accountRes.text();const txText=await txRes.text();
    const accounts=accountText?JSON.parse(accountText):[];const transactions=txText?JSON.parse(txText):[];
    if(!accountRes.ok)throw new Error(accounts?.message||"Unable to load loyalty points.");
    if(!txRes.ok)throw new Error(transactions?.message||"Unable to load loyalty history.");
    const account=accounts?.[0]||{guest_email:email,points_balance:0,lifetime_points:0,free_nights_earned:0,free_nights_redeemed:0};
    return Response.json({account,transactions,pointsPerNight:100,pointsForFreeNight:1000,freeNightsAvailable:Math.floor(Number(account.points_balance||0)/1000)});
  }catch(e){
    if(e instanceof Error&&e.message==="UNAUTHORIZED")return Response.json({error:"Please log in."},{status:401});
    return Response.json({error:e instanceof Error?e.message:"Unable to load loyalty points."},{status:500});
  }
}
