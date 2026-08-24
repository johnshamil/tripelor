"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, Gift, Sparkles } from "lucide-react";

type User={email:string;fullName:string;isAdmin?:boolean};
type Loyalty={account?:{points_balance?:number};pointsForFreeNight?:number};

function levelFor(points:number){
  if(points>=5000)return {level:"Platinum",nextLevel:null,pointsToNext:null};
  if(points>=2500)return {level:"Gold",nextLevel:"Platinum",pointsToNext:5000-points};
  if(points>=1000)return {level:"Silver",nextLevel:"Gold",pointsToNext:2500-points};
  return {level:"Bronze",nextLevel:"Silver",pointsToNext:1000-points};
}

export default function RewardsChecker(){
  const [user,setUser]=useState<User|null>(null);
  const [loyalty,setLoyalty]=useState<Loyalty|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    try{
      const me=await fetch("/api/auth/me",{cache:"no-store"});
      const mx=await me.json();
      if(!mx.user){setUser(null);return;}
      setUser(mx.user);
      const lr=await fetch("/api/account/loyalty",{cache:"no-store"});
      const lx=await lr.json();
      if(lr.ok)setLoyalty(lx);
    }finally{setLoading(false);}
  })()},[]);

  if(loading)return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8"><div className="mx-auto max-w-[760px] rounded-2xl border border-gold/20 bg-gradient-to-br from-[#1a1408] via-[#080808] to-black p-7 text-gray-400">Loading your Tripelor card...</div></div></section>;

  if(!user)return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8"><div className="mx-auto flex max-w-[760px] flex-col gap-5 rounded-2xl border border-gold/30 bg-gradient-to-br from-[#1c1609] via-[#090909] to-black p-7 shadow-2xl md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.32em] text-gold">Tripelor Card</p><h2 className="mt-2 text-2xl font-bold">Your member card appears after login.</h2><p className="mt-2 text-sm text-gray-400">Log in to see your name, points and membership level.</p></div><Link href="/login" className="btn-gold shrink-0">Log In</Link></div></div></section>;

  const points=Number(loyalty?.account?.points_balance||0);
  const target=Number(loyalty?.pointsForFreeNight||1000);
  const freeNights=Math.floor(points/target);
  const {level,nextLevel,pointsToNext}=levelFor(points);

  return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8 md:py-10"><div className="mx-auto max-w-[760px]">
    <div className="relative aspect-[1.75/1] min-h-[290px] overflow-hidden rounded-2xl border border-gold/50 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,.22),transparent_32%),linear-gradient(135deg,#171107_0%,#070707_52%,#000_100%)] p-7 shadow-[0_25px_70px_rgba(0,0,0,.55)] md:p-9">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_0%,rgba(255,255,255,.08)_45%,transparent_60%)]"/>
      <div className="absolute right-8 top-8 h-20 w-20 rounded-full border border-gold/20"/>
      <div className="absolute right-14 top-14 h-20 w-20 rounded-full border border-gold/10"/>
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><Award className="h-5 w-5 text-gold"/><p className="text-sm font-bold uppercase tracking-[.32em] text-gold">TRIPELOR</p></div>
            <p className="mt-1 text-[10px] uppercase tracking-[.28em] text-gray-500">The Art of Exploring</p>
          </div>
          <div className="rounded-md border border-gold/35 bg-gold/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">{level} Member</div>
        </div>

        <div className="grid gap-7 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[.24em] text-gray-500">Card Holder</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-wide text-white md:text-3xl">{user.fullName||"Tripelor Guest"}</h2>
            <p className="mt-4 text-[10px] uppercase tracking-[.24em] text-gray-500">Available Points</p>
            <div className="mt-1 flex items-baseline gap-2"><span className="text-5xl font-black tracking-tight text-gold md:text-6xl">{points.toLocaleString()}</span><span className="text-xs uppercase tracking-[.2em] text-gray-400">PTS</span></div>
          </div>
          <div className="sm:text-right">
            {freeNights>0?<><Gift className="mb-2 inline h-5 w-5 text-gold"/><p className="text-sm font-semibold text-white">{freeNights} free night{freeNights>1?"s":""} ready</p><Link href="/account" className="mt-2 inline-block text-xs uppercase tracking-[.18em] text-gold">Redeem →</Link></>:nextLevel&&pointsToNext!==null?<><Sparkles className="mb-2 inline h-5 w-5 text-gold"/><p className="text-sm text-gray-300"><strong className="text-gold">{pointsToNext.toLocaleString()}</strong> points to {nextLevel}</p><Link href="/account" className="mt-2 inline-block text-xs uppercase tracking-[.18em] text-gold">View rewards →</Link></>:<p className="text-sm text-gold">Top tier member</p>}
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-white/10 pt-4">
          <div><p className="text-[9px] uppercase tracking-[.2em] text-gray-600">Member Email</p><p className="mt-1 text-xs text-gray-400">{user.email}</p></div>
          <div className="text-right"><p className="text-[9px] uppercase tracking-[.2em] text-gray-600">Rewards</p><p className="mt-1 text-xs text-gray-400">1,000 pts = 1 free night</p></div>
        </div>
      </div>
    </div>
  </div></div></section>;
}
