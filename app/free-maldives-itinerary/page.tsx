import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, LockKeyhole, Palmtree, Ship, Waves } from "lucide-react";
import { currentUser } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Free Maldives Itinerary",
  description: "Create a free day-by-day Maldives itinerary with Tripelor and personalize it with local stays, transfers and ocean experiences.",
};

const stylePlans: Record<string, string[]> = {
  ocean: [
    "Easy island arrival and sunset walk",
    "Guided snorkeling and house-reef time",
    "Dolphin cruise and sandbank experience",
    "Shark or turtle ocean day",
    "Free reef, beach and island time",
  ],
  relax: [
    "Easy island arrival and beach time",
    "Slow morning and house-reef swim",
    "Sandbank or quiet lagoon afternoon",
    "Free island day and sunset",
    "Flexible ocean or spa-style rest day",
  ],
  adventure: [
    "Arrival and island orientation",
    "Snorkeling and reef exploration",
    "Full-day ocean adventure",
    "Island hopping",
    "Night fishing or sunset activity",
  ],
  romance: [
    "Arrival and sunset walk",
    "Private beach and snorkeling time",
    "Sandbank or dolphin cruise",
    "Slow island day for two",
    "Sunset dinner or evening experience",
  ],
  family: [
    "Easy arrival and early rest",
    "Family beach and shallow-water day",
    "Dolphin or sandbank outing",
    "Flexible island exploration",
    "Easy snorkeling or free day",
  ],
};

export default async function FreeMaldivesItineraryPage({
  searchParams,
}: {
  searchParams: Promise<{ nights?: string; style?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;
  const nights = Math.min(14, Math.max(3, Number(params.nights || 5) || 5));
  const style = stylePlans[params.style || "ocean"] ? params.style || "ocean" : "ocean";
  const base = stylePlans[style];
  const plan = Array.from({ length: nights }, (_, index) => base[index % base.length]);

  if (!user) {
    return (
      <main className="bg-[#071b24] text-white">
        <div className="container flex min-h-[70vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-3xl border border-[#d9bd7b]/30 bg-white/[.04] p-8 text-center">
            <LockKeyhole className="mx-auto h-8 w-8 text-[#d9bd7b]" />
            <p className="eyebrow mt-5">Free Tripelor member tool</p>
            <h1 className="font-display mt-3 text-5xl">Your free Maldives itinerary</h1>
            <p className="mt-5 leading-7 text-white/60">
              Create a free Tripelor account to unlock a day-by-day Maldives plan and keep planning with local support.
            </p>
            <Link href="/signup?next=%2Ffree-maldives-itinerary" className="btn-gold mt-7 w-full justify-center">
              Unlock my free itinerary
            </Link>
            <Link href="/login?next=%2Ffree-maldives-itinerary" className="mt-4 inline-block text-sm underline">
              Already a member? Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f1ebdf] text-[#071922]">
      <div className="container max-w-5xl py-12 md:py-16">
        <p className="eyebrow text-[#8d7037]">Tripelor member itinerary</p>
        <h1 className="font-display mt-3 text-5xl md:text-6xl">Build your Maldives days.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#59666c]">
          Choose your trip length and travel style. This is a planning guide; Tripelor confirms activities, transfers,
          weather suitability, availability and final prices before booking.
        </p>

        <form className="mt-8 grid gap-5 rounded-2xl border border-[#d0c5b0] bg-[#fffdf8] p-6 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Nights
            <select name="nights" defaultValue={String(nights)} className="mt-2 min-h-12 w-full rounded-xl border border-[#c9b88f] bg-white px-3">
              {[3, 4, 5, 6, 7, 8, 10, 12, 14].map((value) => (
                <option key={value} value={value}>{value} nights</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Travel style
            <select name="style" defaultValue={style} className="mt-2 min-h-12 w-full rounded-xl border border-[#c9b88f] bg-white px-3">
              <option value="ocean">Ocean & snorkeling</option>
              <option value="relax">Relaxed island escape</option>
              <option value="adventure">Adventure</option>
              <option value="romance">Romantic</option>
              <option value="family">Family</option>
            </select>
          </label>
          <button className="btn-gold min-h-12 justify-center sm:col-span-2">Update my itinerary</button>
        </form>

        <div className="mt-8 grid gap-3">
          {plan.map((item, index) => (
            <article key={index} className="flex gap-4 rounded-2xl border border-[#d0c5b0] bg-[#fffdf8] p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a2630] text-[#ead7aa]">
                {index === 0 ? <Ship className="h-5 w-5" /> : index % 2 ? <Waves className="h-5 w-5" /> : <Palmtree className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8d7037]">Day {index + 1}</p>
                <h2 className="font-display mt-1 text-2xl">{item}</h2>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-[#071b24] p-6 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[.18em] text-[#d9bd7b]">Make this plan real</p>
            <p className="mt-2 text-sm text-white/60">Send your dates and preferences to Tripelor for a personalized quote.</p>
          </div>
          <Link href="/build-your-trip?source=free-itinerary" className="btn-gold mt-5 justify-center md:mt-0">
            <CalendarDays className="h-4 w-4" />
            Customize with Tripelor
          </Link>
        </div>
      </div>
    </main>
  );
}
