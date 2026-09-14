"use client";
import { useState } from "react";
import { wishlistIdeas, tagKey } from "@/lib/wishlist";
export default function WishlistTagsEditor({tags,onChange}:{tags:string[];onChange:(tags:string[])=>void}) {
  const [draft,setDraft]=useState(""),[error,setError]=useState("");
  function add(value:string) {
    const tag=value.trim().replace(/\s+/g," ");
    if(!tag)return;
    if(tag.length>40){setError("Keep each tag within 40 characters.");return;}
    if(tags.some(t=>tagKey(t)===tagKey(tag))){setDraft("");return;}
    if(tags.length>=12){setError("Use up to 12 tags.");return;}
    onChange([...tags,tag]);setDraft("");setError("");
  }
  return <div className="mt-5 rounded-xl border border-white/10 p-4">
    <p className="text-sm font-semibold">Customer wishlist tags</p>
    <p className="mt-2 text-xs leading-6 text-white/50">Add only interests this stay or activity genuinely supports. Published tags connect it to My Maldives Wishlist. Add the same tag to related stays and experiences.</p>
    <div className="mt-3 flex flex-wrap gap-2">{tags.map(tag=><button type="button" key={tag} onClick={()=>onChange(tags.filter(t=>t!==tag))} aria-label={"Remove tag "+tag} className="min-h-[44px] rounded-full border border-gold/40 px-3 text-sm text-gold">{tag} ×</button>)}</div>
    <div className="mt-3 flex gap-2"><input value={draft} maxLength={40} aria-label="New wishlist tag" placeholder="Add an interest" className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-white/15 bg-[#071922] px-3 text-white" onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();add(draft);}}}/><button type="button" className="btn-outline" onClick={()=>add(draft)}>Add tag</button></div>
    <p className="mt-3 text-xs text-white/50">Suggestions — tap to add:</p><div className="mt-2 flex flex-wrap gap-2">{wishlistIdeas.filter(tag=>!tags.some(t=>tagKey(t)===tagKey(tag))).map(tag=><button type="button" key={tag} onClick={()=>add(tag)} className="min-h-[44px] rounded-full border border-white/15 px-3 text-xs">+ {tag}</button>)}</div>
    {error && <p role="status" className="mt-2 text-xs text-red-300">{error}</p>}
  </div>;
}
