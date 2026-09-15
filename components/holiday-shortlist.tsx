"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";
import { shortlistChoices, shortlistQuote } from "@/lib/holiday-shortlist";
import type { ShortlistChoice, ShortlistView, ShortlistVote } from "@/lib/holiday-shortlist";

const inputClass="w-full rounded-xl border border-white/20 bg-[#071922] px-4 py-3 text-white outline-none focus:border-gold";
const buttonClass="min-h-11 rounded-xl border border-white/20 px-4 py-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50";
const draftKey="tripelor-shortlist-draft";

export default function HolidayShortlist({properties}:{properties:PublicProperty[]}) {
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  const [title,setTitle]=useState("Our Maldives holiday"),[chosen,setChosen]=useState<string[]>([]),[search,setSearch]=useState("");
  const [token,setToken]=useState(""),[view,setView]=useState<ShortlistView|null>(null),[shareUrl,setShareUrl]=useState("");
  const [name,setName]=useState(""),[quoteSlugs,setQuoteSlugs]=useState<string[]>([]),[closing,setClosing]=useState(false),[closed,setClosed]=useState(false);
  const [recent,setRecent]=useState("");

  async function request(body:Record<string,unknown>) {
    const res=await fetch("/api/holiday-shortlist",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
    const data=await res.json();
    if(!res.ok) throw new Error(data.error || "Unable to save. Please try again.");
    return data;
  }
  async function load(sharedToken:string,initial=false) {
    setBusy(true);setError("");
    try {
      const data:ShortlistView=await request({action:"read",token:sharedToken});
      setView(data);
      if(initial){setName(data.mine?.name || "");setQuoteSlugs(data.properties.map(p=>p.slug));}
      else setNotice("Votes refreshed.");
    } catch(e){setError(e instanceof Error?e.message:"Unable to open this shortlist.");}
    finally{setBusy(false);setReady(true);}
  }
  useEffect(()=>{
    const hash=window.location.hash.slice(1);
    if(hash){
      setToken(hash);setShareUrl(window.location.origin+"/holiday-shortlist#"+hash);
      if(/^[a-f0-9]{64}$/.test(hash)) void load(hash,true);
      else {setError("This shortlist link is incomplete. Ask your friend to send it again.");setReady(true);}
      return;
    }
    try {
      const saved=JSON.parse(localStorage.getItem(draftKey) || "{}");
      if(typeof saved.title==="string")setTitle(saved.title.slice(0,80));
      const selected=Array.isArray(saved.slugs)?saved.slugs.filter((s:unknown)=>typeof s==="string"&&properties.some(p=>p.slug===s)):[];
      const add=new URLSearchParams(window.location.search).get("add");
      if(add&&properties.some(p=>p.slug===add)&&!selected.includes(add))selected.push(add);
      setChosen(Array.from(new Set<string>(selected)).slice(0,3));
      const last=localStorage.getItem("tripelor-last-shortlist") || "";
      if(/^[a-f0-9]{64}$/.test(last))setRecent(last);
    }catch{}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready&&!token){try{localStorage.setItem(draftKey,JSON.stringify({title,slugs:chosen}));}catch{}}},[ready,title,chosen,token]);

  async function create() {
    setBusy(true);setError("");setNotice("");
    try {
      const data=await request({action:"start",title,slugs:chosen});
      setToken(data.token);setView(data);setQuoteSlugs(data.properties.map((p:PublicProperty)=>p.slug));
      const url=window.location.origin+"/holiday-shortlist#"+data.token;
      setShareUrl(url);window.history.replaceState(null,"",url);
      try{localStorage.setItem("tripelor-last-shortlist",data.token);localStorage.removeItem(draftKey);}catch{}
      setNotice("Your shortlist is ready. Copy the link and invite your group.");
      window.scrollTo({top:0,behavior:"smooth"});
    }catch(e){setError(e instanceof Error?e.message:"Unable to create your shortlist.");}
    finally{setBusy(false);}
  }
  async function saveVote(slug:string,choice:ShortlistChoice,question:string,clear=false) {
    if(!view)return;
    setBusy(true);setError("");setNotice("");
    try{
      const data=await request({action:clear?"clear":"vote",token,version:view.version,slug,choice,question,name});
      setView(data);setNotice(clear?"Your vote was removed.":"Your vote is saved for the group.");
    }catch(e){setError(e instanceof Error?e.message:"Unable to save your vote.");}
    finally{setBusy(false);}
  }
  async function close() {
    if(!view)return;
    setBusy(true);setError("");
    try{await request({action:"close",token,version:view.version});setClosed(true);setView(null);setNotice("The link is closed and its votes have been cleared.");}
    catch(e){setError(e instanceof Error?e.message:"Unable to close the link.");}
    finally{setBusy(false);}
  }
  async function copy() {
    try{await navigator.clipboard.writeText(shareUrl);setNotice("Link copied. Send it to your group.");}
    catch{setNotice("Select and copy the link below to share it.");}
  }
  const filtered=properties.filter(p=>(p.name+" "+p.island).toLowerCase().includes(search.toLowerCase()));
  const quote=view?shortlistQuote(view,quoteSlugs)+"\n\nOur shared shortlist: "+shareUrl:"";

  return <main className="container py-10 pb-32 md:py-16">
    <p className="eyebrow">Plan together</p>
    <h1 className="font-display mt-4 text-4xl md:text-6xl">{view?view.title:"Share My Holiday Shortlist"}</h1>
    <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300">Choose up to three stays, share one link and find your group's favourite. No account needed.</p>
    {error&&<p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
    <p role="status" aria-live="polite" className="mt-4 text-sm text-gold">{notice}</p>
    {!ready&&<p className="mt-6">Opening your shortlist…</p>}
    {ready&&token&&!view&&!closed&&<div className="mt-6 flex flex-wrap gap-3"><button disabled={busy} onClick={()=>load(token,true)} className={buttonClass}>{busy?"Opening…":"Try again"}</button><a href="/holiday-shortlist" className={buttonClass}>Create a new shortlist</a></div>}
    {closed&&<a href="/holiday-shortlist" className="btn-gold mt-6">Create a new shortlist</a>}
    {ready&&!token&&<>
      {recent&&<a href={"/holiday-shortlist#"+recent} onClick={e=>{e.preventDefault();setToken(recent);setShareUrl(window.location.origin+"/holiday-shortlist#"+recent);window.history.replaceState(null,"","/holiday-shortlist#"+recent);void load(recent,true);}} className="mt-4 inline-flex min-h-11 items-center text-sm text-gold underline">Open my last shortlist</a>}
      <div className="mt-7 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm">Shortlist name<input maxLength={80} className={inputClass} value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="grid gap-2 text-sm">Find a property or island<input className={inputClass} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stays"/></label></div>
      <p className="mt-4 text-sm text-gold">{chosen.length} of 3 selected</p>
      {properties.length===0&&<p className="mt-6">No published stays are available to shortlist right now. <Link href="/contact" className="text-gold underline">Ask Tripelor</Link>.</p>}
      {properties.length>0&&filtered.length===0&&<p className="mt-6">No stays match your search. Try another name or island.</p>}
      <div className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(p=><article key={p.slug} className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[.025]">
        <StayDetails property={p}/>
        <label className="m-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gold/30 p-3"><input type="checkbox" checked={chosen.includes(p.slug)} disabled={!chosen.includes(p.slug)&&chosen.length>=3} onChange={e=>setChosen(current=>e.target.checked?[...current,p.slug].slice(0,3):current.filter(s=>s!==p.slug))}/><span className="text-sm">{chosen.includes(p.slug)?"Added to shortlist":"Add to shortlist"}</span></label>
      </article>)}</div>
      <div className="mt-8 rounded-2xl border border-gold/20 p-6"><p className="text-sm leading-7 text-gray-300">Anyone with the link can see display names, votes and questions and join in. Share it only with your group. Links last 30 days. Your browser remembers your votes and creator controls; use the same browser to change them.</p><p className="mt-2 text-xs text-gray-400">The stays are fixed once you create the link. Check your selection first.</p><button disabled={busy||!chosen.length||!title.trim()} onClick={create} className="btn-gold mt-5 disabled:opacity-50">{busy?"Creating…":"Create share link"}</button></div>
    </>}
    {view&&<>
      <section aria-label="Share shortlist" className="mt-6 rounded-2xl border border-gold/20 p-5">
        <p className="text-sm leading-7 text-gray-300">Anyone with this link can view the group and vote. Expires {new Date(view.expiresAt).toLocaleDateString("en-GB")}. Keep using this browser to edit your votes.</p>
        <div className="mt-4 flex flex-wrap gap-3"><button onClick={copy} className="btn-gold min-h-11">Copy invite link</button><button disabled={busy} onClick={()=>load(token)} className={buttonClass}>{busy?"Updating…":"Refresh votes"}</button></div>
        <label className="mt-4 grid gap-2 text-xs text-gray-400">Your share link<input readOnly className={inputClass} value={shareUrl} onFocus={e=>e.target.select()}/></label>
      </section>
      <label className="mt-7 grid max-w-md gap-2 text-sm">Your display name<input maxLength={40} className={inputClass} value={name} onChange={e=>setName(e.target.value)} placeholder="How your group knows you"/><span className="text-xs text-gray-400">Visible to your group when you save a vote. Please avoid personal contact details in questions.</span></label>
      {view.slugs.length>view.properties.length&&<p className="mt-5 text-sm text-amber-200">A shortlisted property is no longer published. It is excluded from new quote requests. Ask Tripelor about alternatives.</p>}
      <div className="mt-7 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">{view.properties.map(p=><article key={p.slug} className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-white/[.025]">
        <StayDetails property={p}/>
        <div className="border-t border-white/10 p-5">
          <div className="space-y-2">{shortlistChoices.map(c=><p key={c.value} className="text-sm text-gray-300">{c.label}: <strong className="text-gold">{view.people.filter(person=>person.votes.some(v=>v.slug===p.slug&&v.choice===c.value)).length}</strong></p>)}</div>
          <VoteEditor slug={p.slug} mine={view.mine?.votes.find(v=>v.slug===p.slug)} disabled={busy||!name.trim()} save={saveVote}/>
          <details className="mt-5"><summary className="min-h-11 cursor-pointer py-3 text-sm text-gold">See group responses</summary><div className="space-y-3">{view.people.filter(person=>person.votes.some(v=>v.slug===p.slug)).map((person,index)=>{const vote=person.votes.find(v=>v.slug===p.slug)!;return <p key={index} className="break-words text-sm leading-6 text-gray-300"><strong>{person.name}</strong> · {shortlistChoices.find(c=>c.value===vote.choice)?.label}{vote.question&&<span className="block whitespace-pre-line">{vote.question}</span>}</p>;})}{!view.people.some(person=>person.votes.some(v=>v.slug===p.slug))&&<p className="text-sm text-gray-400">No votes yet. Be the first.</p>}</div></details>
        </div>
      </article>)}</div>
      <section className="mt-8 rounded-2xl border border-gold/20 p-6"><h2 className="text-2xl font-semibold">Ready for a group quote?</h2><p className="mt-3 text-sm leading-7 text-gray-300">Choose the stays to include. Add your dates, guest numbers and preferred rooms in WhatsApp before sending. A quote request does not reserve rooms.</p><div className="mt-4 space-y-2">{view.properties.map(p=><label key={p.slug} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={quoteSlugs.includes(p.slug)} onChange={e=>setQuoteSlugs(current=>e.target.checked?[...current,p.slug]:current.filter(s=>s!==p.slug))}/>{p.name}</label>)}</div>
        {view.properties.some(p=>quoteSlugs.includes(p.slug))?<a className="btn-gold mt-5" href={"https://wa.me/9609429403?text="+encodeURIComponent(quote)} target="_blank" rel="noopener noreferrer">Ask Tripelor for a group quote</a>:<p className="mt-4 text-sm text-gray-400">Select at least one available stay.</p>}
        <p className="mt-3 text-xs leading-6 text-gray-400">Opens WhatsApp with your selected stays, vote totals, questions and shared link for the Tripelor team. Review and send the message yourself.</p>
      </section>
      {view.isOwner&&<div className="mt-8">{closing?<div className="rounded-xl border border-red-400/30 p-4"><p className="text-sm">Close this link for everyone and clear all votes?</p><div className="mt-3 flex gap-3"><button disabled={busy} onClick={close} className={buttonClass}>Close link</button><button disabled={busy} onClick={()=>setClosing(false)} className={buttonClass}>Keep it open</button></div></div>:<button disabled={busy} onClick={()=>setClosing(true)} className="min-h-11 text-sm text-gray-400 underline">Close this shared link</button>}</div>}
    </>}
  </main>;
}

function StayDetails({property:p}:{property:PublicProperty}) {
  const groups=new Map<string,typeof p.rooms>();
  p.rooms.forEach(room=>groups.set(room.name,[...(groups.get(room.name)||[]),room]));
  return <>{p.photos[0]&&<img src={propertyPhotoUrl(p.photos[0])} alt={p.name} loading="lazy" className="aspect-[4/3] w-full object-cover"/>}<div className="p-5">
    <p className="text-xs text-gold">{p.island}</p><h2 className="mt-2 text-2xl font-semibold">{p.name}</h2><Link href={"/stays/"+p.slug} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm text-gold underline">View property & photos</Link>
    <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">Rooms & meal-plan prices</summary><div className="space-y-4">{Array.from(groups.entries()).map(([roomName,rooms])=><div key={roomName} className="rounded-xl border border-white/10 p-3">{rooms[0].photos?.[0]&&<img src={propertyPhotoUrl(rooms[0].photos[0])} alt={roomName} loading="lazy" className="mb-3 aspect-video w-full rounded-lg object-cover"/>}<h3 className="font-semibold">{roomName}</h3><p className="mt-1 text-xs text-gray-400">Up to {rooms[0].capacity} guests</p>{rooms.map((r,i)=><p key={i} className="mt-2 text-sm text-gray-300">{r.mealPlan} · {r.sellingRate>0?"USD "+r.sellingRate.toLocaleString("en-US"):"Price on request"}{r.totalRooms<1?" · Currently unavailable":""}</p>)}</div>)}</div><p className="mt-3 text-xs leading-6 text-gray-400">Listed base rates per room per night, not a dated quote. Seasonal rates, occupancy, availability, taxes and transfers affect the total.</p><p className="mt-2 whitespace-pre-line break-words text-xs leading-6 text-gray-300">Taxes: {p.taxes || "Ask Tripelor"}</p><p className="mt-2 whitespace-pre-line break-words text-xs leading-6 text-gray-300">Transfers: {p.transfers || "Ask Tripelor"}</p></details>
  </div></>;
}

function VoteEditor({slug,mine,disabled,save}:{slug:string;mine?:ShortlistVote;disabled:boolean;save:(slug:string,choice:ShortlistChoice,question:string,clear?:boolean)=>Promise<void>}) {
  const [choice,setChoice]=useState<ShortlistChoice>(mine?.choice || "favourite"),[question,setQuestion]=useState(mine?.question || "");
  useEffect(()=>{setChoice(mine?.choice || "favourite");setQuestion(mine?.question || "");},[mine?.choice,mine?.question]);
  return <form className="mt-5 space-y-3" onSubmit={e=>{e.preventDefault();void save(slug,choice,question);}}><label className="grid gap-2 text-sm">Your vote<select className={inputClass} value={choice} onChange={e=>setChoice(e.target.value as ShortlistChoice)}>{shortlistChoices.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>{choice==="question"&&<label className="grid gap-2 text-sm">Your question<textarea maxLength={300} required rows={3} className={inputClass} value={question} onChange={e=>setQuestion(e.target.value)}/></label>}<button disabled={disabled} className={buttonClass}>{mine?"Update my vote":"Save my vote"}</button>{mine&&<button type="button" disabled={disabled} onClick={()=>save(slug,choice,"",true)} className="ml-3 min-h-11 text-xs text-gray-400 underline">Remove my vote</button>}</form>;
}
