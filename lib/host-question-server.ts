import { propertyConfig } from "@/lib/property-store";
export class HostProblem extends Error {constructor(message:string,public status=400){super(message);}}
export function validateHostInput<T>(read:()=>T):T{try{return read();}catch(e){throw new HostProblem(e instanceof Error?e.message:"Check your input.");}}
export const hostResponse=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
export function hostError(e:unknown){if(e instanceof Error && e.message==="UNAUTHORIZED")return hostResponse({error:"Please sign in to view your private host messages."},401);if(e instanceof Error && e.message==="FORBIDDEN")return hostResponse({error:"Admin access required."},403);return hostResponse({error:e instanceof HostProblem?e.message:"Unable to complete this action. Please try again."},e instanceof HostProblem?e.status:500);}
export async function hostBody(req:Request,max=14000){if(req.headers.get("origin")!==new URL(req.url).origin)throw new HostProblem("Please submit from Tripelor.",403);const raw=await req.text();if(raw.length>max)throw new HostProblem("Please shorten your message.");try{const value=JSON.parse(raw);if(!value||typeof value!=="object"||Array.isArray(value))throw new Error();return value;}catch{throw new HostProblem("Invalid request.");}}
export async function hostDB(query:string,init:RequestInit={}){
  const {url,key}=propertyConfig();const r=await fetch(url+"/rest/v1/host_questions"+query,{...init,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",Prefer:"return=representation"},cache:"no-store"});
  if(!r.ok)throw new HostProblem("Unable to load or save host questions. Please try again.",503);return r.status===204?[]:r.json();
}
export async function hostStorage(path:string,body:unknown){
  const {url,key}=propertyConfig();const r=await fetch(url+"/storage/v1/"+path,{method:"POST",headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});const data=await r.json().catch(()=>null);
  if(!r.ok||!data)throw new HostProblem("Unable to open or upload the host media. Please try again.",503);return data;
}
export function hostSignedUrl(path:string){const {url}=propertyConfig();const full=path.startsWith("http")?path:url+"/storage/v1"+(path.startsWith("/")?path:"/"+path);if(new URL(full).origin!==new URL(url).origin)throw new HostProblem("Invalid media response.",503);return full;}
