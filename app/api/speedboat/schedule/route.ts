import { NextResponse } from "next/server";
import { propertyDB } from "@/lib/property-store";

export async function GET(){
  try{
    const schedule = await propertyDB("speedboat_schedule?select=id,route,day_of_week,departure_time,operator,capacity,price_per_person&active=eq.true&order=day_of_week.asc,departure_time.asc");
    return NextResponse.json({schedule},{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({schedule:[]});}
}
