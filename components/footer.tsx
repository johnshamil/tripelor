"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import TripelorWordmark from "@/components/tripelor-wordmark";
import { useSiteLanguage } from "@/components/use-site-language";
import { translations } from "@/lib/professional-translations";
import { coastalCopy } from "@/lib/coastal-copy";

export default function Footer() {
  const locale = useSiteLanguage();
  const copy = translations[locale].footer;
  const brand = coastalCopy[locale];
  return <footer className="brand-footer">
    <div className="container">
      <div className="brand-footer-invitation"><div><p>{brand.small}</p><h2>{brand.footerTitle}</h2><p>{brand.footerBody}</p></div><Link href="/contact" className="coastal-button">{brand.footerCta}<ArrowUpRight /></Link></div>
      <div className="brand-footer-grid">
        <div><Link href="/" aria-label="Tripelor home"><TripelorWordmark /></Link><p className="brand-footer-intro">{copy.intro}</p></div>
        <div><h3>{copy.explore}</h3><Link href="/stays">{copy.ourStays}</Link><Link href="/island-adventures">{copy.islandPackages}</Link><Link href="/excursions">{brand.experiences}</Link><Link href="/speedboat">{copy.transfers}</Link><Link href="/reviews">{copy.guestReviews}</Link></div>
        <div><h3>{copy.information}</h3><Link href="/about">{copy.about}</Link><Link href="/travel-info#faq">{copy.faq}</Link><Link href="/travel-info#terms">{copy.terms}</Link><Link href="/travel-info#cancellation">{copy.cancellation}</Link><Link href="/travel-info#privacy">{copy.privacy}</Link></div>
        <div><h3>{copy.contact}</h3><a href="mailto:bookings@tripelor.com"><Mail />bookings@tripelor.com</a><a href="tel:+9609429403"><Phone />+960 942 9403</a><p><MapPin />Maldives</p><Link href="/contact" className="brand-footer-contact">{copy.enquiry}<ArrowUpRight /></Link></div>
      </div>
      <div className="brand-footer-trust">
        <span>Registered Maldives Travel Agency</span>
        <a href="https://www.tourism.gov.mv/en/registered/travel_agencies/6ac89beb575a7/travelagencies.print" target="_blank" rel="noreferrer">Verify on Maldives Tourism <ArrowUpRight /></a>
      </div>
      <div className="brand-footer-worldwide" aria-label="Tripelor worldwide">
        <span>Tripelor Worldwide</span>
        <Link href="/it" hrefLang="it">Italiano</Link>
        <Link href="/de" hrefLang="de">Deutsch</Link>
        <Link href="/ru" hrefLang="ru">Русский</Link>
        <Link href="/zh" hrefLang="zh-CN">中文</Link>
        <Link href="/fr" hrefLang="fr">Français</Link>
        <Link href="/es" hrefLang="es">Español</Link>
      </div>
      <div className="brand-footer-legal"><p>© {new Date().getFullYear()} Tripelor. {copy.rights}</p><p>{brand.tagline}</p></div>
    </div>
  </footer>;
}
