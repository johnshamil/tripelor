"use client";
import { normalizePropertyHost } from "@/lib/property-model";
import type { PropertyHost } from "@/lib/property-model";
import HostMediaUpload from "@/components/host-media-upload";
const input="w-full min-w-0 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-base leading-7 outline-none focus:border-gold";
export default function PropertyHostEditor({value,onChange,busy,onBusyChange}:{value?:PropertyHost;onChange:(value:PropertyHost)=>void;busy:boolean;onBusyChange:(busy:boolean)=>void}){
  const host=normalizePropertyHost(value);
  return <section id="property-host" className="host-surface min-w-0 rounded-2xl border border-gold/25 bg-white/[.025] p-4 sm:p-5 md:p-6">
    <h3 className="text-lg font-semibold">A Message From Your Island</h3><p className="mt-2 text-sm leading-6 text-gray-400">Add your host’s name, welcome and photograph. A voice recording is optional.</p>
    <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-gold/25 p-3 text-sm leading-6"><input type="checkbox" className="h-5 w-5 shrink-0 accent-[#c9a86a]" checked={host.enabled} disabled={busy} onChange={e=>onChange({...host,enabled:e.target.checked})}/>Show this host on the published property page</label>
    <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4"><label className="grid gap-2 text-sm">Host name<input className={input} maxLength={120} value={host.name} onChange={e=>onChange({...host,name:e.target.value})}/></label><label className="grid gap-2 text-sm">Introduction<textarea rows={4} className={input} maxLength={2000} value={host.introduction} onChange={e=>onChange({...host,introduction:e.target.value})} placeholder="Let guests know who welcomes them and what staying here feels like."/></label></fieldset>
    <div className="mt-4"><HostMediaUpload kind="profile" section="photo" value={host.photo} disabled={busy} onBusyChange={onBusyChange} onChange={photo=>onChange({...host,photo})}/></div>
    <details open={Boolean(host.audio || host.transcript)} className="mt-4 min-w-0 rounded-xl border border-white/15 p-3 sm:p-4">
      <summary className="min-h-12 cursor-pointer py-3 text-sm font-medium text-gold">Add a voice welcome (optional)</summary>
      <HostMediaUpload kind="profile" section="audio" value={host.audio} disabled={busy} onBusyChange={onBusyChange} onChange={audio=>onChange({...host,audio})}/>
      <label className="mt-4 grid min-w-0 gap-2 text-sm">Voice transcript<textarea disabled={busy} rows={4} maxLength={5000} value={host.transcript} onChange={e=>onChange({...host,transcript:e.target.value})} className={input} placeholder="Type the words spoken in the recording."/></label>
      <p className="mt-2 text-sm leading-6 text-gray-400">Add a transcript so guests can read the welcome without sound.</p>
    </details>
    <p className="mt-4 text-sm leading-6 text-gray-400">Preview shows your unsaved changes. Save the property to keep them. Guest questions arrive in <a href="/admin/host-questions" className="inline-flex min-h-12 items-center text-gold underline">Host Questions</a>.</p>
  </section>;
}
