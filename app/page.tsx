import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Clock,
  MapPin,
  Headphones,
  Hotel,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react";
import SaveTripButton from "@/components/save-trip-button";
import { propertyPhotoUrl } from "@/lib/property-model";
import RewardsChecker from "@/components/rewards-checker";
import HomeReferralRewards from "@/components/home-referral-rewards";
import HomeStoryPreview from "@/components/home-story-preview";
import SmartOffers from "@/components/smart-offers";
import PropertyCards from "@/components/room-first-booking-cards";
import { publishedProperties } from "@/lib/property-store";
import { VAAVU_BLUE_ESCAPE } from "@/lib/vaavu-blue-escape";
import { cookies } from "next/headers";
import { professionalLocale, translations } from "@/lib/professional-translations";

const escapes = [
  {
    title: "The 3-Night Escape",
    href: "/island-adventures?duration=3",
    image:
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=88",
    label: "A beautiful introduction",
    badge: "3 nights",
    text: "A thoughtfully paced island stay with meals and selected ocean experiences.",
  },
  {
    title: "The 5-Night Journey",
    href: "/island-adventures?duration=5",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=88",
    label: "Time to experience more",
    badge: "5 nights",
    text: "More unhurried days for snorkeling, sandbanks, dolphins and island life.",
  },
  {
    title: VAAVU_BLUE_ESCAPE.name,
    href: VAAVU_BLUE_ESCAPE.href,
    image: VAAVU_BLUE_ESCAPE.image,
    label: "Discover Vaavu",
    badge: `USD ${VAAVU_BLUE_ESCAPE.price} per person`,
    text: "Shark Bay snorkeling, dolphins, lunch, shipwreck snorkeling, turtles and island hopping to Thinadhoo or Keyodhoo.",
  },
];

type Review = {
  id: string;
  property_name: string;
  guest_name: string;
  country: string | null;
  rating: number;
  review_title: string | null;
  review_text: string;
  stay_date: string | null;
};

async function getReviews(): Promise<Review[]> {
  try {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return [];
    const response = await fetch(
      `${url}/rest/v1/reviews?select=id,property_name,guest_name,country,rating,review_title,review_text,stay_date&status=eq.approved&order=created_at.desc`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export default async function Home() {
  const locale = professionalLocale(cookies().get("tripelor_lang")?.value);
  const copy = translations[locale].home;
  const [reviews, managedProperties] = await Promise.all([getReviews(), publishedProperties()]);
  const experiences = managedProperties
    .filter(property => property.status === "published")
    .flatMap(property => (property.experiences || [])
      .filter(item => item.enabled && item.photos.length > 0)
      .map(item => ({ item, propertyName: property.name, island: property.island, slug: property.slug })));

  const localizedEscapes = [
    { ...escapes[0], title: copy.escape3Title, label: copy.escape3Label, badge: copy.escape3Badge, text: copy.escape3Body },
    { ...escapes[1], title: copy.escape5Title, label: copy.escape5Label, badge: copy.escape5Badge, text: copy.escape5Body },
    {
      ...escapes[2],
      label: copy.vaavuLabel,
      badge: `USD ${VAAVU_BLUE_ESCAPE.price} ${copy.perPerson}`,
      text: copy.vaavuBody,
    },
  ];

  const memberCopy = locale === "it"
    ? {
        cta: "Unisciti a Tripelor · Offerte Membri",
        eyebrow: "Vantaggi per i membri",
        benefits: ["Offerte private", "Salva i viaggi", "Tripelor Points", "Avvisi disponibilità", "Concierge locale"],
      }
    : locale === "ru"
      ? {
          cta: "Вступить в Tripelor · Закрытые предложения",
          eyebrow: "Преимущества участника",
          benefits: ["Закрытые предложения", "Сохранение поездок", "Tripelor Points", "Уведомления о наличии", "Местный консьерж"],
        }
      : {
          cta: "Join Tripelor · Unlock Member Deals",
          eyebrow: "Member benefits",
          benefits: ["Private deals", "Save trips", "Tripelor Points", "Availability alerts", "Local concierge"],
        };


  return (
    <>
      <HomeReferralRewards locale={locale} />
      <section className="luxury-hero">
        <img
          src="/properties/rivethi-beach-hotel/1719713475.jpeg"
          alt="A serene Maldives beachfront escape"
          className="luxury-hero-image"
          fetchPriority="high"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#021016]/90 via-[#021016]/60 to-[#021016]/25" />
        <div className="container relative z-10 grid min-h-[76svh] items-center gap-12 py-16 md:py-24 lg:grid-cols-[1fr_320px]">
          <div className="max-w-4xl">
            <p className="eyebrow text-[#ead7aa]">{copy.heroEyebrow}</p>
            <h1 className="font-display mt-6 max-w-4xl text-[2.8rem] leading-[1.05] text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]">
              {copy.heroTitle1}
              <span className="block italic text-[#ead7aa]">{copy.heroTitle2}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              {copy.heroBody}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#properties" className="btn-gold w-full sm:w-auto">
                {copy.exploreStays} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/speedboat" className="btn-outline w-full border-white/40 bg-black/20 text-white sm:w-auto">
                <Ship className="h-4 w-4" /> {copy.findTransfers}
              </Link>
              <Link
                href="/signup?next=%2Faccount"
                className="btn-outline w-full border-[#ead7aa]/70 bg-[#ead7aa]/10 text-[#f6e7bf] sm:w-auto"
              >
                <UserPlus className="h-4 w-4" /> {memberCopy.cta}
              </Link>
            </div>
            <Link href="/maldives-matchmaker" className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm text-[#ead7aa] underline">{copy.unsure} <ArrowRight className="h-4 w-4" /></Link>
            <div className="mt-6 max-w-3xl rounded-2xl border border-[#ead7aa]/20 bg-black/20 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#ead7aa]">{memberCopy.eyebrow}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {memberCopy.benefits.map((benefit) => (
                  <span key={benefit} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs text-white/75">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/65">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#d9bd7b]" /> {copy.transparentPricing}
              </span>
              <span className="flex items-center gap-2">
                <Hotel className="h-4 w-4 text-[#d9bd7b]" /> {copy.roomsMeals}
              </span>
              <span className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#d9bd7b]" /> {copy.localSupport}
              </span>
            </div>
          </div>

          <aside className="hidden border-l border-white/20 pl-8 text-white lg:block">
            <p className="text-xs uppercase tracking-[.3em] text-[#d9bd7b]">
              {copy.tripelorWay}
            </p>
            <div className="mt-7 space-y-7">
              {[
                ["01", copy.step1Title, copy.step1Body],
                ["02", copy.step2Title, copy.step2Body],
                ["03", copy.step3Title, copy.step3Body],
              ].map(([number, title, text]) => (
                <div key={number} className="grid grid-cols-[34px_1fr] gap-3">
                  <span className="font-display text-xl italic text-[#d9bd7b]">{number}</span>
                  <div>
                    <h2 className="font-medium">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-white/55">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <div className="absolute bottom-8 right-6 hidden rotate-90 text-[10px] uppercase tracking-[.42em] text-white/45 xl:block">
          {copy.artExploring}
        </div>
      </section>

      <HomeStoryPreview
        properties={managedProperties}
        locale={locale}
        copy={{ title: copy.islandStoryTitle, body: copy.islandStoryBody, cta: copy.islandStoryCta }}
      />
      <section className="border-b border-[#d9bd7b]/25 bg-[#0a222c] text-white">
        <div className="container grid items-center gap-7 py-12 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">New · Maldives Matchmaker</p>
            <h2 className="font-display mt-3 text-3xl md:text-5xl">Tell us your budget. We’ll find your Maldives match.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/60">A quick personalised quiz compares published Tripelor rooms, seasonal rates, meal plans, destinations and your travel style — then saves the lead for concierge follow-up.</p>
          </div>
          <Link href="/maldives-matchmaker" className="btn-gold">Find My Maldives Match <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section className="border-b border-[#d9bd7b]/25 bg-[#071922] text-white">
        <div className="container grid gap-7 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="eyebrow">Private access · Secret Deals</p>
            <h2 className="font-display mt-3 text-3xl md:text-5xl">Unlock private Maldives offers.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/60">Choose your travel month, budget and holiday style. Tripelor reveals matched private options and lets our team follow up with the confirmed final price.</p>
          </div>
          <Link href="/secret-deals" className="btn-gold">Unlock Secret Deals <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section className="border-b border-[#d9bd7b]/25 bg-[#0a222c] text-white">
        <div className="container grid gap-7 py-12 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="eyebrow">Flights by Tripelor</p>
            <h2 className="font-display mt-3 text-3xl md:text-5xl">Start your Maldives journey with the flight.</h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/60">Send your route, dates and passenger details. Tripelor checks an authorized fare source, then helps connect your flight with the stay, speedboat and experiences.</p>
          </div>
          <Link href="/flights" className="btn-gold">Request My Flight Fare <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>


      <section className="border-b border-gold/20 bg-[#071922]">
        <div className="container grid items-center gap-6 py-12 md:grid-cols-[1fr_auto]">
          <div><p className="eyebrow">{copy.coupleEyebrow}</p><h2 className="font-display mt-4 text-3xl md:text-4xl">{copy.coupleTitle}</h2><p className="mt-3 max-w-2xl leading-7 text-white/65">{copy.coupleBody}</p></div>
          <Link href="/couple-match" className="btn-gold">{copy.coupleCta} <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="border-b border-gold/20 bg-[#0b2731]">
        <div className="container grid items-center gap-6 py-12 md:grid-cols-[1fr_auto]">
          <div><p className="eyebrow">{copy.wishlistEyebrow}</p><h2 className="font-display mt-4 text-3xl md:text-4xl">{copy.wishlistTitle}</h2><p className="mt-3 max-w-2xl leading-7 text-white/65">{copy.wishlistBody}</p></div>
          <Link href="/wishlist" className="btn-gold">{copy.wishlistCta} <ArrowRight className="h-4 w-4"/></Link>
        </div>
      </section>

      <PropertyCards managedProperties={managedProperties} featured locale={locale} />

      {experiences.length > 0 && (
        <section id="discover-experiences" aria-labelledby="discover-experiences-title" className="scroll-mt-24 border-b border-white/10 bg-[#06151c] text-white">
          <div className="container py-16 md:py-20">
            <p className="eyebrow">{copy.expEyebrow}</p>
            <h2 id="discover-experiences-title" className="section-title mt-4">{copy.expTitle}</h2>
            <p className="mt-5 max-w-2xl leading-7 text-white/65">{copy.expBody}</p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {experiences.map(({ item, propertyName, island, slug }) => {
                const href = `/stays/${slug}#experience-${item.id}`;
                const imageUrl = propertyPhotoUrl(item.photos[0]);
                const priceLabel = item.price > 0 ? `${copy.fromUsd} ${item.price} ${item.priceUnit}` : copy.priceOnRequest;
                return (
                  <article key={`${slug}-${item.id}`} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[.025]">
                    <Link href={href} aria-label={`Explore ${item.name} at ${propertyName}`} className="group block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
                      <img src={imageUrl} alt={item.name} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-700 motion-safe:group-hover:scale-105 motion-reduce:transition-none" />
                    </Link>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="flex items-start gap-2 text-sm text-[#ead7aa]"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{island}</p>
                      <h3 className="font-display mt-3 break-words text-3xl">{item.name}</h3>
                      <p className="mt-2 text-xs text-white/55">{copy.through} {propertyName}</p>
                      <p className="mt-4 flex items-center gap-2 text-sm text-white/75"><Clock aria-hidden="true" className="h-4 w-4 shrink-0" />{item.duration}</p>
                      <p className="mb-6 mt-3 line-clamp-3 text-sm leading-6 text-white/65">{item.description}</p>
                      <div className="mt-auto border-t border-white/10 pt-5">
                        <p className="text-lg text-[#ead7aa]">{priceLabel}</p>
                        <Link href={href} className="mt-3 inline-flex min-h-[48px] items-center gap-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">{copy.exploreExperience} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                        <div className="mt-3">
                          <SaveTripButton itemType="package" itemKey={`experience-${slug}-${item.id}`} title={item.name} subtitle={`${propertyName} · ${item.duration} · ${priceLabel}`} imageUrl={imageUrl} href={href} label={copy.addToTrip} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-6 text-sm leading-6 text-white/55">{copy.saveNote}</p>
          </div>
        </section>
      )}

      <section className="section-shell overflow-hidden">
        <div className="container grid gap-12 py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">{copy.quietLuxury}</p>
            <h2 className="section-title mt-5">{copy.effortlessTitle}</h2>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-12">
            <p className="max-w-2xl text-lg leading-8 text-white/65">
              {copy.effortlessBody}
            </p>
            <Link href="/about" className="luxury-link mt-7">
              {copy.discoverTripelor} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-[#8d7037]">{copy.curated}</p>
            <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
              {copy.chooseEscape}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#40505a]">
              {copy.chooseEscapeBody}
            </p>
            <Link href="/island-adventures#excursions" className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#715721] underline">{copy.viewExcursions} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {localizedEscapes.map((escape) => (
              <Link key={escape.title} href={escape.href} className="escape-card group flex items-end">
                <img src={escape.image} alt={escape.title} />
                <div className="escape-card-shade" />
                <div className="relative z-10 w-full p-7 text-white lg:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="border border-white/35 bg-black/20 px-3 py-2 text-sm backdrop-blur-md">
                      {escape.badge}
                    </span>
                    <ArrowUpRight className="h-6 w-6 shrink-0 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                  <p className="mt-20 text-xs uppercase tracking-[.24em] text-[#ead7aa]">
                    {escape.label}
                  </p>
                  <h3 className="font-display mt-3 text-4xl">{escape.title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-white/75">{escape.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SmartOffers locale={locale} />
      <RewardsChecker locale={locale} />

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-24">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="eyebrow text-[#8d7037]">{copy.seamlessEyebrow}</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
                {copy.seamlessTitle}
              </h2>
              <p className="mt-5 max-w-md leading-7 text-[#53616a]">
                {copy.seamlessBody}
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-[#cfc4af] bg-[#cfc4af] md:grid-cols-3">
              {[
                [Hotel, copy.selectedStays, copy.selectedStaysBody],
                [Compass, copy.islandExperiences, copy.islandExperiencesBody],
                [Ship, copy.speedboatTransfers, copy.speedboatTransfersBody],
              ].map(([Icon, title, text]) => {
                const FeatureIcon = Icon as typeof Hotel;
                return (
                  <div key={title as string} className="bg-[#f7f3eb] p-7 md:p-8">
                    <FeatureIcon className="h-7 w-7 text-[#9c7d3d]" />
                    <h3 className="font-display mt-10 text-2xl">{title as string}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#53616a]">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container py-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">{copy.guestExperiences}</p>
              <h2 className="section-title mt-4">{copy.wordsJourney}</h2>
            </div>
            <Link href="/reviews" className="luxury-link">
              {copy.shareExperience} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-10 border border-white/10 bg-white/[.025] p-10 text-center text-white/45">
              {copy.guestStoriesSoon}
            </div>
          ) : (
            <div className="mobile-scroll mt-10 flex gap-5 pb-4">
              {reviews.map((review) => (
                <article key={review.id} className="min-w-[300px] border border-white/10 bg-white/[.025] p-7 md:min-w-[390px] md:p-9">
                  <Star className="h-5 w-5 fill-[#c9a86a] text-[#c9a86a]" />
                  <p className="font-display mt-7 text-2xl leading-9 text-white/90">“{review.review_text}”</p>
                  <div className="mt-8 border-t border-white/10 pt-5">
                    <p className="font-medium text-white">{review.guest_name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[.15em] text-white/40">
                      {[review.country, review.property_name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-[#c9a86a]/25 bg-[#0b2731]">
        <div className="container py-24 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-[#d9bd7b]" />
          <p className="eyebrow mt-6">{copy.storyStarts}</p>
          <h2 className="font-display mx-auto mt-4 max-w-4xl text-4xl leading-tight text-white md:text-6xl">
            {copy.finalTitle}
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">
              {copy.buildTrip} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="btn-outline">{copy.speakTripelor}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
