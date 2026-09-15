"use client";
import { useRef, useState } from "react";
import { hostMediaUrl } from "@/lib/host-questions";
export default function HostAudio({file,label}:{file:string;label:string}){
  const [error,setError]=useState(false);const audio=useRef<HTMLAudioElement>(null);
  return <div className="min-w-0"><audio ref={audio} key={file} controls preload="none" aria-label={label} src={hostMediaUrl(file)} onError={()=>setError(true)} onLoadedData={()=>setError(false)} className="block w-full min-w-0 max-w-full"/>{error&&<p role="status" className="mt-2 text-sm leading-6 text-amber-200">Unable to play this recording. Read the transcript below or <button type="button" onClick={()=>{setError(false);audio.current?.load();}} className="min-h-12 px-2 underline">try again</button>.</p>}</div>;
}
