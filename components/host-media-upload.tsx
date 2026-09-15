"use client";
import { useId, useState } from "react";
import HostAudio from "@/components/host-audio";
import { hostMediaUrl } from "@/lib/host-questions";
export default function HostMediaUpload({kind,section,questionId,value,onChange,onBusyChange,disabled=false}:{kind:"profile"|"reply";section:"photo"|"audio";questionId?:string;value:string;onChange:(value:string)=>void;onBusyChange:(busy:boolean)=>void;disabled?:boolean}){
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const inputId=useId();
  async function upload(file?:File){
    if(!file||busy||disabled)return;
    setBusy(true);onBusyChange(true);setError("");
    try{
      const extension=file.name.toLowerCase().split(".").pop()||"";
      const fallback:Record<string,string>={jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",mp3:"audio/mpeg",m4a:"audio/mp4",ogg:"audio/ogg",webm:"audio/webm",wav:"audio/wav"};
      const contentType=file.type.toLowerCase()||fallback[extension]||"";
      if(file.size<1||file.size>10*1024*1024)throw new Error("Choose a file up to 10 MB.");
      const sign=await fetch("/api/admin/host-media/sign",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,section,questionId,contentType,size:file.size})});const data=await sign.json();if(!sign.ok)throw new Error(data.error||"Unable to start upload.");
      const uploaded=await fetch(data.signedUrl,{method:"PUT",headers:{"Content-Type":contentType},body:file});if(!uploaded.ok)throw new Error("Upload failed. Please try again.");
      onChange(data.file);
    }catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(false);onBusyChange(false);}
  }
  return <div className="min-w-0 rounded-xl border border-white/15 p-3 sm:p-4">
    <p className="text-sm font-medium">{section==="photo"?"Host photograph":"Voice message"}</p>
    <p id={inputId+"-help"} className="mt-2 text-sm leading-6 text-gray-400">{section==="photo"?"JPG, PNG or WebP, up to 10 MB.":"MP3, M4A, OGG, WebM or WAV, up to 10 MB. Aim for a short 20–45 second welcome."}</p>
    <input id={inputId} aria-label={section==="photo"?"Choose host photograph":"Choose voice recording"} aria-describedby={inputId+"-help"} type="file" disabled={disabled||busy} accept={section==="photo"?"image/jpeg,image/png,image/webp":".mp3,.m4a,.ogg,.webm,.wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,audio/wav,audio/x-wav"} className="peer sr-only" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void upload(file);}}/>
    <label htmlFor={inputId} className="btn-outline mt-4 w-full cursor-pointer normal-case tracking-normal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-disabled:cursor-wait peer-disabled:opacity-50">{busy?"Uploading…":value?(section==="photo"?"Replace photograph":"Replace recording"):(section==="photo"?"Choose photograph":"Choose recording")}</label>
    {busy&&<p role="status" className="mt-3 text-sm text-gold">Uploading…</p>}{error&&<p role="alert" className="mt-3 text-sm text-red-200">{error}</p>}
    {value&&<div className="mt-4 min-w-0">{section==="photo"?<img src={hostMediaUrl(value)} alt="Host photograph preview" className="h-24 w-24 rounded-2xl object-cover"/>:<HostAudio file={value} label="Preview uploaded voice message"/>}<button type="button" disabled={busy||disabled} onClick={()=>onChange("")} className="mt-2 min-h-12 px-2 text-sm text-gray-300 underline">Remove {section==="photo"?"photograph":"recording"}</button></div>}
  </div>;
}
