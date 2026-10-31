import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Check, Compass, Headphones, ShieldCheck, Ship, Star, Waves } from "lucide-react";
import { cookies } from "next/headers";
import HomeSearch from "@/components/home-search";
import HomeReferralRewards from "@/components/home-referral-rewards";
import MaldivesPass from "@/components/maldives-pass";
import HomeStoryPreview from "@/components/home-story-preview";
import PropertyCards from "@/components/room-first-booking-cards";
import TripelorMark from "@/components/tripelor-mark";
import SaveTripButton from "@/components/save-trip-button";
import { publishedProperties } from "@/lib/property-store";
import { properties as defaultProperties } from "@/lib/properties";
import { propertyPhotoUrl } from "@/lib/property-model";
import { professionalLocale, translations } from "@/lib/professional-translations";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://tripelor.com",
    languages: {
      "x-default": "https://tripelor.com",
      en: "https://tripelor.com",
      it: "https://tripelor.com/it",
      de: "https://tripelor.com/de",
      ru: "https://tripelor.com/ru",
      "zh-CN": "https://tripelor.com/zh",
      fr: "https://tripelor.com/fr",
      es: "https://tripelor.com/es",
    },
  },
};
import { coastalCopy } from "@/lib/coastal-copy";
import { maldivesToday } from "@/lib/manual-booking";
import { VAAVU_BLUE_ESCAPE } from "@/lib/vaavu-blue-escape";

type Review = { id: string; property_name: string; guest_name: string; country: string | null; rating: number; review_text: string };
async function getReviews(): Promise<Review[]> {
  try {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, ""), key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return [];
    const response = await fetch(`${url}/rest/v1/reviews?select=id,property_name,guest_name,country,rating,review_text&status=eq.approved&order=created_at.desc&limit=3`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
    return response.ok ? await response.json() : [];
  } catch { return []; }
}

export default async function Home() {
  const locale = professionalLocale(cookies().get("tripelor_lang")?.value);
  const copy = coastalCopy[locale], original = translations[locale].home;
  const [reviews, managedProperties] = await Promise.all([getReviews(), publishedProperties()]);
  const managedSlugs = new Set(managedProperties.map(property => property.slug));
  const islands = Array.from(new Set([
    ...managedProperties.map(property => property.island),
    ...defaultProperties.filter(property => !managedSlugs.has(property.slug)).map(property => property.location),
  ].filter(location => location && location !== "Maldives"))).sort((a, b) => a.localeCompare(b));
  const experiences = managedProperties.flatMap(property => (property.experiences || []).filter(item => item.enabled && item.photos.length).map(item => ({ item, propertyName: property.name, island: property.island, slug: property.slug }))).slice(0, 3);
  const icons = [Compass, Waves, Ship, Check];
  return <div className="coastal-home" data-locale={locale}>
    <section className="coastal-premium-hero" aria-labelledby="coastal-hero-title">
      <img
        src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2200&q=90"
        alt="Turquoise Maldives lagoon with tropical island and overwater villas"
        className="coastal-premium-hero-image"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        width={2200}
        height={1400}
      />
      <div className="coastal-premium-hero-shade" />
      <div className="container coastal-premium-hero-content">
        <p className="coastal-premium-kicker">Small islands. Big feelings.</p>
        <h1 id="coastal-hero-title">
          <span>Your Maldives.</span>
          <strong>Your Way.</strong>
        </h1>
        <p className="coastal-premium-intro">Handpicked stays, island experiences &amp; transfers — all in one place.</p>
        <div className="coastal-premium-actions">
          <Link href="/stays" className="coastal-premium-primary">Explore Stays <ArrowRight /></Link>
          <Link href="/build-your-trip" className="coastal-premium-secondary">Build My Trip <ArrowRight /></Link>
        </div>
        <div className="coastal-premium-trust">
          <p><ShieldCheck />Registered Maldives Travel Agency</p>
          <p><Headphones />Local Support in Maldives</p>
          <p><Star />Trusted by Travellers Worldwide</p>
        </div>
      </div>
    </section>
    <div className="container coastal-premium-search-wrap">
      <HomeSearch islands={islands.length ? islands : ["Felidhoo", "Hulhumalé"]} locale={locale} today={maldivesToday()} />
      <div className="coastal-premium-feature-row">
        <p><Compass /> <span><strong>Member Deals</strong><small>Better rates</small></span></p>
        <p><TripelorMark /> <span><strong>Handpicked Stays</strong><small>Local islands</small></span></p>
        <p><Waves /> <span><strong>Amazing Experiences</strong><small>Ocean adventures</small></span></p>
        <p><Ship /> <span><strong>Seamless Transfers</strong><small>Island to island</small></span></p>
      </div>
    </div>
    <section className="container coastal-home-pass">
      <MaldivesPass compact />
    </section>

    <PropertyCards managedProperties={managedProperties} featured locale={locale} />

    <section className="container coastal-ocean-section" aria-labelledby="ocean-title">
      <div className="coastal-section-heading"><div><p className="coastal-eyebrow">{copy.oceanEyebrow}</p><h2 id="ocean-title">{copy.oceanTitle}</h2></div><Link href="/excursions" className="coastal-text-link">{copy.allExperiences}<ArrowUpRight /></Link></div>
      <div className="coastal-experience-grid">
        {experiences.length ? experiences.map(({ item, propertyName, island, slug }) => <article key={`${slug}-${item.id}`} className="coastal-experience-card"><Link href={`/stays/${slug}#experiences`}><img src={propertyPhotoUrl(item.photos[0])} alt={item.name} width={900} height={600} loading="lazy" decoding="async" /><div><p>{island}</p><h3>{item.name}</h3><p>{original.through} {propertyName}</p><span className="coastal-text-link">{original.exploreExperience}<ArrowUpRight /></span></div></Link><SaveTripButton itemType="bundle" itemKey={`experience:${slug}:${item.id}`} title={item.name} subtitle={`${propertyName} · ${island}`} imageUrl={propertyPhotoUrl(item.photos[0])} href={`/stays/${slug}#experiences`} label={original.addToTrip} /></article>) : <>
          <Link href={VAAVU_BLUE_ESCAPE.href} className="coastal-experience-card"><img src={VAAVU_BLUE_ESCAPE.image} alt="Snorkeling and ocean adventures in Vaavu Atoll" width={900} height={600} loading="lazy" decoding="async" /><div><p>Vaavu Atoll</p><h3>{VAAVU_BLUE_ESCAPE.name}</h3><p>{original.vaavuBody}</p><span className="coastal-text-link">{copy.exploreExperiences}<ArrowUpRight /></span></div></Link>
          <Link href="/excursions/ukulhas" className="coastal-experience-card coastal-experience-typographic"><Waves /><div><p>Ukulhas · North Ari Atoll</p><h3>{copy.experienceTitle}</h3><p>{copy.experienceBody}</p><span className="coastal-text-link">{copy.exploreExperiences}<ArrowUpRight /></span></div></Link>
          <Link href="/speedboat" className="coastal-experience-card coastal-experience-typographic is-blue"><Ship /><div><p>{copy.transfers}</p><h3>{copy.transferTitle}</h3><p>{copy.transferBody}</p><span className="coastal-text-link">{copy.findTransfers}<ArrowUpRight /></span></div></Link>
        </>}
      </div>
    </section>

    <section className="container py-10 md:py-14">
      <Link href="/tours/noah-safari-maldives" className="group grid overflow-hidden rounded-3xl border border-white/10 bg-[#071922] md:grid-cols-[1.1fr_.9fr]">
        <div className="p-7 md:p-10">
          <p className="coastal-eyebrow">New safari experience</p>
          <h2 className="font-display mt-3 text-4xl text-white md:text-5xl">NOAH Maldives Safari Boat</h2>
          <p className="mt-4 max-w-2xl leading-7 text-white/55">Shared safari departures and private charters for 3–14 nights, with six en-suite cabins and curated Maldives routes.</p>
          <span className="coastal-text-link mt-6">Explore NOAH Safari <ArrowUpRight /></span>
        </div>
        <img src="https://noahmaldives.com/wp-content/uploads/2026/07/NOAH-safari-boat-for-rent-MALDIVES-41-1080.jpg" alt="NOAH Maldives safari boat" className="h-72 w-full object-cover md:h-full" loading="lazy" decoding="async" />
      </Link>
    </section>

    <section className="container py-8"><Link href="/stays/nala-veli-maldives" className="group block rounded-3xl border border-[#b9a276]/40 bg-[#092d37] p-8 text-white md:p-10"><p className="text-sm uppercase tracking-[.2em] text-[#d9bd7b]">New Ukulhas stays</p><h2 className="font-display mt-3 text-3xl md:text-4xl">Nala Veli Villa & Nala Veli Beach & Spa</h2><p className="mt-3 max-w-2xl text-white/70">Explore room choices, breakfast-inclusive prices and island transfers. Booking requests are confirmed by our team.</p><span className="mt-5 inline-flex items-center gap-2 text-[#d9bd7b]">Explore Nala Veli <ArrowUpRight className="h-4 w-4"/></span></Link></section>
    <HomeStoryPreview properties={managedProperties} locale={locale} copy={{ title: original.islandStoryTitle, body: original.islandStoryBody, cta: original.islandStoryCta }} />

    <section className="container coastal-personal-grid">
      <article className="coastal-personal-card"><TripelorMark className="coastal-card-star" /><p className="coastal-eyebrow">{copy.helpEyebrow}</p><h2>{copy.helpTitle}</h2><p>{copy.helpBody}</p><Link href="/maldives-matchmaker" className="coastal-text-link">{copy.helpCta}<ArrowRight /></Link></article>
      <article className="coastal-personal-card is-blue"><Compass className="coastal-card-star" /><p className="coastal-eyebrow">{copy.lessPlanning}</p><h2>{copy.secretTitle}</h2><p>{copy.secretBody}</p><Link href="/secret-deals" className="coastal-text-link">{copy.secretCta}<ArrowRight /></Link></article>
    </section>

    <HomeReferralRewards locale={locale} />
    <section className="container coastal-members"><div><p className="coastal-eyebrow">{copy.joinEyebrow}</p><h2>{copy.joinTitle}</h2><p>{copy.joinBody}</p></div><Link href="/signup?next=%2Faccount" className="coastal-button">{copy.joinCta}<ArrowUpRight /></Link></section>

    {reviews.length > 0 && <section className="container coastal-reviews"><div className="coastal-section-heading"><div><p className="coastal-eyebrow">{copy.reviewsEyebrow}</p><h2>{copy.reviewsTitle}</h2></div><Link href="/reviews" className="coastal-text-link">{copy.allReviews}<ArrowUpRight /></Link></div><div className="coastal-review-grid">{reviews.map(review => <article key={review.id}><div aria-label={`${review.rating} out of 5 stars`} className="coastal-rating">{Array.from({ length: Math.min(5, Math.max(1, Math.round(review.rating))) }, (_, index) => <Star key={index} aria-hidden="true" />)}</div><blockquote>“{review.review_text}”</blockquote><p>{review.guest_name}<span>{[review.country, review.property_name].filter(Boolean).join(" · ")}</span></p></article>)}</div></section>}
  </div>;
}
