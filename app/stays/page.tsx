import PropertyCards from "@/components/room-first-booking-cards";
import { publishedProperties } from "@/lib/property-store";
import { cookies } from "next/headers";
import { professionalLocale, translations } from "@/lib/professional-translations";

export const dynamic = "force-dynamic";

export default async function StaysPage() {
  const locale = professionalLocale(cookies().get("tripelor_lang")?.value);
  const copy = translations[locale].staysPage;
  const managedProperties = await publishedProperties();
  return <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
    <header className="bg-[#071922] py-16 text-white md:py-24">
      <div className="container">
        <p className="eyebrow text-[#ead7aa]">{copy.eyebrow}</p>
        <h1 className="font-display mt-4 text-5xl md:text-7xl">{copy.title}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-white/65">{copy.body}</p>
      </div>
    </header>
    <PropertyCards managedProperties={managedProperties} locale={locale} />
  </main>;
}
