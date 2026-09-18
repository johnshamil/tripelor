"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import TripelorMark from "@/components/tripelor-mark";
import { useSiteLanguage } from "@/components/use-site-language";
import { translations } from "@/lib/professional-translations";

export default function Footer() {
  const locale = useSiteLanguage();
  const copy = translations[locale].footer;

  return (
    <footer className="border-t border-white/10 bg-[#041117]">
      <div className="container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_.7fr_.8fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-3">
              <TripelorMark className="h-11 w-11 text-[#d9bd7b]" />
              <span className="font-display text-2xl tracking-[.09em] text-white">TRIPELOR</span>
            </Link>
            <p className="mt-6 text-sm leading-7 text-white/45">{copy.intro}</p>
            <p className="mt-7 text-[10px] uppercase tracking-[.28em] text-[#c9a86a]">{copy.tagline}</p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">{copy.explore}</h2>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <Link href="/stays" className="transition hover:text-[#d9bd7b]">{copy.ourStays}</Link>
              <Link href="/island-adventures" className="transition hover:text-[#d9bd7b]">{copy.islandPackages}</Link>
              <Link href="/experience-bundles" className="transition hover:text-[#d9bd7b]">{copy.experiences}</Link>
              <Link href="/speedboat" className="transition hover:text-[#d9bd7b]">{copy.transfers}</Link>
              <Link href="/reviews" className="transition hover:text-[#d9bd7b]">{copy.guestReviews}</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">{copy.information}</h2>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/45">
              <Link href="/about" className="transition hover:text-[#d9bd7b]">{copy.about}</Link>
              <Link href="/travel-info#faq" className="transition hover:text-[#d9bd7b]">{copy.faq}</Link>
              <Link href="/travel-info#terms" className="transition hover:text-[#d9bd7b]">{copy.terms}</Link>
              <Link href="/travel-info#cancellation" className="transition hover:text-[#d9bd7b]">{copy.cancellation}</Link>
              <Link href="/travel-info#privacy" className="transition hover:text-[#d9bd7b]">{copy.privacy}</Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white">{copy.contact}</h2>
            <div className="mt-5 space-y-4 text-sm text-white/45">
              <a href="mailto:bookings@tripelor.com" className="flex items-center gap-3 transition hover:text-[#d9bd7b]">
                <Mail className="h-4 w-4 text-[#c9a86a]" /> bookings@tripelor.com
              </a>
              <a href="tel:+9609429403" className="flex items-center gap-3 transition hover:text-[#d9bd7b]">
                <Phone className="h-4 w-4 text-[#c9a86a]" /> +960 942 9403
              </a>
              <p className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#c9a86a]" /> Maldives
              </p>
            </div>
            <Link href="/contact" className="luxury-link mt-7">
              {copy.enquiry} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tripelor. {copy.rights}</p>
          <p>{copy.services}</p>
        </div>
      </div>
    </footer>
  );
}
