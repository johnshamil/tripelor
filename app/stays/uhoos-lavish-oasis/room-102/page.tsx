import fs from "fs";
import path from "path";
import Link from "next/link";
import { BedDouble, CheckCircle2, MapPin } from "lucide-react";
import AvailabilityChecker from "@/components/availability-checker";

function getPhotos(){
  const dir=path.join(process.cwd(),"public","uhoos","room-102");
  try{return fs.readdirSync(dir).filter(x=>/\.(jpe?g|png|webp|avif)$/i.test(x)).map(x=>`/uhoos/room-102/${encodeURIComponent(x)}`);}catch{return[];}
}

export default function Room102Page(){const photos=getPhotos();return <main className="container py-12 md:py-16">
  <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><p className="text-sm uppercase tracking-[.3em] text-gold">Uhoo&apos;s Lavish Oasis</p><h1 className="mt-2 text-4xl font-bold md:text-6xl">ROOM 102</h1><p className="mt-3 flex items-center gap-2 text-gray-400"><MapPin className="h-4 w-4 text-gold"/>V. Felidhoo, Maldives</p></div><Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&roomType=ROOM%20102&mealPlan=Bed%20%26%20Breakfast" className="btn-gold">Book Room 102</Link></div>
  <section className="mt-10">{photos.length?<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{photos.map((src,i)=><div key={src} className={`${i===0?"md:col-span-2 lg:col-span-2 lg:row-span-2":""} overflow-hidden rounded-3xl border border-white/10 bg-zinc-900`}><img src={src} alt={`Room 102 photo ${i+1}`} className={`${i===0?"min-h-[420px]":"h-64"} h-full w-full object-cover transition duration-500 hover:scale-105`}/></div>)}</div>:<div className="card p-8 text-center text-gray-400">Room 102 photo gallery is ready. Upload photos to <strong className="text-white">public/uhoos/room-102</strong> and they will appear here automatically after deployment.</div>}</section>
  <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_.9fr]"><section><div className="flex items-center gap-3"><BedDouble className="h-7 w-7 text-gold"/><h2 className="text-3xl font-bold">Comfortable island accommodation</h2></div><p className="mt-4 leading-7 text-gray-400">Room 102 gives Tripelor guests another private room choice at Uhoo&apos;s Lavish Oasis, with flexible dining options and local support.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Room 102","Ideal for 2 guests","Bed & Breakfast from USD 85","Half Board USD 95","Full Board USD 115","Local island hospitality"].map(x=><div key={x} className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="h-5 w-5 text-gold"/>{x}</div>)}</div></section><AvailabilityChecker roomType="ROOM 102"/></div>
</main>}
