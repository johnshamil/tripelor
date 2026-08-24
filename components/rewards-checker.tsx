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

  if(loading)return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8"><div className="mx-auto max-w-3xl rounded-[28px] border border-gold/20 bg-gradient-to-br from-[#17120a] via-black to-[#0a0a0a] p-7 text-gray-400">Loading your Tripelor Rewards card...</div></div></section>;

  if(!user)return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8"><div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-[28px] border border-gold/20 bg-gradient-to-br from-[#17120a] via-black to-[#0a0a0a] p-7 shadow-2xl md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.32em] text-gold">Tripelor Rewards</p><h2 className="mt-2 text-2xl font-bold">Your points card appears automatically after login.</h2><p className="mt-2 text-sm text-gray-400">Log in to see your name, points balance and reward status on the homepage.</p></div><Link href="/login" className="btn-gold shrink-0">Log In</Link></div></div></section>;

  const points=Number(loyalty?.account?.points_balance||0);
  const target=Number(loyalty?.pointsForFreeNight||1000);
  const freeNights=Math.floor(points/target);
  const {level,nextLevel,pointsToNext}=levelFor(points);

  return <section className="border-y border-white/10 bg-[#050505]"><div className="container py-8 md:py-10"><div className="mx-auto max-w-3xl">
    <div className="relative overflow-hidden rounded-[30px] border border-gold/40 bg-gradient-to-br from-[#2a210f] via-[#0b0b0b] to-black p-7 shadow-2xl md:p-9">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-gold/10 bg-gold/5"/><div className="absolute -bottom-24 -left-10 h-52 w-52 rounded-full border border-white/5 bg-white/[.02]"/>
      <div className="relative"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Award className="h-5 w-5 text-gold"/><p className="text-xs font-semibold uppercase tracking-[.34em] text-gold">Tripelor Rewards</p></div><p className="mt-6 text-xs uppercase tracking-[.22em] text-gray-500">Member</p><h2 className="mt-1 text-2xl font-bold md:text-3xl">{user.fullName||"Tripelor Guest"}</h2></div><div className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.2em] text-gold">{level}</div></div>
      <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[.24em] text-gray-500">Available Points</p><p className="mt-1 text-5xl font-black tracking-tight text-gold md:text-6xl">{points.toLocaleString()}</p><p className="mt-1 text-sm text-gray-400">Tripelor Points</p></div><div className="sm:text-right">{freeNights>0?<><Gift className="mb-2 inline h-5 w-5 text-gold"/><p className="font-semibold text-white">{freeNights} free night{freeNights>1?"s":""} available</p><Link href="/account" className="mt-2 inline-block text-sm text-gold">View & redeem →</Link></>:nextLevel&&pointsToNext!==null?<><Sparkles className="mb-2 inline h-5 w-5 text-gold"/><p className="text-sm text-gray-300"><strong className="text-gold">{pointsToNext.toLocaleString()}</strong> points to {nextLevel}</p><Link href="/account" className="mt-2 inline-block text-sm text-gold">View rewards →</Link></>:<p className="text-sm text-gold">Highest rewards level reached</p>}</div></div>
      <div className="mt-7 border-t border-white/10 pt-4 text-xs text-gray-500">100 points per completed paid room-night · 1,000 points = 1 free night</div></div>
    </div>
  </div></div></section>;
}
