"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Headphones,
  Hotel,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plane,
  ShieldCheck,
  Ship,
  Sparkles,
  TicketCheck,
  Utensils,
  WalletCards,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";

type Booking = {
  id: string;
  booking_reference?: string | null;
  property_name: string;
  room_type?: string | null;
  check_in: string;
  check_out: string;
  status?: string | null;
  payment_status?: string | null;
  package_name?: string | null;
  activities?: string | null;
  meal_plan?: string | null;
  estimated_total?: number | null;
  speedboat_seats?: number | null;
  speedboat_total?: number | null;
  adults?: number | null;
  children?: number | null;
};

type PreArrival = {
  flight_number?: string | null;
  arrival_time?: string | null;
  transfer_preference?: string | null;
  dietary?: string | null;
  celebration?: string | null;
  interests?: string[] | null;
  special_request?: string | null;
  status?: string | null;
  submitted_at?: string | null;
};

type ChecklistKey = "documents" | "concierge" | "transfer" | "wallet";

function maldivesToday() {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Indian/Maldives",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function daysBetween(from: string, to: string) {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function imageFor(propertyName: string) {
  const value = propertyName.toLowerCase();
  if (value.includes("rivethi")) return "/properties/rivethi-beach-hotel/1719713475.jpeg";
  if (value.includes("masfalhi")) return "/images%20(3).jpeg";
  return "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
}

export default function JourneyModePage() {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? {
        back: "Torna a My Tripelor",
        eyebrow: "Tripelor Journey Mode",
        title: "Il tuo viaggio, passo dopo passo.",
        subtitle: "Tutto ciò che ti serve prima dell'arrivo, durante il soggiorno e fino alla partenza, in un unico posto.",
        loading: "Preparazione del tuo Journey Mode...",
        unavailable: "Journey Mode non è disponibile",
        noTripTitle: "Il tuo prossimo viaggio apparirà qui.",
        noTripBody: "Quando avrai una prenotazione attiva, Tripelor trasformerà questo spazio nel tuo assistente di viaggio personale.",
        build: "Pianifica un viaggio",
        next: "Cosa devo fare adesso?",
        days: "giorni alla partenza",
        today: "Il viaggio inizia oggi",
        staying: "Sei alle Maldive",
        departing: "Oggi è il giorno della partenza",
        bookingRef: "Riferimento prenotazione",
        status: "Stato",
        payment: "Pagamento",
        paid: "Pagato",
        paymentPending: "In attesa",
        timeline: "Il tuo viaggio",
        timelineBody: "Una vista semplice dei prossimi momenti importanti.",
        beforeTravel: "Prima di partire",
        beforeTravelDetail: "Controlla i documenti, completa le preferenze pre-arrivo e tieni a portata di mano il Travel Wallet.",
        arrival: "Arrivo alle Maldive",
        flight: "Volo",
        arrivalTime: "Orario di arrivo",
        transfer: "Trasferimento in motoscafo",
        transferRequested: "posti richiesti",
        transferPending: "Aggiungi o conferma il trasferimento con Tripelor.",
        stay: "Soggiorno sull'isola",
        experiences: "Esperienze",
        departure: "Partenza",
        checklist: "Checklist di viaggio",
        checklistBody: "Salvata su questo dispositivo. Spunta gli elementi mentre ti prepari.",
        documents: "Passaporto e documenti di viaggio pronti",
        concierge: "Preferenze pre-arrivo inviate",
        transferCheck: "Trasferimento controllato",
        wallet: "Travel Wallet salvato o pronto offline",
        quick: "Accesso rapido",
        walletTitle: "Travel Wallet",
        walletBody: "Voucher, prenotazione e riepilogo del viaggio.",
        conciergeTitle: "Concierge pre-arrivo",
        conciergeBody: "Volo, trasferimento, dieta e richieste speciali.",
        guestTitle: "Guest Services",
        guestBody: "Durante il soggiorno: pulizia, colazione, attrezzatura ed escursioni.",
        transferTitle: "Trasferimenti",
        transferBody: "Controlla o organizza il motoscafo.",
        storyTitle: "My Maldives Story",
        storyBody: "Salva foto, momenti preferiti e ricordi del viaggio.",
        whatsapp: "Chatta con Tripelor",
        map: "Apri la posizione",
        whatNextPreArrival: "Completa i dettagli pre-arrivo",
        whatNextPreArrivalBody: "Aggiungi volo, orario di arrivo e preferenze così il concierge può preparare il tuo arrivo.",
        whatNextTransfer: "Organizza il trasferimento",
        whatNextTransferBody: "Non vediamo ancora posti in motoscafo associati a questa prenotazione.",
        whatNextWallet: "Controlla il tuo Travel Wallet",
        whatNextWalletBody: "Conserva riferimento prenotazione, soggiorno e dettagli di viaggio prima della partenza.",
        whatNextArrival: "Segui i dettagli di arrivo",
        whatNextArrivalBody: "Apri il Travel Wallet e segui le istruzioni di trasferimento confermate dal concierge.",
        whatNextStay: "Apri Guest Services",
        whatNextStayBody: "Richiedi assistenza per colazione, housekeeping, snorkeling, escursioni o trasferimenti.",
        whatNextDeparture: "Conferma la partenza",
        whatNextDepartureBody: "Controlla l'orario del trasferimento e tieni pronti bagagli e Travel Wallet.",
        open: "Apri",
        meal: "Piano pasti",
        room: "Camera",
        tripTotal: "Totale viaggio",
      }
    : locale === "ru"
      ? {
          back: "Назад в My Tripelor",
          eyebrow: "Tripelor Journey Mode",
          title: "Ваша поездка — шаг за шагом.",
          subtitle: "Всё необходимое до прилёта, во время отдыха и до отправления — в одном месте.",
          loading: "Готовим Journey Mode...",
          unavailable: "Journey Mode недоступен",
          noTripTitle: "Здесь появится ваша следующая поездка.",
          noTripBody: "Когда появится активное бронирование, Tripelor превратит эту страницу в вашего персонального помощника в поездке.",
          build: "Спланировать поездку",
          next: "Что мне делать дальше?",
          days: "дней до поездки",
          today: "Путешествие начинается сегодня",
          staying: "Вы на Мальдивах",
          departing: "Сегодня день отправления",
          bookingRef: "Номер бронирования",
          status: "Статус",
          payment: "Оплата",
          paid: "Оплачено",
          paymentPending: "Ожидается",
          timeline: "Ваш маршрут",
          timelineBody: "Простая последовательность ближайших важных этапов.",
          beforeTravel: "До поездки",
          beforeTravelDetail: "Проверьте документы, заполните данные перед прилётом и держите Travel Wallet под рукой.",
          arrival: "Прибытие на Мальдивы",
          flight: "Рейс",
          arrivalTime: "Время прилёта",
          transfer: "Трансфер на скоростном катере",
          transferRequested: "мест запрошено",
          transferPending: "Добавьте или подтвердите трансфер с Tripelor.",
          stay: "Проживание на острове",
          experiences: "Впечатления",
          departure: "Отправление",
          checklist: "Чек-лист поездки",
          checklistBody: "Сохраняется на этом устройстве. Отмечайте готовые пункты.",
          documents: "Паспорт и документы готовы",
          concierge: "Данные перед прилётом отправлены",
          transferCheck: "Трансфер проверен",
          wallet: "Travel Wallet сохранён или готов офлайн",
          quick: "Быстрый доступ",
          walletTitle: "Travel Wallet",
          walletBody: "Ваучер, бронирование и сводка поездки.",
          conciergeTitle: "Консьерж до прилёта",
          conciergeBody: "Рейс, трансфер, питание и особые пожелания.",
          guestTitle: "Guest Services",
          guestBody: "Во время проживания: уборка, завтрак, снаряжение и экскурсии.",
          transferTitle: "Трансферы",
          transferBody: "Проверьте или организуйте скоростной катер.",
          storyTitle: "My Maldives Story",
          storyBody: "Сохраняйте фотографии, любимые моменты и воспоминания о поездке.",
          whatsapp: "Написать Tripelor",
          map: "Открыть карту",
          whatNextPreArrival: "Заполните данные перед прилётом",
          whatNextPreArrivalBody: "Добавьте рейс, время прилёта и пожелания, чтобы консьерж подготовил ваш приезд.",
          whatNextTransfer: "Организуйте трансфер",
          whatNextTransferBody: "Пока к бронированию не привязаны места на скоростном катере.",
          whatNextWallet: "Проверьте Travel Wallet",
          whatNextWalletBody: "Сохраните номер бронирования, данные проживания и поездки перед отправлением.",
          whatNextArrival: "Следуйте информации по прибытию",
          whatNextArrivalBody: "Откройте Travel Wallet и следуйте подтверждённым консьержем инструкциям по трансферу.",
          whatNextStay: "Откройте Guest Services",
          whatNextStayBody: "Запросите помощь с завтраком, уборкой, снорклингом, экскурсиями или трансфером.",
          whatNextDeparture: "Подтвердите отправление",
          whatNextDepartureBody: "Проверьте время трансфера и держите багаж и Travel Wallet готовыми.",
          open: "Открыть",
          meal: "План питания",
          room: "Номер",
          tripTotal: "Сумма поездки",
        }
      : {
          back: "Back to My Tripelor",
          eyebrow: "Tripelor Journey Mode",
          title: "Your journey, one step at a time.",
          subtitle: "Everything you need before arrival, during your stay and all the way to departure — in one place.",
          loading: "Preparing your Journey Mode...",
          unavailable: "Journey Mode unavailable",
          noTripTitle: "Your next journey will appear here.",
          noTripBody: "Once you have an active booking, Tripelor turns this space into your personal Maldives travel companion.",
          build: "Plan a Trip",
          next: "What do I do next?",
          days: "days until your trip",
          today: "Your journey starts today",
          staying: "You are in the Maldives",
          departing: "Today is departure day",
          bookingRef: "Booking reference",
          status: "Status",
          payment: "Payment",
          paid: "Paid",
          paymentPending: "Pending",
          timeline: "Your Journey",
          timelineBody: "A simple view of the important moments ahead.",
          beforeTravel: "Before you travel",
          beforeTravelDetail: "Check your documents, complete pre-arrival preferences and keep your Travel Wallet ready.",
          arrival: "Arrival in the Maldives",
          flight: "Flight",
          arrivalTime: "Arrival time",
          transfer: "Speedboat transfer",
          transferRequested: "seat(s) requested",
          transferPending: "Add or confirm your transfer with Tripelor.",
          stay: "Island stay",
          experiences: "Experiences",
          departure: "Departure",
          checklist: "Travel Checklist",
          checklistBody: "Saved on this device. Tick items off as you prepare.",
          documents: "Passport & travel documents ready",
          concierge: "Pre-arrival preferences submitted",
          transferCheck: "Transfer checked",
          wallet: "Travel Wallet saved or ready offline",
          quick: "Quick Access",
          walletTitle: "Travel Wallet",
          walletBody: "Voucher, booking and journey summary.",
          conciergeTitle: "Pre-Arrival Concierge",
          conciergeBody: "Flight, transfer, dietary and special requests.",
          guestTitle: "Guest Services",
          guestBody: "During your stay: housekeeping, breakfast, gear and excursions.",
          transferTitle: "Transfers",
          transferBody: "Check or arrange your speedboat.",
          storyTitle: "My Maldives Story",
          storyBody: "Save photos, favourite moments and memories from your journey.",
          whatsapp: "Chat with Tripelor",
          map: "Open Location",
          whatNextPreArrival: "Complete your pre-arrival details",
          whatNextPreArrivalBody: "Add your flight, arrival time and preferences so your concierge can prepare for your arrival.",
          whatNextTransfer: "Arrange your transfer",
          whatNextTransferBody: "We do not see speedboat seats attached to this booking yet.",
          whatNextWallet: "Review your Travel Wallet",
          whatNextWalletBody: "Keep your booking reference, stay and journey details ready before you travel.",
          whatNextArrival: "Follow your arrival details",
          whatNextArrivalBody: "Open your Travel Wallet and follow the transfer instructions confirmed by your concierge.",
          whatNextStay: "Open Guest Services",
          whatNextStayBody: "Request breakfast, housekeeping, snorkeling equipment, excursions or transfer help.",
          whatNextDeparture: "Confirm your departure",
          whatNextDepartureBody: "Check your transfer timing and keep your luggage and Travel Wallet ready.",
          open: "Open",
          meal: "Meal plan",
          room: "Room",
          tripTotal: "Trip total",
        };

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [preArrival, setPreArrival] = useState<PreArrival | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>({
    documents: false,
    concierge: false,
    transfer: false,
    wallet: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        const member = await me.json();
        if (!member.user) {
          window.location.href = "/login?next=%2Faccount%2Fjourney";
          return;
        }

        const response = await fetch("/api/account/bookings", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load your journey.");
        setBookings(data.bookings || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your journey.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trip = useMemo(() => {
    const today = maldivesToday();
    return bookings
      .filter(booking =>
        String(booking.status || "").toLowerCase() !== "cancelled" &&
        booking.check_out &&
        booking.check_out >= today,
      )
      .sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)))[0] || null;
  }, [bookings]);

  useEffect(() => {
    if (!trip?.id) return;
    let active = true;
    fetch(`/api/account/pre-arrival?reservationId=${encodeURIComponent(trip.id)}`, { cache: "no-store" })
      .then(response => response.json())
      .then(data => {
        if (active && data?.request) setPreArrival(data.request);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [trip?.id]);

  useEffect(() => {
    if (!trip?.id) return;
    try {
      const saved = localStorage.getItem(`tripelor-journey-checklist-${trip.id}`);
      if (saved) setChecklist(current => ({ ...current, ...JSON.parse(saved) }));
    } catch {
      // Journey Mode remains usable without local storage.
    }
  }, [trip?.id]);

  function toggleChecklist(key: ChecklistKey) {
    setChecklist(current => {
      const next = { ...current, [key]: !current[key] };
      if (trip?.id) {
        try {
          localStorage.setItem(`tripelor-journey-checklist-${trip.id}`, JSON.stringify(next));
        } catch {
          // Keep current-tab state if storage is unavailable.
        }
      }
      return next;
    });
  }

  if (loading) {
    return <main className="container py-20 text-gray-400">{copy.loading}</main>;
  }

  if (error) {
    return (
      <main className="container py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <Sparkles className="mx-auto h-9 w-9 text-gold" />
          <h1 className="font-display mt-4 text-4xl">{copy.unavailable}</h1>
          <p className="mt-3 text-gray-400">{error}</p>
          <Link href="/account" className="btn-outline mt-6">{copy.back}</Link>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="container py-16 pb-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/[.03] p-8 text-center md:p-12">
          <Sparkles className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-5">{copy.eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">{copy.noTripTitle}</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">{copy.noTripBody}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">{copy.build}</Link>
            <Link href="/account" className="btn-outline">{copy.back}</Link>
          </div>
        </div>
      </main>
    );
  }

  const today = maldivesToday();
  const daysUntil = daysBetween(today, trip.check_in);
  const speedboatSeats = Number(trip.speedboat_seats || 0);
  const activities = trip.activities || trip.package_name || "";
  const paymentPaid = String(trip.payment_status || "").toLowerCase() === "paid";
  const preArrivalSubmitted = Boolean(preArrival?.submitted_at || preArrival?.flight_number || preArrival?.arrival_time);
  const stage =
    today < trip.check_in ? "upcoming" :
    today === trip.check_out ? "departing" :
    today >= trip.check_in && today < trip.check_out ? "staying" :
    "upcoming";

  const nextAction =
    stage === "departing"
      ? { title: copy.whatNextDeparture, body: copy.whatNextDepartureBody, href: speedboatSeats > 0 ? "/account/wallet" : "/speedboat", icon: Ship }
      : stage === "staying"
        ? { title: copy.whatNextStay, body: copy.whatNextStayBody, href: "/account/guest-portal", icon: BellRing }
        : daysUntil <= 0
          ? { title: copy.whatNextArrival, body: copy.whatNextArrivalBody, href: "/account/wallet", icon: Plane }
          : !preArrivalSubmitted
            ? { title: copy.whatNextPreArrival, body: copy.whatNextPreArrivalBody, href: "/account/pre-arrival", icon: Headphones }
            : speedboatSeats <= 0
              ? { title: copy.whatNextTransfer, body: copy.whatNextTransferBody, href: "/speedboat", icon: Ship }
              : { title: copy.whatNextWallet, body: copy.whatNextWalletBody, href: "/account/wallet", icon: WalletCards };

  const NextIcon = nextAction.icon;
  const image = imageFor(trip.property_name);
  const whatsappText = encodeURIComponent(
    `Hello Tripelor, I need help with my journey${trip.booking_reference ? ` (${trip.booking_reference})` : ""}.`,
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${trip.property_name}, Maldives`)}`;
  const checklistItems: { key: ChecklistKey; label: string; auto?: boolean }[] = [
    { key: "documents", label: copy.documents },
    { key: "concierge", label: copy.concierge, auto: preArrivalSubmitted },
    { key: "transfer", label: copy.transferCheck, auto: speedboatSeats > 0 },
    { key: "wallet", label: copy.wallet },
  ];
  const completed = checklistItems.filter(item => item.auto || checklist[item.key]).length;
  const progress = Math.round((completed / checklistItems.length) * 100);

  return (
    <main className="journey-mode-page bg-[#06151c] pb-24 text-white">
      <section className="relative min-h-[520px] overflow-hidden border-b border-white/10">
        <img src={image} alt={trip.property_name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#031016]/[.98] via-[#031016]/[.82] to-[#031016]/[.35]" />
        <div className="container relative z-10 flex min-h-[520px] flex-col justify-between py-8 md:py-12">
          <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm text-white/55 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {copy.back}
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.3em] text-[#e3ca91]">
                <Sparkles className="h-4 w-4" /> {copy.eyebrow}
              </p>
              <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] md:text-7xl">{copy.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{copy.subtitle}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 border border-white/15 bg-black/25 px-4 py-3 text-sm backdrop-blur-md">
                  <MapPin className="h-4 w-4 text-[#e3ca91]" /> {trip.property_name}
                </span>
                <span className="inline-flex items-center gap-2 border border-white/15 bg-black/25 px-4 py-3 text-sm backdrop-blur-md">
                  <CalendarDays className="h-4 w-4 text-[#e3ca91]" />
                  {stage === "staying"
                    ? copy.staying
                    : stage === "departing"
                      ? copy.departing
                      : daysUntil === 0
                        ? copy.today
                        : `${daysUntil} ${copy.days}`}
                </span>
              </div>
            </div>

            <aside className="border border-[#e3ca91]/25 bg-[#041117]/80 p-6 backdrop-blur-xl">
              <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#e3ca91]">{copy.bookingRef}</p>
              <p className="font-display mt-2 break-all text-3xl text-white">{trip.booking_reference || "Pending"}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-xs">
                <div>
                  <p className="text-white/35">{copy.status}</p>
                  <p className="mt-1 font-semibold text-white">{trip.status || "Pending"}</p>
                </div>
                <div>
                  <p className="text-white/35">{copy.payment}</p>
                  <p className={`mt-1 font-semibold ${paymentPaid ? "text-emerald-300" : "text-amber-200"}`}>
                    {paymentPaid ? copy.paid : copy.paymentPending}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="container -mt-8 relative z-20">
        <div className="overflow-hidden border border-[#d9bd7b]/35 bg-gradient-to-br from-[#153640] to-[#071922] shadow-[0_30px_80px_rgba(0,0,0,.3)]">
          <div className="grid lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="p-6 md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d9bd7b]">{copy.next}</p>
              <h2 className="font-display mt-3 text-3xl md:text-4xl">{nextAction.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">{nextAction.body}</p>
            </div>
            <Link href={nextAction.href} className="flex min-h-28 items-center gap-3 border-t border-white/10 bg-[#d9bd7b] px-7 font-semibold text-[#071922] transition hover:bg-[#ead7aa] lg:border-l lg:border-t-0">
              <NextIcon className="h-5 w-5" /> {copy.open} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container grid gap-8 py-12 xl:grid-cols-[1.2fr_.8fr]">
        <div>
          <div>
            <p className="eyebrow">{copy.timeline}</p>
            <h2 className="font-display mt-3 text-4xl">{copy.timeline}</h2>
            <p className="mt-3 text-sm leading-6 text-white/45">{copy.timelineBody}</p>
          </div>

          <div className="mt-8 space-y-0 border-l border-gold/25 pl-6 md:pl-8">
            <JourneyStep icon={ShieldCheck} title={copy.beforeTravel} detail={copy.beforeTravelDetail} />
            <JourneyStep
              icon={Plane}
              title={copy.arrival}
              detail={[
                trip.check_in,
                preArrival?.flight_number ? `${copy.flight}: ${preArrival.flight_number}` : "",
                preArrival?.arrival_time ? `${copy.arrivalTime}: ${preArrival.arrival_time}` : "",
              ].filter(Boolean).join(" · ")}
            />
            <JourneyStep
              icon={Ship}
              title={copy.transfer}
              detail={speedboatSeats > 0 ? `${speedboatSeats} ${copy.transferRequested}` : copy.transferPending}
            />
            <JourneyStep
              icon={Hotel}
              title={copy.stay}
              detail={[
                trip.property_name,
                trip.room_type ? `${copy.room}: ${trip.room_type}` : "",
                trip.meal_plan ? `${copy.meal}: ${trip.meal_plan}` : "",
              ].filter(Boolean).join(" · ")}
            />
            {activities && <JourneyStep icon={Waves} title={copy.experiences} detail={activities} />}
            <JourneyStep icon={CalendarDays} title={copy.departure} detail={trip.check_out} last />
          </div>
        </div>

        <aside className="space-y-6">
          <section className="border border-white/10 bg-white/[.025] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">{copy.checklist}</p>
                <h2 className="font-display mt-2 text-3xl">{progress}%</h2>
              </div>
              <CheckCircle2 className="h-8 w-8 text-gold" />
            </div>
            <p className="mt-3 text-sm leading-6 text-white/45">{copy.checklistBody}</p>
            <div className="mt-5 h-1.5 overflow-hidden bg-white/10">
              <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-5 divide-y divide-white/10">
              {checklistItems.map(item => {
                const checked = Boolean(item.auto || checklist[item.key]);
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.auto}
                    onClick={() => toggleChecklist(item.key)}
                    className="flex min-h-14 w-full items-center gap-3 py-3 text-left disabled:cursor-default"
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center border ${checked ? "border-gold bg-gold text-[#071922]" : "border-white/20 text-transparent"}`}>
                      <Check className="h-4 w-4" />
                    </span>
                    <span className={checked ? "text-white/75" : "text-white/55"}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="border border-gold/20 bg-gold/[.05] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">{copy.quick}</p>
            <div className="mt-5 grid gap-3">
              <QuickLink href="/account/wallet" icon={WalletCards} title={copy.walletTitle} body={copy.walletBody} />
              <QuickLink href="/account/pre-arrival" icon={Headphones} title={copy.conciergeTitle} body={copy.conciergeBody} />
              {stage === "staying" && <QuickLink href="/account/guest-portal" icon={BellRing} title={copy.guestTitle} body={copy.guestBody} />}
              <QuickLink href="/speedboat" icon={Ship} title={copy.transferTitle} body={copy.transferBody} />
              <QuickLink href={`/account/story?reservationId=${encodeURIComponent(trip.id)}`} icon={Sparkles} title={copy.storyTitle} body={copy.storyBody} />
            </div>
          </section>
        </aside>
      </section>

      <section className="container grid gap-px overflow-hidden border border-white/10 bg-white/10 md:grid-cols-4">
        <InfoTile icon={TicketCheck} label={copy.bookingRef} value={trip.booking_reference || "Pending"} />
        <InfoTile icon={Utensils} label={copy.meal} value={trip.meal_plan || "As booked"} />
        <InfoTile icon={PackageCheck} label={copy.experiences} value={activities || "—"} />
        <InfoTile
          icon={CreditCard}
          label={copy.tripTotal}
          value={trip.estimated_total != null ? `USD ${Number(trip.estimated_total).toFixed(2)}` : "—"}
        />
      </section>

      <section className="container mt-8 grid gap-3 sm:grid-cols-3">
        <a
          href={`https://wa.me/9609429403?text=${whatsappText}`}
          className="btn-gold justify-center gap-2"
        >
          <MessageCircle className="h-4 w-4" /> {copy.whatsapp}
        </a>
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn-outline justify-center gap-2">
          <MapPin className="h-4 w-4" /> {copy.map}
        </a>
        <Link href="/account/wallet" className="btn-outline justify-center gap-2">
          <WalletCards className="h-4 w-4" /> {copy.walletTitle}
        </Link>
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
  icon: typeof CalendarDays;
  title: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className={`relative ${last ? "pb-0" : "pb-8"}`}>
      <span className="absolute -left-[39px] top-0 flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-[#06151c] text-gold md:-left-[47px]">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/45">{detail}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof WalletCards;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="group grid grid-cols-[36px_1fr_auto] items-center gap-3 border border-white/10 bg-black/15 p-4 transition hover:border-gold/30">
      <Icon className="h-5 w-5 text-gold" />
      <span>
        <strong className="block text-sm text-white">{title}</strong>
        <span className="mt-1 block text-xs leading-5 text-white/40">{body}</span>
      </span>
      <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:text-gold" />
    </Link>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TicketCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 bg-[#071922] p-5">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-3 text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold text-white/75">{value}</p>
    </div>
  );
}
