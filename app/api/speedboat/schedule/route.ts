import { NextResponse } from "next/server";

export async function GET(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) return NextResponse.json({schedule:[]});
  try{
    const r=await fetch(`${url}/rest/v1/speedboat_schedule?select=day_of_week,departure_time,operator&active=eq.true&route=eq.Male%20to%20Felidhoo&order=day_of_week.asc,departure_time.asc`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:"no-store"});
    if(!r.ok) throw new Error("Schedule unavailable");
    return NextResponse.json({schedule:await r.json()});
  }catch{return NextResponse.json({schedule:[]});}
}
