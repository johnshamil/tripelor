"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginPage(){
 const[email,setEmail]=useState("");const[password,setPassword]=useState("");const[status,setStatus]=useState("");const[busy,setBusy]=useState(false);
 useEffect(()=>{
  const hash=window.location.hash||"";
  const query=window.location.search||"";
  const hashParams=new URLSearchParams(hash.replace(/^#/,""));
  const queryParams=new URLSearchParams(query.replace(/^\?/,""));
  const type=hashParams.get("type")||queryParams.get("type");
  const hasRecoveryToken=Boolean(hashParams.get("access_token")||queryParams.get("access_token")||queryParams.get("token_hash")||queryParams.get("code"));
  if(type==="recovery"||hasRecoveryToken){
   window.location.replace(`/reset-password${query}${hash}`);
  }
 },[]);
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setStatus("");try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});const x=await r.json();if(!r.ok)throw new Error(x.error||"Unable to log in.");const params=new URLSearchParams(window.location.search);const next=params.get("next");window.location.href=next&&next.startsWith("/")?next:"/";}catch(e){setStatus(e instanceof Error?e.message:"Unable to log in.");}finally{setBusy(false)}}
 return <main className="relative min-h-screen overflow-hidden"><img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=90" alt="Maldives" className="absolute inset-0 h-full w-full object-cover"/><div className="absolute inset-0 bg-black/70"/><div className="container relative flex min-h-screen items-center justify-center py-12"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/80 p-7 shadow-2xl backdrop-blur-xl md:p-9"><p className="text-center text-sm uppercase tracking-[.35em] text-gold">Tripelor</p><h1 className="mt-3 text-center text-4xl font-bold">Welcome to the Maldives</h1><p className="mt-3 text-center text-gray-400">Log in to enter Tripelor and manage your bookings.</p><form onSubmit={submit} className="mt-8 grid gap-5"><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address" autoComplete="email" className="rounded-xl border border-white/10 bg-black/70 px-4 py-3"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" className="rounded-xl border border-white/10 bg-black/70 px-4 py-3"/>{status&&<p className="rounded-xl border border-white/10 bg-white/[.05] p-3 text-sm">{status}</p>}<button disabled={busy} className="btn-gold gap-2 disabled:opacity-60"><LogIn className="h-4 w-4"/>{busy?"Logging in...":"Log In & Enter Tripelor"}</button><div className="flex justify-between gap-4 text-sm"><Link href="/signup" className="text-gold">Create account</Link><Link href="/forgot-password" className="text-gray-400 hover:text-gold">Forgot password?</Link></div></form></div></div></main>}
