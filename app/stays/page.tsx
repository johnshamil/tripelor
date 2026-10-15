import PropertyCards from "@/components/room-first-booking-cards";
import { publishedProperties } from "@/lib/property-store";
import { cookies } from "next/headers";
import { professionalLocale, translations } from "@/lib/professional-translations";
import { coastalCopy } from "@/lib/coastal-copy";
import { cleanStaySearch, type StaySearch } from "@/lib/stay-search";

export const dynamic = "force-dynamic";

export default async function StaysPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const locale = professionalLocale(cookies().get("tripelor_lang")?.value);
  const copy = translations[locale].staysPage;
  const brand = coastalCopy[locale];
  const input: StaySearch = Object.fromEntries(["island", "checkIn", "checkOut", "guests"].map(key => [key, typeof searchParams[key] === "string" ? searchParams[key] : ""]));
  const search = cleanStaySearch(input);
  const hasSearch = Object.values(input).some(Boolean);
  const managedProperties = await publishedProperties();
  return <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
    <header className="bg-[#071922] py-16 text-white md:py-24">
      <div className="container">
        <p className="eyebrow text-[#ead7aa]">{copy.eyebrow}</p>
        <h1 className="font-display mt-4 text-5xl md:text-7xl">{copy.title}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-white/65">{copy.body}</p>
      </div>
    </header>
    {hasSearch && <div className="container"><div className="coastal-search-summary">
      <p className="coastal-eyebrow">{brand.searchFor}</p>
      <p><strong>{search.island || brand.allIslands}</strong>{search.checkIn && search.checkOut ? ` · ${search.checkIn} — ${search.checkOut}` : ""} · {search.guests} {brand.guestsLabel}</p>
      <p>{brand.searchNote}</p>
    </div></div>}
    <PropertyCards managedProperties={managedProperties} locale={locale} search={hasSearch ? search : undefined} />
  </main>;
}
