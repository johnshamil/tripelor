import Link from "next/link";
import { BedDouble, CheckCircle2, MapPin } from "lucide-react";
import AvailabilityChecker from "@/components/availability-checker";

const photos = [
  "/images%20(3).jpeg",
  "/images%20(1).jpeg",
  "/images%20(2).jpeg",
  "/images%20(4).jpeg",
  "/images%20(5).jpeg",
];

export default function FamilyRoomPage() {
  return (
    <main className="container py-8 pb-36 md:py-16 md:pb-20">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-gold md:text-sm md:tracking-[.3em]">
            Masfalhi View Inn
          </p>
          <h1 className="mt-2 text-4xl font-bold md:text-6xl">Family Room with Sea View</h1>
          <p className="mt-3 flex items-center gap-2 text-gray-400">
            <MapPin className="h-4 w-4 text-gold" /> V. Felidhoo, Maldives
          </p>
        </div>
        <Link
          href="/booking?property=Masfalhi%20View%20Inn&roomType=Family%20Room%20with%20Sea%20View&mealPlan=Bed%20%26%20Breakfast"
          className="btn-gold w-full md:w-auto"
        >
          Book Family Room
        </Link>
      </div>

      <section className="mt-7 md:mt-10">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {photos.map((src, index) => (
            <div
              key={src}
              className={`${index === 0 ? "md:col-span-2 lg:col-span-2 lg:row-span-2" : ""} relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 md:rounded-3xl`}
            >
              <img
                src={src}
                alt={index === 0 ? "Family Room with Sea View at Masfalhi View Inn" : `Masfalhi View Inn family room photo ${index + 1}`}
                className={`${index === 0 ? "aspect-[4/3] md:min-h-[420px]" : "h-56 md:h-64"} w-full object-cover transition duration-500 hover:scale-105`}
              />
              {index === 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 md:p-5 md:pt-16">
                  <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/70">Masfalhi View Inn</p>
                  <p className="mt-1 text-sm font-medium text-white">Family Room with Sea View</p>
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
            <h2 className="text-2xl font-bold leading-tight md:text-3xl">A spacious sea-view room for families and groups</h2>
          </div>
          <p className="mt-4 leading-7 text-gray-400">
            A spacious, air-conditioned family room at Masfalhi View Inn with sea views, a private bathroom and flexible bedding for up to five guests.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              "Sleeps up to 5 guests",
              "3 twin beds + 1 queen bed",
              "Sea view",
              "Air conditioning",
              "Private bathroom",
              "Free Wi-Fi",
              "Bed & Breakfast from USD 97",
              "Half Board USD 110",
              "Full Board USD 130",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-gray-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <AvailabilityChecker roomType="Family Room with Sea View" propertyName="Masfalhi View Inn" />
      </div>
    </main>
  );
}
