import Link from "next/link";
import { BedDouble, MapPin, Utensils, Video, CheckCircle2 } from "lucide-react";

const rates = [
  { name: "Bed & Breakfast", price: 85, detail: "Room + daily breakfast" },
  { name: "Half Board", price: 95, detail: "Room + breakfast + dinner" },
  { name: "Full Board", price: 115, detail: "Room + breakfast + lunch + dinner" },
];

const photos = [
  "/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.23.jpeg",
  "/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.22%20(2).jpeg",
  "/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.22%20(1).jpeg",
];

export default function UhoosLavishOasisPage() {
  return (
    <>
      <section className="container py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Featured Stay</p>
            <h1 className="mt-2 text-4xl font-bold md:text-6xl">Uhoo&apos;s Lavish Oasis</h1>
            <p className="mt-3 flex items-center gap-2 text-gray-300"><MapPin className="h-4 w-4 text-gold"/>V. Felidhoo, Maldives</p>
          </div>
          <Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&destination=Maldives&mealPlan=Bed%20%26%20Breakfast" className="btn-gold">Book This Stay</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-white/10 lg:col-span-2">
            <img src={photos[0]} alt="Uhoo's Lavish Oasis exterior" className="h-full min-h-[420px] w-full object-cover" />
          </div>
          <div className="grid gap-4">
            {photos.slice(1).map((src, index) => (
              <div key={src} className="overflow-hidden rounded-2xl border border-white/10">
                <img src={src} alt={`Uhoo's Lavish Oasis room ${index + 1}`} className="h-52 w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <h2 className="text-3xl font-bold">A comfortable island stay in Felidhoo</h2>
            <p className="mt-4 max-w-3xl text-gray-400">Stay close to the natural beauty of Vaavu Atoll in a warm, welcoming guesthouse with thoughtfully prepared rooms and flexible meal plans. Choose the option that best suits your holiday and send your booking request directly through Tripelor.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {["Comfortable double room", "Daily meal-plan options", "Ideal for couples and island escapes", "Booking support through Tripelor"].map(item => <div key={item} className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="h-5 w-5 text-gold"/>{item}</div>)}
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-3"><BedDouble className="h-7 w-7 text-gold"/><div><p className="text-sm text-gray-400">Starting from</p><p className="text-3xl font-bold">USD 85 <span className="text-sm font-normal text-gray-400">/ room / night</span></p></div></div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="container py-16">
          <div className="mb-8"><p className="text-sm uppercase tracking-[0.3em] text-gold">Room Rates</p><h2 className="mt-2 text-3xl font-bold md:text-4xl">Choose your meal plan</h2><p className="mt-2 text-gray-400">All prices are per room, per night.</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {rates.map(rate => (
              <article key={rate.name} className="card p-6">
                <Utensils className="h-7 w-7 text-gold"/>
                <h3 className="mt-4 text-xl font-semibold">{rate.name}</h3>
                <p className="mt-2 text-gray-400">{rate.detail}</p>
                <p className="mt-6 text-4xl font-bold text-gold">${rate.price}</p>
                <p className="text-sm text-gray-500">USD per room / night</p>
                <Link href={`/booking?property=Uhoo%27s%20Lavish%20Oasis&destination=Maldives&mealPlan=${encodeURIComponent(rate.name)}`} className="btn-gold mt-6 w-full">Book {rate.name}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="mb-7 flex items-center gap-3"><Video className="h-7 w-7 text-gold"/><div><p className="text-sm uppercase tracking-[0.3em] text-gold">Property Videos</p><h2 className="text-3xl font-bold">Take a closer look</h2></div></div>
        <div className="grid gap-6 md:grid-cols-2">
          <video controls playsInline className="w-full rounded-2xl border border-white/10 bg-black" src="/uhoos/WhatsApp%20Video%202026-08-17%20at%2015.30.20.mp4" />
          <video controls playsInline className="w-full rounded-2xl border border-white/10 bg-black" src="/uhoos/WhatsApp%20Video%202026-08-17%20at%2015.30.22.mp4" />
        </div>
      </section>
    </>
  );
}
