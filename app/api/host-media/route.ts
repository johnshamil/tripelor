import { currentUser, isAdminEmail } from "@/lib/auth-server";
import { propertyDB } from "@/lib/property-store";
import { HostProblem, hostDB, hostError, hostSignedUrl, hostStorage } from "@/lib/host-question-server";
export const dynamic="force-dynamic";
export async function GET(req:Request){try{
  const file=new URL(req.url).searchParams.get("file")||"";
  const profile=/^profiles\/[0-9a-f-]{36}\.(jpg|png|webp|mp3|m4a|ogg|webm|wav)$/.test(file);
  const reply=file.match(/^replies\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(mp3|m4a|ogg|webm|wav)$/);
  if(!profile&&!reply)throw new HostProblem("Media not found.",404);
  let allowed=false;
  if(profile){const rows=await propertyDB("managed_properties?status=eq.published&data->host->>enabled=eq.true&or=(data->host->>photo.eq."+encodeURIComponent(file)+",data->host->>audio.eq."+encodeURIComponent(file)+")&select=id&limit=1");allowed=rows.length>0;}
  if(!allowed){const u=await currentUser();if(u&&isAdminEmail(u.email))allowed=true;else if(reply&&u){const rows=await hostDB("?id=eq."+reply[1]+"&user_id=eq."+encodeURIComponent(u.id)+"&replied_at=not.is.null&reply_audio=eq."+encodeURIComponent(file)+"&select=id&limit=1");allowed=rows.length>0;}}
  if(!allowed)throw new HostProblem("This media is private or unavailable.",404);
  const data=await hostStorage("object/sign/host-media/"+file,{expiresIn:60});if(typeof data.signedURL!=="string")throw new HostProblem("Media unavailable.",404);
  return new Response(null,{status:307,headers:{Location:hostSignedUrl(data.signedURL),"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}catch(e){return hostError(e);}}
