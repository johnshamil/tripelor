import Link from "next/link";
import { CalendarDays, Heart, MapPin, Plane, Ship, Sparkles, Star, Waves } from "lucide-react";
import { cookies } from "next/headers";
import StoryPublicActions from "@/components/story-public-actions";
import { professionalLocale } from "@/lib/professional-translations";
import { publicStoryByToken } from "@/lib/trip-story-server";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: true } };

const badgeMeta: Record<string, [string, string]> = {
  "first-turtle": ["🐢", "First Turtle"],
  "shark-bay": ["🦈", "Shark Bay"],
  sunset: ["🌅", "Island Sunset"],
  dolphin: ["🐬", "Dolphins"],
  sandbank: ["🏝️", "Sandbank"],
  "island-hopping": ["🛥️", "Island Hopping"],
  "night-fishing": ["🎣", "Night Fishing"],
  shipwreck: ["⚓", "Shipwreck"],
  manta: ["🌊", "Manta Moment"],
  romantic: ["❤️", "Special Moment"],
};

function heroImage(propertyName: string) {
  const value = propertyName.toLowerCase();
  if (value.includes("rivethi")) return "/properties/rivethi-beach-hotel/1719713475.jpeg";
  if (value.includes("masfalhi")) return "/images%20(3).jpeg";
  return "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
}

function nightCount(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000));
}

function monthYear(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default async function PublicStoryPage({ params }: { params: { token: string } }) {
  const localeKey = professionalLocale(cookies().get("tripelor_lang")?.value);
  const locale = localeKey === "it" ? "it-IT" : localeKey === "ru" ? "ru-RU" : "en-GB";
  const copy = localeKey === "it"
    ? {
        eyebrow: "My Maldives Story",
        unavailable: "Questa storia non è disponibile.",
        unavailableBody: "Il proprietario potrebbe averla resa privata oppure il link non è più valido.",
        home: "Scopri Tripelor",
        favorite: "Il momento preferito",
        story: "La storia",
        memories: "Ricordi del viaggio",
        journey: "Il viaggio",
        arrival: "Arrivo alle Maldive",
        transfer: "Motoscafo",
        stay: "Soggiorno sull'isola",
        experiences: "Esperienze",
        memoriesStep: "Ricordi",
        nights: "notti",
        created: "Creato con Tripelor",
        createdBody: "Viaggi alle Maldive, soggiorni sulle isole, esperienze e trasferimenti organizzati con cura.",
        cta: "Crea la tua Maldives Story",
      }
    : localeKey === "ru"
      ? {
          eyebrow: "My Maldives Story",
          unavailable: "Эта история недоступна.",
          unavailableBody: "Владелец мог сделать её приватной, либо ссылка больше не действует.",
          home: "Открыть Tripelor",
          favorite: "Любимый момент",
          story: "История",
          memories: "Воспоминания о поездке",
          journey: "Маршрут",
          arrival: "Прибытие на Мальдивы",
          transfer: "Скоростной катер",
          stay: "Островное проживание",
          experiences: "Впечатления",
          memoriesStep: "Воспоминания",
          nights: "ночей",
          created: "Создано с Tripelor",
          createdBody: "Путешествия на Мальдивы, островные отели, впечатления и трансферы — в одном продуманном маршруте.",
          cta: "Создать свою Maldives Story",
        }
      : {
          eyebrow: "My Maldives Story",
          unavailable: "This story is not available.",
          unavailableBody: "The owner may have made it private, or this sharing link is no longer active.",
          home: "Explore Tripelor",
          favorite: "Favourite Moment",
          story: "The Story",
          memories: "Journey Memories",
          journey: "The Journey",
          arrival: "Arrival in the Maldives",
          transfer: "Speedboat",
          stay: "Island Stay",
          experiences: "Experiences",
          memoriesStep: "Memories",
          nights: "nights",
          created: "Created with Tripelor",
          createdBody: "Maldives island stays, ocean experiences and transfers — thoughtfully arranged into one seamless journey.",
          cta: "Create Your Maldives Story",
        };

  let bundle = null;
  try {
    if (!/^[0-9a-f-]{36}$/i.test(params.token)) throw new Error("Invalid story link");
    bundle = await publicStoryByToken(params.token);
  } catch {
    bundle = null;
  }

  if (!bundle) {
    return (
      <main className="bg-[#06151c] text-white">
        <section className="container flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-xl text-center">
            <Sparkles className="mx-auto h-10 w-10 text-gold" />
            <h1 className="font-display mt-6 text-5xl">{copy.unavailable}</h1>
            <p className="mt-5 leading-7 text-white/55">{copy.unavailableBody}</p>
            <Link href="/" className="btn-gold mt-7">{copy.home}</Link>
          </div>
        </section>
      </main>
    );
  }

  const { story, reservation, photos } = bundle;
  const image = heroImage(reservation.property_name);
  const experiences = reservation.activities || reservation.package_name || "";
  const nights = nightCount(reservation.check_in, reservation.check_out);

  return (
    <main className="public-story-page bg-[#f1ebdf] text-[#071922]">
      <style>{`
        @media print {
          header, footer, .story-no-print { display: none !important; }
          body, .public-story-page { background: white !important; }
          .story-card { break-inside: avoid; box-shadow: none !important; }
        }
      `}</style>

      <section className="relative min-h-[620px] overflow-hidden text-white">
        <img src={image} alt={reservation.property_name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031016]/[.98] via-[#031016]/[.70] to-[#031016]/[.20]" />
        <div className="container relative z-10 flex min-h-[620px] flex-col justify-between py-10 md:py-14">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="font-display text-2xl tracking-[.08em]">TRIPELOR</Link>
            <span className="text-[9px] uppercase tracking-[.22em] text-[#e3ca91]">{copy.eyebrow}</span>
          </div>

          <div className="max-w-4xl">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] md:text-7xl">{story.title || copy.eyebrow}</h1>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur"><MapPin className="mr-2 inline h-4 w-4 text-[#e3ca91]" />{reservation.property_name}</span>
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">{nights} {copy.nights}</span>
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur"><CalendarDays className="mr-2 inline h-4 w-4 text-[#e3ca91]" />{monthYear(reservation.check_in, locale)}</span>
            </div>
            <div className="mt-8">
              <StoryPublicActions title={story.title || copy.eyebrow} />
            </div>
          </div>
        </div>
      </section>

      <section className="container grid gap-8 py-12 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-8">
          {story.favorite_moment && (
            <section className="story-card border border-[#c9a86a]/35 bg-[#fffdf8] p-7 shadow-sm md:p-9">
              <Heart className="h-8 w-8 text-[#9c7d3d]" />
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.favorite}</p>
              <p className="font-display mt-3 text-4xl leading-tight">{story.favorite_moment}</p>
            </section>
          )}

          {story.story_text && (
            <section className="story-card border border-[#d0c5b0] bg-[#fffdf8] p-7 shadow-sm md:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.story}</p>
              <p className="mt-5 whitespace-pre-wrap text-lg leading-9 text-[#40505a]">{story.story_text}</p>
            </section>
          )}

          {photos.length > 0 && (
            <section className="story-card border border-[#d0c5b0] bg-[#fffdf8] p-5 shadow-sm md:p-7">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.memories}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {photos.filter(photo => photo.signed_url).map((photo, index) => (
                  <figure key={photo.id} className={index === 0 ? "sm:col-span-2" : ""}>
                    <img
                      src={photo.signed_url}
                      alt={photo.caption || `Maldives travel memory ${index + 1}`}
                      className={`w-full object-cover ${index === 0 ? "aspect-[16/9]" : "aspect-square"}`}
                    />
                    {photo.caption && <figcaption className="mt-2 text-sm text-[#687377]">{photo.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-7">
          {story.badges?.length > 0 && (
            <section className="story-card border border-[#c9a86a]/35 bg-[#071922] p-6 text-white shadow-lg md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9bd7b]">{copy.memories}</p>
              <div className="mt-5 grid gap-3">
                {story.badges.map(key => {
                  const meta = badgeMeta[key];
                  if (!meta) return null;
                  return (
                    <div key={key} className="flex items-center gap-3 border border-white/10 bg-white/[.04] p-4">
                      <span className="text-2xl">{meta[0]}</span>
                      <span className="font-semibold">{meta[1]}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="story-card border border-[#d0c5b0] bg-[#fffdf8] p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.journey}</p>
            <div className="mt-6">
              <JourneyStep icon={Plane} title={copy.arrival} />
              {Number(reservation.speedboat_seats || 0) > 0 && <JourneyStep icon={Ship} title={copy.transfer} />}
              <JourneyStep icon={MapPin} title={copy.stay} detail={reservation.property_name} />
              {experiences && <JourneyStep icon={Waves} title={copy.experiences} detail={experiences} />}
              <JourneyStep icon={Star} title={copy.memoriesStep} last />
            </div>
          </section>

          <section className="story-card border border-[#c9a86a]/35 bg-[#f3ead9] p-6 text-center md:p-8">
            <Sparkles className="mx-auto h-7 w-7 text-[#8d7037]" />
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.created}</p>
            <p className="font-display mt-3 text-3xl">TRIPELOR</p>
            <p className="mt-3 text-sm leading-6 text-[#687377]">{copy.createdBody}</p>
            <Link href="/build-your-trip" className="btn-gold mt-6">{copy.cta}</Link>
          </section>
        </aside>
      </section>
    </main>
  );
}

function JourneyStep({
  icon: Icon,
  title,
  detail,
  last = false,
}: {
  icon: typeof Plane;
  title: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <div className="grid grid-cols-[38px_1fr] gap-4">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9c7d3d]/35 bg-[#f3ead9] text-[#8d7037]">
          <Icon className="h-4 w-4" />
        </span>
        {!last && <span className="h-full w-px bg-[#cfc4af]" />}
      </div>
      <div className={last ? "pb-0 pt-1" : "pb-7 pt-1"}>
        <h3 className="font-semibold">{title}</h3>
        {detail && <p className="mt-1 text-sm leading-6 text-[#687377]">{detail}</p>}
      </div>
    </div>
  );
}
