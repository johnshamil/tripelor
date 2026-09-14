"use client";
import Link from "next/link";
import {ArrowRight,ArrowUpRight,BedDouble,Check,Compass,Headphones,MapPin,MessageCircle,Plane,ShieldCheck,Ship,Sparkles,Utensils,Waves} from "lucide-react";
import {useState,useRef,useEffect,useId} from "react";
type Highlight={icon:"shield"|"support"|"transfer"|"airport"|"dining"|"island";title:string;text:string};
type Rate={name:string;price:number;detail:string;bookingHref:string};
type Room={mealPlans?:Rate[];name:string;image:string;description:string;details:string[];photos?:string[];bathroomPhotos?:string[];href?:string;bookingHref:string};
type Term={title:string;text:string};
const icons={shield:ShieldCheck,support:Headphones,transfer:Ship,airport:Plane,dining:Utensils,island:Waves};
export default function LuxuryPropertyPage({eyebrow,name,location,description,photos,startingFrom,bookingHref,highlights,rates,rooms=[],terms=[],videos=[]}:{eyebrow:string;name:string;location:string;description:string;photos:string[];startingFrom:number;bookingHref:string;highlights:Highlight[];rates:Rate[];rooms?:Room[];terms?:Term[];videos?:string[]}){
const [activePhoto,setActivePhoto]=useState(photos[0]);const conciergeMessage=encodeURIComponent(`Hello Tripelor, I would like help planning a stay at ${name}.`);
return <>
<section className="property-cinematic-hero"><img key={activePhoto} src={activePhoto} alt={name} className="property-cinematic-image"/><div className="property-cinematic-shade"/><div className="container relative z-10 flex min-h-[70vh] flex-col justify-end pb-10 pt-28 md:pb-14"><div className="max-w-4xl"><span className="inline-flex items-center gap-2 border border-[#d9bd7b]/45 bg-[#041117]/35 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#ead7aa] backdrop-blur-md"><Sparkles className="h-3.5 w-3.5"/>Selected by Tripelor</span><p className="eyebrow mt-7 text-[#ead7aa]">{eyebrow}</p><h1 className="font-display mt-4 text-5xl leading-[.98] text-white md:text-7xl lg:text-[5.5rem]">{name}</h1><p className="mt-5 flex items-center gap-2 text-sm uppercase tracking-[.16em] text-white/65"><MapPin className="h-4 w-4 text-[#d9bd7b]"/>{location}</p><p className="mt-5 max-w-2xl text-base leading-8 text-white/70">{description}</p><div className="mt-7 flex flex-wrap gap-3">{rooms.length>0?<a href="#choose-room" className="btn-gold">Choose a Room <ArrowRight className="h-4 w-4"/></a>:<Link href={bookingHref} className="btn-gold">Check Dates & Book <ArrowRight className="h-4 w-4"/></Link>}<a href={`https://wa.me/9609429403?text=${conciergeMessage}`} target="_blank" rel="noreferrer" className="btn-outline border-white/40 text-white"><MessageCircle className="h-4 w-4"/>Ask a Concierge</a></div></div><div className="mt-8 flex gap-3 overflow-x-auto pb-2">{photos.map((photo,index)=><button key={photo} type="button" onClick={()=>setActivePhoto(photo)} className={`relative h-20 w-28 shrink-0 overflow-hidden border transition md:h-24 md:w-36 ${activePhoto===photo?"border-[#d9bd7b]":"border-white/25 opacity-70 hover:opacity-100"}`} aria-label={`View ${name} photo ${index+1}`}><img src={photo} alt="" className="h-full w-full object-cover"/></button>)}</div></div></section>
{rooms.length>0&&<section id="choose-room" className="section-shell scroll-mt-24"><div className="container py-16 md:py-20"><div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between"><div><p className="eyebrow">Choose your room</p><h2 className="section-title mt-3">Your room comes first.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-white/45">Compare the rooms, open the photos and select the one you want. Choose a meal plan below, then select your travel dates.</p></div><div className="border border-[#c9a86a]/30 bg-[#c9a86a]/5 px-5 py-4"><p className="text-[10px] uppercase tracking-[.18em] text-white/40">Property rates from</p><p className="font-display mt-1 text-3xl text-[#d9bd7b]">USD {startingFrom}<span className="text-xs text-white/35"> / night</span></p></div></div><div className="mt-8 grid gap-6 lg:grid-cols-2">{rooms.map((room,index)=><article key={room.name} className="group overflow-hidden border border-white/10 bg-white/[.025] transition hover:border-[#c9a86a]/45"><div className="relative h-72 overflow-hidden md:h-80"><img src={room.image} alt={room.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-[#041117] via-transparent to-transparent"/><span className="absolute left-4 top-4 bg-emerald-950/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.15em] text-emerald-200">Live date checking</span><div className="absolute inset-x-0 bottom-0 p-6"><p className="text-[10px] uppercase tracking-[.22em] text-[#d9bd7b]">Room {String(index+1).padStart(2,"0")}</p><h3 className="font-display mt-2 text-4xl text-white">{room.name}</h3></div></div><div className="p-6 md:p-7"><p className="leading-7 text-white/55">{room.description}</p><RoomPhotoGallery label={`${room.name} · Room photos`} photos={room.photos?.length ? room.photos : room.image ? [room.image] : []}/><RoomPhotoGallery label={`${room.name} · Toilet / bathroom photos`} photos={room.bathroomPhotos || []}/><div className="mt-5 grid gap-2 sm:grid-cols-2">{room.details.map(detail=><p key={detail} className="flex items-center gap-2 text-sm text-white/65"><Check className="h-4 w-4 text-[#c9a86a]"/>{detail}</p>)}</div>{room.mealPlans?.length ? <div className="mt-6 border-t border-white/10 pt-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#d9bd7b]">Choose your meal plan</p><div className="mt-4 grid gap-3">{room.mealPlans.map((plan, planIndex) => <Link key={`${plan.name}-${planIndex}`} href={plan.bookingHref} aria-label={`Select ${room.name} with ${plan.name}, USD ${plan.price} per night`} className="group/plan flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c9a86a]/25 bg-[#c9a86a]/5 p-4 transition hover:border-[#c9a86a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c9a86a]"><div><h4 className="font-semibold text-white">{({ "Bed & Breakfast": "BB · Bed & Breakfast", "Half Board": "HB · Half Board", "Full Board": "FB · Full Board", "Room Only": "RO · Room Only" } as Record<string,string>)[plan.name] || plan.name}</h4><p className="mt-1 text-xs text-white/55">{plan.detail}</p></div><div className="text-right"><p className="text-xl font-semibold text-[#d9bd7b]">USD {plan.price}</p><p className="text-xs text-white/45">per room / night</p><span className="mt-2 inline-flex items-center gap-1 text-xs text-[#d9bd7b]">Select plan <ArrowRight className="h-3 w-3"/></span></div></Link>)}</div><p className="mt-3 text-xs leading-5 text-white/45">Choose dates next. Availability and final pricing are confirmed by Tripelor.</p></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2">{room.href&&<Link href={room.href} className="btn-outline justify-center">Photos & Details</Link>}<Link href={room.bookingHref} className="btn-gold justify-center">Select {room.name}<ArrowRight className="h-4 w-4"/></Link></div>}</div></article>)}</div></div></section>}
<section className="bg-[#f1ebdf] text-[#071922]"><div className="container py-16 md:py-20"><div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:items-start"><div><p className="eyebrow text-[#8d7037]">Why this stay</p><h2 className="font-display mt-4 text-4xl leading-tight md:text-5xl">Everything you need,<span className="block italic text-[#9c7d3d]">made effortless.</span></h2></div><div className="grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] md:grid-cols-3">{highlights.map(h=>{const Icon=icons[h.icon];return <article key={h.title} className="bg-[#f8f4ec] p-7"><Icon className="h-6 w-6 text-[#9c7d3d]"/><h3 className="font-display mt-7 text-2xl">{h.title}</h3><p className="mt-3 text-sm leading-6 text-[#58656c]">{h.text}</p></article>})}</div></div></div></section>
{rates.length>0&&<section className="bg-[#06151c]"><div className="container grid gap-10 py-16 md:py-20 lg:grid-cols-[1fr_340px]"><div><p className="eyebrow">{rooms.some(room=>room.mealPlans?.length) ? "Seasonal rates" : "Meal plans"}</p><h2 className="section-title mt-4">Choose how you would like to stay.</h2><div className="mt-8 grid gap-4 md:grid-cols-2">{rates.map(rate=><Link key={`${rate.name}-${rate.price}`} href={rate.bookingHref} className="group border border-white/10 bg-white/[.025] p-6 transition hover:border-[#c9a86a]/45"><Utensils className="h-5 w-5 text-[#c9a86a]"/><h3 className="font-display mt-6 text-2xl text-white">{rate.name}</h3><p className="mt-2 text-sm leading-6 text-white/45">{rate.detail}</p><div className="mt-5 border-t border-white/10 pt-4"><span className="font-display text-3xl text-[#d9bd7b]">USD {rate.price}</span><span className="text-xs text-white/35"> / night</span></div></Link>)}</div></div><aside className="h-fit border border-[#c9a86a]/30 bg-[#0a222b] p-7 lg:sticky lg:top-24"><p className="eyebrow">Ready to book?</p><h3 className="font-display mt-3 text-3xl text-white">{name}</h3><p className="mt-2 flex items-center gap-2 text-sm text-white/45"><MapPin className="h-4 w-4 text-[#c9a86a]"/>{location}</p><div className="mt-6 border-y border-white/10 py-5"><p className="text-[10px] uppercase tracking-[.2em] text-white/35">Rates from</p><p className="font-display mt-2 text-4xl text-[#d9bd7b]">USD {startingFrom}</p></div>{rooms.length>0?<a href="#choose-room" className="btn-gold mt-6 w-full justify-center">Choose Your Room</a>:<Link href={bookingHref} className="btn-gold mt-6 w-full justify-center">Check Dates & Book</Link>}<a href={`https://wa.me/9609429403?text=${conciergeMessage}`} target="_blank" rel="noreferrer" className="btn-outline mt-3 w-full justify-center">Ask a Concierge</a></aside></div></section>}
{terms.length>0&&<section className="bg-[#f1ebdf] text-[#071922]"><div className="container py-14"><div className="grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] md:grid-cols-2">{terms.map(term=><article key={term.title} className="bg-[#f8f4ec] p-7"><Compass className="h-5 w-5 text-[#9c7d3d]"/><h3 className="font-display mt-4 text-2xl">{term.title}</h3><p className="mt-3 text-sm leading-7 text-[#58656c]">{term.text}</p></article>)}</div></div></section>}
{videos.length>0&&<section className="section-shell"><div className="container py-16"><p className="eyebrow">A closer look</p><h2 className="section-title mt-3">See the stay before you arrive.</h2><div className="mt-8 grid gap-6 md:grid-cols-2">{videos.map(video=><video key={video} controls playsInline className="w-full border border-white/10 bg-black" src={video}/>)}</div></div></section>}
<div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#041117]/95 p-3 backdrop-blur-xl md:hidden">{rooms.length>0?<a href="#choose-room" className="btn-gold w-full justify-center"><BedDouble className="h-4 w-4"/>Choose a Room</a>:<Link href={bookingHref} className="btn-gold w-full justify-center">Check Dates & Book</Link>}</div>
</>}


function RoomPhotoGallery({label,photos}:{label:string;photos:string[]}) {
  const [index,setIndex]=useState<number|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const swipe=useRef<{x:number;y:number}|null>(null);
  const titleId=useId();
  const opened=index!==null;
  useEffect(()=>{
    if(!opened) return;
    const element=dialog.current;
    if(!element) return;
    const trigger=document.activeElement as HTMLElement|null;
    const previousOverflow=document.body.style.overflow;
    element.showModal();
    document.body.style.overflow="hidden";
    return ()=>{
      element.close();
      document.body.style.overflow=previousOverflow;
      trigger?.focus();
    };
  },[opened]);
  if(!photos.length) return null;
  const move=(direction:number)=>setIndex(current=>current===null?null:(current+direction+photos.length)%photos.length);
  return <div className="mt-6">
    <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#d9bd7b]">{label}</p>
    <p className="mt-1 text-xs text-white/45">Tap to enlarge · Swipe to explore</p>
    <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2">
      {photos.map((photo,i)=><button key={`${photo}-${i}`} type="button" onClick={()=>setIndex(i)} aria-label={`Open ${label}, photo ${i+1} of ${photos.length}`} className="w-28 shrink-0 snap-start overflow-hidden rounded-lg border border-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9bd7b] sm:w-36"><img src={photo} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover"/></button>)}
    </div>
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();setIndex(null);}} onClose={()=>setIndex(null)} onKeyDown={event=>{
      if(event.key==="ArrowRight"){event.preventDefault();move(1);}
      if(event.key==="ArrowLeft"){event.preventDefault();move(-1);}
    }} className="fixed inset-0 m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-[#02090d] p-0 text-white backdrop:bg-black/90">
      {index!==null&&<div className="flex h-full flex-col p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] md:p-8">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div><h2 id={titleId} className="text-sm font-semibold text-[#d9bd7b]">{label}</h2><p aria-live="polite" className="mt-1 text-xs text-white/60">Photo {index+1} of {photos.length}</p></div>
          <button type="button" autoFocus onClick={()=>setIndex(null)} className="min-h-11 min-w-11 rounded-full border border-white/30 px-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d9bd7b]" aria-label="Close photo gallery">Close ✕</button>
        </div>
        <div className="my-4 flex min-h-0 flex-1 items-center justify-center" style={{touchAction:"pan-y pinch-zoom"}} onTouchStart={event=>{
          swipe.current=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;
        }} onTouchMove={event=>{if(event.touches.length!==1)swipe.current=null;}} onTouchCancel={()=>{swipe.current=null;}} onTouchEnd={event=>{
          const origin=swipe.current;swipe.current=null;
          if(!origin||!event.changedTouches.length)return;
          const dx=event.changedTouches[0].clientX-origin.x,dy=event.changedTouches[0].clientY-origin.y;
          if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))move(dx<0?1:-1);
        }}>
          <img src={photos[index]} alt={`${label}, photo ${index+1}`} draggable={false} className="h-full w-full object-contain"/>
        </div>
        {photos.length>1&&<div className="flex shrink-0 items-center justify-between gap-4">
          <button type="button" onClick={()=>move(-1)} aria-label="Previous photo" className="min-h-11 rounded-full border border-white/30 px-5">← Previous</button>
          <span className="hidden text-xs text-white/50 sm:inline">Swipe or use the arrow keys</span>
          <button type="button" onClick={()=>move(1)} aria-label="Next photo" className="min-h-11 rounded-full border border-white/30 px-5">Next →</button>
        </div>}
      </div>}
    </dialog>
  </div>;
}
