"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Compass,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Wallet,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";
import { propertyPhotoUrl, type PublicProperty } from "@/lib/property-model";
import {
  destinationLabel,
  matchMaldives,
  styleLabel,
  type MatchDestination,
  type MatchInput,
  type MatchMeal,
  type MatchStyle,
} from "@/lib/maldives-matchmaker";

const styleOptions: Array<{ value: MatchStyle; icon: typeof Heart }> = [
  { value: "romance", icon: Heart },
  { value: "family", icon: Users },
  { value: "ocean", icon: Waves },
  { value: "adventure", icon: Compass },
  { value: "relax", icon: Sparkles },
];

const destinationOptions: MatchDestination[] = ["flexible", "vaavu", "ukulhas", "maafushi", "airport"];
const mealOptions: MatchMeal[] = ["flexible", "Bed & Breakfast", "Half Board", "Full Board"];
const nightOptions = [3, 4, 5, 7, 10];

function addNights(date: string, nights: number) {
  if (!date) return "";
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + nights);
  return result.toISOString().slice(0, 10);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

export default function MaldivesMatchmaker({ properties }: { properties: PublicProperty[] }) {
  const locale = useSiteLanguage();
  const copy = locale === "it"
    ? {
        eyebrow: "Tripelor Maldives Matchmaker",
        title: "Trova le Maldive più adatte a te.",
        intro: "Rispondi a poche domande. Tripelor confronterà soggiorni pubblicati, camere, piani pasti e budget per creare i tuoi migliori abbinamenti.",
        step: "Passo",
        travellers: "Chi viaggia?",
        travellersBody: "Dicci quante persone devono stare nella stessa camera.",
        adults: "Adulti",
        children: "Bambini",
        trip: "Quando vuoi viaggiare?",
        tripBody: "Le date aiutano Tripelor a usare le tariffe stagionali pubblicate. Puoi lasciarle flessibili.",
        arrival: "Arrivo indicativo",
        nights: "Notti",
        budget: "Budget alloggio",
        budgetBody: "Budget totale per la camera durante l'intero soggiorno. Trasferimenti, escursioni e alcuni supplementi possono essere aggiuntivi.",
        flexibleBudget: "0 = flessibile",
        style: "Che tipo di vacanza vuoi?",
        destination: "Destinazione preferita",
        meal: "Piano pasti",
        contact: "I tuoi abbinamenti sono pronti.",
        contactBody: "Inserisci nome e almeno email o WhatsApp. Salveremo la richiesta e mostreremo subito gli abbinamenti completi.",
        name: "Nome",
        email: "Email",
        whatsapp: "WhatsApp",
        marketing: "Vorrei ricevere occasionalmente offerte Tripelor. Facoltativo.",
        privacy: "I tuoi dati vengono usati per questa richiesta. Il consenso marketing è separato e facoltativo.",
        reveal: "Mostra i miei abbinamenti",
        saving: "Preparazione...",
        back: "Indietro",
        continue: "Continua",
        resultsEyebrow: "I tuoi abbinamenti Tripelor",
        resultsTitle: "Ecco dove inizierei.",
        resultsBody: "Questi importi sono stime del soggiorno basate sulle tariffe pubblicate. Tripelor conferma disponibilità, tasse, trasferimenti e prezzo finale prima del pagamento.",
        best: "Miglior abbinamento",
        alternative: "Alternativa",
        estimated: "Soggiorno stimato",
        average: "media / notte",
        overBudget: "Sopra il budget indicato",
        explore: "Vedi soggiorno",
        book: "Richiedi questa camera",
        whatsappCta: "Continua su WhatsApp",
        adjust: "Modifica risposte",
        noMatch: "Non abbiamo trovato una camera pubblicata adatta a questi criteri.",
        noMatchBody: "Prova ad aumentare il budget, scegliere una destinazione flessibile o contatta Tripelor per una ricerca manuale.",
        ref: "Riferimento",
        styleLabels: { romance:"Romantica", family:"Famiglia", ocean:"Mare e snorkeling", adventure:"Avventura", relax:"Relax" },
        destLabels: { flexible:"Sorprendimi", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / aeroporto" },
        mealFlexible: "Miglior piano disponibile",
      }
    : locale === "ru"
      ? {
          eyebrow: "Tripelor Maldives Matchmaker",
          title: "Найдите свои Мальдивы.",
          intro: "Ответьте на несколько вопросов. Tripelor сравнит опубликованные отели, номера, питание и бюджет и покажет подходящие варианты.",
          step: "Шаг",
          travellers: "Кто путешествует?",
          travellersBody: "Укажите, сколько гостей должно разместиться в одном номере.",
          adults: "Взрослые",
          children: "Дети",
          trip: "Когда вы хотите поехать?",
          tripBody: "Даты позволяют учитывать опубликованные сезонные тарифы. Их можно оставить гибкими.",
          arrival: "Примерная дата приезда",
          nights: "Ночей",
          budget: "Бюджет на проживание",
          budgetBody: "Общий бюджет на номер за весь период. Трансферы, экскурсии и некоторые доплаты могут оплачиваться отдельно.",
          flexibleBudget: "0 = гибкий бюджет",
          style: "Какой отдых вам нужен?",
          destination: "Предпочтительное направление",
          meal: "Питание",
          contact: "Ваши варианты готовы.",
          contactBody: "Введите имя и хотя бы email или WhatsApp. Мы сохраним запрос и сразу покажем полные варианты.",
          name: "Имя",
          email: "Email",
          whatsapp: "WhatsApp",
          marketing: "Хочу иногда получать предложения Tripelor. Необязательно.",
          privacy: "Контактные данные используются для этого запроса. Согласие на маркетинг отдельное и необязательное.",
          reveal: "Показать мои варианты",
          saving: "Готовим...",
          back: "Назад",
          continue: "Продолжить",
          resultsEyebrow: "Ваши варианты Tripelor",
          resultsTitle: "С этих вариантов стоит начать.",
          resultsBody: "Суммы ниже — оценка проживания по опубликованным тарифам. Tripelor подтверждает наличие, налоги, трансферы и финальную цену до оплаты.",
          best: "Лучшее совпадение",
          alternative: "Альтернатива",
          estimated: "Проживание",
          average: "среднее / ночь",
          overBudget: "Выше указанного бюджета",
          explore: "Открыть отель",
          book: "Запросить номер",
          whatsappCta: "Продолжить в WhatsApp",
          adjust: "Изменить ответы",
          noMatch: "По этим условиям не найден подходящий опубликованный номер.",
          noMatchBody: "Попробуйте увеличить бюджет, выбрать гибкое направление или попросите Tripelor подобрать вариант вручную.",
          ref: "Номер запроса",
          styleLabels: { romance:"Романтика", family:"Семья", ocean:"Океан и снорклинг", adventure:"Приключения", relax:"Спокойный отдых" },
          destLabels: { flexible:"Подберите мне", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / аэропорт" },
          mealFlexible: "Лучший доступный план",
        }
      : {
          eyebrow: "Tripelor Maldives Matchmaker",
          title: "Find your kind of Maldives.",
          intro: "Answer a few quick questions. Tripelor will compare published stays, room types, meal plans and your budget to create your strongest matches.",
          step: "Step",
          travellers: "Who is travelling?",
          travellersBody: "Tell us how many guests need to fit in the same room.",
          adults: "Adults",
          children: "Children",
          trip: "When would you like to travel?",
          tripBody: "Dates let Tripelor use published seasonal rates. You can leave the arrival flexible.",
          arrival: "Approximate arrival",
          nights: "Nights",
          budget: "Accommodation budget",
          budgetBody: "Your total room budget for the whole stay. Transfers, excursions and some supplements may be additional.",
          flexibleBudget: "0 = flexible budget",
          style: "How should the holiday feel?",
          destination: "Preferred destination",
          meal: "Meal preference",
          contact: "Your matches are ready.",
          contactBody: "Add your name and either email or WhatsApp. We’ll save the enquiry and reveal your full matches immediately.",
          name: "Name",
          email: "Email",
          whatsapp: "WhatsApp",
          marketing: "I’d like occasional Tripelor offers. Optional.",
          privacy: "Your contact details are used for this trip request. Marketing consent is separate and optional.",
          reveal: "Reveal My Maldives Matches",
          saving: "Preparing...",
          back: "Back",
          continue: "Continue",
          resultsEyebrow: "Your Tripelor matches",
          resultsTitle: "Here’s where I’d start.",
          resultsBody: "These are stay estimates using published rates. Tripelor confirms availability, taxes, transfers and the final selling price before payment.",
          best: "Best Match",
          alternative: "Alternative",
          estimated: "Estimated stay",
          average: "average / night",
          overBudget: "Above your stated budget",
          explore: "Explore Stay",
          book: "Request This Room",
          whatsappCta: "Continue on WhatsApp",
          adjust: "Adjust My Answers",
          noMatch: "No published room currently fits these criteria.",
          noMatchBody: "Try a larger budget, choose a flexible destination, or ask Tripelor to search manually.",
          ref: "Reference",
          styleLabels: { romance:"Romantic", family:"Family", ocean:"Ocean & snorkeling", adventure:"Adventure", relax:"Slow & relaxing" },
          destLabels: { flexible:"Surprise me", vaavu:"Vaavu Atoll", ukulhas:"Ukulhas", maafushi:"Maafushi", airport:"Hulhumalé / airport" },
          mealFlexible: "Best available plan",
        };

  const [step, setStep] = useState(0);
  const [input, setInput] = useState<MatchInput>({
    adults: 2,
    children: 0,
    nights: 5,
    arrival: "",
    budget: 1200,
    style: "romance",
    destination: "flexible",
    meal: "flexible",
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const recommendations = useMemo(() => matchMaldives(properties, input), [properties, input]);
  const top = recommendations[0];
  const checkOut = addNights(input.arrival, input.nights);

  function update<K extends keyof MatchInput>(key: K, value: MatchInput[K]) {
    setInput(current => ({ ...current, [key]: value }));
  }

  function next() {
    setError("");
    setStep(current => Math.min(3, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setError("");
    setStep(current => Math.max(0, current - 1));
  }

  async function reveal() {
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
      const response = await fetch("/api/matchmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          name,
          email,
          whatsapp,
          company,
          marketingConsent,
          recommendedProperty: top?.property.name || "",
          recommendedRoom: top?.room.name || "",
          estimatedStayTotal: top?.total || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save your match.");
      setReference(data.reference || "");
      setRevealed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your match.");
    } finally {
      setSubmitting(false);
    }
  }

  const styleName = copy.styleLabels[input.style];
  const destinationName = copy.destLabels[input.destination];
  const progress = revealed ? 100 : ((step + 1) / 4) * 100;

  if (revealed) {
    const whatsappMessage = encodeURIComponent(
      `Hello Tripelor, I completed the Maldives Matchmaker.
Reference: ${reference || "Matchmaker"}
Style: ${styleLabel(input.style)}
Destination: ${destinationLabel(input.destination)}
Guests: ${input.adults} adult(s), ${input.children} child(ren)
Stay: ${input.nights} nights${input.arrival ? ` from ${input.arrival}` : ""}
Budget: ${input.budget ? `USD ${input.budget}` : "Flexible"}
Top match: ${top ? `${top.property.name} · ${top.room.name} · ${top.room.mealPlan} · estimated USD ${top.total.toFixed(2)}` : "Please help me find an option"}
Please help me confirm availability and the full trip price.`,
    );

    return (
      <main className="bg-[#06151c] pb-24 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_20%_0%,rgba(217,189,123,.18),transparent_30%),#06151c]">
          <div className="container py-14 md:py-20">
            <p className="eyebrow">{copy.resultsEyebrow}</p>
            <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">{copy.resultsTitle}</h1>
            <p className="mt-5 max-w-2xl leading-8 text-white/55">{copy.resultsBody}</p>
            {reference && <p className="mt-5 text-xs uppercase tracking-[.18em] text-gold">{copy.ref}: {reference}</p>}
          </div>
        </section>

        <section className="container grid gap-6 py-10 lg:grid-cols-3">
          {recommendations.length === 0 ? (
            <div className="col-span-full border border-gold/20 bg-gold/[.05] p-8 text-center">
              <Compass className="mx-auto h-8 w-8 text-gold" />
              <h2 className="font-display mt-4 text-3xl">{copy.noMatch}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">{copy.noMatchBody}</p>
            </div>
          ) : recommendations.map((match, index) => {
            const bookingParams = new URLSearchParams({
              property: match.property.name,
              roomType: match.room.name,
              mealPlan: match.room.mealPlan,
              nights: String(input.nights),
              planTotal: String(match.total),
            });
            if (input.arrival) {
              bookingParams.set("checkIn", input.arrival);
              bookingParams.set("checkOut", checkOut);
            }
            return (
              <article key={match.property.slug} className={`flex flex-col overflow-hidden border ${index === 0 ? "border-gold/60 shadow-[0_25px_70px_rgba(217,189,123,.12)]" : "border-white/10"} bg-white/[.025]`}>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0b2731]">
                  {match.property.photos[0] && <img src={propertyPhotoUrl(match.property.photos[0])} alt={match.property.name} className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041117]/80 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 border border-gold/30 bg-[#041117]/80 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-gold backdrop-blur">
                    {index === 0 ? copy.best : `${copy.alternative} ${index}`}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-2 text-xs text-gold"><MapPin className="h-4 w-4" /> {match.property.island}</p>
                  <h2 className="font-display mt-3 text-3xl">{match.property.name}</h2>
                  <p className="mt-2 text-sm text-white/60">{match.room.name} · {match.room.mealPlan}</p>

                  <div className="mt-5 space-y-2">
                    {match.reasons.map(reason => (
                      <p key={reason} className="flex items-start gap-2 text-sm leading-6 text-white/55">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-gold" /> {reason}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 border-y border-white/10 py-5">
                    <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/35">{copy.estimated}</p>
                    <p className="font-display mt-2 text-4xl text-gold">{money(match.total)}</p>
                    <p className="mt-1 text-xs text-white/40">{money(match.nightly)} {copy.average} · {input.nights} {copy.nights.toLowerCase()}</p>
                    {match.overBudget && <p className="mt-2 text-xs text-amber-300">{copy.overBudget}</p>}
                  </div>

                  <div className="mt-auto grid gap-3 pt-6">
                    <Link href={`/stays/${match.property.slug}`} className="btn-outline justify-center">{copy.explore}</Link>
                    <Link href={`/booking?${bookingParams.toString()}`} className="btn-gold justify-center">{copy.book} <ArrowRight className="h-4 w-4" /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="container">
          <div className="grid gap-3 border border-gold/25 bg-[#0b2731] p-5 md:grid-cols-[1fr_auto_auto] md:items-center md:p-7">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Tripelor concierge</p>
              <h2 className="font-display mt-2 text-2xl">Turn this match into a complete Maldives trip.</h2>
            </div>
            <a href={`https://wa.me/9609429403?text=${whatsappMessage}`} className="btn-gold justify-center gap-2">
              <MessageCircle className="h-4 w-4" /> {copy.whatsappCta}
            </a>
            <button type="button" onClick={() => { setRevealed(false); setStep(0); }} className="btn-outline justify-center">{copy.adjust}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <section className="relative overflow-hidden bg-[#06151c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(217,189,123,.18),transparent_30%),radial-gradient(circle_at_15%_80%,rgba(35,119,132,.17),transparent_28%)]" />
        <div className="container relative py-14 md:py-20">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-[1.02] md:text-7xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/60">{copy.intro}</p>
          <div className="mt-8 max-w-xl">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.16em] text-white/40">
              <span>{copy.step} {step + 1} / 4</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden bg-white/10"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </section>

      <section className="container -mt-1 pt-9">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-[0_25px_80px_rgba(34,43,46,.1)] md:p-9">
            {step === 0 && (
              <div>
                <h2 className="font-display text-4xl">{copy.travellers}</h2>
                <p className="mt-3 text-sm leading-7 text-[#687377]">{copy.travellersBody}</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Counter label={copy.adults} value={input.adults} min={1} max={10} onChange={value => update("adults", value)} />
                  <Counter label={copy.children} value={input.children} min={0} max={10} onChange={value => update("children", value)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-4xl">{copy.trip}</h2>
                <p className="mt-3 text-sm leading-7 text-[#687377]">{copy.tripBody}</p>
                <label className="mt-7 block text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">
                  {copy.arrival}
                  <input type="date" value={input.arrival} onChange={event => update("arrival", event.target.value)} className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 text-base normal-case tracking-normal outline-none focus:border-[#9c7d3d]" />
                </label>
                <div className="mt-7">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">{copy.nights}</p>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {nightOptions.map(value => <Choice key={value} active={input.nights === value} onClick={() => update("nights", value)}>{value}</Choice>)}
                  </div>
                </div>
                <label className="mt-7 block text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">
                  {copy.budget} · USD
                  <div className="relative mt-2">
                    <Wallet className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" />
                    <input type="number" min={0} max={1000000} step="50" value={input.budget} onChange={event => update("budget", Math.max(0, Number(event.target.value) || 0))} className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 text-base outline-none focus:border-[#9c7d3d]" />
                  </div>
                  <span className="mt-2 block normal-case tracking-normal text-[#778184]">{copy.budgetBody} · {copy.flexibleBudget}</span>
                </label>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-4xl">{copy.style}</h2>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {styleOptions.map(option => {
                    const Icon = option.icon;
                    return (
                      <button key={option.value} type="button" onClick={() => update("style", option.value)} className={`min-h-24 border p-4 text-left transition ${input.style === option.value ? "border-[#9c7d3d] bg-[#f3ead9]" : "border-[#d0c5b0] bg-white hover:border-[#b69b63]"}`}>
                        <Icon className="h-5 w-5 text-[#8d7037]" />
                        <span className="mt-3 block font-semibold">{copy.styleLabels[option.value]}</span>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">{copy.destination}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {destinationOptions.map(value => <Choice key={value} active={input.destination === value} onClick={() => update("destination", value)}>{copy.destLabels[value]}</Choice>)}
                </div>

                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.16em] text-[#8d7037]">{copy.meal}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {mealOptions.map(value => <Choice key={value} active={input.meal === value} onClick={() => update("meal", value)}>{value === "flexible" ? copy.mealFlexible : value}</Choice>)}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">{recommendations.length} match{recommendations.length === 1 ? "" : "es"} ready</p>
                <h2 className="font-display mt-3 text-4xl">{copy.contact}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687377]">{copy.contactBody}</p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">{copy.name}<input value={name} onChange={event => setName(event.target.value)} maxLength={120} className="mt-2 min-h-14 w-full border border-[#d0c5b0] bg-white px-4 outline-none focus:border-[#9c7d3d]" /></label>
                  <label className="text-sm font-medium">{copy.email}<div className="relative mt-2"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" /><input type="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={250} className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 outline-none focus:border-[#9c7d3d]" /></div></label>
                  <label className="text-sm font-medium sm:col-span-2">{copy.whatsapp}<div className="relative mt-2"><MessageCircle className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d7037]" /><input value={whatsapp} onChange={event => setWhatsapp(event.target.value)} maxLength={60} placeholder="+39..., +7..., +960..." className="min-h-14 w-full border border-[#d0c5b0] bg-white pl-11 pr-4 outline-none focus:border-[#9c7d3d]" /></div></label>
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
              {step < 3 ? (
                <button type="button" onClick={next} className="btn-gold">{copy.continue} <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <button type="button" onClick={reveal} disabled={submitting} className="btn-gold disabled:opacity-50"><Sparkles className="h-4 w-4" /> {submitting ? copy.saving : copy.reveal}</button>
              )}
            </div>
          </div>

          <aside className="h-fit border border-[#d0c5b0] bg-[#f8f4ec] p-6 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">Your Maldives brief</p>
            <div className="mt-5 space-y-4 text-sm">
              <Summary icon={Users} label="Guests" value={`${input.adults} adult${input.adults === 1 ? "" : "s"}${input.children ? ` · ${input.children} child${input.children === 1 ? "" : "ren"}` : ""}`} />
              <Summary icon={CalendarDays} label={copy.nights} value={`${input.nights} ${copy.nights.toLowerCase()}${input.arrival ? ` · ${input.arrival}` : ""}`} />
              <Summary icon={Heart} label={copy.style} value={styleName} />
              <Summary icon={MapPin} label={copy.destination} value={destinationName} />
              <Summary icon={Utensils} label={copy.meal} value={input.meal === "flexible" ? copy.mealFlexible : input.meal} />
              <Summary icon={Wallet} label={copy.budget} value={input.budget ? money(input.budget) : "Flexible"} />
            </div>
            <div className="mt-6 border-t border-[#d0c5b0] pt-5">
              <p className="text-xs leading-6 text-[#687377]">No payment or reservation is made by the Matchmaker. Tripelor confirms the final booking separately.</p>
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
      <div className="mt-5 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">−</button>
        <strong className="font-display text-4xl text-[#8d7037]">{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9b88f] text-xl disabled:opacity-30">+</button>
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

function Summary({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
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
