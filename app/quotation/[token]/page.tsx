import { CalendarDays, Clock3, Headphones, MapPin, Users } from "lucide-react";
import ManualQuotationActions from "@/components/manual-quotation-actions";
import TripelorMark from "@/components/tripelor-mark";
import { QUOTATION_BANK_ACCOUNTS } from "@/lib/quotation-bank-details";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tripelor Quotation",
  robots: { index: false, follow: false },
};

type QuoteItem = {
  id: string;
  category: "stay" | "transfer" | "excursion" | "other";
  label: string;
  details: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type QuoteRow = {
  reference: string;
  share_token: string;
  customer_name: string;
  property_name: string;
  room_name: string;
  meal_plan: string;
  check_in: string | null;
  check_out: string | null;
  adults: number;
  children: number;
  rooms: number;
  currency: "USD" | "MVR";
  items: QuoteItem[];
  subtotal: number;
  discount_amount: number;
  fees_amount: number;
  total: number;
  notes: string;
  terms: string;
  status: string;
  valid_until: string;
  created_at: string;
};

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Quotation storage is not configured.");
  return { url, key };
}

async function quotation(token: string): Promise<QuoteRow | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const { url, key } = cfg();
  const response = await fetch(
    `${url}/rest/v1/manual_quotations?share_token=eq.${encodeURIComponent(token)}&select=reference,share_token,customer_name,property_name,room_name,meal_plan,check_in,check_out,adults,children,rooms,currency,items,subtotal,discount_amount,fees_amount,total,notes,terms,status,valid_until,created_at&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

function money(value: number, currency: "USD" | "MVR") {
  return `${currency} ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function date(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  }).format(new Date(value));
}

export default async function ManualQuotationPage({ params }: { params: { token: string } }) {
  const quote = await quotation(params.token);

  if (!quote) {
    return (
      <main className="bg-[#06151c] text-white">
        <section className="container flex min-h-[70vh] items-center justify-center py-20">
          <div className="max-w-xl text-center">
            <Clock3 className="mx-auto h-10 w-10 text-gold" />
            <h1 className="font-display mt-6 text-5xl">Quotation unavailable</h1>
            <p className="mt-5 leading-7 text-white/60">This quotation link is incomplete or no longer available.</p>
          </div>
        </section>
      </main>
    );
  }

  const expired = Date.now() > new Date(quote.valid_until).getTime();
  const cancelled = quote.status === "cancelled";
  const currency = quote.currency === "MVR" ? "MVR" : "USD";
  const guests = `${quote.adults} adult${quote.adults === 1 ? "" : "s"} · ${quote.children} child${quote.children === 1 ? "" : "ren"} · ${quote.rooms} room${quote.rooms === 1 ? "" : "s"}`;

  return (
    <main className="manual-quote-page bg-[#e9e2d5] py-6 text-[#071922] md:py-10">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          html, body {
            background: white !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, .no-print,
          .mobile-booking-bar, .floating-plan,
          a[href^="https://wa.me/"] {
            display: none !important;
          }
          body > main, .route-transition, .manual-quote-page {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            background: white !important;
          }
          .route-transition {
            animation: none !important;
            transform: none !important;
            filter: none !important;
            opacity: 1 !important;
          }
          .manual-quote-page .quote-sheet {
            width: 100% !important;
            max-width: none !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: 0 !important;
            color: #26353b !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }
          .quote-screen-actions {
            display: none !important;
          }
          .quote-header {
            padding: 0 0 4mm !important;
            background: white !important;
            border-bottom: 2px solid #b39458;
            break-inside: avoid;
          }
          .quote-header * {
            color: #26353b !important;
          }
          .quote-header-layout {
            grid-template-columns: minmax(0, 1fr) auto !important;
            align-items: start !important;
            gap: 5mm !important;
          }
          .quote-logo {
            width: 44px !important;
            height: 44px !important;
            color: #8d7037 !important;
          }
          .quote-brand {
            color: #8d7037 !important;
            font-size: 9px !important;
          }
          .quote-header h1 {
            margin-top: 5px !important;
            font-size: 32px !important;
          }
          .quote-prepared-for {
            margin-top: 6px !important;
            font-size: 11px !important;
          }
          .quote-reference {
            text-align: right !important;
            gap: 5px !important;
          }
          .quote-reference-number {
            font-size: 17px !important;
          }
          .quote-reference-dates {
            font-size: 9px !important;
            line-height: 1.5 !important;
          }
          .quote-status-notice {
            margin-top: 3mm !important;
            padding: 2mm !important;
            border: 1px solid #b39458 !important;
          }
          .quote-body {
            padding: 4mm 0 0 !important;
          }
          .quote-parties {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 5mm !important;
            padding-bottom: 3mm !important;
            break-inside: avoid;
          }
          .quote-parties p {
            margin-top: 3px !important;
          }
          .quote-travel {
            grid-template-columns: 1fr 1fr 1.3fr 1.5fr !important;
            gap: 3mm !important;
            padding: 3mm 0 !important;
            break-inside: avoid;
          }
          .quote-travel .quote-info-value {
            overflow: visible !important;
            white-space: normal !important;
            font-size: 11px !important;
          }
          .quote-stay-details {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 4px 5mm !important;
            margin-top: 3mm !important;
            padding: 2mm 3mm !important;
            border: 1px solid #ded5c5;
            break-inside: avoid;
          }
          .quote-items-wrap {
            margin-top: 3mm !important;
            overflow: visible !important;
          }
          .quote-items {
            font-size: 10.5px !important;
          }
          .quote-items thead {
            display: table-header-group;
            background: #f7f2e9 !important;
            color: #26353b !important;
          }
          .quote-items tr {
            break-inside: avoid;
          }
          .quote-items td, .quote-items th {
            padding: 6px 8px !important;
          }
          .quote-items th:nth-child(2) { width: 14mm !important; }
          .quote-items th:nth-child(3) { width: 28mm !important; }
          .quote-items th:nth-child(4) { width: 32mm !important; }
          .quote-items td:nth-child(n+3) {
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
          }
          .quote-summary {
            grid-template-columns: minmax(0, 1fr) 62mm !important;
            align-items: start;
            margin-top: 4mm !important;
            gap: 5mm !important;
          }
          .quote-notes > div {
            margin-top: 2mm !important;
            break-inside: avoid;
          }
          .quote-notes > div:first-child { margin-top: 0 !important; }
          .quote-bank-accounts {
            margin-top: 5px !important;
          }
          .quote-bank-account-number {
            font-size: 11px !important;
            letter-spacing: 0 !important;
          }
          .quote-total {
            padding: 3mm !important;
            background: #f7f2e9 !important;
            border: 1px solid #b39458;
            break-inside: avoid;
          }
          .quote-total * {
            color: #26353b !important;
          }
          .quote-total-amount {
            margin-top: 5px !important;
            font-size: 27px !important;
            line-height: 1.15 !important;
            overflow-wrap: anywhere;
          }
          .quote-total-breakdown {
            margin-top: 2mm !important;
            padding: 2mm 0 !important;
            border-color: #ded5c5 !important;
            font-size: 10px !important;
          }
          .quote-total .quote-small { margin-top: 2mm !important; }
          .quote-small {
            font-size: 10px !important;
            line-height: 1.35 !important;
          }
          .quote-footer {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
            gap: 5mm !important;
            margin-top: 4mm !important;
            padding-top: 3mm !important;
            font-size: 9px !important;
            line-height: 1.4 !important;
            break-inside: avoid;
          }
          .quote-footer > p { text-align: right !important; }
        }
      `}</style>

      <div className="quote-sheet mx-auto w-[min(100%-1rem,1120px)] overflow-hidden border border-[#cbbfa9] bg-white shadow-[0_30px_100px_rgba(30,35,38,.18)]">
        <section className="quote-header bg-[#06151c] px-6 py-7 text-white md:px-9 md:py-8">
          <div className="quote-header-layout grid gap-5 md:grid-cols-[1fr_auto] md:items-start">
            <div className="flex items-start gap-4">
              <TripelorMark className="quote-logo h-14 w-14 shrink-0 text-[#ead7aa] md:h-16 md:w-16" />
              <div>
                <p className="quote-brand text-[10px] font-bold uppercase tracking-[.28em] text-[#d9bd7b]">Tripelor · Maldives Travel</p>
                <h1 className="font-display mt-2 text-4xl leading-none md:text-5xl">Quotation</h1>
                <p className="quote-prepared-for mt-3 text-sm text-white/60">Prepared for <strong className="text-white">{quote.customer_name}</strong></p>
              </div>
            </div>
            <div className="quote-reference grid gap-2 text-left md:text-right">
              <div>
                <p className="text-[9px] uppercase tracking-[.16em] text-white/35">Reference</p>
                <p className="quote-reference-number mt-1 font-display text-2xl text-[#ead7aa]">{quote.reference}</p>
              </div>
              <div className="quote-reference-dates text-xs leading-5 text-white/45">
                <p>Created: {dateTime(quote.created_at)}</p>
                <p>Valid until: {dateTime(quote.valid_until)}</p>
              </div>
            </div>
          </div>

          {(expired || cancelled) && (
            <div className="quote-status-notice mt-5 border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">
              {cancelled
                ? "This quotation has been cancelled by Tripelor."
                : "This quotation has expired. Contact Tripelor for an updated price and availability check."}
            </div>
          )}
        </section>

        <section className="quote-body px-6 py-6 md:px-9 md:py-7">
          <div className="quote-parties grid gap-4 border-b border-[#ded5c5] pb-5 text-xs sm:grid-cols-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8d7037]">Bill to</p>
              <p className="mt-2 font-semibold text-[#26353b]">{quote.customer_name}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8d7037]">Bill from</p>
              <p className="mt-2 font-semibold text-[#26353b]">Tripelor{quote.property_name ? ` · ${quote.property_name}` : ""}</p>
              <p className="mt-1 text-[#58656c]">Maldives · bookings@tripelor.com · +960 9429403</p>
            </div>
          </div>
          <div className="quote-travel grid grid-cols-2 gap-3 border-b border-[#ded5c5] py-5 md:grid-cols-4">
            <QuickInfo icon={CalendarDays} label="Check-in" value={date(quote.check_in)} />
            <QuickInfo icon={CalendarDays} label="Check-out" value={date(quote.check_out)} />
            <QuickInfo icon={Users} label="Travellers" value={guests} />
            <QuickInfo icon={MapPin} label="Stay" value={[quote.property_name, quote.room_name].filter(Boolean).join(" · ") || "Custom quotation"} />
          </div>

          {(quote.meal_plan || quote.property_name) && (
            <div className="quote-stay-details mt-4 grid gap-3 rounded-lg bg-[#f7f2e9] px-4 py-3 text-xs text-[#58656c] sm:grid-cols-2">
              {quote.property_name && <p><strong className="text-[#39484e]">Property:</strong> {quote.property_name}</p>}
              {quote.room_name && <p><strong className="text-[#39484e]">Room:</strong> {quote.room_name}</p>}
              {quote.meal_plan && <p><strong className="text-[#39484e]">Meal plan:</strong> {quote.meal_plan}</p>}
              <p><strong className="text-[#39484e]">Status:</strong> {quote.status}</p>
            </div>
          )}

          <div className="quote-items-wrap mt-5 overflow-hidden border border-[#ded5c5]">
            <table className="quote-items w-full border-collapse text-left text-xs">
              <thead className="bg-[#071922] text-[#ead7aa]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Item</th>
                  <th className="w-[76px] px-3 py-2.5 text-center font-semibold">Qty</th>
                  <th className="w-[125px] px-3 py-2.5 text-right font-semibold">Unit</th>
                  <th className="w-[135px] px-3 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map((item, index) => (
                  <tr key={item.id || index} className="border-t border-[#e5ddcf] align-top">
                    <td className="px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8d7037]">{item.category}</p>
                      <p className="mt-1 font-semibold text-[#26353b]">{item.label}</p>
                      {item.details && <p className="quote-small mt-1 text-[10px] leading-4 text-[#7a8589]">{item.details}</p>}
                    </td>
                    <td className="px-3 py-3 text-center text-[#58656c]">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-[#58656c]">{money(item.unitPrice, currency)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-[#8d7037]">{money(item.lineTotal, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="quote-summary mt-5 grid gap-5 md:grid-cols-[1fr_290px]">
            <div className="quote-notes space-y-3">
              {quote.notes && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8d7037]">Notes</p>
                  <p className="quote-small mt-1 whitespace-pre-line text-[11px] leading-5 text-[#58656c]">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div className={quote.notes ? "border-t border-[#ded5c5] pt-3" : ""}>
                  <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8d7037]">Conditions</p>
                  <p className="quote-small mt-1 whitespace-pre-line text-[10px] leading-4 text-[#6b777c]">{quote.terms}</p>
                </div>
              )}
              {currency === "MVR" && (
                <div className="border-t border-[#ded5c5] pt-3">
                  <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#8d7037]">Bank details · confirmed bookings</p>
                  <div className="quote-bank-accounts mt-2 space-y-2">
                    {QUOTATION_BANK_ACCOUNTS.map(account => (
                      <div key={account.bank}>
                        <p className="quote-small text-[10px] leading-4 text-[#58656c]">{account.bank}</p>
                        <p className="quote-bank-account-number break-all font-semibold tracking-wide text-[#26353b]">Account number: {account.accountNumber}</p>
                      </div>
                    ))}
                  </div>
                  <p className="quote-small mt-1 text-[10px] leading-4 text-[#6b777c]">Please wait for Tripelor to confirm availability and the final amount before payment.</p>
                </div>
              )}
            </div>

            <aside className="quote-total bg-[#071922] p-5 text-white">
              <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d9bd7b]">Quotation total</p>
              <p className="quote-total-amount font-display mt-2 text-4xl text-[#ead7aa]">{money(quote.total, currency)}</p>
              <div className="quote-total-breakdown mt-4 space-y-2 border-y border-white/10 py-4 text-xs">
                <p className="flex justify-between gap-3 text-white/55"><span>Subtotal</span><strong className="text-white">{money(quote.subtotal, currency)}</strong></p>
                {Number(quote.discount_amount) > 0 && (
                  <p className="flex justify-between gap-3 text-white/55"><span>Discount</span><strong className="text-emerald-300">− {money(quote.discount_amount, currency)}</strong></p>
                )}
                {Number(quote.fees_amount) > 0 && (
                  <p className="flex justify-between gap-3 text-white/55"><span>Taxes / fees</span><strong className="text-white">{money(quote.fees_amount, currency)}</strong></p>
                )}
              </div>
              <p className="quote-small mt-4 text-[10px] leading-4 text-white/40">
                Availability is not held until Tripelor confirms the booking and payment conditions.
              </p>
            </aside>
          </div>

          <div className="quote-footer mt-5 grid gap-3 border-t border-[#ded5c5] pt-4 text-[10px] leading-4 text-[#6b777c] sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="flex items-center gap-2 font-semibold text-[#8d7037]"><Headphones className="h-3.5 w-3.5" /> Tripelor Travel Advisor</p>
              <p className="mt-1">WhatsApp: +960 9429403 · Maldives</p>
            </div>
            <p className="text-left sm:text-right">This quotation is not a confirmed reservation or inventory hold.</p>
          </div>
        </section>
      </div>

      {!cancelled && (
        <div className="quote-screen-actions no-print mx-auto mt-5 w-[min(100%-1rem,1120px)] rounded-xl border border-white/10 bg-[#06151c] p-4 text-white">
          <ManualQuotationActions
            reference={quote.reference}
            customerName={quote.customer_name}
            total={Number(quote.total)}
            currency={currency}
          />
        </div>
      )}
    </main>
  );
}

function QuickInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.14em] text-[#8d7037]">
        <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
      </p>
      <p className="quote-info-value mt-1 truncate text-xs font-semibold text-[#39484e]" title={value}>{value}</p>
    </div>
  );
}
