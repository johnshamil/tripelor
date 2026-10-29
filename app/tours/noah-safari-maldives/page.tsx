import Link from "next/link";
import { Anchor, BadgeCheck, BedDouble, CalendarDays, CircleDollarSign, Ship, Users, Waves } from "lucide-react";

export const metadata = {
  title: "NOAH Maldives Safari Boat | Tripelor",
  description: "Book shared Maldives safari trips and private charters aboard NOAH through Tripelor.",
};

const rates = [
  ["Shared trip · guest sharing a cabin", "USD 175", "per guest / night before taxes"],
  ["Shared trip · guest alone in a cabin", "USD 225", "per guest / night before taxes"],
  ["3rd adult on day bed", "USD 125", "per night before taxes"],
  ["Child age 2–11 sharing with adults", "USD 87.50", "per child / night before taxes"],
  ["Private charter · whole boat up to 4 guests", "USD 1,200", "per night before taxes"],
  ["Private charter · each extra adult", "USD 75", "per adult / night before taxes"],
  ["Private charter · each extra child age 2–11", "USD 37.50", "per child / night before taxes"],
  ["Infant under 2", "Free", "one infant per cabin"],
];

export default function NoahSafariPage() {
  const whatsapp = "https://wa.me/9609429403?text=" + encodeURIComponent("Hello Tripelor, I would like a quote for the NOAH Maldives Safari Boat.");
  return <main className="bg-[#06151c] text-white">
    <section className="relative min-h-[70vh] overflow-hidden border-b border-white/10">
      <img src="https://noahmaldives.com/wp-content/uploads/2026/07/NOAH-safari-boat-for-rent-MALDIVES-41-1080.jpg" alt="NOAH Maldives safari boat" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#031018]/95 via-[#031018]/75 to-[#031018]/30" />
      <div className="container relative flex min-h-[70vh] items-end py-20 md:py-28">
        <p className="eyebrow">Tripelor Safari Partner</p>
        <h1 className="font-display mt-4 max-w-5xl text-5xl leading-tight md:text-7xl">NOAH Maldives Safari Boat</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-white/60">Explore the Maldives by liveaboard with shared departures or a private whole-boat charter. Trips can run from 3 to 14 nights, with a sample route through North Malé, Goidhoo Atoll, Baa Atoll and Gaafaru.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-gold">Request a Tripelor Quote</a>
          <Link href="/contact" className="btn-outline">Send an Enquiry</Link>
        </div>
      </div>
    </section>

    <section className="container py-12 md:py-16">
      <div className="grid gap-5 md:grid-cols-2">
        <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.025]">
          <img src="https://noahmaldives.com/wp-content/uploads/2026/07/NOAH-safari-boat-for-rent-MALDIVES-41-1080.jpg" alt="NOAH safari boat after its 2026 refurbishment" className="h-80 w-full object-cover md:h-96" loading="lazy" />
          <figcaption className="p-4 text-xs text-white/45">NOAH safari boat · official 2026 refurbishment photo</figcaption>
        </figure>
        <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.025]">
          <img src="https://noahmaldives.com/wp-content/uploads/2026/07/NOAH-safari-boat-for-rent-MALDIVES-42-1080.jpg" alt="NOAH Maldives safari boat" className="h-80 w-full object-cover md:h-96" loading="lazy" />
          <figcaption className="p-4 text-xs text-white/45">NOAH Maldives · official supplier photo</figcaption>
        </figure>
      </div>
      <p className="mt-4 text-xs text-white/35">Photos used with permission from NOAH for Tripelor marketing.</p>
    </section>

    <section className="container py-14 md:py-18">
      <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-4">
        {[
          [Users, "18 guests", "Licensed guest capacity"],
          [BedDouble, "6 cabins", "King bed, day bed, en-suite & A/C"],
          [CalendarDays, "3–14 nights", "Flexible safari durations"],
          [Ship, "Shared or private", "Choose a cabin or charter the boat"],
        ].map(([Icon,title,text]:any)=><article key={title} className="bg-[#071922] p-6"><Icon className="h-6 w-6 text-gold"/><h2 className="font-display mt-5 text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></article>)}
      </div>
    </section>

    <section className="container py-8 md:py-12">
      <p className="eyebrow">Published prices</p>
      <h2 className="font-display mt-3 text-4xl md:text-5xl">Choose how you want to travel.</h2>
      <p className="mt-4 max-w-3xl leading-7 text-white/55">Rates are the supplier's published prices and are the same year-round. Tripelor will confirm live availability and the final tax-inclusive total before payment.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {rates.map(([name,price,note])=><article key={name} className="border border-white/10 bg-white/[.025] p-6">
          <CircleDollarSign className="h-5 w-5 text-gold"/>
          <h3 className="mt-5 text-lg font-semibold">{name}</h3>
          <p className="font-display mt-3 text-3xl text-gold">{price}</p>
          <p className="mt-1 text-xs text-white/40">{note}</p>
        </article>)}
      </div>
      <div className="mt-6 rounded-2xl border border-gold/25 bg-gold/5 p-6 text-sm leading-7 text-white/65">
        <strong className="text-white">Taxes:</strong> 10% service charge, 17% TGST on the rate plus service charge, and USD 12 Green Tax per guest aged 2+ per night. Infants under 2 do not pay Green Tax.
      </div>
    </section>

    <section className="container py-12 md:py-16">
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="border border-white/10 bg-white/[.025] p-7">
          <Anchor className="h-6 w-6 text-gold"/>
          <h2 className="font-display mt-5 text-3xl">Sample 8-day route</h2>
          <p className="mt-4 leading-7 text-white/55">North Malé → Goidhoo Atoll → Baa Atoll, including Hanifaru Bay when in season → Gaafaru wrecks → return to Malé. The captain may adjust the route or order of stops for weather and safety.</p>
        </article>
        <article className="border border-white/10 bg-white/[.025] p-7">
          <BadgeCheck className="h-6 w-6 text-gold"/>
          <h2 className="font-display mt-5 text-3xl">Licensed & documented</h2>
          <p className="mt-4 leading-7 text-white/55">NOAH is a Maldives-licensed tourist vessel. Its current operating licence is stated as valid until 6 July 2031, with passenger certification and passenger/third-party insurance provided to Tripelor.</p>
        </article>
      </div>
    </section>

    <section className="bg-[#f1ebdf] text-[#071922]">
      <div className="container py-14 md:py-18">
        <p className="eyebrow text-[#8d7037]">Booking terms</p>
        <div className="mt-6 grid gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] md:grid-cols-2">
          {[
            ["Deposit & balance","30% deposit confirms the booking. Balance is due 60 days before departure; bookings within 60 days are paid in full."],
            ["Price protection","Once the deposit is paid, the confirmed price is fixed and no fuel surcharge can be added."],
            ["Cancellation","More than 60 days: deposit retained or moved once to another date within 12 months. 60–30 days: 50%. Under 30 days or no-show: 100%. Green Tax is refunded for unused nights."],
            ["Weather & disruption","The captain may change the route for safety. If NOAH shortens a trip for a reason within its control, unused nights are refunded pro rata on the amount paid, with Green Tax for those nights."],
          ].map(([title,text])=><article key={title} className="bg-[#f8f4ec] p-7"><h3 className="font-display text-2xl">{title}</h3><p className="mt-3 text-sm leading-7 text-[#58656c]">{text}</p></article>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-gold">Request NOAH Quote</a>
          <Link href="/tours" className="btn-outline border-[#071922]/30 text-[#071922]">Back to Travel Packages</Link>
        </div>
      </div>
    </section>
  </main>;
}
