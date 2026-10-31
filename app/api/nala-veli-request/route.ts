import {randomUUID} from "node:crypto";
const choices:Record<string,Record<string,number[]>>={
"Nala Veli Villa":{"Comfort Single":[56,64,79],"Comfort Double":[81,89,104],"Deluxe Single":[66,74,89],"Deluxe Double":[91,99,114]},
"Nala Veli Beach & Spa":{"Comfort Single":[81,89,104],"Comfort Double":[106,114,129],"Deluxe Single":[91,99,114],"Deluxe Double":[116,124,139],"Deluxe Triple":[141,149,164],"Family Single":[101,109,124],"Family Double":[126,134,149],"Family Triple":[151,159,174],"Family Quad":[176,184,199]}};
function idx(s:string){const d=new Date(s+"T00:00:00Z"),m=d.getUTCMonth()+1,day=d.getUTCDate();if((m===12&&day>=15)||(m===1&&day<=10))return -1;if(m===12||(m===1&&day>=11)||m===2||m===3)return 2;if([4,8,10,11].includes(m))return 1;return 0;}
function escape(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));}
export async function POST(req:Request){
try{const b=await req.json();const str=(v:unknown,n=200)=>typeof v==="string"?v.trim().slice(0,n):"";
const property=str(b.property),room=str(b.room),start=str(b.start,10),end=str(b.end,10),name=str(b.name,120),email=str(b.email),phone=str(b.phone,50),requests=str(b.requests,800);
if(!choices[property]?.[room]||!name||!email.includes("@")||!phone||!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<=start||start<new Date().toISOString().slice(0,10))return Response.json({error:"Invalid booking details."},{status:400});
const dates:string[]=[];let d=new Date(start+"T00:00:00Z"),stop=new Date(end+"T00:00:00Z");if(Number.isNaN(d.getTime())||Number.isNaN(stop.getTime()))return Response.json({error:"Invalid dates."},{status:400});while(d<stop&&dates.length<45){dates.push(d.toISOString().slice(0,10));d.setUTCDate(d.getUTCDate()+1);}if(!dates.length||dates.length>=45)return Response.json({error:"Stay must be 1–44 nights."},{status:400});
const quoteOnly=dates.some(x=>idx(x)<0||x>"2027-04-30"),total=quoteOnly?null:Math.round(dates.reduce((sum,x)=>sum+choices[property][room][idx(x)]*1.2,0)*100)/100;
const key=process.env.RESEND_API_KEY;if(!key)return Response.json({error:"Booking request service unavailable."},{status:503});
const reference="TRP-NV-"+randomUUID().slice(0,8).toUpperCase();
const body=`Reference: ${reference}\nProperty: ${property}\nRoom: ${room}\nCheck-in: ${start}\nCheck-out: ${end}\nNights: ${dates.length}\nGuest: ${name}\nEmail: ${email}\nPhone: ${phone}\nEstimated accommodation total: ${total===null?"Quote on request":"USD "+total.toFixed(2)}\nSpecial requests: ${requests}\nStatus: PENDING SUPPLIER CONFIRMATION. No room held or payment taken.`;
const send=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:"Tripelor Bookings <bookings@tripelor.com>",to:["bookings@tripelor.com"],reply_to:email,subject:reference+" · Nala Veli booking request",text:body})});
if(!send.ok)return Response.json({error:"Unable to deliver booking request. Please contact Tripelor directly."},{status:502});
await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:"Tripelor Bookings <bookings@tripelor.com>",to:[email],subject:reference+" · Request received — not yet confirmed",text:"Dear "+name+",\n\nTripelor received your Nala Veli booking request.\n\n"+body+"\n\nThis is NOT a confirmed booking. We will contact Nala Veli for written availability confirmation and then send you final terms and payment instructions. No payment is due yet.\n\nTripelor"})}).catch(()=>{});
return Response.json({success:true,reference,status:"pending_supplier_confirmation"});
}catch{return Response.json({error:"Unable to process booking request."},{status:500});}
}