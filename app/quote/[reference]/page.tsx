import Link from "next/link";
import { CheckCircle2, Clock3, Headphones, Sparkles } from "lucide-react";
import { cookies } from "next/headers";
import TripQuoteActions from "@/components/trip-quote-actions";
import TripelorMark from "@/components/tripelor-mark";
import { professionalLocale } from "@/lib/professional-translations";
import { decodeQuoteLines, quoteFromLines, quoteIssuedAt, quoteStatus, validQuoteReference, QUOTE_VALID_HOURS } from "@/lib/trip-quote";
import type { CartLine } from "@/lib/trip-cart";
import { localizeQuotedLine } from "@/lib/quote-display";
import { verifyQuoteSignature, type QuoteExtras } from "@/lib/trip-quote-server";
import { DEFAULT_SPEEDBOAT_SEAT_PRICE_USD, speedboatTransferTotal } from "@/lib/transfer-pricing";
import { MVR_PER_USD, quoteAmount, quoteMoney, type QuoteCurrency } from "@/lib/quote-currency";
import { QUOTATION_BANK_ACCOUNTS } from "@/lib/quotation-bank-details";

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
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
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
        document: "Preventivo",
        preparedFor: "Preparato per",
        preparedBy: "Preparato da",
        guestTbc: "Ospite da confermare",
        item: "Voce",
        description: "Descrizione",
        unitPrice: "Prezzo",
        quantity: "Quantità",
        total: "Totale",
        subtotal: "Subtotale",
        bankDetails: "Coordinate bancarie · solo per prenotazioni confermate",
        bankName: "Banca",
        beneficiary: "Intestatario",
        accountNumber: "Numero di conto",
        paymentNote: "Non effettuare il pagamento prima della conferma della disponibilità e dell'importo finale da parte di Tripelor.",
        terms: "Note e condizioni",
        inclusions: "Dettagli inclusi",
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
          document: "Предложение",
          preparedFor: "Подготовлено для",
          preparedBy: "Подготовлено компанией",
          guestTbc: "Имя гостя уточняется",
          item: "Услуга",
          description: "Описание",
          unitPrice: "Цена",
          quantity: "Количество",
          total: "Итого",
          subtotal: "Промежуточный итог",
          bankDetails: "Банковские реквизиты · для подтверждённого бронирования",
          bankName: "Банк",
          beneficiary: "Получатель",
          accountNumber: "Номер счёта",
          paymentNote: "Не отправляйте оплату до подтверждения наличия мест и окончательной суммы компанией Tripelor.",
          terms: "Примечания и условия",
          inclusions: "Что включено",
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
          document: "Quotation",
          preparedFor: "Prepared for",
          preparedBy: "Prepared by",
          guestTbc: "Guest to be confirmed",
          item: "Item",
          description: "Description",
          unitPrice: "Price",
          quantity: "Quantity",
          total: "Total",
          subtotal: "Subtotal",
          bankDetails: "Bank details · for confirmed bookings",
          bankName: "Bank",
          beneficiary: "Account name",
          accountNumber: "Account number",
          paymentNote: "Please wait for Tripelor to confirm availability and the final amount before making payment.",
          terms: "Notes and conditions",
          inclusions: "What’s included",
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
    const clientName = typeof searchParams?.clientName === "string" && searchParams.clientName.length <= 120 ? searchParams.clientName : "";
    const clientEmail = typeof searchParams?.clientEmail === "string" && searchParams.clientEmail.length <= 180 ? searchParams.clientEmail : "";
    const clientPhone = typeof searchParams?.clientPhone === "string" && searchParams.clientPhone.length <= 50 ? searchParams.clientPhone : "";
    let currency: QuoteCurrency | undefined;
    let fxRate: number | undefined;
    if (searchParams?.currency !== undefined) {
      if (searchParams.currency !== "USD" && searchParams.currency !== "MVR") throw new Error("Invalid quote currency.");
      currency = searchParams.currency;
      fxRate = Number(searchParams.fxRate);
      if (!Number.isFinite(fxRate) || fxRate < 1 || fxRate > 100) throw new Error("Invalid quote exchange rate.");
    }
    extras = { room, meal, transferSeats, requestHref, customizeHref, ...(currency ? { currency, fxRate } : {}), clientName, clientEmail, clientPhone };

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

  const showBankDetails = currency === "MVR" && Boolean(room);

  return (
    <main className="quote-page bg-[#eee8dc] py-8 text-[#111c20] md:py-14">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body.quote-print-mode > header,
          body.quote-print-mode > footer,
          body.quote-print-mode .no-print { display: none !important; }
          body.quote-print-mode { background: white !important; }
          body.quote-print-mode .quote-page { padding: 0 !important; background: white !important; }
          body.quote-print-mode .quote-sheet { box-shadow: none !important; border: 0 !important; }
          body.quote-print-mode .quote-document-header,
          body.quote-print-mode .quote-total-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body.quote-print-mode .quote-page tr,
          body.quote-print-mode .quote-page .quote-section { break-inside: avoid; }
          body.quote-print-mode .quote-page .quote-sheet > div { padding-top: 16px !important; padding-bottom: 16px !important; }
          body.quote-print-mode .quote-page h1 { font-size: 36px !important; }
        }
      `}</style>

      <div className="container max-w-5xl">
        <div className="quote-sheet overflow-hidden border border-[#d5c9b7] bg-white shadow-[0_30px_90px_rgba(28,31,30,.12)]">
          <div className="quote-document-header bg-[#080b0c] px-6 py-9 text-white sm:px-9 md:px-12 md:py-11">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#dfbd70]">Tripelor · Maldives</p>
                <h1 className="font-display mt-3 text-5xl text-[#e2bd68] sm:text-6xl">{copy.document}</h1>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">{copy.subtitle}</p>
              </div>
              <div className="flex items-center gap-3 text-[#e2bd68]">
                <TripelorMark className="h-14 w-14" />
                <span className="font-display text-xl tracking-[.15em]">TRIPELOR</span>
              </div>
            </div>
            <dl className="mt-9 grid gap-4 border-t border-[#d9bd7b]/35 pt-5 text-sm sm:grid-cols-3">
              <div><dt className="text-[10px] uppercase tracking-[.18em] text-white/55">{copy.quote}</dt><dd className="mt-1 font-semibold text-[#e2bd68]">{params.reference}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[.18em] text-white/55">{copy.issued}</dt><dd className="mt-1 font-medium">{dateLabel(new Date(issued).toISOString(), locale, true)}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-[.18em] text-white/55">{copy.valid}</dt><dd className="mt-1 font-medium">{dateLabel(new Date(expiresAt).toISOString(), locale, true)}</dd></div>
            </dl>
          </div>

          <div className="grid gap-6 border-b border-[#e1d8c9] px-6 py-7 text-sm sm:grid-cols-2 sm:px-9 md:px-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-[#987432]">{copy.preparedFor}</h2>
              <p className="mt-3 font-semibold text-[#111c20]">{extras.clientName || copy.guestTbc}</p>
              {extras.clientEmail && <p className="mt-1 break-all text-[#506066]">{extras.clientEmail}</p>}
              {extras.clientPhone && <p className="mt-1 text-[#506066]">{extras.clientPhone}</p>}
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-[#987432]">{copy.preparedBy}</h2>
              <p className="mt-3 font-semibold">Tripelor</p>
              {room && <p className="mt-1 text-[#506066]">Uhoo&apos;s Lavish Oasis · Felidhoo, Maldives</p>}
              <p className="mt-1 text-[#506066]">bookings@tripelor.com</p>
              <p className="mt-1 text-[#506066]">+960 9429403</p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-9 md:px-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#0b0e0f] text-[#e2bd68]">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-semibold sm:px-4">{copy.item}</th>
                    <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">{copy.description}</th>
                    <th scope="col" className="hidden px-4 py-3 text-right font-semibold md:table-cell">{copy.unitPrice}</th>
                    <th scope="col" className="px-2 py-3 text-center font-semibold sm:px-4">{copy.quantity}</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold sm:px-4">{copy.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map(item => {
                    const unitLabel = item.kind === "stay" ? copy.perRoom : item.unit === "couple" ? copy.perCouple : copy.perPerson;
                    const quantityLabel = item.kind === "stay" ? item.quantity === 1 ? copy.roomUnit : copy.rooms : item.unit === "couple"
                      ? item.quantity === 1 ? copy.couple : copy.couples
                      : item.quantity === 1 ? copy.guest : copy.guests;
                    return (
                      <tr key={item.productId} className="border-b border-[#e5ddd0] align-top">
                        <td className="px-3 py-4 sm:px-4">
                          <p className="font-semibold leading-5">{item.name}</p>
                          <p className="mt-1 text-xs text-[#687377]">{copy.kinds[item.kind]}</p>
                          <p className="mt-2 text-xs leading-5 text-[#687377] sm:hidden">
                            {dateLabel(item.date, locale)}{item.checkOut ? ` – ${dateLabel(item.checkOut, locale)}` : ""}
                            <br />{quoteMoney(item.unitPrice, currency, fxRate)} {unitLabel}
                          </p>
                        </td>
                        <td className="hidden px-4 py-4 text-[#506066] sm:table-cell">
                          <p>{item.nights ? `${copy.checkIn}: ${dateLabel(item.date, locale)}` : `${copy.preferredDate}: ${dateLabel(item.date, locale)}`}</p>
                          {item.checkOut && <p className="mt-1">{copy.checkOut}: {dateLabel(item.checkOut, locale)}</p>}
                          {item.duration && <p className="mt-1">{item.duration}</p>}
                          {room && item.kind === "stay" && <p className="mt-1">{room}</p>}
                        </td>
                        <td className="hidden px-4 py-4 text-right text-[#506066] md:table-cell">{quoteMoney(item.unitPrice, currency, fxRate)}<span className="block text-xs">{unitLabel}</span></td>
                        <td className="px-2 py-4 text-center sm:px-4">{item.quantity}<span className="block text-[10px] text-[#687377]">{quantityLabel}</span></td>
                        <td className="px-3 py-4 text-right font-semibold text-[#806026] sm:px-4">{quoteMoney(item.lineTotal, currency, fxRate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-8 px-6 pb-8 sm:px-9 md:grid-cols-[1fr_310px] md:px-12">
            <div className="quote-section text-sm">
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-[#987432]">{copy.tripDetails}</h2>
              <div className="mt-3 space-y-1 leading-6 text-[#506066]">
                {room && <p>{room.includes(", ") ? copy.rooms : copy.room}: <strong className="text-[#111c20]">{room}</strong></p>}
                {meal && <p>{copy.meal}: <strong className="text-[#111c20]">{meal}</strong></p>}
                {transferSeats > 0 && <p>{copy.transfer}: <strong className="text-[#111c20]">{transferSeats} {copy.speedboatSeats}</strong></p>}
              </div>
              {displayItems.some(item => item.inclusions.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-[.14em] text-[#987432]">{copy.inclusions}</h3>
                  {displayItems.map(item => item.inclusions.length > 0 && (
                    <div key={item.productId} className="mt-3">
                      <p className="font-semibold">{item.name}{item.kind === "stay" && item.quantity > 1 ? ` · ${copy.eachRoom}` : ""}</p>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#506066]">
                        {item.inclusions.map(inclusion => <li key={inclusion} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#987432]" />{inclusion}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="quote-section self-start border border-[#d9c6a0] bg-[#faf7ef] text-sm">
              <div className="space-y-3 px-5 py-4">
                <p className="flex justify-between gap-3"><span>{copy.subtotal}</span><span className="font-semibold">{quoteMoney(quote.total, currency, fxRate)}</span></p>
                {transferSeats > 0 && <p className="flex justify-between gap-3"><span>{copy.transfer} · {transferSeats}</span><span className="font-semibold">{quoteMoney(transferTotal, currency, fxRate)}</span></p>}
              </div>
              <div className="quote-total-bar flex items-center justify-between gap-3 bg-[#0b0e0f] px-5 py-4 font-bold text-[#e2bd68]">
                <span>{copy.estimate}</span><span className="text-lg">{quoteMoney(proposalTotal, currency, fxRate)}</span>
              </div>
              {currency === "MVR" && <p className="px-5 py-3 text-xs leading-5 text-[#506066]">{conversionNote}</p>}
            </div>
          </div>

          {showBankDetails && (
            <div className="quote-section mx-6 border-t border-[#e1d8c9] py-6 text-sm sm:mx-9 md:mx-12">
              <h2 className="text-xs font-bold uppercase tracking-[.14em] text-[#987432]">{copy.bankDetails}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {QUOTATION_BANK_ACCOUNTS.map(account => (
                  <dl key={account.bank} className="min-w-0 border border-[#e1d8c9] bg-white p-4">
                    <div><dt className="text-xs text-[#687377]">{copy.bankName}</dt><dd className="mt-1 font-semibold">{account.bank}</dd></div>
                    <div className="mt-3"><dt className="text-xs text-[#687377]">{copy.accountNumber}</dt><dd className="mt-1 break-all font-semibold tracking-wide">{account.accountNumber}</dd></div>
                  </dl>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-[#506066]">{copy.paymentNote}</p>
            </div>
          )}

          <div className="quote-section border-t border-[#e1d8c9] px-6 py-6 text-xs leading-5 text-[#506066] sm:px-9 md:px-12">
            <h2 className="mb-2 font-bold uppercase tracking-[.14em] text-[#987432]">{copy.terms}</h2>
            <p>{copy.notice}</p>
            <p className="mt-2">{copy.validFor}</p>
          </div>
          <div className="h-3 bg-[#0b0e0f]" />
        </div>

        <div className="no-print mt-7 bg-[#071922] p-6 text-white sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#e2bd68]"><Headphones className="h-4 w-4" />{copy.advisor}</p>
          <p className="mt-2 text-sm leading-6 text-white/65">{copy.advisorBody}</p>
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
          <a href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20would%20like%20help%20with%20my%20trip%20quote." className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[#e2bd68] underline underline-offset-4">{copy.whatsapp}</a>
        </div>
      </div>
    </main>
  );
}
