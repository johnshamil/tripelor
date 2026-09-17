import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { VAAVU_BLUE_ESCAPE as excursion } from "@/lib/vaavu-blue-escape";

export const metadata: Metadata = {
  title: "Vaavu Blue Escape – USD 100 per person",
  description: "Shark Bay snorkeling, dolphin watching, lunch, shipwreck snorkeling, turtle spotting and island hopping to Thinadhoo or Keyodhoo. USD 100 per person.",
  alternates: { canonical: `https://tripelor.com${excursion.href}` },
  openGraph: {
    title: "Vaavu Blue Escape | Tripelor",
    description: "Explore Vaavu with ocean experiences, island hopping and lunch for USD 100 per person.",
    url: `https://tripelor.com${excursion.href}`,
    siteName: "Tripelor",
    type: "website",
  },
};

export default function VaavuBlueEscapePage() {
  return (
    <main>
      <section className="container py-8 md:py-14">
        <Link href="/island-adventures" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-gold">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All packages
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm uppercase tracking-[.2em] text-gold"><MapPin aria-hidden="true" className="h-4 w-4" />Vaavu Atoll, Maldives</p>
            <h1 className="font-display mt-4 text-5xl leading-tight md:text-6xl">{excursion.name}</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-gray-300">{excursion.description}</p>
            <div className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <strong className="text-5xl text-gold">USD {excursion.price}</strong>
              <span className="text-lg text-gray-300">per person</span>
            </div>
            <Link href={excursion.enquiryHref} className="btn-gold mt-7 w-full gap-2 sm:w-auto">Enquire About This Package <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image src={excursion.image} alt={excursion.imageAlt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
          <section className="card p-6 sm:p-8" aria-labelledby="included-title">
            <h2 id="included-title" className="font-display text-3xl">What’s included</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {excursion.inclusions.map(item => (
                <li key={item} className="flex items-start gap-3 leading-7">
                  <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-gold" /><span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
          <aside className="card p-6 sm:p-8">
            <h2 className="font-display text-3xl">Plan your escape</h2>
            <p className="mt-4 leading-7 text-gray-300">Share your preferred date and number of guests. Our team will confirm availability and the island stop: Thinadhoo or Keyodhoo.</p>
            <Link href={excursion.enquiryHref} className="btn-gold mt-6 w-full">Send an Enquiry</Link>
          </aside>
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-gray-400">Marine activities depend on weather and sea conditions. Wildlife sightings cannot be guaranteed. Final details are confirmed before payment.</p>
        <Link href="/island-adventures#excursions" className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-gold">Explore more Vaavu excursions <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </section>
    </main>
  );
}
