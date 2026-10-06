import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, Headphones, MapPin, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import TripQuoteActions from "@/components/trip-quote-actions";
import TripelorMark from "@/components/tripelor-mark";
import { professionalLocale } from "@/lib/professional-translations";
import { decodeQuoteLines, quoteFromLines, quoteIssuedAt, quoteStatus, validQuoteReference, QUOTE_VALID_HOURS } from "@/lib/trip-quote";
import type { CartLine } from "@/lib/trip-cart";
import { localizeQuotedLine } from "@/lib/quote-display";
import { verifyQuoteSignature, type QuoteExtras } from "@/lib/trip-quote-server";
import { speedboatTransferTotal } from "@/lib/transfer-pricing";
import { MVR_PER_USD, quoteAmount, quoteMoney, type QuoteCurrency } from "@/lib/quote-currency";

export const dynamic = "force-dynamic";

function dateLabel(value: string, locale: "en" | "it" | "ru", withTime = false) {
  const language = locale === "it" ? "it-IT" : locale === "ru" ? "ru-RU" : "en-GB";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return new Intl.DateTimeFormat(language, withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Maldives" }
    : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }
  ).format(date);
}

export default function QuotePage({
  params,
  searchParams,
}: {
  params: { reference: string };
  searchParams?: {
    issued?: string;
    item?: string | string[];
    room?: string;
    meal?: string;
    transferSeats?: string;
    request?: string;
    customize?: string;
    currency?: string;
    fxRate?: string;
    sig?: string;
  };
}) {
  const locale = professionalLocale(cookies().get("tripelor_lang")?.value);
  const copy = locale === "it"
    ? {
        eyebrow: "Proposta di viaggio Tripelor",
        title: "La tua fuga alle Maldive",
        subtitle: "Una proposta personale con soggiorni ed esperienze selezionate, pronta da condividere, modificare o inviare al team Tripelor.",
        quote: "Numero proposta",
        issued: "Creata",
        valid: "Valida fino al",
        validFor: `Questa proposta resta disponibile per ${QUOTE_VALID_HOURS} ore.`,
        estimate: "Totale stimato",
        included: "Incluso in questa selezione",
        preferredDate: "Data preferita",
        checkIn: "Check-in",
        checkOut: "Check-out",
        guests: "ospiti",
        guest: "ospite",
        couples: "coppie",
        couple: "coppia",
        perPerson: "a persona",
        perCouple: "per coppia",
        rooms: "camere",
        roomUnit: "camera",
        perRoom: "per camera / 2 ospiti",
        eachRoom: "Per ogni camera selezionata",
        advisor: "Il tuo Travel Advisor Tripelor",
        advisorBody: "Vuoi cambiare una data, aggiungere un trasferimento o rendere il viaggio ancora più speciale? Il nostro team alle Maldive può adattare questa proposta per te.",
        whatsapp: "Parla con Tripelor su WhatsApp",
        notice: "Questa è una proposta di viaggio e non costituisce una prenotazione o un blocco di disponibilità. Disponibilità, trasferimenti, tasse, condizioni e pagamento vengono confermati prima della prenotazione.",
        expiredTitle: "Questa proposta è scaduta.",
        expiredBody: "Le proposte Tripelor restano attive per 48 ore per mantenere prezzi e disponibilità aggiornati. Puoi ricreare il viaggio dal tuo piano.",
        invalidTitle: "Impossibile aprire questa proposta.",
        invalidBody: "Il link potrebbe essere incompleto o non più valido.",
        back: "Torna al mio viaggio",
        kinds: { stay: "soggiorno", package: "pacchetto", excursion: "escursione" },
        tripDetails: "Dettagli del viaggio",
        room: "Camera",
        meal: "Piano pasti",
        transfer: "Trasferimento",
        speedboatSeats: "posti in motoscafo",
      }
    : locale === "ru"
      ? {
          eyebrow: "Персональное предложение Tripelor",
          title: "Ваш отдых на Мальдивах",
          subtitle: "Персональное предложение с выбранным проживанием и впечатлениями — его можно отправить, изменить или передать команде Tripelor.",
          quote: "Номер предложения",
          issued: "Создано",
          valid: "Действует до",
          validFor: `Предложение доступно в течение ${QUOTE_VALID_HOURS} часов.`,
          estimate: "Ориентировочная сумма",
          included: "Включено в выбор",
          preferredDate: "Предпочтительная дата",
          checkIn: "Заезд",
          checkOut: "Выезд",
          guests: "гостей",
          guest: "гость",
          couples: "пары",
          couple: "пара",
          perPerson: "с человека",
          perCouple: "за пару",
          rooms: "номера",
          roomUnit: "номер",
          perRoom: "за номер / 2 гостей",
          eachRoom: "Для каждого выбранного номера",
          advisor: "Ваш Travel Advisor Tripelor",
          advisorBody: "Хотите изменить даты, добавить трансфер или сделать поездку особенной? Наша команда на Мальдивах поможет адаптировать предложение.",
          whatsapp: "Написать Tripelor в WhatsApp",
          notice: "Это предложение не является подтверждённым бронированием и не удерживает номера. Доступность, трансферы, налоги, условия и оплата подтверждаются до бронирования.",
          expiredTitle: "Срок действия предложения истёк.",
          expiredBody: "Предложения Tripelor активны 48 часов, чтобы цены и доступность оставались актуальными. Вы можете заново создать поездку в своём плане.",
          invalidTitle: "Не удалось открыть предложение.",
          invalidBody: "Ссылка может быть неполной или уже недействительной.",
          back: "Вернуться к моей поездке",
          kinds: { stay: "проживание", package: "пакет", excursion: "экскурсия" },
          tripDetails: "Детали поездки",
          room: "Номер",
          meal: "План питания",
          transfer: "Трансфер",
          speedboatSeats: "мест(а) на скоростном катере",
        }
      : {
          eyebrow: "Tripelor private travel proposal",
          title: "Your Maldives Escape",
          subtitle: "A personal travel proposal with your selected stays and experiences, ready to share, adjust or send to the Tripelor team.",
          quote: "Quote number",
          issued: "Created",
          valid: "Valid until",
          validFor: `This proposal stays available for ${QUOTE_VALID_HOURS} hours.`,
          estimate: "Estimated total",
          included: "Included in this selection",
          preferredDate: "Preferred date",
          checkIn: "Check-in",
          checkOut: "Check-out",
          guests: "guests",
          guest: "guest",
          couples: "couples",
          couple: "couple",
          perPerson: "per person",
          perCouple: "per couple",
          rooms: "rooms",
          roomUnit: "room",
          perRoom: "per room / 2 guests",
          eachRoom: "For each selected room",
          advisor: "Your Tripelor Travel Advisor",
          advisorBody: "Want to change a date, add a transfer or make the trip more special? Our Maldives team can tailor this proposal for you.",
          whatsapp: "Chat with Tripelor on WhatsApp",
          notice: "This is a travel proposal, not a confirmed reservation or inventory hold. Availability, transfers, taxes, conditions and payment are confirmed before booking.",
          expiredTitle: "This quote has expired.",
          expiredBody: "Tripelor quotes stay active for 48 hours so pricing and availability remain current. You can rebuild the trip from My Trip Plan.",
          invalidTitle: "We couldn’t open this quote.",
          invalidBody: "The quote link may be incomplete or no longer valid.",
          back: "Back to My Trip",
          kinds: { stay: "stay", package: "package", excursion: "excursion" },
          tripDetails: "Trip details",
          room: "Room",
          meal: "Meal plan",
          transfer: "Transfer",
          speedboatSeats: "speedboat seat(s)",
        };

  let lines: CartLine[] = [];
  let quote: ReturnType<typeof quoteFromLines>;
  let issued = 0;
  let expiresAt = 0;
  let extras: QuoteExtras = { room: "", meal: "", transferSeats: 0, requestHref: "", customizeHref: "" };

  try {
    if (!validQuoteReference(params.reference)) throw new Error("Invalid reference.");
    issued = quoteIssuedAt(searchParams?.issued);
    lines = decodeQuoteLines(searchParams?.item);

    const room = typeof searchParams?.room === "string" && searchParams.room.length <= 100 ? searchParams.room : "";
    const meal = typeof searchParams?.meal === "string" && searchParams.meal.length <= 100 ? searchParams.meal : "";
    const transferSeatsValue = Number(searchParams?.transferSeats || 0);
    const transferSeats = Number.isInteger(transferSeatsValue) && transferSeatsValue >= 0 && transferSeatsValue <= 20 ? transferSeatsValue : 0;
    const requestHref = typeof searchParams?.request === "string" && searchParams.request.startsWith("/booking?") && searchParams.request.length <= 2500
      ? searchParams.request
      : "";
    const customizeHref = typeof searchParams?.customize === "string" && searchParams.customize.startsWith("/build-your-trip") && searchParams.customize.length <= 500
      ? searchParams.customize
      : "";
    let currency: QuoteCurrency | undefined;
    let fxRate: number | undefined;
    if (searchParams?.currency !== undefined) {
      if (searchParams.currency !== "USD" && searchParams.currency !== "MVR") throw new Error("Invalid quote currency.");
      currency = searchParams.currency;
      fxRate = Number(searchParams.fxRate);
      if (!Number.isFinite(fxRate) || fxRate < 1 || fxRate > 100) throw new Error("Invalid quote exchange rate.");
    }
    extras = { room, meal, transferSeats, requestHref, customizeHref, ...(currency ? { currency, fxRate } : {}) };

    if (!searchParams?.sig || !verifyQuoteSignature(searchParams.sig, params.reference, issued, lines, extras)) {
      throw new Error("Invalid quote signature.");
    }

    const status = quoteStatus(issued);
    expiresAt = status.expiresAt;
    if (status.expired) {
      return (
        <main className="quote-page bg-[#06151c] text-white">
          <section className="container flex min-h-[70vh] items-center justify-center py-20">
            <div className="max-w-xl text-center">
              <Clock3 className="mx-auto h-10 w-10 text-gold" />
              <h1 className="font-display mt-6 text-5xl">{copy.expiredTitle}</h1>
              <p className="mt-5 leading-7 text-white/60">{copy.expiredBody}</p>
              <Link href="/my-trip?view=plan" className="btn-gold mt-7">{copy.back}</Link>
            </div>
          </section>
        </main>
      );
    }
    const issuedMaldivesDate = new Date(issued + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    quote = quoteFromLines(lines, issuedMaldivesDate);
  } catch {
    return (
      <main className="quote-page bg-[#06151c] text-white">
        <section className="container flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-xl text-center">
            <Sparkles className="mx-auto h-10 w-10 text-gold" />
            <h1 className="font-display mt-6 text-5xl">{copy.invalidTitle}</h1>
            <p className="mt-5 leading-7 text-white/60">{copy.invalidBody}</p>
            <Link href="/my-trip" className="btn-gold mt-7">{copy.back}</Link>
          </div>
        </section>
      </main>
    );
  }

  const displayItems = quote.items.map(item => localizeQuotedLine(item, locale));
  const room = extras.room;
  const meal = extras.meal;
  const transferSeats = extras.transferSeats;
  const transferTotal = speedboatTransferTotal(transferSeats);
  const requestHref = extras.requestHref || undefined;
  const customizeHref = extras.customizeHref || undefined;
  const proposalTotal = quote.total + transferTotal;
  const currency = extras.currency || "USD";
  const fxRate = extras.fxRate || MVR_PER_USD;
  const conversionNote = locale === "it"
    ? `Convertito da ${quoteMoney(proposalTotal, "USD")} al tasso di 1 USD = MVR ${fxRate.toFixed(2)}. Tripelor confermerà la valuta e l'importo finale del pagamento.`
    : locale === "ru"
      ? `Пересчитано из ${quoteMoney(proposalTotal, "USD")} по курсу 1 USD = MVR ${fxRate.toFixed(2)}. Tripelor подтвердит валюту и окончательную сумму оплаты.`
      : `Converted from ${quoteMoney(proposalTotal, "USD")} at 1 USD = MVR ${fxRate.toFixed(2)}. Tripelor will confirm payment currency and final amount.`;

  return (
    <main className="quote-page bg-[#f1ebdf] text-[#071922]">
      <style>{`
        @media print {
          @page { size: A4; margin: 11mm; }
          body.quote-print-mode header,
          body.quote-print-mode footer,
          body.quote-print-mode .no-print { display: none !important; }
          body.quote-print-mode { background: white !important; }
          body.quote-print-mode .quote-page { background: white !important; }
          body.quote-print-mode .quote-print-card { box-shadow: none !important; border-color: #cfc4af !important; }
          body.quote-print-mode .quote-dark { color: #071922 !important; background: white !important; }
          body.quote-print-mode .quote-dark * { color: #071922 !important; }
          body.quote-print-mode .quote-hero-art { display: none !important; }
          body.quote-print-mode .quote-page section .container { padding-top: 16px !important; padding-bottom: 16px !important; }
          body.quote-print-mode .quote-page article,
          body.quote-print-mode .quote-page aside { break-inside: avoid; padding: 18px !important; }
          body.quote-print-mode .quote-page h1 { font-size: 32px !important; }
          body.quote-print-mode .quote-page h2 { font-size: 24px !important; }
        }
      `}</style>

      <section className="quote-dark relative overflow-hidden bg-[#06151c] text-white">
        <div className="quote-hero-art absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(217,189,123,.16),transparent_42%),linear-gradient(115deg,#031016,#0b2630)]" />
        <div className="container relative py-12 md:py-16">
          <div className="mb-9 flex items-center gap-3 text-[#ead7aa]"><TripelorMark className="h-10 w-10" /><span className="font-display text-xl tracking-[.15em]">TRIPELOR</span></div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl leading-tight md:text-7xl">{copy.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/65">{copy.subtitle}</p>

          <div className="mt-9 grid max-w-4xl gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-[#071922]/90 p-5">
              <p className="text-[10px] uppercase tracking-[.18em] text-white/40">{copy.quote}</p>
              <p className="mt-2 font-semibold text-[#ead7aa]">{params.reference}</p>
            </div>
            <div className="bg-[#071922]/90 p-5">
              <p className="text-[10px] uppercase tracking-[.18em] text-white/40">{copy.issued}</p>
              <p className="mt-2 font-semibold">{dateLabel(new Date(issued).toISOString(), locale, true)}</p>
            </div>
            <div className="bg-[#071922]/90 p-5">
              <p className="text-[10px] uppercase tracking-[.18em] text-white/40">{copy.valid}</p>
              <p className="mt-2 font-semibold">{dateLabel(new Date(expiresAt).toISOString(), locale, true)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 pb-24 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-start">
          <div className="space-y-5">
            {displayItems.map((item, index) => {
              const quantityLabel = item.kind === "stay" ? item.quantity === 1 ? copy.roomUnit : copy.rooms : item.unit === "couple"
                ? item.quantity === 1 ? copy.couple : copy.couples
                : item.quantity === 1 ? copy.guest : copy.guests;
              const unitLabel = item.kind === "stay" ? copy.perRoom : item.unit === "couple" ? copy.perCouple : copy.perPerson;
              return (
                <article key={item.productId} className="quote-print-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-sm md:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#8d7037]">
                        {String(index + 1).padStart(2, "0")} · {copy.kinds[item.kind]}
                      </p>
                      <h2 className="font-display mt-2 text-3xl">{item.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#687377]">{quoteMoney(item.unitPrice, currency, fxRate)} {unitLabel}</p>
                      <p className="mt-1 text-2xl font-semibold text-[#8d7037]">{quoteMoney(item.lineTotal, currency, fxRate)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 border-y border-[#ded5c5] py-4 text-sm text-[#58656c]">
                    <span>{item.quantity} {quantityLabel}</span>
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#9c7d3d]" />
                      {item.nights ? copy.checkIn : copy.preferredDate}: {dateLabel(item.date, locale)}
                    </span>
                    {item.checkOut && <span>{copy.checkOut}: {dateLabel(item.checkOut, locale)}</span>}
                    {item.duration && <span>{item.duration}</span>}
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#899194]">{item.kind === "stay" && item.quantity > 1 ? copy.eachRoom : copy.included}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {item.inclusions.map(inclusion => (
                        <p key={inclusion} className="flex items-start gap-2 text-sm leading-6 text-[#58656c]">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#9c7d3d]" /> {inclusion}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="quote-print-card quote-dark border border-[#c9a86a]/40 bg-[#071922] p-6 text-white shadow-2xl lg:sticky lg:top-28 md:p-8">
            {(room || meal || transferSeats > 0) && (
              <div className="mb-6 border-b border-white/10 pb-6">
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9bd7b]">{copy.tripDetails}</p>
                <div className="mt-4 space-y-3 text-sm text-white/65">
                  {room && <p className="flex justify-between gap-4"><span>{room.includes(", ") ? copy.rooms : copy.room}</span><strong className="text-right text-white">{room}</strong></p>}
                  {meal && <p className="flex justify-between gap-4"><span>{copy.meal}</span><strong className="text-right text-white">{meal}</strong></p>}
                  {transferSeats > 0 && <p className="flex justify-between gap-4"><span>{copy.transfer}</span><strong className="text-right text-white">{transferSeats} {copy.speedboatSeats} · {quoteMoney(transferTotal, currency, fxRate)}</strong></p>}
                </div>
              </div>
            )}
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9bd7b]">{copy.estimate}</p>
            <p className="font-display mt-3 text-4xl text-[#ead7aa] md:text-5xl">{quoteMoney(proposalTotal, currency, fxRate)}</p>
            {currency === "MVR" && <p className="mt-2 text-xs leading-5 text-white/60">{conversionNote}</p>}
            <p className="mt-4 text-sm leading-6 text-white/50">{copy.validFor}</p>

            <TripQuoteActions
              reference={params.reference}
              lines={lines}
              total={quoteAmount(proposalTotal, currency, fxRate)}
              currency={currency}
              room={room}
              transferSeats={transferSeats}
              requestHref={requestHref}
              customizeHref={customizeHref}
            />

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#ead7aa]">
                <Headphones className="h-4 w-4" /> {copy.advisor}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/55">{copy.advisorBody}</p>
              <a
                href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20would%20like%20help%20with%20my%20trip%20quote."
                className="no-print mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#ead7aa] underline underline-offset-4"
              >
                {copy.whatsapp}
              </a>
            </div>

            <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-white/40">{copy.notice}</p>
          </aside>
        </div>
      </section>
    </main>
  );
}
