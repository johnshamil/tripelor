"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  Download,
  Heart,
  ImagePlus,
  MapPin,
  MessageCircle,
  Plane,
  Share2,
  Ship,
  Sparkles,
  Star,
  Trash2,
  Waves,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";

type Booking = {
  id: string;
  booking_reference?: string | null;
  property_name: string;
  room_type?: string | null;
  check_in: string;
  check_out: string;
  guest_name?: string | null;
  status?: string | null;
  package_name?: string | null;
  activities?: string | null;
  meal_plan?: string | null;
  speedboat_seats?: number | null;
};

type Story = {
  id: string;
  reservation_id: string;
  title: string;
  story_text: string;
  favorite_moment: string;
  badges: string[];
  is_public: boolean;
  share_token: string;
  updated_at: string;
};

type Photo = {
  id: string;
  signed_url?: string;
  caption?: string;
};

const badges = [
  ["first-turtle", "🐢", "First Turtle"],
  ["shark-bay", "🦈", "Shark Bay"],
  ["sunset", "🌅", "Island Sunset"],
  ["dolphin", "🐬", "Dolphins"],
  ["sandbank", "🏝️", "Sandbank"],
  ["island-hopping", "🛥️", "Island Hopping"],
  ["night-fishing", "🎣", "Night Fishing"],
  ["shipwreck", "⚓", "Shipwreck"],
  ["manta", "🌊", "Manta Moment"],
  ["romantic", "❤️", "Special Moment"],
] as const;

function imageFor(propertyName: string) {
  const value = propertyName.toLowerCase();
  if (value.includes("rivethi")) return "/properties/rivethi-beach-hotel/1719713475.jpeg";
  if (value.includes("masfalhi")) return "/images%20(3).jpeg";
  return "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
}

function nights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000));
}

function prettyDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export default function MaldivesStoryPage() {
  const siteLocale = useSiteLanguage();
  const locale = siteLocale === "it" ? "it-IT" : siteLocale === "ru" ? "ru-RU" : "en-GB";
  const copy = siteLocale === "it"
    ? {
        back: "Torna a My Tripelor",
        eyebrow: "My Maldives Story",
        title: "Il tuo viaggio merita di essere ricordato.",
        intro: "Trasforma la tua vacanza in un diario digitale Tripelor: foto, momenti preferiti, tappe e ricordi da conservare e condividere.",
        choose: "Scegli un viaggio",
        loading: "Preparazione della tua storia...",
        noTrips: "La tua prima Maldives Story inizierà dopo una prenotazione Tripelor.",
        create: "Pianifica il tuo viaggio",
        storyTitle: "Titolo della storia",
        favorite: "Il mio momento preferito",
        favoritePlaceholder: "Il tramonto, la prima tartaruga, una cena speciale...",
        journal: "La nostra storia",
        journalPlaceholder: "Racconta cosa ha reso speciale questo viaggio...",
        stamps: "Francobolli dei ricordi",
        stampsBody: "Scegli i momenti che fanno parte della tua storia.",
        photos: "Album dei ricordi",
        photosBody: "Aggiungi fino a 12 foto. JPG, PNG o WebP · massimo 10 MB ciascuna.",
        upload: "Aggiungi foto",
        uploading: "Caricamento...",
        remove: "Rimuovi foto",
        save: "Salva la mia storia",
        saving: "Salvataggio...",
        saved: "Storia salvata",
        share: "Condividi la mia storia",
        private: "Rendi privata",
        shared: "Link della storia copiato",
        pdf: "Salva come PDF",
        favoriteLabel: "Momento preferito",
        route: "Il nostro viaggio",
        routeAirport: "Arrivo alle Maldive",
        routeTransfer: "Motoscafo",
        routeStay: "Soggiorno sull'isola",
        routeExperience: "Esperienze",
        routeMemories: "Ricordi",
        nights: "notti",
        review: "Lascia una recensione verificata",
        privacy: "La storia resta privata finché non scegli di condividerla. Le foto vengono conservate in modo privato e i link pubblici possono essere disattivati in qualsiasi momento.",
        created: "Creato con Tripelor",
        publicLabel: "Storia condivisibile",
        privateLabel: "Solo per me",
        error: "Non siamo riusciti a caricare la storia.",
        photoError: "Non siamo riusciti a caricare la foto.",
      }
    : siteLocale === "ru"
      ? {
          back: "Назад в My Tripelor",
          eyebrow: "My Maldives Story",
          title: "Путешествие, которое хочется сохранить.",
          intro: "Превратите отдых в цифровую историю Tripelor: фотографии, любимые моменты, маршрут и воспоминания, которыми можно поделиться.",
          choose: "Выберите поездку",
          loading: "Готовим вашу историю...",
          noTrips: "Ваша первая Maldives Story появится после бронирования Tripelor.",
          create: "Спланировать поездку",
          storyTitle: "Название истории",
          favorite: "Мой любимый момент",
          favoritePlaceholder: "Закат, первая черепаха, особенный ужин...",
          journal: "Наша история",
          journalPlaceholder: "Расскажите, что сделало эту поездку особенной...",
          stamps: "Штампы воспоминаний",
          stampsBody: "Выберите моменты, которые стали частью вашей истории.",
          photos: "Альбом воспоминаний",
          photosBody: "Добавьте до 12 фото. JPG, PNG или WebP · до 10 МБ каждое.",
          upload: "Добавить фото",
          uploading: "Загружаем...",
          remove: "Удалить фото",
          save: "Сохранить историю",
          saving: "Сохраняем...",
          saved: "История сохранена",
          share: "Поделиться историей",
          private: "Сделать приватной",
          shared: "Ссылка на историю скопирована",
          pdf: "Сохранить как PDF",
          favoriteLabel: "Любимый момент",
          route: "Наш маршрут",
          routeAirport: "Прибытие на Мальдивы",
          routeTransfer: "Скоростной катер",
          routeStay: "Островное проживание",
          routeExperience: "Впечатления",
          routeMemories: "Воспоминания",
          nights: "ночей",
          review: "Оставить подтверждённый отзыв",
          privacy: "История остаётся приватной, пока вы сами не решите поделиться ею. Фотографии хранятся в приватном хранилище, а публичную ссылку можно отключить в любой момент.",
          created: "Создано с Tripelor",
          publicLabel: "Можно поделиться",
          privateLabel: "Только для меня",
          error: "Не удалось загрузить историю.",
          photoError: "Не удалось загрузить фотографию.",
        }
      : {
          back: "Back to My Tripelor",
          eyebrow: "My Maldives Story",
          title: "A journey worth remembering.",
          intro: "Turn your holiday into a beautiful Tripelor travel journal — photos, favourite moments, journey stamps and memories you can keep and share.",
          choose: "Choose a journey",
          loading: "Preparing your Maldives Story...",
          noTrips: "Your first Maldives Story will begin after a Tripelor booking.",
          create: "Plan My Trip",
          storyTitle: "Story title",
          favorite: "My favourite moment",
          favoritePlaceholder: "The sunset, our first turtle, a special dinner...",
          journal: "Our story",
          journalPlaceholder: "Tell the story of what made this journey special...",
          stamps: "Memory stamps",
          stampsBody: "Choose the moments that became part of your story.",
          photos: "Memory album",
          photosBody: "Add up to 12 photos. JPG, PNG or WebP · maximum 10 MB each.",
          upload: "Add Photos",
          uploading: "Uploading...",
          remove: "Remove photo",
          save: "Save My Story",
          saving: "Saving...",
          saved: "Story saved",
          share: "Share My Story",
          private: "Make Private",
          shared: "Story link copied",
          pdf: "Save as PDF",
          favoriteLabel: "Favourite moment",
          route: "Our Journey",
          routeAirport: "Arrival in the Maldives",
          routeTransfer: "Speedboat",
          routeStay: "Island stay",
          routeExperience: "Experiences",
          routeMemories: "Memories",
          nights: "nights",
          review: "Leave a verified review",
          privacy: "Your story stays private until you choose to share it. Photos are kept in private storage, and you can turn the public link off at any time.",
          created: "Created with Tripelor",
          publicLabel: "Shareable Story",
          privateLabel: "Only Me",
          error: "We could not load your story.",
          photoError: "We could not upload this photo.",
        };

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [story, setStory] = useState<Story | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState("");
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [storyText, setStoryText] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [storyLoading, setStoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        const member = await me.json();
        if (!member.user) {
          window.location.href = "/login?next=%2Faccount%2Fstory";
          return;
        }
        const response = await fetch("/api/account/bookings", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || copy.error);
        const valid = (data.bookings || [])
          .filter((booking: Booking) => String(booking.status || "").toLowerCase() !== "cancelled")
          .sort((a: Booking, b: Booking) => String(b.check_out).localeCompare(String(a.check_out)));
        setBookings(valid);
        const params = new URLSearchParams(window.location.search);
        const requested = params.get("reservationId");
        setSelectedId(valid.some((booking: Booking) => booking.id === requested) ? requested! : valid[0]?.id || "");
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : copy.error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = useMemo(
    () => bookings.find(booking => booking.id === selectedId) || bookings[0] || null,
    [bookings, selectedId],
  );

  useEffect(() => {
    if (!selected?.id) return;
    let active = true;
    setStoryLoading(true);
    setStatus("");
    setError("");
    fetch(`/api/account/story?reservationId=${encodeURIComponent(selected.id)}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || copy.error);
        if (!active) return;
        const existing: Story | null = data.story || null;
        setStory(existing);
        setPhotos(data.photos || []);
        setShareUrl(data.shareUrl || "");
        setTitle(existing?.title || `${selected.guest_name || "My"} Maldives Story`);
        setFavoriteMoment(existing?.favorite_moment || "");
        setStoryText(existing?.story_text || "");
        setSelectedBadges(existing?.badges || []);
        setIsPublic(Boolean(existing?.is_public));
      })
      .catch(reason => active && setError(reason instanceof Error ? reason.message : copy.error))
      .finally(() => active && setStoryLoading(false));
    return () => { active = false; };
  }, [selected?.id]);

  function toggleBadge(key: string) {
    setSelectedBadges(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  }

  async function save(publicValue = isPublic) {
    if (!selected?.id) return null;
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const response = await fetch("/api/account/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: selected.id,
          title,
          favoriteMoment,
          storyText,
          badges: selectedBadges,
          isPublic: publicValue,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || copy.error);
      setStory(data.story);
      setPhotos(data.photos || photos);
      setIsPublic(Boolean(data.story?.is_public));
      setShareUrl(data.shareUrl || "");
      setStatus(copy.saved);
      return data;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.error);
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    if (!selected?.id || !event.target.files?.length) return;
    const files = Array.from(event.target.files).slice(0, Math.max(0, 12 - photos.length));
    if (!files.length) return;
    setUploading(true);
    setStatus("");
    setError("");
    try {
      for (const file of files) {
        const form = new FormData();
        form.set("reservationId", selected.id);
        form.set("file", file);
        const response = await fetch("/api/account/story/photos", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || copy.photoError);
        setPhotos(current => [...current, data.photo]);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : copy.photoError);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function removePhoto(photoId: string) {
    if (!selected?.id) return;
    setError("");
    const response = await fetch(
      `/api/account/story/photos?reservationId=${encodeURIComponent(selected.id)}&photoId=${encodeURIComponent(photoId)}`,
      { method: "DELETE" },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || copy.photoError);
      return;
    }
    setPhotos(current => current.filter(photo => photo.id !== photoId));
  }

  async function shareStory() {
    const data = await save(true);
    if (!data?.shareUrl) return;
    const absolute = `${window.location.origin}${data.shareUrl}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || copy.eyebrow, text: copy.created, url: absolute });
      } else {
        await navigator.clipboard.writeText(absolute);
        setStatus(copy.shared);
      }
    } catch {
      await navigator.clipboard.writeText(absolute).catch(() => {});
      setStatus(copy.shared);
    }
  }

  async function makePrivate() {
    await save(false);
  }

  if (loading) return <main className="container py-20 text-gray-400">{copy.loading}</main>;

  if (!selected) {
    return (
      <main className="container py-16 pb-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/[.03] p-8 text-center md:p-12">
          <Sparkles className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-5">{copy.eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">{copy.title}</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">{copy.noTrips}</p>
          <Link href="/build-your-trip" className="btn-gold mt-7">{copy.create}</Link>
        </div>
      </main>
    );
  }

  const tripNights = nights(selected.check_in, selected.check_out);
  const image = imageFor(selected.property_name);
  const experiences = selected.activities || selected.package_name || "";
  const completedTrip = selected.check_out < new Date().toISOString().slice(0, 10);

  return (
    <main className="maldives-story-page bg-[#f1ebdf] pb-24 text-[#071922]">
      <style>{`
        @media print {
          header, footer, .story-no-print { display: none !important; }
          body, .maldives-story-page { background: white !important; }
          .story-print-card { box-shadow: none !important; break-inside: avoid; }
          .story-print-hero { min-height: 420px !important; }
        }
      `}</style>

      <section className="story-print-hero relative min-h-[560px] overflow-hidden text-white">
        <img src={image} alt={selected.property_name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031016]/[.98] via-[#031016]/[.75] to-[#031016]/[.25]" />
        <div className="container relative z-10 flex min-h-[560px] flex-col justify-between py-8 md:py-12">
          <Link href="/account" className="story-no-print inline-flex w-fit items-center gap-2 text-sm text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {copy.back}
          </Link>
          <div className="max-w-4xl">
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.3em] text-[#e3ca91]">
              <Sparkles className="h-4 w-4" /> {copy.eyebrow}
            </p>
            <h1 className="font-display mt-5 text-5xl leading-[1.02] md:text-7xl">{title || copy.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{copy.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur"><MapPin className="mr-2 inline h-4 w-4 text-[#e3ca91]" />{selected.property_name}</span>
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">{tripNights} {copy.nights}</span>
              <span className="border border-white/15 bg-black/25 px-4 py-3 backdrop-blur">{prettyDate(selected.check_in, locale)} → {prettyDate(selected.check_out, locale)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="story-no-print container -mt-7 relative z-20">
        <div className="grid gap-4 border border-[#c9a86a]/35 bg-[#fffdf8] p-5 shadow-xl md:grid-cols-[1fr_auto] md:items-center">
          <label className="text-xs font-semibold uppercase tracking-[.16em] text-[#8d7037]">
            {copy.choose}
            <select
              value={selected.id}
              onChange={event => setSelectedId(event.target.value)}
              className="mt-2 min-h-12 w-full border border-[#d0c5b0] bg-white px-4 text-base normal-case tracking-normal text-[#071922] outline-none focus:border-[#9c7d3d] md:max-w-xl"
            >
              {bookings.map(booking => (
                <option key={booking.id} value={booking.id}>{booking.property_name} · {booking.check_in}</option>
              ))}
            </select>
          </label>
          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${isPublic ? "border-emerald-600/25 bg-emerald-50 text-emerald-700" : "border-[#c9a86a]/30 bg-[#f3ead9] text-[#745b2e]"}`}>
            <Check className="h-4 w-4" /> {isPublic ? copy.publicLabel : copy.privateLabel}
          </span>
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-7">
          <section className="story-print-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-sm md:p-8">
            <label className="block text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">
              {copy.storyTitle}
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                maxLength={160}
                className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 text-2xl normal-case tracking-normal text-[#071922] outline-none focus:border-[#9c7d3d]"
              />
            </label>
            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">
              {copy.favorite}
              <textarea
                value={favoriteMoment}
                onChange={event => setFavoriteMoment(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder={copy.favoritePlaceholder}
                className="mt-2 w-full border border-[#d0c5b0] bg-white p-4 text-base normal-case leading-7 tracking-normal text-[#071922] outline-none placeholder:text-[#899194] focus:border-[#9c7d3d]"
              />
            </label>
            <label className="mt-6 block text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">
              {copy.journal}
              <textarea
                value={storyText}
                onChange={event => setStoryText(event.target.value)}
                maxLength={6000}
                rows={9}
                placeholder={copy.journalPlaceholder}
                className="mt-2 w-full border border-[#d0c5b0] bg-white p-4 text-base normal-case leading-8 tracking-normal text-[#071922] outline-none placeholder:text-[#899194] focus:border-[#9c7d3d]"
              />
            </label>
          </section>

          <section className="story-print-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-sm md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">{copy.stamps}</p>
            <h2 className="font-display mt-2 text-3xl">{copy.stamps}</h2>
            <p className="mt-2 text-sm leading-6 text-[#687377]">{copy.stampsBody}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {badges.map(([key, emoji, label]) => {
                const active = selectedBadges.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleBadge(key)}
                    className={`story-no-print flex min-h-16 items-center gap-3 border p-4 text-left transition ${active ? "border-[#9c7d3d] bg-[#f3ead9]" : "border-[#d8cdb8] bg-white hover:border-[#b69b63]"}`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-semibold">{label}</span>
                    {active && <Check className="ml-auto h-4 w-4 text-[#8d7037]" />}
                  </button>
                );
              })}
              {selectedBadges.length > 0 && (
                <div className="hidden print:grid print:col-span-2 print:grid-cols-3 print:gap-2">
                  {badges.filter(([key]) => selectedBadges.includes(key)).map(([key, emoji, label]) => (
                    <div key={key} className="border border-[#d8cdb8] p-3 text-sm">{emoji} {label}</div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="story-print-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">{copy.photos}</p>
                <h2 className="font-display mt-2 text-3xl">{copy.photos}</h2>
                <p className="mt-2 text-sm leading-6 text-[#687377]">{copy.photosBody}</p>
              </div>
              <label className="story-no-print btn-gold cursor-pointer">
                <ImagePlus className="h-4 w-4" /> {uploading ? copy.uploading : copy.upload}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading || photos.length >= 12}
                  onChange={uploadPhotos}
                  className="sr-only"
                />
              </label>
            </div>

            {photos.length === 0 ? (
              <div className="mt-7 flex min-h-44 flex-col items-center justify-center border border-dashed border-[#c9b88f] bg-[#f8f4ec] text-center">
                <Camera className="h-8 w-8 text-[#9c7d3d]" />
                <p className="mt-3 text-sm text-[#687377]">{copy.photosBody}</p>
              </div>
            ) : (
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {photos.map((photo, index) => (
                  <figure key={photo.id} className={`group relative overflow-hidden bg-[#e7dfd0] ${index === 0 ? "sm:col-span-2" : ""}`}>
                    {photo.signed_url ? (
                      <img src={photo.signed_url} alt={photo.caption || `Maldives memory ${index + 1}`} className={`w-full object-cover ${index === 0 ? "aspect-[16/9]" : "aspect-square"}`} />
                    ) : (
                      <div className="aspect-square" />
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="story-no-print absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white opacity-100 backdrop-blur sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label={copy.remove}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-7">
          <section className="story-print-card border border-[#c9a86a]/35 bg-[#071922] p-6 text-white shadow-xl md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9bd7b]">{copy.favoriteLabel}</p>
            <Heart className="mt-5 h-8 w-8 text-[#e3ca91]" />
            <p className="font-display mt-4 text-3xl leading-tight">{favoriteMoment || copy.favoritePlaceholder}</p>
          </section>

          <section className="story-print-card border border-[#d0c5b0] bg-[#fffdf8] p-6 md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{copy.route}</p>
            <div className="mt-6 space-y-0">
              <RouteStep icon={Plane} title={copy.routeAirport} />
              {Number(selected.speedboat_seats || 0) > 0 && <RouteStep icon={Ship} title={copy.routeTransfer} />}
              <RouteStep icon={MapPin} title={copy.routeStay} detail={selected.property_name} />
              {experiences && <RouteStep icon={Waves} title={copy.routeExperience} detail={experiences} />}
              <RouteStep icon={Star} title={copy.routeMemories} last />
            </div>
          </section>

          <section className="story-no-print border border-[#d0c5b0] bg-[#fffdf8] p-6">
            <button onClick={() => save()} disabled={saving || storyLoading} className="btn-gold w-full justify-center gap-2 disabled:opacity-50">
              <Check className="h-4 w-4" /> {saving ? copy.saving : copy.save}
            </button>
            <button onClick={shareStory} disabled={saving || storyLoading} className="btn-outline mt-3 w-full justify-center gap-2 border-[#8d7037] text-[#745b2e] disabled:opacity-50">
              <Share2 className="h-4 w-4" /> {copy.share}
            </button>
            {isPublic && (
              <button onClick={makePrivate} disabled={saving} className="mt-3 min-h-11 w-full text-sm font-semibold text-[#745b2e] underline underline-offset-4">
                {copy.private}
              </button>
            )}
            <button onClick={() => window.print()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#745b2e]">
              <Download className="h-4 w-4" /> {copy.pdf}
            </button>
            {status && <p className="mt-4 border border-emerald-600/20 bg-emerald-50 p-3 text-sm text-emerald-700">{status}</p>}
            {error && <p className="mt-4 border border-red-500/20 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {isPublic && shareUrl && (
              <p className="mt-4 break-all text-xs leading-5 text-[#687377]">{window.location.origin}{shareUrl}</p>
            )}
            <p className="mt-5 text-xs leading-6 text-[#687377]">{copy.privacy}</p>
          </section>

          {completedTrip && (
            <Link href={`/reviews?reservationId=${encodeURIComponent(selected.id)}`} className="story-no-print flex min-h-14 items-center justify-between border border-[#c9a86a]/35 bg-[#f3ead9] px-5 text-sm font-semibold text-[#745b2e]">
              {copy.review} <Star className="h-4 w-4" />
            </Link>
          )}
        </aside>
      </section>

      <section className="container border-t border-[#c9b88f] pt-8 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#8d7037]">{copy.created}</p>
        <p className="font-display mt-2 text-2xl">TRIPELOR</p>
      </section>
    </main>
  );
}

function RouteStep({ icon: Icon, title, detail, last = false }: { icon: typeof Plane; title: string; detail?: string; last?: boolean }) {
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
