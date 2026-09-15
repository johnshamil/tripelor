"use client";
import { normalizePropertyHost } from "@/lib/property-model";
import type { PropertyHost } from "@/lib/property-model";
import HostMediaUpload from "@/components/host-media-upload";
const input="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-gold";
export default function PropertyHostEditor({value,onChange,busy,onBusyChange}:{value?:PropertyHost;onChange:(value:PropertyHost)=>void;busy:boolean;onBusyChange:(busy:boolean)=>void}){
  const host=normalizePropertyHost(value);
  return <section className="rounded-2xl border border-gold/25 bg-white/[.025] p-5 md:p-6">
    <h3 className="text-lg font-semibold">A Message From Your Island</h3><p className="mt-2 text-sm leading-6 text-gray-400">Introduce the real host who welcomes guests. Add their approved photograph, introduction and optional recording. Voice messages need a written transcript.</p>
    <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={host.enabled} disabled={busy} onChange={e=>onChange({...host,enabled:e.target.checked})}/>Show this host on the published property page</label>
    <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4"><label className="grid gap-2 text-sm">Host name<input className={input} maxLength={120} value={host.name} onChange={e=>onChange({...host,name:e.target.value})}/></label><label className="grid gap-2 text-sm">Introduction<textarea rows={4} className={input} maxLength={2000} value={host.introduction} onChange={e=>onChange({...host,introduction:e.target.value})} placeholder="Let guests know who welcomes them and what staying here feels like."/></label></fieldset>
    <div className="mt-4 space-y-4"><HostMediaUpload kind="profile" section="photo" value={host.photo} disabled={busy} onBusyChange={onBusyChange} onChange={photo=>onChange({...host,photo})}/><HostMediaUpload kind="profile" section="audio" value={host.audio} disabled={busy} onBusyChange={onBusyChange} onChange={audio=>onChange({...host,audio})}/></div>
    <label className="mt-4 grid gap-2 text-sm">Voice transcript<textarea disabled={busy} rows={4} maxLength={5000} value={host.transcript} onChange={e=>onChange({...host,transcript:e.target.value})} className={input} placeholder="Type the words spoken in the recording."/></label>
    <p className="mt-3 text-xs leading-6 text-gray-400">Preview Property shows unsaved changes. Save the property to keep them. Guest questions arrive in <a href="/admin/host-questions" className="text-gold underline">Host Questions</a>; you can publish a private text or voice reply there.</p>
  </section>;
}
