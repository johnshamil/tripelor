import { propertyAdmin } from "@/lib/property-store";
import { customerHostQuestion, validHostId, validateHostReply } from "@/lib/host-questions";
import { HostProblem, hostBody, hostDB, hostError, hostResponse, validateHostInput } from "@/lib/host-question-server";
export const dynamic="force-dynamic";
function adminView(row:any){return {...customerHostQuestion(row),guest_name:row.guest_name,guest_email:row.guest_email,draft_name:row.draft_name,draft_text:row.draft_text,draft_audio:row.draft_audio,draft_transcript:row.draft_transcript};}
export async function GET(req:Request){try{await propertyAdmin();const params=new URL(req.url).searchParams,filter=params.get("filter")||"pending",offset=Number(params.get("offset")||0);if(!["pending","answered","all"].includes(filter)||!Number.isInteger(offset)||offset<0||offset>100000)throw new HostProblem("Invalid page.");const rows=await hostDB("?order=created_at.desc,id.desc&limit=21&offset="+offset+(filter==="all"?"":filter==="pending"?"&replied_at=is.null":"&replied_at=not.is.null"));return hostResponse({questions:rows.slice(0,20).map(adminView),hasMore:rows.length>20});}catch(e){return hostError(e);}}
export async function POST(req:Request){try{
  const b=await hostBody(req);await propertyAdmin();if(!validHostId(b.id)||!["draft","publish"].includes(b.action))throw new HostProblem("Choose a question and reply action.");
  const rows=await hostDB("?id=eq."+b.id+"&limit=1"),row=rows[0];if(!row)throw new HostProblem("Question not found.",404);if(b.version!==row.version)throw new HostProblem("This question changed in another session. Reload before replying.",409);
  const reply=validateHostInput(()=>validateHostReply(b,row.id,b.action==="publish"));
  const data:any={draft_name:reply.name,draft_text:reply.text,draft_audio:reply.audio,draft_transcript:reply.transcript,version:row.version+1};
  if(b.action==="publish")Object.assign(data,{reply_name:reply.name,reply_text:reply.text,reply_audio:reply.audio,reply_transcript:reply.transcript,replied_at:new Date().toISOString()});
  const saved=await hostDB("?id=eq."+row.id+"&version=eq."+row.version,{method:"PATCH",body:JSON.stringify(data)});if(!saved.length)throw new HostProblem("This question changed. Reload and try again.",409);
  return hostResponse({question:adminView(saved[0])});
}catch(e){return hostError(e);}}
