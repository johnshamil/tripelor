"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Heart,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";
import { propertyPhotoUrl, type PublicProperty } from "@/lib/property-model";
import {
  findSecretDeals,
  secretDealDestinationLabel,
  secretDealLabel,
  type SecretDealDestination,
  type SecretDealInput,
  type SecretDealType,
} from "@/lib/secret-deals";

const dealTypes: Array<{ value: SecretDealType; icon: typeof Heart }> = [
  { value: "honeymoon", icon: Heart },
  { value: "budget", icon: Wallet },
  { value: "family", icon: Users },
  { value: "ocean", icon: Waves },
  { value: "luxury", icon: Crown },
  { value: "last-minute", icon: Flame },
];

const destinations: SecretDealDestination[] = ["flexible", "vaavu", "ukulhas", "maafushi", "airport"];
const nightOptions = [3, 4, 5, 7, 10];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function currentMonth() {
  const now = new Date();
  const maldives = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return `${maldives.getUTCFullYear()}-${String(maldives.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function SecretDeals({ properties }: { properties: PublicProperty[] }) {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? {
        eyebrow: "Tripelor Secret Deals",
        title: "Sblocca offerte private per le Maldive.",
        intro: "Scegli il tipo di vacanza, il mese e il budget. Tripelor confronterà le tariffe pubblicate e ti mostrerà opzioni private adatte al tuo viaggio.",
        step: "Passo",
        dealType: "Che tipo di offerta cerchi?",
        destination: "Dove vuoi andare?",
        trip: "Quando e per quanto tempo?",
        month: "Mese di viaggio",
        nights: "Notti",
        travellers: "Viaggiatori",
        adults: "Adulti",
        children: "Bambini",
        budget: "Budget alloggio totale",
        flexibleBudget: "0 = budget flessibile",
        contact: "Le tue offerte sono quasi sbloccate.",
        contactBody: "Inserisci nome e almeno email o WhatsApp. Salveremo la richiesta e mostreremo subito le opzioni.",
        name: "Nome",
        email: "Email",
        whatsapp: "WhatsApp",
        country: "Paese",
        marketing: "Vorrei ricevere occasionalmente Secret Deal e offerte Tripelor. Facoltativo.",
        privacy: "I dati vengono usati per questa richiesta. Il consenso marketing è separato e facoltativo.",
        unlock: "Sblocca le offerte",
        unlocking: "Sblocco...",
        back: "Indietro",
        continue: "Continua",
        resultsEyebrow: "Offerte private sbloccate",
        resultsTitle: "Le tue opzioni Tripelor.",
        resultsBody: "Questi sono prezzi iniziali stimati basati sulle tariffe pubblicate per il periodo scelto. Non sono prenotazioni né blocchi di inventario. Tripelor conferma disponibilità, tasse e prezzo finale prima del pagamento.",
        privateOffer: "Offerta privata",
        best: "Migliore opzione",
        alternative: "Alternativa",
        from: "Da",
        total: "stima soggiorno",
        nightly: "a notte",
        request: "Richiedi questa offerta",
        explore: "Vedi soggiorno",
        whatsappCta: "Parla con Tripelor",
        adjust: "Modifica preferenze",
        noMatch: "Nessuna offerta pubblicata corrisponde ancora ai criteri.",
        noMatchBody: "Prova una destinazione flessibile, aumenta il budget o chiedi a Tripelor una ricerca manuale.",
        ref: "Riferimento",
        typeLabels: { honeymoon:"Luna di miele", budget:"Miglior valore", family:"Famiglia", ocean:"Oceano & snorkeling", luxury:"Luxury", "last-minute":"Last Minute" },
        destLabels: { flexible:"Sorprendimi", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / aeroporto" },
      }
    : locale === "ru"
      ? {
          eyebrow: "Tripelor Secret Deals",
          title: "Откройте приватные предложения на Мальдивы.",
          intro: "Выберите стиль отдыха, месяц и бюджет. Tripelor сравнит опубликованные тарифы и покажет подходящие приватные варианты.",
          step: "Шаг",
          dealType: "Какое предложение вы ищете?",
          destination: "Куда хотите поехать?",
          trip: "Когда и на сколько ночей?",
          month: "Месяц поездки",
          nights: "Ночей",
          travellers: "Путешественники",
          adults: "Взрослые",
          children: "Дети",
          budget: "Общий бюджет на проживание",
          flexibleBudget: "0 = гибкий бюджет",
          contact: "Ваши предложения почти открыты.",
          contactBody: "Введите имя и хотя бы email или WhatsApp. Мы сохраним запрос и сразу откроем варианты.",
          name: "Имя",
          email: "Email",
          whatsapp: "WhatsApp",
          country: "Страна",
          marketing: "Хочу иногда получать Secret Deals и предложения Tripelor. Необязательно.",
          privacy: "Данные используются для этого запроса. Согласие на маркетинг отдельное и необязательное.",
          unlock: "Открыть предложения",
          unlocking: "Открываем...",
          back: "Назад",
          continue: "Продолжить",
          resultsEyebrow: "Приватные предложения открыты",
          resultsTitle: "Ваши варианты Tripelor.",
          resultsBody: "Это стартовые оценки на основе опубликованных тарифов для выбранного периода. Они не являются бронированием или удержанием номера. Tripelor подтверждает наличие, налоги и финальную цену до оплаты.",
          privateOffer: "Приватное предложение",
          best: "Лучший вариант",
          alternative: "Альтернатива",
          from: "От",
          total: "оценка проживания",
          nightly: "за ночь",
          request: "Запросить это предложение",
          explore: "Открыть отель",
          whatsappCta: "Написать Tripelor",
          adjust: "Изменить параметры",
          noMatch: "Пока нет опубликованного варианта под эти условия.",
          noMatchBody: "Попробуйте гибкое направление, увеличьте бюджет или попросите Tripelor подобрать вручную.",
          ref: "Номер запроса",
          typeLabels: { honeymoon:"Медовый месяц", budget:"Лучшее соотношение", family:"Семья", ocean:"Океан и снорклинг", luxury:"Luxury", "last-minute":"Last Minute" },
          destLabels: { flexible:"Подберите мне", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / аэропорт" },
        }
      : {
          eyebrow: "Tripelor Secret Deals",
          title: "Unlock private Maldives offers.",
          intro: "Choose your holiday style, travel month and budget. Tripelor compares published selling rates and reveals private options matched to your trip.",
          step: "Step",
          dealType: "What kind of deal are you looking for?",
          destination: "Where would you like to go?",
          trip: "When and for how long?",
          month: "Travel month",
          nights: "Nights",
          travellers: "Travellers",
          adults: "Adults",
          children: "Children",
          budget: "Total accommodation budget",
          flexibleBudget: "0 = flexible budget",
          contact: "Your private offers are almost unlocked.",
          contactBody: "Add your name and either email or WhatsApp. We’ll save the enquiry and reveal your options immediately.",
          name: "Name",
          email: "Email",
          whatsapp: "WhatsApp",
          country: "Country",
          marketing: "I’d like occasional Secret Deal drops and Tripelor offers. Optional.",
          privacy: "Your details are used for this request. Marketing consent is separate and optional.",
          unlock: "Unlock My Secret Deals",
          unlocking: "Unlocking...",
          back: "Back",
          continue: "Continue",
          resultsEyebrow: "Private offers unlocked",
          resultsTitle: "Your Tripelor options.",
          resultsBody: "These are starting estimates using published selling rates for your selected period. They are not reservations or inventory holds. Tripelor confirms availability, taxes and the final selling price before payment.",
          privateOffer: "Private Offer",
          best: "Best Option",
          alternative: "Alternative",
          from: "From",
          total: "estimated stay",
          nightly: "per night",
          request: "Request This Deal",
          explore: "Explore Stay",
          whatsappCta: "Chat with Tripelor",
          adjust: "Adjust Preferences",
          noMatch: "No published offer currently fits these criteria.",
          noMatchBody: "Try a flexible destination, increase the budget, or ask Tripelor to search manually.",
          ref: "Reference",
          typeLabels: { honeymoon:"Honeymoon", budget:"Best Value", family:"Family", ocean:"Ocean & Snorkeling", luxury:"Luxury", "last-minute":"Last Minute" },
          destLabels: { flexible:"Surprise me", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / airport" },
        };

  const [step, setStep] = useState(0);
  const [input, setInput] = useState<SecretDealInput>({
    adults: 2,
    children: 0,
    nights: 5,
    budget: 1000,
    dealType: "budget",
    destination: "flexible",
    travelMonth: currentMonth(),
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const deals = useMemo(() => findSecretDeals(properties, input), [properties, input]);
  const top = deals[0];

  function update<K extends keyof SecretDealInput>(key: K, value: SecretDealInput[K]) {
    setInput(current => ({ ...current, [key]: value }));
  }

  function next() {
    setError("");
    setStep(current => Math.min(2, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setError("");
    setStep(current => Math.max(0, current - 1));
  }

  async function unlock() {
    setError("");
    if (!name.trim()) {
      setError(locale === "it" ? "Inserisci il tuo nome." : locale === "ru" ? "Введите имя." : "Please enter your name.");
      return;
    }
    if (!email.trim() && !whatsapp.trim()) {
      setError(locale === "it" ? "Aggiungi email o WhatsApp." : locale === "ru" ? "Добавьте email или WhatsApp." : "Add an email address or WhatsApp number.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/secret-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          name,
          email,
          whatsapp,
          country,
          company,
          marketingConsent,
          revealedProperty: top?.property.name || "",
          revealedRoom: top?.room.name || "",
          estimatedTotal: top?.estimatedTotal || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to unlock your offers.");
      setReference(data.reference || "");
      setRevealed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to unlock your offers.");
    } finally {
      setSubmitting(false);
    }
  }

  if (revealed) {
    const whatsappText = encodeURIComponent(
      `Hello Tripelor, I unlocked Secret Deals.
Reference: ${reference || "Secret Deals"}
Deal type: ${secretDealLabel(input.dealType)}
Destination: ${secretDealDestinationLabel(input.destination)}
Travel month: ${input.travelMonth || "Flexible"}
Guests: ${input.adults} adult(s), ${input.children} child(ren)
Nights: ${input.nights}
Accommodation budget: ${input.budget ? `USD ${input.budget}` : "Flexible"}
Top offer: ${top ? `${top.property.name} · ${top.room.name} · from USD ${top.estimatedTotal.toFixed(2)}` : "Please help me find a deal"}
Please confirm availability and the final full price.`,
    );

    return (
      <main className="bg-[#06151c] pb-24 text-white">
        <section className="border-b border-gold/20 bg-[radial-gradient(circle_at_80%_0%,rgba(217,189,123,.2),transparent_30%),#06151c]">
          <div className="container py-14 md:py-20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <LockKeyhole className="h-5 w-5 text-gold" />
            </div>
            <p className="eyebrow mt-6">{copy.resultsEyebrow}</p>
            <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">{copy.resultsTitle}</h1>
            <p className="mt-5 max-w-2xl leading-8 text-white/55">{copy.resultsBody}</p>
            {reference && <p className="mt-5 text-xs uppercase tracking-[.18em] text-gold">{copy.ref}: {reference}</p>}
          </div>
        </section>

        <section className="container grid gap-6 py-10 lg:grid-cols-3">
          {deals.length === 0 ? (
            <div className="col-span-full border border-gold/20 bg-gold/[.05] p-9 text-center">
              <Compass className="mx-auto h-8 w-8 text-gold" />
              <h2 className="font-display mt-4 text-3xl">{copy.noMatch}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">{copy.noMatchBody}</p>
            </div>
          ) : deals.map((deal, index) => {
            const params = new URLSearchParams({
              property: deal.property.name,
              roomType: deal.room.name,
              mealPlan: deal.room.mealPlan,
              nights: String(input.nights),
              planTotal: String(deal.estimatedTotal),
            });
            return (
              <article key={deal.property.slug} className={`flex flex-col overflow-hidden border ${index === 0 ? "border-gold/60 shadow-[0_30px_80px_rgba(217,189,123,.12)]" : "border-white/10"} bg-white/[.025]`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0b2731]">
                  {deal.property.photos[0] && <img src={propertyPhotoUrl(deal.property.photos[0])} alt={deal.property.name} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041117]/90 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 border border-gold/30 bg-[#041117]/85 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-gold backdrop-blur">
                    {index === 0 ? copy.best : `${copy.alternative} ${index}`}
                  </span>
                  <span className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold text-[#ead7aa]">
                    <LockKeyhole className="h-4 w-4" /> {copy.privateOffer}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-2 text-xs text-gold"><MapPin className="h-4 w-4" /> {deal.property.island}</p>
                  <h2 className="font-display mt-3 text-3xl">{deal.property.name}</h2>
                  <p className="mt-2 text-sm text-white/60">{deal.room.name} · {deal.room.mealPlan}</p>

                  <div className="mt-5 space-y-2">
                    {deal.reasons.map(reason => (
                      <p key={reason} className="flex items-start gap-2 text-sm leading-6 text-white/55">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" /> {reason}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 border-y border-white/10 py-5">
                    <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">{copy.from} · {copy.total}</p>
                    <p className="font-display mt-2 text-4xl text-gold">{money(deal.estimatedTotal)}</p>
                    <p className="mt-1 text-xs text-white/40">{money(deal.nightlyFrom)} {copy.nightly} · {input.nights} {copy.nights.toLowerCase()}</p>
                  </div>

                  <div className="mt-auto grid gap-3 pt-6">
                    <Link href={`/stays/${deal.property.slug}`} className="btn-outline justify-center">{copy.explore}</Link>
                    <Link href={`/booking?${params.toString()}`} className="btn-gold justify-center">{copy.request} <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="container">
          <div className="grid gap-4 border border-gold/25 bg-[#0b2731] p-6 md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">Tripelor Private Deals Desk</p>
              <h2 className="font-display mt-2 text-2xl">Want the full holiday price?</h2>
              <p className="mt-2 text-xs leading-5 text-white/45">Tripelor can add transfers and excursions after confirming the room with the property.</p>
            </div>
            <a href={`https://wa.me/9609429403?text=${whatsappText}`} className="btn-gold justify-center gap-2"><MessageCircle className="h-4 w-4" /> {copy.whatsappCta}</a>
            <button type="button" onClick={() => { setRevealed(false); setStep(0); }} className="btn-outline justify-center">{copy.adjust}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <section className="relative overflow-hidden bg-[#06151c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(217,189,123,.22),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(35,119,132,.16),transparent_28%)]" />
        <div className="container relative py-14 md:py-20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
            <LockKeyhole className="h-5 w-5 text-gold" />
          </div>
          <p className="eyebrow mt-6">{copy.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-[1.02] md:text-7xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{copy.intro}</p>
          <div className="mt-8 max-w-xl">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-white/40">
              <span>{copy.step} {step + 1} / 3</span>
              <span>{Math.round(((step + 1) / 3) * 100)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden bg-white/10"><div className="h-full bg-gold transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="container pt-9">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-[0_25px_80px_rgba(34,43,46,.1)] md:p-9">
            {step === 0 && (
              <div>
                <h2 className="font-display text-4xl">{copy.dealType}</h2>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {dealTypes.map(option => {
                    const Icon = option.icon;
                    return (
                      <button key={option.value} type="button" onClick={() => update("dealType", option.value)} className={`min-h-28 border p-5 text-left transition ${input.dealType === option.value ? "border-[#9c7d3d] bg-[#f3ead9]" : "border-[#d0c5b0] bg-white hover:border-[#b69b63]"}`}>
                        <Icon className="h-5 w-5 text-[#8d7037]" />
                        <span className="mt-3 block font-semibold">{copy.typeLabels[option.value]}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">{copy.destination}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {destinations.map(value => <Choice key={value} active={input.destination === value} onClick={() => update("destination", value)}>{copy.destLabels[value]}</Choice>)}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-4xl">{copy.trip}</h2>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="text-sm font-medium">{copy.month}<input type="month" value={input.travelMonth} onChange={event => update("travelMonth", event.target.value)} className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 outline-none focus:border-[#9c7d3d]" /></label>
                  <div>
                    <p className="text-sm font-medium">{copy.nights}</p>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {nightOptions.map(value => <Choice key={value} active={input.nights === value} onClick={() => update("nights", value)}>{value}</Choice>)}
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-sm font-medium">{copy.travellers}</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Counter label={copy.adults} value={input.adults} min={1} max={10} onChange={value => update("adults", value)} />
                  <Counter label={copy.children} value={input.children} min={0} max={10} onChange={value => update("children", value)} />
                </div>

                <label className="mt-7 block text-sm font-medium">{copy.budget} · USD
                  <div className="relative mt-2">
                    <Wallet className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" />
                    <input type="number" min={0} max={1000000} step="50" value={input.budget} onChange={event => update("budget", Math.max(0, Number(event.target.value) || 0))} className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 outline-none focus:border-[#9c7d3d]" />
                  </div>
                  <span className="mt-2 block text-xs font-normal text-[#778184]">{copy.flexibleBudget}</span>
                </label>
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">{deals.length} private option{deals.length === 1 ? "" : "s"} ready</p>
                <h2 className="font-display mt-3 text-4xl">{copy.contact}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687377]">{copy.contactBody}</p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">{copy.name}<input value={name} onChange={event => setName(event.target.value)} maxLength={120} className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 outline-none focus:border-[#9c7d3d]" /></label>
                  <label className="text-sm font-medium">{copy.country}<input value={country} onChange={event => setCountry(event.target.value)} maxLength={100} className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 outline-none focus:border-[#9c7d3d]" /></label>
                  <label className="text-sm font-medium">{copy.email}<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" /><input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={250} className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 outline-none focus:border-[#9c7d3d]" /></div></label>
                  <label className="text-sm font-medium">{copy.whatsapp}<div className="relative mt-2"><MessageCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" /><input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} maxLength={60} placeholder="+39..., +7..., +960..." className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 outline-none focus:border-[#9c7d3d]" /></div></label>
                  <label className="hidden" aria-hidden="true">Company<input tabIndex={-1} autoComplete="off" value={company} onChange={event => setCompany(event.target.value)} /></label>
                </div>

                <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#58656c]">
                  <input type="checkbox" checked={marketingConsent} onChange={event => setMarketingConsent(event.target.checked)} className="mt-1" />
                  {copy.marketing}
                </label>
                <div className="mt-5 flex gap-3 border border-[#c9b88f] bg-[#f3ead9] p-4 text-xs leading-6 text-[#687377]">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7037]" /> {copy.privacy}
                </div>
              </div>
            )}

            {error && <p role="alert" className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-[#d0c5b0] pt-6">
              <button type="button" onClick={previous} disabled={step === 0} className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-[#687377] disabled:invisible"><ArrowLeft className="h-4 w-4" /> {copy.back}</button>
              {step < 2 ? (
                <button type="button" onClick={next} className="btn-gold">{copy.continue} <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={unlock} disabled={submitting} className="btn-gold disabled:opacity-50"><LockKeyhole className="h-4 w-4" /> {submitting ? copy.unlocking : copy.unlock}</button>
              )}
            </div>
          </div>

          <aside className="h-fit overflow-hidden border border-[#d0c5b0] bg-[#f8f4ec] lg:sticky lg:top-24">
            <div className="border-b border-[#d0c5b0] bg-[#071922] p-6 text-white">
              <LockKeyhole className="h-6 w-6 text-gold" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[.18em] text-gold">Locked preview</p>
              <div className="mt-4 space-y-3 opacity-45 blur-[2px]" aria-hidden="true">
                <div className="h-5 w-3/4 bg-white/25" />
                <div className="h-10 w-1/2 bg-gold/25" />
                <div className="h-4 w-full bg-white/15" />
              </div>
            </div>
            <div className="p-6">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#899194]">Your deal brief</p>
              <div className="mt-5 space-y-4 text-sm">
                <Summary icon={LockKeyhole} label={copy.dealType} value={copy.typeLabels[input.dealType]} />
                <Summary icon={MapPin} label={copy.destination} value={copy.destLabels[input.destination]} />
                <Summary icon={CalendarDays} label={copy.month} value={input.travelMonth || "Flexible"} />
                <Summary icon={Users} label={copy.travellers} value={`${input.adults} adult${input.adults === 1 ? "" : "s"}${input.children ? ` · ${input.children} child${input.children === 1 ? "" : "ren"}` : ""}`} />
                <Summary icon={Wallet} label={copy.budget} value={input.budget ? money(input.budget) : "Flexible"} />
              </div>
              <p className="mt-6 border-t border-[#d0c5b0] pt-5 text-xs leading-6 text-[#687377]">Unlocking does not charge your card or reserve inventory.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="border border-[#d0c5b0] bg-white p-5">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">−</button>
        <strong className="font-display text-3xl text-[#8d7037]">{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">+</button>
      </div>
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-12 border px-4 py-3 text-sm font-semibold transition ${active ? "border-[#9c7d3d] bg-[#f3ead9] text-[#745b2e]" : "border-[#d0c5b0] bg-white text-[#53616a] hover:border-[#b69b63]"}`}>
      <span className="inline-flex items-center gap-2">{active && <Check className="h-4 w-4" />}{children}</span>
    </button>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof LockKeyhole; label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-[#ded5c5] pb-4 last:border-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7037]" />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#899194]">{label}</p>
        <p className="mt-1 leading-5 text-[#39484e]">{value}</p>
      </div>
    </div>
  );
}
