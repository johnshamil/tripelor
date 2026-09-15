import { requireUser } from "@/lib/auth-server";
import { propertyDB } from "@/lib/property-store";
import { customerHostQuestion, validHostId, validateHostQuestion } from "@/lib/host-questions";
import { HostProblem, hostBody, hostDB, hostError, hostResponse, validateHostInput } from "@/lib/host-question-server";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{const u=await requireUser();if(!validHostId(u.id))throw new HostProblem("Please sign in again.",401);const raw=new URL(req.url).searchParams.get("offset")||"0";const offset=Number(raw);if(!Number.isInteger(offset)||offset<0||offset>10000)throw new HostProblem("Invalid page.");const rows=await hostDB("?user_id=eq."+u.id+"&order=created_at.desc,id.desc&limit=21&offset="+offset);return hostResponse({questions:rows.slice(0,20).map(customerHostQuestion),hasMore:rows.length>20});}catch(e){return hostError(e);}}
export async function POST(req:Request){try{
  const b=await hostBody(req,4000),u=await requireUser();if(!validHostId(u.id))throw new HostProblem("Please sign in again.",401);
  const value=validateHostInput(()=>validateHostQuestion(b));
  const properties=await propertyDB("managed_properties?id=eq."+value.propertyId+"&status=eq.published&select=id,slug,data&limit=1");const p=properties[0];
  if(!p||p.data?.host?.enabled!==true)throw new HostProblem("This host is not currently accepting questions. Please contact Tripelor.",404);
  const recent=await hostDB("?user_id=eq."+u.id+"&created_at=gt."+encodeURIComponent(new Date(Date.now()-86400000).toISOString())+"&select=id&limit=10");if(recent.length>=10)throw new HostProblem("You have sent several questions today. Please wait for a reply before sending more.",429);
  const rows=await hostDB("",{method:"POST",body:JSON.stringify({user_id:u.id,guest_name:String(u.user_metadata?.full_name||"Guest").slice(0,150),guest_email:String(u.email||"").slice(0,250),property_id:p.id,property_slug:p.slug,property_name:p.data.name,topic:value.topic,question:value.question})});
  return hostResponse({question:customerHostQuestion(rows[0])});
}catch(e){return hostError(e);}}
