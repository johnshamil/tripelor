"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BedDouble, CalendarDays, MapPin, Ship, UsersRound, Waves } from "lucide-react";
import { coastalCopy } from "@/lib/coastal-copy";
import type { ProfessionalLocale } from "@/lib/professional-translations";
import type { StaySearch } from "@/lib/stay-search";

type Tab = "stays" | "experiences" | "transfers";
export default function HomeSearch({ islands, locale, today, initialSearch = {}, staysOnly = false }: { islands: string[]; locale: ProfessionalLocale; today: string; initialSearch?: StaySearch; staysOnly?: boolean }) {
  const copy = coastalCopy[locale];
  const [tab, setTab] = useState<Tab>("stays");
  const [checkIn, setCheckIn] = useState(initialSearch.checkIn || "");
  const [checkOut, setCheckOut] = useState(initialSearch.checkOut || "");
  const panelsRef = useRef<HTMLDivElement>(null);
  const nextDay = checkIn ? new Date(Date.parse(`${checkIn}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : today;
  const tabs = [{ key: "stays", label: copy.stays, icon: BedDouble }, { key: "experiences", label: copy.experiences, icon: Waves }, { key: "transfers", label: copy.transfers, icon: Ship }] as const;

  useEffect(() => {
    const container = panelsRef.current;
    const activePanel = container?.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');
    if (!container || !activePanel) return;
    const updateHeight = () => {
      const height = Math.ceil(activePanel.getBoundingClientRect().height);
      if (height > 0 && container.style.height !== `${height}px`) container.style.height = `${height}px`;
    };
    updateHeight();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(activePanel);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateHeight, { passive: true });
    return () => window.removeEventListener("resize", updateHeight);
  }, [tab]);

  return <section className="coastal-search" aria-label="Plan your Maldives escape">
    {!staysOnly && <div className="coastal-search-heading">
      <div role="tablist" aria-label="Trip services">{tabs.map(({ key, label, icon: Icon }, index) => <button key={key} type="button" role="tab" id={`search-tab-${key}`} tabIndex={tab === key ? 0 : -1} aria-selected={tab === key} aria-controls={`search-panel-${key}`} onClick={() => setTab(key)} onKeyDown={event => {
        const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault();
        setTab(tabs[next].key);
        document.getElementById(`search-tab-${tabs[next].key}`)?.focus();
      }}><Icon aria-hidden="true" /><span>{label}</span></button>)}</div>
      <p>{copy.lessPlanning}</p>
    </div>}
    <div ref={panelsRef} className="coastal-search-panels">
      <div role={staysOnly ? undefined : "tabpanel"} id="search-panel-stays" aria-label={staysOnly ? copy.stays : undefined} aria-labelledby={staysOnly ? undefined : "search-tab-stays"} hidden={tab !== "stays"}>
        <form action="/stays" method="get" className="coastal-search-form">
          <label><span><MapPin />{copy.where}</span><select name="island" defaultValue={initialSearch.island || ""}><option value="">{copy.allIslands}</option>{Array.from(new Set([...islands, initialSearch.island || ""].filter(Boolean))).map(island => <option key={island}>{island}</option>)}</select></label>
          <label><span><CalendarDays />{copy.checkIn}</span><input name="checkIn" type="date" min={today} required={Boolean(checkIn || checkOut)} value={checkIn} onChange={event => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(""); }} /></label>
          <label><span><CalendarDays />{copy.checkOut}</span><input name="checkOut" type="date" min={nextDay} required={Boolean(checkIn || checkOut)} value={checkOut} onChange={event => setCheckOut(event.target.value)} /></label>
          <label><span><UsersRound />{copy.travellers}</span><select name="guests" defaultValue={initialSearch.guests || "2"}>{[1, 2, 3, 4].map(number => <option key={number} value={number}>{number} {number === 1 ? copy.guest : copy.guests}</option>)}</select></label>
          <button className="coastal-button coastal-search-submit" type="submit">{copy.search}<ArrowRight /></button>
        </form>
      </div>
      {(["experiences", "transfers"] as const).map(service => <div key={service} role="tabpanel" id={`search-panel-${service}`} aria-labelledby={`search-tab-${service}`} hidden={tab !== service}>
        <div className="coastal-search-service">
          <div>{service === "experiences" ? <Waves /> : <Ship />}<h2>{service === "experiences" ? copy.experienceTitle : copy.transferTitle}</h2><p>{service === "experiences" ? copy.experienceBody : copy.transferBody}</p></div>
          <div className="coastal-search-service-links"><Link className="coastal-button" href={service === "experiences" ? "/excursions" : "/speedboat"}>{service === "experiences" ? copy.exploreExperiences : copy.findTransfers}<ArrowRight /></Link>{service === "experiences" && <Link className="coastal-text-link" href="/experience-bundles">{copy.completeBundle}<ArrowRight /></Link>}</div>
        </div>
      </div>)}
    </div>
  </section>;
}
