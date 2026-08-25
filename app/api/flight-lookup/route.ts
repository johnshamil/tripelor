import {NextResponse} from "next/server";

function cleanFlight(v:string){return v.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,10)}

export async function GET(req:Request){
  const key=process.env.AVIATIONSTACK_API_KEY;
  if(!key)return NextResponse.json({error:"Flight lookup is not configured yet.",code:"NOT_CONFIGURED"},{status:503});
  const {searchParams}=new URL(req.url);
  const flight=cleanFlight(searchParams.get("flight")||"");
  const date=searchParams.get("date")||"";
  if(!flight)return NextResponse.json({error:"Enter a flight number."},{status:400});
  try{
    const params=new URLSearchParams({access_key:key,flight_iata:flight,limit:"20"});
    if(date)params.set("flight_date",date);
    const r=await fetch(`https://api.aviationstack.com/v1/flights?${params.toString()}`,{cache:"no-store"});
    const x=await r.json();
    if(!r.ok||x?.error)return NextResponse.json({error:x?.error?.message||"Unable to look up this flight."},{status:502});
    const rows=Array.isArray(x?.data)?x.data:[];
    const candidates=rows.filter((f:any)=>String(f?.arrival?.iata||"").toUpperCase()==="MLE");
    const row=candidates[0]||rows[0];
    if(!row)return NextResponse.json({error:"No matching flight found. Check the flight number and date."},{status:404});
    const arrival=row.arrival||{};
    const scheduled=arrival.scheduled||arrival.estimated||arrival.actual||null;
    if(!scheduled)return NextResponse.json({error:"Flight found, but arrival time is unavailable."},{status:404});
    const d=new Date(scheduled);
    const localDate=new Intl.DateTimeFormat("en-CA",{timeZone:"Indian/Maldives",year:"numeric",month:"2-digit",day:"2-digit"}).format(d);
    const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Indian/Maldives",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(d);
    const hh=parts.find(p=>p.type==="hour")?.value||"00",mm=parts.find(p=>p.type==="minute")?.value||"00";
    return NextResponse.json({flight:{flightNumber:row.flight?.iata||flight,airline:row.airline?.name||null,status:row.flight_status||null,origin:row.departure?.airport||row.departure?.iata||null,originIata:row.departure?.iata||null,arrivalAirport:arrival.airport||"Velana International Airport",arrivalIata:arrival.iata||null,arrivalDate:localDate,arrivalTime:`${hh}:${mm}`,terminal:arrival.terminal||null,gate:arrival.gate||null,scheduled:arrival.scheduled||null,estimated:arrival.estimated||null,actual:arrival.actual||null}});
  }catch(e){console.error("Flight lookup error",e);return NextResponse.json({error:"Flight lookup is temporarily unavailable."},{status:500});}
}
