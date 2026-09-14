"use client";
import { useState } from "react";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";

export default function IslandMoment() {
  const [playing,setPlaying]=useState(false);
  const [failed,setFailed]=useState(false);
  return <section aria-labelledby="island-moment-title" className="border-y border-gold/20 bg-[#0b2731] text-white">
    <div className="container grid items-center gap-10 py-16 md:grid-cols-[1fr_minmax(0,360px)] md:gap-16 md:py-20">
      <div className="max-w-xl">
        <p className="eyebrow">Island moments · A glimpse of your Maldives</p>
        <h2 id="island-moment-title" className="font-display mt-5 text-4xl leading-tight md:text-6xl">Some moments need<br /><span className="italic text-[#ead7aa]">no itinerary.</span></h2>
        <p className="mt-6 text-lg leading-8 text-white/70">An open horizon. A sky turning gold. Take a moment by the ocean, then imagine your own island escape.</p>
        <p id="island-moment-description" className="mt-4 text-sm leading-7 text-white/55">A short portrait film of sunset over the sea. Tap to watch; sound is yours to turn on.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/stays" className="btn-gold">Find Your Island Stay <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/experience-bundles" className="btn-outline">Explore Experiences</Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[1.5rem] border border-[#d9bd7b]/35 bg-[#041117] shadow-2xl">
        {playing ? <video controls autoPlay muted playsInline preload="none" poster="/media/island-moment.jpg" width={540} height={960} aria-label="Sunset over the sea" aria-describedby="island-moment-description" className="aspect-[9/16] w-full object-contain" onError={()=>setFailed(true)}>
          <source src="/media/island-moment.mp4" type="video/mp4" />
          Your browser cannot play this video.
        </video> : <button type="button" className="group relative block aspect-[9/16] w-full overflow-hidden focus-visible:outline focus-visible:outline-4 focus-visible:outline-gold" onClick={()=>setPlaying(true)} aria-label="Play island sunset film">
          <img src="/media/island-moment.jpg" alt="Pink and golden sunset above the open sea" loading="lazy" width={540} height={960} className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-black/65 via-transparent to-transparent pb-10">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/15 backdrop-blur-sm"><Play aria-hidden="true" className="ml-1 h-6 w-6 fill-white" /></span>
            <span className="mt-4 text-sm font-semibold tracking-wide">Watch the moment · 8 seconds</span>
          </span>
        </button>}
        {failed && <p role="status" className="p-4 text-sm">Unable to play here. <a href="/media/island-moment.mp4" className="underline">Open the video</a>.</p>}
      </div>
    </div>
  </section>;
}
