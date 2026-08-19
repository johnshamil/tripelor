const BOOKING_EMAIL = "bookings@tripelor.com";
const BOOKING_BCC_EMAIL = "johnshamil87@gmail.com";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendResend(apiKey:string,payload:Record<string,unknown>){
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const result=await response.json();
  return {response,result};
}

export async function POST(request:Request){
  try{
    const apiKey=process.env.RESEND_API_KEY;
    if(!apiKey)return Response.json({error:"Email service is not configured yet."},{status:500});
    const {arrivalDate,arrivalTime,seats,fullName,email,phone,notes}=await request.json();
    if(!arrivalDate||!arrivalTime||!seats||!fullName||!email||!phone)return Response.json({error:"Arrival date, arrival time, seats, name, email and phone are required."},{status:400});

    const arrival=new Date(`${arrivalDate}T${arrivalTime}:00`);
    if(Number.isNaN(arrival.getTime()))return Response.json({error:"Please enter a valid arrival date and time."},{status:400});
    if((arrival.getTime()-Date.now())<86400000)return Response.json({error:"Speedboat requests must be submitted at least 24 hours before arrival."},{status:400});

    const adminHtml=`<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6"><div style="background:#0a0a0a;color:#d4af37;padding:22px 26px;border-radius:14px 14px 0 0"><h1 style="margin:0;font-size:24px">New Speedboat Transfer Request</h1></div><div style="border:1px solid #e5e5e5;border-top:0;padding:26px;border-radius:0 0 14px 14px"><table style="width:100%;border-collapse:collapse"><tbody><tr><td style="padding:8px 0;font-weight:bold">Guest</td><td>${escapeHtml(fullName)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Email</td><td>${escapeHtml(email)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Phone</td><td>${escapeHtml(phone)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Arrival Date</td><td>${escapeHtml(arrivalDate)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Arrival Time</td><td>${escapeHtml(arrivalTime)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Seats</td><td>${escapeHtml(seats)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Notes</td><td>${escapeHtml(notes||"None")}</td></tr></tbody></table><p style="margin-top:22px;color:#666;font-size:13px">Speedboat request for transfer to V. Felidhoo. Please confirm schedule, seat availability and fare with the guest.</p></div></div>`;

    const {response:adminResponse,result:adminResult}=await sendResend(apiKey,{from:"Tripelor Transfers <bookings@tripelor.com>",to:[BOOKING_EMAIL],bcc:[BOOKING_BCC_EMAIL],reply_to:email,subject:`New Tripelor speedboat request - ${escapeHtml(fullName)} - ${escapeHtml(arrivalDate)}`,html:adminHtml});
    if(!adminResponse.ok)return Response.json({error:adminResult?.message||"Unable to send speedboat request."},{status:500});

    const customerHtml=`<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6"><div style="background:#0a0a0a;color:#d4af37;padding:22px 26px;border-radius:14px 14px 0 0"><h1 style="margin:0;font-size:24px">Speedboat Request Received</h1></div><div style="border:1px solid #e5e5e5;border-top:0;padding:26px;border-radius:0 0 14px 14px"><p>Dear ${escapeHtml(fullName)},</p><p>We received your speedboat transfer request for V. Felidhoo.</p><table style="width:100%;border-collapse:collapse"><tbody><tr><td style="padding:8px 0;font-weight:bold">Arrival Date</td><td>${escapeHtml(arrivalDate)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Arrival Time</td><td>${escapeHtml(arrivalTime)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Seats</td><td>${escapeHtml(seats)}</td></tr></tbody></table><p style="margin-top:22px">Tripelor will confirm the available speedboat schedule, seats and final fare with you. Transfer requests must be made at least 24 hours before arrival.</p><p>Regards,<br><strong>Tripelor</strong></p></div></div>`;
    try{await sendResend(apiKey,{from:"Tripelor Transfers <bookings@tripelor.com>",to:[email],reply_to:BOOKING_EMAIL,subject:"Tripelor speedboat request received",html:customerHtml});}catch(customerError){console.error("Speedboat customer email error",customerError);}

    return Response.json({success:true,id:adminResult.id});
  }catch(error){console.error("Speedboat request error",error);return Response.json({error:error instanceof Error?error.message:"Unable to send speedboat request."},{status:500});}
}
