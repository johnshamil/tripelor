"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SaveTripButton from "@/components/save-trip-button";
import { mealCode, momentKey } from "@/lib/couple-match";
import type { CouplePreferences, buildCoupleMatch } from "@/lib/couple-match";
import type { PublicProperty } from "@/lib/property-model";
import { propertyPhotoUrl } from "@/lib/property-model";

type Match = { id:string; version:number; side:string; expiresAt:string; joined:boolean; own:CouplePreferences|null; partnerReady:boolean; result:ReturnType<typeof buildCoupleMatch>|null; choice:string|null; invite?:string };
const initial:CouplePreferences={pace:"balance",setting:"either",meal:"any",budget:0,moment:""};
const field="mt-2 min-h-[48px] w-full rounded-xl border border-white/20 bg-[#0b2731] px-3 py-3 text-base text-white focus:outline focus:outline-2 focus:outline-gold";
export default function CoupleMatch({properties}:{properties:PublicProperty[]}) {
  const [match,setMatch]=useState<Match|null>(null);
  const [preferences,setPreferences]=useState<CouplePreferences>(initial);
  const [list,setList]=useState<Array<{id:string;created_at:string}>>([]);
  const [invitation,setInvitation]=useState<{id:string;token:string}|null>(null);
  const [inviteLink,setInviteLink]=useState("");
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[signIn,setSignIn]=useState(false);
  const [next,setNext]=useState("/couple-match");
  const [showForm,setShowForm]=useState(true);
  function adopt(data:Match,replacePreferences=true) {
    setMatch(data);setInvitation(null);setSignIn(false);
    window.history.replaceState(null,"","/couple-match#id="+data.id);
    if(replacePreferences){setPreferences(data.own || initial);setShowForm(!data.own);}
    if(data.invite)setInviteLink(window.location.origin+"/couple-match#id="+data.id+"&invite="+data.invite);
    else if(data.joined)setInviteLink("");
  }
  async function load(id="",replacePreferences=true) {
    setBusy(true);setMessage("");
    try {
      const r=await fetch("/api/couple-match"+(id?"?id="+encodeURIComponent(id):""),{cache:"no-store"});
      const data=await r.json();
      if(r.status===401){setSignIn(true);setNext(location.pathname+location.hash);return;}
      if(!r.ok)throw new Error(data.error);
      if(id)adopt(data,replacePreferences);else setList(data.matches || []);
    }catch(e){setMessage(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
  }
  useEffect(()=>{
    const hash=new URLSearchParams(window.location.hash.slice(1)),id=hash.get("id") || "",token=hash.get("invite") || "";
    setNext(location.pathname+location.hash);
    if(id && token)setInvitation({id,token});
    else void load(id);
  },[]);
  async function act(action:string,extra:Record<string,unknown>={}) {
    setBusy(true);setMessage("");
    try {
      const r=await fetch("/api/couple-match",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,id:match?.id,version:match?.version,...extra})});
      const data=await r.json();
      if(r.status===401){setSignIn(true);setNext(location.pathname+location.hash);return;}
      if(!r.ok)throw new Error(data.error);
      if(data.deleted){setMatch(null);setInviteLink("");history.replaceState(null,"","/couple-match");setList([]);setMessage("Match deleted for both travellers.");return;}
      adopt(data,action!=="choose" && action!=="invite");
      if(action==="preferences"){setShowForm(false);setMessage("Your preferences are saved.");}
      if(action==="choose")setMessage("Your shared stay choice is saved. Your partner can refresh to see it.");
    }catch(e){setMessage(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
  }
  const meals=Array.from(new Set(properties.flatMap(p=>p.rooms.map(r=>mealCode(r.mealPlan)))));
  const moments=properties.flatMap(p=>(p.experiences || []).filter(e=>e.enabled).map(e=>({value:momentKey(p.slug,e.id),label:e.name+" · "+p.name})));
  const result=match?.result;
  const selected=result?.candidates.find(c=>c.key===match?.choice) || result?.candidates[0];
  const quote=["Hello Tripelor, please prepare a confirmed quote for our Two Hearts, One Island plan.",
    result?.pace || "",result?.setting || "",
    selected ? "Stay: "+selected.name+" · "+selected.island+" · "+selected.room+" · "+selected.meal+" · Starting room rate USD "+selected.rate+" per night." : "Please help us find a suitable stay.",
    ...(result?.moments.map(m=>"Traveller "+m.traveller+" moment: "+m.name+(m.property?" through "+m.property:"")) || []),
    "Please confirm dates, occupancy pricing for two guests, taxes, activity prices and transfer arrangements."].filter(Boolean).join("\n");
  return <div className="bg-[#06151c] text-white"><div className="container py-12 md:py-20">
    <p className="eyebrow">Two travellers. A holiday you shape together.</p>
    <h1 className="font-display mt-4 max-w-3xl text-4xl md:text-6xl">Two Hearts, One Island</h1>
    <p className="mt-5 max-w-2xl leading-7 text-white/65">Choose what matters to you separately. Discover your common ground, then pick a stay and a special moment for each of you.</p>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">Each traveller uses their own Tripelor account. Your individual budget is not shown to your partner. Once both submit, your shared result and chosen moments are visible to both of you. Matches remain accessible for 30 days.</p>
    {message && <p role="status" className="mt-6 rounded-xl border border-gold/30 p-4 text-gold">{message}</p>}
    {signIn && <Link className="btn-gold mt-6" href={"/login?next="+encodeURIComponent(next)}>Sign in to continue</Link>}
    {!match && invitation && <section className="mt-10 max-w-2xl rounded-2xl border border-gold/30 p-6"><h2 className="font-display text-3xl">You have an island invitation</h2><p className="mt-4 leading-7 text-white/65">Join using your own account. Your partner cannot see your answers while you are choosing. Joining reserves the second traveller place for your account.</p><button disabled={busy} onClick={()=>act("join",{id:invitation.id,invite:invitation.token})} className="btn-gold mt-6">{busy?"Opening…":"Join our match"}</button></section>}
    {!match && !invitation && <section className="mt-10"><button disabled={busy} className="btn-gold" onClick={()=>act("start")}>{busy?"Loading…":"Start our island match"}</button>
      {list.length>0 && <div className="mt-8"><h2 className="font-display text-2xl">Continue a match</h2><div className="mt-4 flex flex-wrap gap-3">{list.map((m,i)=><button key={m.id} disabled={busy} onClick={()=>load(m.id)} className="btn-outline">Match {i+1} · {new Date(m.created_at).toLocaleDateString()}</button>)}</div></div>}
    </section>}
    {match && <div className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-gold/30 px-4 py-3 text-sm text-gold">{match.own?"Your answers saved":"Your answers needed"} · {match.partnerReady?"Partner ready":match.joined?"Partner is choosing":"Waiting for partner"}</span>
        <button disabled={busy} onClick={()=>load(match.id,false)} className="btn-outline">Refresh shared result</button>
        {match.own && <button disabled={busy} onClick={()=>setShowForm(!showForm)} className="btn-outline">{showForm?"Close preferences":"Edit my preferences"}</button>}
      </div>
      {match.side==="owner" && !match.joined && <section className="mt-6 rounded-2xl border border-white/15 p-6">
        <h2 className="font-display text-2xl">Invite your other half</h2>
        <p className="mt-3 text-sm leading-6 text-white/65">Send the invitation privately. The first other signed-in traveller to accept it becomes your partner.</p>
        {inviteLink ? <><label className="mt-4 block text-sm">Partner invitation<input className={field} readOnly value={inviteLink} onFocus={e=>e.target.select()} /></label><button className="btn-outline mt-4" onClick={async()=>{try{await navigator.clipboard.writeText(inviteLink);setMessage("Invitation copied. Share it with your partner.");}catch{setMessage("Select and copy the invitation above.");}}}>Copy invitation</button></> : <button disabled={busy} className="btn-outline mt-4" onClick={()=>act("invite")}>Create a new invitation link</button>}
      </section>}
      {showForm && <form className="mt-8 max-w-2xl rounded-2xl border border-white/15 p-6" onSubmit={e=>{e.preventDefault();void act("preferences",{preferences});}}>
        <h2 className="font-display text-3xl">Your private preferences</h2>
        <fieldset disabled={busy} className="mt-6 grid gap-5">
          <label>Your holiday pace<select className={field} value={preferences.pace} onChange={e=>setPreferences({...preferences,pace:e.target.value as CouplePreferences["pace"]})}><option value="adventure">More adventure</option><option value="relax">More relaxation</option><option value="balance">A little of both</option></select></label>
          <label>Island atmosphere<select className={field} value={preferences.setting} onChange={e=>setPreferences({...preferences,setting:e.target.value as CouplePreferences["setting"]})}><option value="either">Open to either</option><option value="quiet">Quieter surroundings</option><option value="active">More activity</option></select></label>
          <label>Preferred meal plan<select className={field} value={preferences.meal} onChange={e=>setPreferences({...preferences,meal:e.target.value})}><option value="any">Flexible</option>{meals.map(m=><option key={m} value={m}>{m}</option>)}</select></label>
          <label>Comfortable budget for one room per night (USD)<input type="number" min="1" max="10000" step="0.01" required className={field} value={preferences.budget || ""} onChange={e=>setPreferences({...preferences,budget:Number(e.target.value)})}/><span className="mt-2 block text-xs text-white/55">Room budget for both of you, excluding taxes, transfers and activities.</span></label>
          <label>Your one special moment<select className={field} value={preferences.moment} onChange={e=>setPreferences({...preferences,moment:e.target.value})}><option value="">Leave some time free</option>{moments.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
        </fieldset>
        <button disabled={busy} className="btn-gold mt-6" type="submit">{busy?"Saving…":"Save my preferences"}</button>
      </form>}
      {result && <section className="mt-10">
        <p className="eyebrow">Your Perfect Middle</p><h2 className="font-display mt-4 text-3xl md:text-5xl">A little of you. A little of them.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><p className="rounded-2xl border border-gold/30 p-6 leading-7">{result.pace}</p><p className="rounded-2xl border border-gold/30 p-6 leading-7">{result.setting} <span className="block text-sm text-white/55">Our team can advise on the atmosphere; properties are not rated for quietness.</span></p></div>
        <h3 className="font-display mt-10 text-2xl">One special moment each</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{result.moments.map(m=><article key={m.traveller} className="rounded-2xl border border-white/15 p-6"><p className="text-xs text-gold">Traveller {m.traveller}</p><h4 className="mt-3 text-xl">{m.name}</h4>{m.slug && <><p className="mt-3 text-sm text-white/60">Through {m.property} · {m.price>0?"From USD "+m.price+" "+m.unit:"Price on request"}</p>{selected && m.slug!==selected.slug && <p className="mt-2 text-sm text-gold">At another property. Ask Tripelor whether this can fit your trip.</p>}<Link className="mt-4 inline-block underline" href={"/stays/"+m.slug+"#experience-"+m.id}>Explore moment</Link></>}</article>)}</div>
        <h3 className="font-display mt-10 text-2xl">Choose your shared stay</h3>
        <p className="mt-3 text-sm leading-6 text-white/60">Suggestions fit both room budgets and have capacity for two. Meal preferences and your moments guide their order. Either traveller can update the shared choice; refresh to see each other's changes.</p>
        {!result.candidates.length && <p className="mt-6 rounded-xl border border-gold/30 p-6">No published room currently fits both budgets with capacity for two. Edit your preferences or request a tailored quote.</p>}
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{result.candidates.map(c=><article key={c.key} className={"overflow-hidden rounded-2xl border "+(selected?.key===c.key?"border-gold":"border-white/15")}>
          {c.photo && <img src={propertyPhotoUrl(c.photo)} alt={c.name} loading="lazy" className="aspect-[4/3] w-full object-cover"/>}
          <div className="p-6"><p className="text-xs text-gold">{c.island}</p><h4 className="font-display mt-3 text-2xl">{c.name}</h4><p className="mt-3">{c.room} · {c.meal}</p><p className="mt-3 text-xl text-gold">From USD {c.rate} / room / night</p><ul className="mt-4 space-y-2 text-sm text-white/60">{c.reasons.map(r=><li key={r}>{r}</li>)}</ul><button disabled={busy || match.choice===c.key} className="btn-outline mt-5" onClick={()=>act("choose",{choice:c.key})}>{match.choice===c.key?"Our saved choice":selected?.key===c.key?"Save suggested stay":"Choose this stay"}</button></div>
        </article>)}</div>
        <div className="mt-8 rounded-2xl border border-gold/30 bg-[#0b2731] p-6">
          <p className="text-sm leading-7 text-white/65">Starting room rates are not a confirmed quote. Dates, availability, occupancy pricing, taxes, transfers and both activities need confirmation. Activity prices remain separate.</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <SaveTripButton key={match.version} itemType="package" itemKey={"couple-match-"+match.id} title="Two Hearts, One Island" subtitle={selected?selected.name+" · "+selected.room+" · "+selected.meal:"Our shared holiday wishes"} imageUrl={selected?.photo?propertyPhotoUrl(selected.photo):undefined} href={"/couple-match#id="+match.id} label="Save to My Trip"/>
            <a className="btn-gold" target="_blank" rel="noopener noreferrer" href={"https://wa.me/9609429403?text="+encodeURIComponent(quote)}>Request our quote</a>
          </div><p className="mt-4 text-xs text-white/55">Opens WhatsApp for you to review and send. Your individual budgets are not included.</p>
        </div>
      </section>}
      {!result && match.own && <p className="mt-8 text-white/65">Your choices are ready. Once your partner submits, refresh to reveal your shared holiday idea.</p>}
      <div className="mt-10 border-t border-white/10 pt-6"><p className="text-xs text-white/50">Available until {new Date(match.expiresAt).toLocaleDateString()}. Either traveller can delete this match for both accounts.</p><button className="mt-3 min-h-[44px] text-sm text-white/60 underline" disabled={busy} onClick={()=>{if(window.confirm("Delete this match and both travellers' preferences?"))void act("delete");}}>Delete this match</button></div>
    </div>}
  </div></div>;
}
