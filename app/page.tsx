import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  Headphones,
  Hotel,
  MapPin,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
} from "lucide-react";
import RewardsChecker from "@/components/rewards-checker";
import HomeLiveAvailability from "@/components/home-live-availability";
import SmartOffers from "@/components/smart-offers";
import { properties } from "@/lib/properties";

const escapes = [
  {
    title: "The 3-Night Escape",
    href: "/island-adventures?duration=3",
    image:
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1600&q=88",
    label: "A beautiful introduction",
    text: "A thoughtfully paced island stay with meals and selected ocean experiences.",
  },
  {
    title: "The 5-Night Journey",
    href: "/island-adventures?duration=5",
    image:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=88",
    label: "Time to experience more",
    text: "More unhurried days for snorkeling, sandbanks, dolphins and island life.",
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
  const reviews = await getReviews();

  return (
    <>
      <section className="luxury-hero">
        <img
          src="/properties/rivethi-beach-hotel/1719713475.jpeg"
          alt="A serene Maldives beachfront escape"
          className="luxury-hero-image"
        />
        <div className="luxury-hero-shade" />
        <div className="container relative z-10 grid min-h-[88vh] items-center gap-12 py-24 lg:grid-cols-[1fr_320px]">
          <div className="max-w-4xl">
            <p className="eyebrow text-[#ead7aa]">Maldives, planned with care</p>
            <h1 className="font-display mt-6 max-w-4xl text-5xl leading-[.98] text-white sm:text-6xl md:text-7xl lg:text-[6.3rem]">
              Your Maldives,
              <span className="block italic text-[#d9bd7b]">considered beautifully.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              Curated island stays, private-feeling experiences and seamless
              speedboat transfers—all thoughtfully brought together by a local
              team.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/build-your-trip" className="btn-gold">
                Design My Journey <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/stays" className="btn-outline border-white/40 text-white">
                Explore Stays
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/65">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#d9bd7b]" /> Transparent pricing
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[#d9bd7b]" /> Live availability
              </span>
              <span className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#d9bd7b]" /> Local support
              </span>
            </div>
          </div>

          <aside className="hidden border-l border-white/20 pl-8 text-white lg:block">
            <p className="text-xs uppercase tracking-[.3em] text-[#d9bd7b]">
              The Tripelor way
            </p>
            <div className="mt-7 space-y-7">
              {[
                ["01", "Choose a stay", "Compare selected Maldives properties."],
                ["02", "Add experiences", "Shape each day around your pace."],
                ["03", "Arrange arrival", "Bring rooms and transfers together."],
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
          The art of exploring
        </div>
      </section>

      <HomeLiveAvailability />

      <section className="section-shell overflow-hidden">
        <div className="container grid gap-12 py-24 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">A quieter kind of luxury</p>
            <h2 className="section-title mt-5">Travel that feels effortless.</h2>
          </div>
          <div className="lg:border-l lg:border-white/10 lg:pl-12">
            <p className="max-w-2xl text-lg leading-8 text-white/65">
              From your first search to your island arrival, Tripelor keeps the
              details clear and the journey personal. Choose your dates, compare
              stays and bring the whole experience together in one place.
            </p>
            <Link href="/about" className="luxury-link mt-7">
              Discover Tripelor <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-[#8d7037]">Curated escapes</p>
            <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
              Choose the rhythm of your island stay.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#40505a]">
              Two beautifully simple ways to begin, each ready to personalise
              around the moments that matter to you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {escapes.map((escape, index) => (
              <Link key={escape.title} href={escape.href} className="escape-card group">
                <img src={escape.image} alt={escape.title} />
                <div className="escape-card-shade" />
                <div className="absolute inset-x-0 bottom-0 z-10 p-7 text-white md:p-10">
                  <div className="flex items-center justify-between gap-4">
                    <span className="border border-white/35 bg-black/20 px-3 py-2 text-[10px] uppercase tracking-[.24em] backdrop-blur-md">
                      {index === 0 ? "3 nights" : "5 nights"}
                    </span>
                    <ArrowUpRight className="h-6 w-6 transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                  <p className="mt-20 text-xs uppercase tracking-[.24em] text-[#ead7aa]">
                    {escape.label}
                  </p>
                  <h3 className="font-display mt-3 text-4xl md:text-5xl">{escape.title}</h3>
                  <p className="mt-3 max-w-lg leading-7 text-white/75">{escape.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container py-24">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow">Selected stays</p>
              <h2 className="section-title mt-4">A beautiful place to begin.</h2>
            </div>
            <Link href="/stays" className="btn-outline w-fit">
              View All Properties
            </Link>
          </div>

          <div>
            {properties.map((property, index) => (
              <Link href={`/stays/${property.slug}`} key={property.slug} className="property-row group">
                <span className="font-display text-xl italic text-[#c9a86a]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[.2em] text-white/45">
                    <MapPin className="h-3.5 w-3.5 text-[#c9a86a]" /> {property.location}
                  </p>
                  <h3 className="font-display mt-2 text-3xl text-white md:text-4xl">{property.name}</h3>
                  <p className="mt-3 max-w-2xl leading-7 text-white/55">{property.description}</p>
                </div>
                <div className="md:text-right">
                  <p className="text-xs uppercase tracking-[.18em] text-white/40">From</p>
                  <p className="font-display mt-1 text-3xl text-[#d9bd7b]">${property.startingFrom}</p>
                  <p className="text-xs text-white/40">per night</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/35 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#d9bd7b]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SmartOffers />
      <RewardsChecker />

      <section className="bg-[#f1ebdf] text-[#071922]">
        <div className="container py-24">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="eyebrow text-[#8d7037]">One seamless journey</p>
              <h2 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
                Everything your Maldives needs.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-[#53616a]">
                A simple way to plan your stay, your island experiences and the
                transfer that brings it all together.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-[#cfc4af] bg-[#cfc4af] md:grid-cols-3">
              {[
                [Hotel, "Selected stays", "Compare rooms, meal plans and live availability."],
                [Compass, "Island experiences", "Choose ocean adventures and slower island moments."],
                [Ship, "Speedboat transfers", "Arrange your arrival and departure in one journey."],
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
              <p className="eyebrow">Guest experiences</p>
              <h2 className="section-title mt-4">Words from the journey.</h2>
            </div>
            <Link href="/reviews" className="luxury-link">
              Share Your Experience <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-10 border border-white/10 bg-white/[.025] p-10 text-center text-white/45">
              Guest stories will appear here soon.
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
          <p className="eyebrow mt-6">Your island story starts here</p>
          <h2 className="font-display mx-auto mt-4 max-w-4xl text-4xl leading-tight text-white md:text-6xl">
            Stay beautifully. Explore deeply. Remember everything.
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">
              Build Your Trip <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="btn-outline">Speak With Tripelor</Link>
          </div>
        </div>
      </section>
    </>
  );
}
