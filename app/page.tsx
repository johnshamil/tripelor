import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Compass, Ship, Star, Waves } from "lucide-react";
import { cookies } from "next/headers";
import HomeSearch from "@/components/home-search";
import HomeReferralRewards from "@/components/home-referral-rewards";
import HomeStoryPreview from "@/components/home-story-preview";
import PropertyCards from "@/components/room-first-booking-cards";
import TripelorMark from "@/components/tripelor-mark";
import SaveTripButton from "@/components/save-trip-button";
import { publishedProperties } from "@/lib/property-store";
import { properties as defaultProperties } from "@/lib/properties";
import { propertyPhotoUrl } from "@/lib/property-model";
import { professionalLocale, translations } from "@/lib/professional-translations";
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
    <section className="container coastal-hero" aria-labelledby="coastal-hero-title">
      <div className="coastal-hero-copy">
        <p className="coastal-eyebrow"><TripelorMark className="coastal-small-star" />{copy.small}</p>
        <h1 id="coastal-hero-title"><span>{copy.less}</span><span>{copy.ordinary}</span><span>{copy.more}</span><span>{copy.maldives}</span></h1>
        <div className="coastal-hero-bottom"><p>{copy.intro}</p><a href="#properties" aria-label={copy.scroll}><ArrowDown /></a></div>
      </div>
      <div className="coastal-hero-photo" data-photo-surface>
        <img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=88" alt="Turquoise Maldives lagoon and overwater villas, an island inspiration" loading="eager" fetchPriority="high" width={1200} height={1500} />
        <p className="coastal-photo-location">{copy.ocean}</p>
        <div className="coastal-photo-caption"><p>{copy.somewhere}</p><TripelorMark className="coastal-photo-star" /><span>{copy.inspiration}</span></div>
      </div>
    </section>
    <div className="container"><HomeSearch islands={islands.length ? islands : ["Felidhoo", "Hulhumalé"]} locale={locale} today={maldivesToday()} />
      <div className="coastal-promises">{copy.promises.map((promise, index) => { const Icon = icons[index]; return <p key={promise}><Icon aria-hidden="true" />{promise}</p>; })}</div>
    </div>

    <PropertyCards managedProperties={managedProperties} featured locale={locale} />

    <section className="container coastal-ocean-section" aria-labelledby="ocean-title">
      <div className="coastal-section-heading"><div><p className="coastal-eyebrow">{copy.oceanEyebrow}</p><h2 id="ocean-title">{copy.oceanTitle}</h2></div><Link href="/excursions" className="coastal-text-link">{copy.allExperiences}<ArrowUpRight /></Link></div>
      <div className="coastal-experience-grid">
        {experiences.length ? experiences.map(({ item, propertyName, island, slug }) => <article key={`${slug}-${item.id}`} className="coastal-experience-card"><Link href={`/stays/${slug}#experiences`}><img src={propertyPhotoUrl(item.photos[0])} alt={item.name} loading="lazy" /><div><p>{island}</p><h3>{item.name}</h3><p>{original.through} {propertyName}</p><span className="coastal-text-link">{original.exploreExperience}<ArrowUpRight /></span></div></Link><SaveTripButton itemType="bundle" itemKey={`experience:${slug}:${item.id}`} title={item.name} subtitle={`${propertyName} · ${island}`} imageUrl={propertyPhotoUrl(item.photos[0])} href={`/stays/${slug}#experiences`} label={original.addToTrip} /></article>) : <>
          <Link href={VAAVU_BLUE_ESCAPE.href} className="coastal-experience-card"><img src={VAAVU_BLUE_ESCAPE.image} alt="Snorkeling and ocean adventures in Vaavu Atoll" loading="lazy" /><div><p>Vaavu Atoll</p><h3>{VAAVU_BLUE_ESCAPE.name}</h3><p>{original.vaavuBody}</p><span className="coastal-text-link">{copy.exploreExperiences}<ArrowUpRight /></span></div></Link>
          <Link href="/excursions/ukulhas" className="coastal-experience-card coastal-experience-typographic"><Waves /><div><p>Ukulhas · North Ari Atoll</p><h3>{copy.experienceTitle}</h3><p>{copy.experienceBody}</p><span className="coastal-text-link">{copy.exploreExperiences}<ArrowUpRight /></span></div></Link>
          <Link href="/speedboat" className="coastal-experience-card coastal-experience-typographic is-blue"><Ship /><div><p>{copy.transfers}</p><h3>{copy.transferTitle}</h3><p>{copy.transferBody}</p><span className="coastal-text-link">{copy.findTransfers}<ArrowUpRight /></span></div></Link>
        </>}
      </div>
    </section>

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
