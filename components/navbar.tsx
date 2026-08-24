"use client";
import Link from "next/link";
import { LogOut, Menu, Plane, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

type User={email:string;fullName:string;isAdmin?:boolean};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user,setUser]=useState<User|null>(null);
  const links = [["/", "Home"], ["/stays/uhoos-lavish-oasis", "Stays"], ["/island-adventures", "Packages"], ["/tours", "Experiences"], ["/speedboat", "Speedboat"], ["/reviews", "Reviews"], ["/contact", "Contact"]];

  useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(r=>r.json()).then(x=>setUser(x.user||null)).catch(()=>setUser(null));},[]);
  useEffect(()=>{document.body.style.overflow=open?"hidden":"";return()=>{document.body.style.overflow=""}},[open]);
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});setOpen(false);window.location.href="/";}

  return <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
    <div className="container flex h-16 items-center justify-between">
      <Link href="/" className="flex items-center gap-2 transition duration-300 hover:scale-[1.03]"><Plane className="h-5 w-5 text-gold"/><span className="text-xl font-bold tracking-wide">Tripelor</span></Link>
      <nav className="hidden items-center gap-5 lg:flex">{links.map(([href,label]) => <Link key={href} href={href} className="nav-tab text-sm">{label}</Link>)}<Link href="/account" className="nav-tab gap-1.5 text-sm"><UserRound className="h-4 w-4"/>Account</Link><Link href="/build-your-trip" className="btn-outline px-4 py-2.5">Build Your Trip</Link><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" className="btn-gold px-4 py-2.5">Book Now</Link></nav>
      <button onClick={() => setOpen(!open)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[.03] transition active:scale-90 lg:hidden" aria-label="Toggle menu" aria-expanded={open}>{open ? <X/> : <Menu/>}</button>
    </div>
    <div className={`fixed inset-x-0 top-16 z-50 h-[calc(100dvh-4rem)] bg-black/98 transition-all duration-300 lg:hidden ${open?"pointer-events-auto translate-y-0 opacity-100":"pointer-events-none -translate-y-3 opacity-0"}`}>
      <div className="container flex h-full flex-col overflow-y-auto py-5">
        <div className="grid gap-1">{links.map(([href,label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-2xl px-4 text-base text-gray-200 transition active:scale-[.98] active:bg-white/5">{label}</Link>)}<Link href="/account" onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-2 rounded-2xl px-4 text-base text-gray-200 active:bg-white/5"><UserRound className="h-4 w-4"/>Account</Link>{user&&<button onClick={logout} className="flex min-h-12 items-center gap-2 rounded-2xl px-4 text-left text-base text-red-300 active:bg-white/5"><LogOut className="h-4 w-4"/>Log Out</button>}</div>
        <div className="mt-auto grid gap-3 border-t border-white/10 pt-5"><Link href="/build-your-trip" onClick={() => setOpen(false)} className="btn-outline w-full">Build Your Trip</Link><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast" onClick={() => setOpen(false)} className="btn-gold w-full">Book Now</Link></div>
      </div>
    </div>
  </header>;
}
