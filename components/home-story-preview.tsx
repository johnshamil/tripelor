"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";
import type { ProfessionalLocale } from "@/lib/professional-translations";

type Mood = "reconnect" | "adventure" | "slow";

const text = {
  en: {
    eyebrow: "Your Maldives Story",
    prompt: "Choose the feeling you want to take home.",
    preview: "A glimpse of your escape",
    stay: "A stay to explore",
    moment: "An island moment",
    from: "From USD",
    perNight: "per room, per night",
    priceNote: "Base room rate. Dates, taxes, transfers and availability are confirmed separately.",
    empty: "Our next island story is being prepared. Explore the stays available now.",
    explore: "Explore Stays",
    moods: {
      reconnect: { label: "Romantic Escape", title: "Time for two.", description: "Slow mornings and moments together." },
      adventure: { label: "Ocean Adventure", title: "Follow the blue.", description: "Days shaped by the sea and island discoveries." },
      slow: { label: "Slow Island Days", title: "Room to just be.", description: "Warm light, open afternoons and an easier pace." },
    },
  },
  it: {
    eyebrow: "La tua storia alle Maldive",
    prompt: "Scegli la sensazione che vuoi portare a casa.",
    preview: "Un assaggio del tuo viaggio",
    stay: "Un soggiorno da scoprire",
    moment: "Un momento sull’isola",
    from: "Da USD",
    perNight: "per camera, a notte",
    priceNote: "Tariffa base della camera. Date, tasse, trasferimenti e disponibilità saranno confermati separatamente.",
    empty: "Stiamo preparando la prossima storia. Scopri i soggiorni disponibili ora.",
    explore: "Esplora i soggiorni",
    moods: {
      reconnect: { label: "Fuga romantica", title: "Tempo per voi due.", description: "Mattine lente e momenti insieme." },
      adventure: { label: "Avventura nell’oceano", title: "Segui il blu.", description: "Giornate tra il mare e le scoperte delle isole." },
      slow: { label: "Giorni senza fretta", title: "Tempo per essere sé stessi.", description: "Luce calda, pomeriggi liberi e un ritmo più lento." },
    },
  },
  ru: {
    eyebrow: "Ваша история на Мальдивах",
    prompt: "Выберите настроение, которое хочется увезти с собой.",
    preview: "Предвкушение вашего путешествия",
    stay: "Проживание, которое стоит открыть",
    moment: "Момент на острове",
    from: "От USD",
    perNight: "за номер за ночь",
    priceNote: "Базовая стоимость номера. Даты, налоги, трансферы и наличие мест подтверждаются отдельно.",
    empty: "Мы готовим следующую островную историю. Пока изучите доступные варианты проживания.",
    explore: "Смотреть варианты",
    moods: {
      reconnect: { label: "Романтический отдых", title: "Время для двоих.", description: "Неспешные утра и моменты вместе." },
      adventure: { label: "Океанские приключения", title: "Следуйте за морем.", description: "Дни, наполненные морем и открытиями." },
      slow: { label: "Неспешные дни", title: "Время просто быть.", description: "Тёплый свет, свободные дни и спокойный ритм." },
    },
  },
} as const;

const moods: Mood[] = ["reconnect", "adventure", "slow"];
const moodTerms: Record<Mood, RegExp> = {
  reconnect: /romanc|honeymoon|couple|private|sunset|love/i,
  adventure: /snorkel|diving|dive|shark|turtle|dolphin|excursion|adventure|sandbank|shipwreck/i,
  slow: /relax|slow|quiet|calm|peace|beach|wellness|spa/i,
};

function score(property: PublicProperty, mood: Mood) {
  const tags = [
    ...(property.wishlistTags || []),
    ...(property.experiences || []).filter(item => item.enabled).flatMap(item => [item.name, ...(item.wishlistTags || [])]),
  ].join(" ");
  const descriptiveText = `${property.name} ${property.description}`;
  return (moodTerms[mood].test(tags) ? 3 : 0)
    + (moodTerms[mood].test(descriptiveText) ? 1 : 0)
    + (mood === "adventure" ? (property.experiences || []).filter(item => item.enabled).length : 0);
}

export default function HomeStoryPreview({
  properties,
  locale,
  copy,
}: {
  properties: PublicProperty[];
  locale: ProfessionalLocale;
  copy: { title: string; body: string; cta: string };
}) {
  const [mood, setMood] = useState<Mood>("reconnect");
  const labels = text[locale];
  const selected = labels.moods[mood];
  const available = properties.filter(property =>
    property.status === "published" && property.photos[0] &&
    property.rooms.some(room => room.sellingRate > 0 && room.totalRooms > 0),
  );
  const property = [...available].sort((a, b) => score(b, mood) - score(a, mood))[0];
  const room = property?.rooms.filter(item => item.sellingRate > 0 && item.totalRooms > 0)
    .sort((a, b) => a.sellingRate - b.sellingRate)[0];
  const experience = property?.experiences?.find(item => item.enabled && moodTerms[mood].test(
    `${item.name} ${(item.wishlistTags || []).join(" ")}`,
  ));
  const story = property && room
    ? { mood, slug: property.slug, room: room.name, meal: room.mealPlan, nights: 3, experience: experience?.id || "" }
    : { mood };
  const href = property ? `/island-story?story=${encodeURIComponent(JSON.stringify(story))}` : "/stays";

  return (
    <section id="your-maldives-story" aria-labelledby="home-story-title" className="overflow-hidden bg-[#f1ebdf] text-[#071922]">
      <div className="container grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
        <div>
          <p className="eyebrow text-[#8d7037]">{labels.eyebrow}</p>
          <h2 id="home-story-title" className="font-display mt-5 max-w-xl text-4xl leading-tight sm:text-5xl">{copy.title}</h2>
          <p className="mt-5 max-w-md leading-7 text-[#53616a]">{copy.body}</p>
          <fieldset className="mt-9">
            <legend className="mb-4 text-sm font-semibold text-[#344751]">{labels.prompt}</legend>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {moods.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mood === option}
                  onClick={() => setMood(option)}
                  className={`group flex min-h-[72px] w-full items-center gap-4 rounded-xl border px-5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8d7037] ${mood === option ? "border-[#a98750] bg-[#fffaf1] shadow-[0_12px_35px_rgba(72,55,26,.10)]" : "border-[#d4c9b6] bg-transparent hover:border-[#a98750] hover:bg-[#f8f4ec]"}`}
                >
                  <span aria-hidden="true" className="font-display text-2xl italic text-[#a98750]">0{index + 1}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{labels.moods[option].label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#53616a]">{labels.moods[option].description}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className={`ml-auto hidden h-4 w-4 shrink-0 text-[#8d7037] lg:block ${mood === option ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <article className="relative isolate flex min-h-[530px] flex-col justify-between overflow-hidden rounded-2xl bg-[#0b2731] text-white shadow-[0_30px_80px_rgba(7,25,34,.22)] sm:min-h-[610px]" aria-live="polite">
          <img
            src={property?.photos[0] ? propertyPhotoUrl(property.photos[0]) : "/properties/rivethi-beach-hotel/1719713475.jpeg"}
            alt={property ? `${property.name} in ${property.island}` : "Maldives beachfront"}
            loading="lazy"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#051318]/95 via-[#051318]/35 to-[#051318]/20" />
          <p className="m-5 self-start rounded-full border border-white/40 bg-[#051318]/45 px-4 py-2 text-[11px] uppercase tracking-[.2em] backdrop-blur-md sm:m-8">
            <Sparkles aria-hidden="true" className="mr-2 inline h-3 w-3 text-[#ead7aa]" />{labels.preview}
          </p>
          <div className="px-6 pb-8 pt-28 sm:px-10 sm:pb-10">
            <p className="text-xs uppercase tracking-[.25em] text-[#ead7aa]">{selected.label}</p>
            <h3 className="font-display mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">{selected.title}</h3>
            {property ? (
              <>
                <div className="mt-8 border-t border-white/30 pt-5">
                  <p className="text-xs uppercase tracking-[.18em] text-white/65">{labels.stay}</p>
                  <p className="font-display mt-2 text-2xl">{property.name}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/75"><MapPin aria-hidden="true" className="h-4 w-4" />{property.island}</p>
                  {experience && <p className="mt-3 text-sm leading-6 text-white/85"><span className="text-[#ead7aa]">{labels.moment}:</span> {experience.name}</p>}
                </div>
                {room && <div className="mt-5"><p className="text-sm text-white/80">{labels.from} <strong className="font-display ml-1 text-2xl font-normal text-white">{room.sellingRate.toLocaleString("en-US")}</strong> <span className="text-white/70">{labels.perNight}</span></p><p className="mt-2 max-w-lg text-xs leading-5 text-white/60">{labels.priceNote}</p></div>}
              </>
            ) : <p className="mt-6 max-w-md leading-7 text-white/80">{labels.empty}</p>}
            <Link href={href} className="btn-gold mt-7 w-full justify-center sm:w-auto">
              {property ? copy.cta : labels.explore} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
