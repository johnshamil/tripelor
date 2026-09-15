import { randomUUID } from "crypto";
import { propertyAdmin } from "@/lib/property-store";
import { validHostId } from "@/lib/host-questions";
import { HostProblem, hostBody, hostDB, hostError, hostResponse, hostSignedUrl, hostStorage } from "@/lib/host-question-server";
export const dynamic="force-dynamic";
const types:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","audio/mpeg":"mp3","audio/mp4":"m4a","audio/x-m4a":"m4a","audio/ogg":"ogg","audio/webm":"webm","audio/wav":"wav","audio/x-wav":"wav"};
export async function POST(req:Request){try{
  const b=await hostBody(req,2000);await propertyAdmin();const ext=types[b.contentType];
  if(!ext||!["profile","reply"].includes(b.kind)||!["photo","audio"].includes(b.section)||!Number.isInteger(b.size)||b.size<1||b.size>10*1024*1024)throw new HostProblem("Choose a supported photo or audio file up to 10 MB.");
  if((b.section==="photo")!==b.contentType.startsWith("image/"))throw new HostProblem("Choose the correct photo or audio format.");
  let prefix="profiles/";
  if(b.kind==="reply"){if(b.section!=="audio"||!validHostId(b.questionId))throw new HostProblem("Choose an enquiry for this voice reply.");const rows=await hostDB("?id=eq."+b.questionId+"&select=id&limit=1");if(!rows.length)throw new HostProblem("Question not found.",404);prefix="replies/"+b.questionId+"/";}
  const file=prefix+randomUUID()+"."+ext,data=await hostStorage("object/upload/sign/host-media/"+file,{});if(typeof data.url!=="string")throw new HostProblem("Unable to start the upload.",503);
  return hostResponse({file,signedUrl:hostSignedUrl(data.url)});
}catch(e){return hostError(e);}}
