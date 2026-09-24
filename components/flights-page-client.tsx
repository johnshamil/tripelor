"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Luggage,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";

type TripType = "round-trip" | "one-way";
type Cabin = "Economy" | "Premium Economy" | "Business" | "First";

function todayMaldives() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Indian/Maldives",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function FlightsPageClient() {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? {
        eyebrow: "Flights by Tripelor",
        title: "Richiedi il tuo volo per le Maldive.",
        body: "Invia il tuo itinerario. Tripelor controllerà una fonte autorizzata airline/GDS/consolidator e ti invierà una quotazione prima di qualsiasi pagamento.",
        round: "Andata e ritorno",
        one: "Solo andata",
        from: "Da",
        to: "A",
        depart: "Partenza",
        return: "Ritorno",
        cabin: "Classe",
        adults: "Adulti",
        children: "Bambini",
        infants: "Neonati",
        flexible: "Le mie date sono flessibili",
        name: "Nome del passeggero principale",
        email: "Email",
        phone: "WhatsApp / telefono",
        notes: "Preferenze o note",
        marketing: "Vorrei ricevere occasionalmente offerte voli e vacanze Tripelor. Facoltativo.",
        submit: "Richiedi tariffa",
        sending: "Invio...",
        notBooking: "Questa richiesta non prenota o trattiene un posto. Tariffa, disponibilità, bagaglio e regole sono confermati da Tripelor prima del pagamento.",
        success: "Richiesta inviata",
        successBody: "Il Flight Desk di Tripelor controllerà la tariffa e ti contatterà con la quotazione.",
        ref: "Riferimento",
        account: "Se eri connesso, puoi seguire la richiesta in My Flights.",
        myFlights: "Apri My Flights",
        another: "Nuova richiesta",
        routeHint: "Usa città o codice aeroporto, ad esempio Dhaka (DAC), Colombo (CMB), Kuala Lumpur (KUL).",
        why: "Perché Tripelor",
        benefit1: "Volo + hotel + motoscafo nello stesso viaggio",
        benefit2: "Supporto per connessioni con trasferimenti alle isole",
        benefit3: "PNR ed e-ticket visibili in My Tripelor dopo l’emissione",
      }
    : locale === "ru"
      ? {
          eyebrow: "Flights by Tripelor",
          title: "Запросите авиабилет на Мальдивы.",
          body: "Отправьте маршрут. Tripelor проверит тариф через авторизованный источник airline/GDS/consolidator и пришлёт предложение до оплаты.",
          round: "Туда и обратно",
          one: "В одну сторону",
          from: "Откуда",
          to: "Куда",
          depart: "Вылет",
          return: "Возврат",
          cabin: "Класс",
          adults: "Взрослые",
          children: "Дети",
          infants: "Младенцы",
          flexible: "Мои даты гибкие",
          name: "Имя основного пассажира",
          email: "Email",
          phone: "WhatsApp / телефон",
          notes: "Пожелания или заметки",
          marketing: "Хочу иногда получать предложения Tripelor по перелётам и отдыху. Необязательно.",
          submit: "Запросить тариф",
          sending: "Отправляем...",
          notBooking: "Этот запрос не бронирует и не удерживает место. Тариф, наличие, багаж и правила подтверждаются Tripelor до оплаты.",
          success: "Запрос отправлен",
          successBody: "Flight Desk Tripelor проверит тариф и свяжется с вами с предложением.",
          ref: "Номер запроса",
          account: "Если вы были авторизованы, запрос можно отслеживать в My Flights.",
          myFlights: "Открыть My Flights",
          another: "Новый запрос",
          routeHint: "Укажите город или код аэропорта, например Dhaka (DAC), Colombo (CMB), Kuala Lumpur (KUL).",
          why: "Почему Tripelor",
          benefit1: "Перелёт + отель + скоростной катер в одном путешествии",
          benefit2: "Помощь с пересадкой на островной трансфер",
          benefit3: "PNR и e-ticket в My Tripelor после выписки",
        }
      : {
          eyebrow: "Flights by Tripelor",
          title: "Request your flight to the Maldives.",
          body: "Send us your itinerary. Tripelor will check an authorized airline/GDS/consolidator source and send you a fare quote before any payment.",
          round: "Round-trip",
          one: "One-way",
          from: "From",
          to: "To",
          depart: "Departure",
          return: "Return",
          cabin: "Cabin",
          adults: "Adults",
          children: "Children",
          infants: "Infants",
          flexible: "My travel dates are flexible",
          name: "Lead passenger name",
          email: "Email",
          phone: "WhatsApp / phone",
          notes: "Preferences or notes",
          marketing: "I’d like occasional Tripelor flight and holiday offers. Optional.",
          submit: "Request My Fare",
          sending: "Sending...",
          notBooking: "This request does not book or hold an airline seat. Fare, availability, baggage and rules are confirmed by Tripelor before payment.",
          success: "Flight request received",
          successBody: "Tripelor Flight Desk will check the fare and contact you with the quote.",
          ref: "Reference",
          account: "If you were signed in, you can track this request in My Flights.",
          myFlights: "Open My Flights",
          another: "Request Another Flight",
          routeHint: "Use a city or airport code, for example Dhaka (DAC), Colombo (CMB), Kuala Lumpur (KUL).",
          why: "Why book through Tripelor",
          benefit1: "Flight + stay + speedboat in one Maldives journey",
          benefit2: "Help matching your arrival with island transfers",
          benefit3: "PNR and e-ticket visible in My Tripelor after ticketing",
        };

  const [tripType, setTripType] = useState<TripType>("round-trip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("MLE");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [cabin, setCabin] = useState<Cabin>("Economy");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [reference, setReference] = useState("");
  const [accountLinked, setAccountLinked] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const routeSummary = useMemo(() => {
    const from = origin.trim() || "Your airport";
    const to = destination.trim() || "MLE";
    return tripType === "round-trip"
      ? `${from} → ${to} → ${from}`
      : `${from} → ${to}`;
  }, [origin, destination, tripType]);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/flights/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripType,
          origin,
          destination,
          departureDate,
          returnDate: tripType === "round-trip" ? returnDate : "",
          cabin,
          adults,
          children,
          infants,
          flexibleDates,
          customerName,
          customerEmail,
          customerPhone,
          notes,
          marketingConsent,
          company,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save your flight request.");
      setReference(data.reference || "");
      setAccountLinked(Boolean(data.accountLinked));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your flight request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <main className="bg-[#06151c] text-white">
        <section className="container flex min-h-[72svh] items-center py-16">
          <div className="mx-auto w-full max-w-3xl border border-gold/30 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.18),transparent_36%),rgba(255,255,255,.025)] p-7 text-center shadow-[0_35px_110px_rgba(0,0,0,.3)] md:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
              <TicketCheck className="h-7 w-7 text-gold" />
            </div>
            <p className="eyebrow mt-6">{copy.eyebrow}</p>
            <h1 className="font-display mt-3 text-4xl md:text-6xl">{copy.success}</h1>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/60">{copy.successBody}</p>
            <div className="mx-auto mt-7 max-w-md border-y border-white/10 py-5">
              <p className="text-[10px] uppercase tracking-[.2em] text-white/35">{copy.ref}</p>
              <p className="font-display mt-2 text-3xl text-gold">{reference}</p>
              <p className="mt-3 text-sm text-white/50">{routeSummary}</p>
            </div>
            <p className="mt-5 text-xs leading-6 text-white/45">{copy.account}</p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              {accountLinked && <Link href="/account/flights" className="btn-gold">{copy.myFlights} <ArrowRight className="h-4 w-4" /></Link>}
              <button type="button" onClick={() => setReference("")} className="btn-outline">{copy.another}</button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <section className="relative overflow-hidden bg-[#06151c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(217,189,123,.20),transparent_30%),radial-gradient(circle_at_10%_85%,rgba(24,103,125,.17),transparent_27%)]" />
        <div className="container relative grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 className="font-display mt-4 max-w-4xl text-5xl leading-[1.02] md:text-7xl">{copy.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{copy.body}</p>
          </div>
          <div className="border border-white/10 bg-white/[.025] p-6">
            <Plane className="h-6 w-6 text-gold" />
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.2em] text-gold">{copy.why}</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/55">
              {[copy.benefit1, copy.benefit2, copy.benefit3].map(item => (
                <p key={item} className="flex gap-3"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" /> {item}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-10">
        <div className="mx-auto max-w-5xl border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-[0_25px_80px_rgba(34,43,46,.1)] md:p-9">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTripType("round-trip")} className={tripType === "round-trip" ? "btn-gold justify-center" : "btn-outline justify-center border-[#b9aa8c] text-[#53616a]"}>{copy.round}</button>
            <button type="button" onClick={() => setTripType("one-way")} className={tripType === "one-way" ? "btn-gold justify-center" : "btn-outline justify-center border-[#b9aa8c] text-[#53616a]"}>{copy.one}</button>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label={copy.from}>
              <input value={origin} onChange={event => setOrigin(event.target.value)} placeholder="Dhaka (DAC)" className="flight-control" />
            </Field>
            <Field label={copy.to}>
              <input value={destination} onChange={event => setDestination(event.target.value.toUpperCase())} placeholder="MLE" className="flight-control" />
            </Field>
          </div>
          <p className="mt-2 text-xs text-[#778184]">{copy.routeHint}</p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Field label={copy.depart}>
              <input type="date" min={todayMaldives()} value={departureDate} onChange={event => setDepartureDate(event.target.value)} className="flight-control" />
            </Field>
            {tripType === "round-trip" && (
              <Field label={copy.return}>
                <input type="date" min={departureDate || todayMaldives()} value={returnDate} onChange={event => setReturnDate(event.target.value)} className="flight-control" />
              </Field>
            )}
            <Field label={copy.cabin}>
              <select value={cabin} onChange={event => setCabin(event.target.value as Cabin)} className="flight-control">
                {(["Economy","Premium Economy","Business","First"] as Cabin[]).map(value => <option key={value}>{value}</option>)}
              </select>
            </Field>
            <label className="flex min-h-14 items-center gap-3 self-end border border-[#d0c5b0] bg-white px-4 text-sm">
              <input type="checkbox" checked={flexibleDates} onChange={event => setFlexibleDates(event.target.checked)} />
              {copy.flexible}
            </label>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <Counter label={copy.adults} value={adults} min={1} max={20} onChange={setAdults} />
            <Counter label={copy.children} value={children} min={0} max={20} onChange={setChildren} />
            <Counter label={copy.infants} value={infants} min={0} max={10} onChange={setInfants} />
          </div>

          <div className="mt-8 border-t border-[#d0c5b0] pt-8">
            <h2 className="font-display text-3xl">Passenger contact</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label={copy.name}>
                <input value={customerName} onChange={event => setCustomerName(event.target.value)} maxLength={120} className="flight-control" />
              </Field>
              <Field label={copy.email}>
                <input type="email" value={customerEmail} onChange={event => setCustomerEmail(event.target.value)} maxLength={250} className="flight-control" />
              </Field>
              <Field label={copy.phone}>
                <input value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} maxLength={60} placeholder="+960..." className="flight-control" />
              </Field>
              <Field label={copy.notes}>
                <input value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} placeholder="Preferred airline, baggage, transit preference..." className="flight-control" />
              </Field>
              <label className="hidden" aria-hidden="true">Company<input tabIndex={-1} autoComplete="off" value={company} onChange={event => setCompany(event.target.value)} /></label>
            </div>

            <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#58656c]">
              <input type="checkbox" checked={marketingConsent} onChange={event => setMarketingConsent(event.target.checked)} className="mt-1" />
              {copy.marketing}
            </label>
          </div>

          {error && <p role="alert" className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

          <div className="mt-7 flex flex-col gap-4 border-t border-[#d0c5b0] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="flex max-w-2xl gap-3 text-xs leading-6 text-[#687377]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7037]" /> {copy.notBooking}</p>
            <button type="button" onClick={submit} disabled={submitting} className="btn-gold shrink-0 disabled:opacity-50">
              <Plane className="h-4 w-4" /> {submitting ? copy.sending : copy.submit}
            </button>
          </div>
        </div>
      </section>

      <section className="container pt-8">
        <div className="grid gap-4 md:grid-cols-3">
          <MiniCard icon={Plane} title="Flight Request" text="Tripelor checks an authorized fare source before quoting." />
          <MiniCard icon={Luggage} title="Fare Conditions" text="Baggage, change/refund conditions and quote expiry are shown before payment." />
          <MiniCard icon={TicketCheck} title="Ticket Issuance" text="After payment and issuance, your PNR and e-ticket appear in My Tripelor." />
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium">{label}{children}</label>;
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="border border-[#d0c5b0] bg-white p-4">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">−</button>
        <strong className="font-display text-3xl text-[#8d7037]">{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

function MiniCard({ icon: Icon, title, text }: { icon: typeof Plane; title: string; text: string }) {
  return (
    <div className="border border-[#d0c5b0] bg-[#f8f4ec] p-5">
      <Icon className="h-5 w-5 text-[#8d7037]" />
      <h3 className="font-display mt-4 text-2xl">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#687377]">{text}</p>
    </div>
  );
}
