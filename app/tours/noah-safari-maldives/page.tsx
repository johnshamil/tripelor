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
  return <main className="bg-[#06151c] pb-24 text-white md:pb-0">
    <section className="relative overflow-hidden border-b border-white/10 bg-[#06151c]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(55,179,197,.20),transparent_32%),radial-gradient(circle_at_12%_35%,rgba(217,189,123,.16),transparent_30%),linear-gradient(160deg,#041117_0%,#0b3440_55%,#071922_100%)]" />
      <div className="absolute -right-24 top-20 h-72 w-72 rounded-full border border-white/5 md:h-96 md:w-96" />
      <div className="absolute -left-28 bottom-[-7rem] h-80 w-80 rounded-full border border-gold/10 md:h-[28rem] md:w-[28rem]" />
      <div className="container relative flex min-h-[72vh] flex-col items-start justify-end pb-28 pt-16 md:min-h-[68vh] md:pb-20 md:pt-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[.22em] text-gold">
            <Ship className="h-3.5 w-3.5" /> Tripelor Safari Partner
          </div>
          <h1 className="font-display mt-6 text-[2.8rem] leading-[.95] tracking-[-.02em] text-white sm:text-6xl md:text-7xl">
            NOAH Maldives
            <span className="block italic text-gold">Safari Boat</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
            Sail the Maldives on a 23 m liveaboard with six en-suite cabins. Choose a shared departure or charter the whole boat for a private 3-14 night island-hopping journey.
          </p>
          <div className="mt-8 grid w-full gap-3 sm:flex sm:flex-wrap">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-gold min-h-12 w-full justify-center sm:w-auto">
              Request a Tripelor Quote
            </a>
            <Link href="/contact" className="btn-outline min-h-12 w-full justify-center sm:w-auto">
              Ask About Dates
            </Link>
          </div>
          <div className="mt-8 grid w-full grid-cols-3 gap-2 border-t border-white/10 pt-6 text-center sm:max-w-xl sm:text-left">
            <div><p className="font-display text-2xl text-white">18</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/40">Guests</p></div>
            <div><p className="font-display text-2xl text-white">6</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/40">Cabins</p></div>
            <div><p className="font-display text-2xl text-white">3-14</p><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/40">Nights</p></div>
          </div>
        </div>
      </div>
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
