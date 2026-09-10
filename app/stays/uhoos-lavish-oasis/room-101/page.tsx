import Link from "next/link";
import { BedDouble, CheckCircle2, MapPin } from "lucide-react";
import AvailabilityChecker from "@/components/availability-checker";

const roomName = "Deluxe Room";
const photos = [
  "/properties/uhoos-lavish-oasis/20250517_193323.jpg",
  "/properties/uhoos-lavish-oasis/20250518_001256.jpg",
  "/properties/uhoos-lavish-oasis/20250518_001936.jpg",
  "/properties/uhoos-lavish-oasis/20250822_104240.jpg",
];

export default function Room101Page() {
  return (
    <main className="container py-8 pb-36 md:py-16 md:pb-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-gold md:text-sm md:tracking-[.3em]">Uhoo&apos;s Lavish Oasis</p>
          <h1 className="mt-2 text-4xl font-bold md:text-6xl">{roomName}</h1>
          <p className="mt-3 flex items-center gap-2 text-gray-400"><MapPin className="h-4 w-4 text-gold" /> V. Felidhoo, Maldives</p>
        </div>
        <Link href="/booking?property=Uhoo%27s%20Lavish%20Oasis&roomType=ROOM%20101&mealPlan=Bed%20%26%20Breakfast" className="btn-gold w-full md:w-auto">
          Book Deluxe Room
        </Link>
      </div>

      <section className="mt-7 md:mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold">Deluxe Room Gallery</p>
            <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">A closer look at Uhoo&apos;s Lavish Oasis</h2>
          </div>
          <span className="shrink-0 text-xs text-gray-500">4 photos</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {photos.map((src, index) => (
            <div key={src} className={`${index === 0 ? "md:col-span-2 lg:col-span-2 lg:row-span-2" : ""} relative overflow-hidden rounded-2xl border border-white/10 bg-[#06151c] md:rounded-3xl`}>
              <img
                src={src}
                alt={index === 0 ? "Deluxe Room at Uhoo's Lavish Oasis" : `Uhoo's Lavish Oasis Deluxe Room photo ${index + 1}`}
                className={`${index === 0 ? "aspect-[3/4] md:aspect-[4/3] md:min-h-[420px]" : "aspect-[3/4] md:h-64"} w-full object-cover transition duration-500 hover:scale-[1.01]`}
              />
              {index === 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-14 md:p-5 md:pt-16">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/70">Uhoo&apos;s Lavish Oasis</p>
                  <p className="mt-1 text-sm font-medium text-white">Deluxe Room · Private room for two</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="flex items-start gap-3">
            <BedDouble className="mt-1 h-6 w-6 shrink-0 text-gold md:h-7 md:w-7" />
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">A private deluxe island room for two</h2>
          </div>
          <p className="mt-4 leading-7 text-gray-400">A comfortable Deluxe Room at Uhoo&apos;s Lavish Oasis with flexible meal plans and Tripelor booking support.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Deluxe Room",
              "Ideal for 2 guests",
              "Bed & Breakfast from USD 85",
              "Half Board USD 95",
              "Full Board USD 115",
              "Local island hospitality",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-gray-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <AvailabilityChecker roomType="ROOM 101" displayName="Deluxe Room" />
      </div>
    </main>
  );
}
