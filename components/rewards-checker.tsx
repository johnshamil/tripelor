"use client";

import { useState } from "react";
import { Award, Search, Sparkles } from "lucide-react";

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

  return <section className="border-y border-white/10 bg-gradient-to-b from-[#090909] to-black"><div className="container py-20"><div className="mx-auto max-w-4xl"><div className="text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10"><Award className="h-7 w-7 text-gold"/></div><p className="mt-5 text-sm uppercase tracking-[.35em] text-gold">Tripelor Rewards</p><h2 className="mt-3 text-4xl font-bold md:text-5xl">See your points</h2><p className="mx-auto mt-4 max-w-2xl text-gray-400">Enter the same email address or phone number used for your Tripelor booking to view your rewards balance.</p></div>

  <div className="card mx-auto mt-9 max-w-2xl p-6 md:p-8"><div className="flex flex-col gap-3 sm:flex-row"><input value={identity} onChange={e=>setIdentity(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')lookup()}} placeholder="Email or phone number" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black px-4 py-3"/><button type="button" onClick={lookup} disabled={loading} className="btn-gold gap-2 disabled:opacity-60"><Search className="h-4 w-4"/>{loading?"Checking...":"Check My Points"}</button></div>
  {message&&<div className="mt-5 rounded-xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm text-gray-300">{message}</div>}
  {reward&&<div className="mt-6 rounded-2xl border border-gold/30 bg-gold/10 p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-gray-400">Welcome back</p><h3 className="mt-1 text-2xl font-bold">{reward.name}</h3><span className="mt-3 inline-flex rounded-full border border-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-[.2em] text-gold">{reward.level} Member</span></div><div className="sm:text-right"><p className="text-sm uppercase tracking-[.2em] text-gray-400">Your Points</p><p className="mt-1 text-5xl font-bold text-gold">{reward.points.toLocaleString()}</p></div></div>{reward.nextLevel&&reward.pointsToNext!==null?<div className="mt-6 border-t border-white/10 pt-5 text-sm text-gray-300"><Sparkles className="mr-2 inline h-4 w-4 text-gold"/>Only <strong className="text-gold">{reward.pointsToNext.toLocaleString()} points</strong> to reach {reward.nextLevel}.</div>:<div className="mt-6 border-t border-white/10 pt-5 text-sm text-gold">You have reached our highest rewards level.</div>}</div>}
  <p className="mt-4 text-xs text-gray-500">For privacy, points are only shown after you enter the email or phone number linked to your booking.</p></div></div></div></section>;
}
