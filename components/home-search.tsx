"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BedDouble, CalendarDays, MapPin, Ship, UsersRound, Waves } from "lucide-react";
import { coastalCopy } from "@/lib/coastal-copy";
import type { ProfessionalLocale } from "@/lib/professional-translations";

type Tab = "stays" | "experiences" | "transfers";
export default function HomeSearch({ islands, locale, today }: { islands: string[]; locale: ProfessionalLocale; today: string }) {
  const copy = coastalCopy[locale];
  const [tab, setTab] = useState<Tab>("stays");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const nextDay = checkIn ? new Date(Date.parse(`${checkIn}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : today;
  const tabs = [{ key: "stays", label: copy.stays, icon: BedDouble }, { key: "experiences", label: copy.experiences, icon: Waves }, { key: "transfers", label: copy.transfers, icon: Ship }] as const;
  return <section className="coastal-search" aria-label="Plan your Maldives escape">
    <div className="coastal-search-heading">
      <div role="tablist" aria-label="Trip services">{tabs.map(({ key, label, icon: Icon }, index) => <button key={key} type="button" role="tab" id={`search-tab-${key}`} tabIndex={tab === key ? 0 : -1} aria-selected={tab === key} aria-controls={`search-panel-${key}`} onClick={() => setTab(key)} onKeyDown={event => {
        const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        setTab(tabs[next].key);
        document.getElementById(`search-tab-${tabs[next].key}`)?.focus();
      }}><Icon aria-hidden="true" /><span>{label}</span></button>)}</div>
      <p>{copy.lessPlanning}</p>
    </div>
    <div role="tabpanel" id={`search-panel-${tab}`} aria-labelledby={`search-tab-${tab}`}>
      {tab === "stays" ? <form action="/stays" method="get" className="coastal-search-form">
        <label><span><MapPin />{copy.where}</span><select name="island" defaultValue=""><option value="">{copy.allIslands}</option>{islands.map(island => <option key={island}>{island}</option>)}</select></label>
        <label><span><CalendarDays />{copy.checkIn}</span><input name="checkIn" type="date" min={today} required={Boolean(checkIn || checkOut)} value={checkIn} onChange={event => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(""); }} /></label>
        <label><span><CalendarDays />{copy.checkOut}</span><input name="checkOut" type="date" min={nextDay} required={Boolean(checkIn || checkOut)} value={checkOut} onChange={event => setCheckOut(event.target.value)} /></label>
        <label><span><UsersRound />{copy.travellers}</span><select name="guests" defaultValue="2">{[1, 2, 3, 4].map(number => <option key={number} value={number}>{number} {number === 1 ? copy.guest : copy.guests}</option>)}</select></label>
        <button className="coastal-button coastal-search-submit" type="submit">{copy.search}<ArrowRight /></button>
      </form> : <div className="coastal-search-service">
        <div>{tab === "experiences" ? <Waves /> : <Ship />}<h2>{tab === "experiences" ? copy.experienceTitle : copy.transferTitle}</h2><p>{tab === "experiences" ? copy.experienceBody : copy.transferBody}</p></div>
        <div className="coastal-search-service-links"><Link className="coastal-button" href={tab === "experiences" ? "/excursions" : "/speedboat"}>{tab === "experiences" ? copy.exploreExperiences : copy.findTransfers}<ArrowRight /></Link>{tab === "experiences" && <Link className="coastal-text-link" href="/experience-bundles">{copy.completeBundle}<ArrowRight /></Link>}</div>
      </div>}
    </div>
  </section>;
}
