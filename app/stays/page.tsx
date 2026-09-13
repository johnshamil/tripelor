import PropertyCards from "@/components/room-first-booking-cards";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export default async function StaysPage() {
  const managedProperties = await publishedProperties();
  return <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
    <header className="bg-[#071922] py-16 text-white md:py-24">
      <div className="container">
        <p className="eyebrow text-[#ead7aa]">The Tripelor collection</p>
        <h1 className="font-display mt-4 text-5xl md:text-7xl">Choose your property.</h1>
        <p className="mt-5 max-w-2xl leading-7 text-white/65">Discover our guesthouses and hotels. Open a property to view its information, rooms and rates before sending your booking request.</p>
      </div>
    </header>
    <PropertyCards managedProperties={managedProperties} />
  </main>;
}
