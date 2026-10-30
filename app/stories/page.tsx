import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { publicStories } from "@/lib/trip-story-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tripelor Stories | Real Maldives Journeys",
  description: "Discover real Maldives travel stories shared by Tripelor guests — island stays, ocean experiences, favourite moments and travel inspiration.",
  alternates: { canonical: "https://tripelor.com/stories" },
};

function monthYear(value: string) {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(value + "T12:00:00Z"));
}

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((Date.parse(checkOut + "T00:00:00Z") - Date.parse(checkIn + "T00:00:00Z")) / 86400000));
}

export default async function TripelorStoriesPage() {
  const stories = await publicStories(24);

  return (
    <main className="bg-[#f7f4ea] text-[#071922]">
      <section className="bg-[#071b24] text-white">
        <div className="container py-16 md:py-24">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#e3ca91]">
            <Sparkles className="h-4 w-4" /> Tripelor Stories
          </p>
          <h1 className="font-display mt-5 max-w-4xl text-5xl leading-tight md:text-7xl">Real Maldives journeys, told by the people who lived them.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
            Guest photos, favourite moments, island stays and ocean memories — shared by Tripelor travellers to inspire your own Maldives story.
          </p>
          <Link href="/build-your-trip" className="btn-gold mt-8">Start My Maldives Story <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        {stories.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {stories.map((bundle: any) => {
              const { story, reservation, cover } = bundle;
              return (
                <article key={story.id} className="overflow-hidden rounded-3xl border border-[#d8d2c5] bg-white shadow-sm">
                  <Link href={"/story/" + story.share_token} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#0b2731]">
                      {cover ? (
                        <img src={cover} alt={story.title || "Tripelor Maldives Story"} className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Sparkles className="h-10 w-10 text-[#d9bd7b]" /></div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">{story.public_name || "Tripelor Traveller"}</p>
                      <h2 className="font-display mt-2 text-3xl leading-tight">{story.title || "My Maldives Story"}</h2>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#687377]">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{reservation.property_name}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{nights(reservation.check_in, reservation.check_out)} nights · {monthYear(reservation.check_in)}</span>
                      </div>
                      {story.favorite_moment && <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#58656c]">“{story.favorite_moment}”</p>}
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3049df]">Read the story <ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-[#d8d2c5] bg-white p-10 text-center md:p-16">
            <Sparkles className="mx-auto h-9 w-9 text-[#8d7037]" />
            <h2 className="font-display mt-5 text-4xl">The first Tripelor Stories are coming soon.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#687377]">After a Tripelor stay, guests can create a private Maldives Story and choose whether to publish it here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
