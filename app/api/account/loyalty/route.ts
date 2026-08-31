import { requireUser } from "@/lib/auth-server";
import {getMembership, POINTS_PER_NIGHT, POINTS_PER_REWARD_NIGHT} from "@/lib/loyalty-membership";

function config(){const url=process.env.SUPABASE_URL?.replace(/\/$/,"");const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Loyalty database is not configured.");return{url,key};}

export async function GET(){
  try{
    const user=await requireUser();
    const {url,key}=config();
    const email=String(user.email||"").trim().toLowerCase();
    const enc=encodeURIComponent(email);
    const headers={apikey:key,Authorization:`Bearer ${key}`};
    const [accountRes,txRes]=await Promise.all([
      fetch(`${url}/rest/v1/loyalty_accounts?select=guest_email,points_balance,lifetime_points,free_nights_earned,free_nights_redeemed,updated_at&guest_email=eq.${enc}&limit=1`,{headers,cache:"no-store"}),
      fetch(`${url}/rest/v1/loyalty_transactions?select=id,transaction_type,points,description,created_at&guest_email=eq.${enc}&order=created_at.desc&limit=20`,{headers,cache:"no-store"})
    ]);
    const accountText=await accountRes.text();const txText=await txRes.text();
    const accounts=accountText?JSON.parse(accountText):[];const transactions=txText?JSON.parse(txText):[];
    if(!accountRes.ok)throw new Error(accounts?.message||"Unable to load loyalty points.");
    if(!txRes.ok)throw new Error(transactions?.message||"Unable to load loyalty history.");
    const account=accounts?.[0]||{guest_email:email,points_balance:0,lifetime_points:0,free_nights_earned:0,free_nights_redeemed:0};
    const membership=getMembership(Number(account.lifetime_points||0));
    return Response.json({account,transactions,membership,pointsPerNight:POINTS_PER_NIGHT,pointsForFreeNight:POINTS_PER_REWARD_NIGHT,freeNightsAvailable:Math.floor(Number(account.points_balance||0)/POINTS_PER_REWARD_NIGHT)});
  }catch(e){
    if(e instanceof Error&&e.message==="UNAUTHORIZED")return Response.json({error:"Please log in."},{status:401});
    return Response.json({error:e instanceof Error?e.message:"Unable to load loyalty points."},{status:500});
  }
}
