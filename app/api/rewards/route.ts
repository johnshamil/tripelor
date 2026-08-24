function rewardLevel(points:number){
  if(points>=5000)return {level:"Platinum",nextLevel:null,pointsToNext:null};
  if(points>=2500)return {level:"Gold",nextLevel:"Platinum",pointsToNext:5000-points};
  if(points>=1000)return {level:"Silver",nextLevel:"Gold",pointsToNext:2500-points};
  return {level:"Bronze",nextLevel:"Silver",pointsToNext:1000-points};
}

export async function POST(request:Request){
  try{
    const supabaseUrl=process.env.SUPABASE_URL?.replace(/\/$/,"");
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!supabaseUrl||!serviceKey)return Response.json({error:"Rewards service is not configured."},{status:500});
    const {identity}=await request.json();
    const value=String(identity||"").trim();
    if(!value)return Response.json({error:"Enter your booking email or phone number."},{status:400});

    const isEmail=value.includes("@");
    const field=isEmail?"email":"phone";
    const normalized=isEmail?value.toLowerCase():value.replace(/\s+/g,"");
    const url=`${supabaseUrl}/rest/v1/customer_rewards?select=id,customer_name,email,phone,points&${field}=eq.${encodeURIComponent(normalized)}&limit=1`;
    const r=await fetch(url,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`},cache:"no-store"});
    if(!r.ok){console.error("Rewards lookup failed",await r.text());return Response.json({error:"Unable to check your points right now."},{status:500});}
    const rows=await r.json();
    if(!Array.isArray(rows)||rows.length===0)return Response.json({error:"We couldn't find a Tripelor Rewards account with those details."},{status:404});
    const row=rows[0];
    const points=Math.max(0,Number(row.points)||0);
    const level=rewardLevel(points);
    return Response.json({reward:{name:row.customer_name||"Tripelor Guest",points,...level}});
  }catch(error){console.error("Rewards API error",error);return Response.json({error:"Unable to check your points right now."},{status:500});}
}
