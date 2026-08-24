"use client";

import { useState } from "react";
import { Award, Search, Sparkles, Plane, Gem } from "lucide-react";

type Reward={name:string;points:number;level:string;nextLevel:string|null;pointsToNext:number|null};

export default function RewardsChecker(){
  const [identity,setIdentity]=useState("");
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [reward,setReward]=useState<Reward|null>(null);

  async function lookup(){
    setMessage("");setReward(null);
    if(!identity.trim()){setMessage("Enter your booking email or phone number.");return;}
    setLoading(true);
    try{
      const r=await fetch("/api/rewards",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identity:identity.trim()})});
      const x=await r.json();
      if(!r.ok)throw new Error(x?.error||"Unable to check points.");
      setReward(x.reward);
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to check points.");}
    finally{setLoading(false);}
  }

  return <section className="relative overflow-hidden border-b border-white/10 bg-[#060606]">
    <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl"/>
    <div className="container relative py-10 md:py-14">
      <div className="grid items-center gap-7 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.35em] text-gold">Tripelor Rewards</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Your points, right at the top.</h2>
          <p className="mt-3 max-w-xl text-gray-400">Use the email or phone number from your booking to see your private Tripelor rewards balance.</p>
          <div className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input value={identity} onChange={e=>setIdentity(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')lookup()}} placeholder="Email or phone number" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/70 px-4 py-3 outline-none focus:border-gold/60"/>
            <button type="button" onClick={lookup} disabled={loading} className="btn-gold gap-2 disabled:opacity-60"><Search className="h-4 w-4"/>{loading?"Checking...":"Show My Card"}</button>
          </div>
          {message&&<div className="mt-4 max-w-xl rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-gray-300">{message}</div>}
          <p className="mt-3 text-xs text-gray-500">Your rewards are only shown after you enter the email or phone number linked to your booking.</p>
        </div>

        <div className="mx-auto w-full max-w-[560px]">
          <div className="relative aspect-[1.65/1] overflow-hidden rounded-[28px] border border-gold/40 bg-gradient-to-br from-[#171717] via-[#0b0b0b] to-[#211804] p-6 shadow-2xl shadow-black/60 md:p-8">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-gold/15"/>
            <div className="absolute -right-5 -top-5 h-36 w-36 rounded-full border border-gold/10"/>
            <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent"/>

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2"><Plane className="h-5 w-5 text-gold"/><span className="text-lg font-bold tracking-wide">TRIPELOR</span></div>
                <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold"><Gem className="h-3.5 w-3.5"/>{reward?reward.level:"Rewards"}</div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[.28em] text-gray-400">Tripelor Points</p>
                <p className="mt-1 text-5xl font-bold tracking-tight text-gold md:text-6xl">{reward?reward.points.toLocaleString():"••••"}</p>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[.22em] text-gray-500">Member</p>
                  <p className="mt-1 max-w-[240px] truncate text-lg font-semibold">{reward?reward.name:"Your Name"}</p>
                </div>
                <div className="text-right">
                  {reward?.nextLevel&&reward.pointsToNext!==null?<><p className="text-[10px] uppercase tracking-[.2em] text-gray-500">Next Level</p><p className="mt-1 text-sm font-semibold text-gold">{reward.pointsToNext.toLocaleString()} pts to {reward.nextLevel}</p></>:reward?<><Award className="ml-auto h-5 w-5 text-gold"/><p className="mt-1 text-xs text-gold">Highest Level</p></>:<><Sparkles className="ml-auto h-5 w-5 text-gold"/><p className="mt-1 text-xs text-gray-400">The Art of Exploring</p></>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
