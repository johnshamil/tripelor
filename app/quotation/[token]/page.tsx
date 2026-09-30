import { CalendarDays, CheckCircle2, Clock3, Headphones, MapPin, Users } from "lucide-react";
import ManualQuotationActions from "@/components/manual-quotation-actions";

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
    `${url}/rest/v1/manual_quotations?share_token=eq.${encodeURIComponent(token)}&select=reference,share_token,customer_name,property_name,room_name,meal_plan,check_in,check_out,adults,children,rooms,items,subtotal,discount_amount,fees_amount,total,notes,terms,status,valid_until,created_at&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );
  if (!response.ok) return null;
  const rows = await response.json();
  return rows?.[0] || null;
}

function usd(value: number) {
  return `USD ${Number(value || 0).toLocaleString("en-US", {
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

function categoryLabel(value: QuoteItem["category"]) {
  if (value === "stay") return "Stay";
  if (value === "transfer") return "Transfer";
  if (value === "excursion") return "Excursion";
  return "Other";
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

  return (
    <main className="manual-quote-page bg-[#ece6da] py-6 text-[#071922] md:py-10">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print {
          body.manual-quote-print-mode header,
          body.manual-quote-print-mode footer,
          body.manual-quote-print-mode .no-print { display: none !important; }
          body.manual-quote-print-mode { background: white !important; padding: 0 !important; }
          body.manual-quote-print-mode .manual-quote-page { background: white !important; padding: 0 !important; }
          body.manual-quote-print-mode .quote-sheet {
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            box-shadow: none !important;
            border: 0 !important;
            padding: 7mm !important;
            font-size: 10px !important;
          }
          body.manual-quote-print-mode .quote-sheet h1 { font-size: 27px !important; }
          body.manual-quote-print-mode .quote-sheet .quote-total { font-size: 31px !important; }
          body.manual-quote-print-mode .quote-sheet table { font-size: 9px !important; }
          body.manual-quote-print-mode .quote-sheet th,
          body.manual-quote-print-mode .quote-sheet td { padding: 4px 5px !important; }
          body.manual-quote-print-mode .quote-sheet .compact-section { margin-top: 8px !important; padding-top: 8px !important; }
          body.manual-quote-print-mode .quote-sheet .terms-copy { font-size: 8px !important; line-height: 1.35 !important; }
        }
      `}</style>

      <section className="quote-sheet mx-auto w-[min(100%-1.25rem,1000px)] border border-[#cfc4af] bg-[#fffdf8] p-5 shadow-[0_30px_90px_rgba(34,43,46,.14)] md:p-8">
        <header className="flex flex-col gap-5 border-b border-[#d8cdb9] pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-[#8d7037]">Tripelor · Official Quotation</p>
            <h1 className="font-display mt-2 text-4xl leading-none md:text-5xl">Maldives Travel Quotation</h1>
            <p className="mt-3 text-sm text-[#687377]">
              Prepared for <strong className="text-[#071922]">{quote.customer_name}</strong>
            </p>
          </div>
          <div className="min-w-[230px] border border-[#d8cdb9] bg-[#f6f1e8] p-4">
            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#899194]">Quotation reference</p>
            <p className="font-display mt-1 text-2xl text-[#8d7037]">{quote.reference}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#58656c]">
              <span>Created</span><strong className="text-right text-[#071922]">{dateTime(quote.created_at)}</strong>
              <span>Valid until</span><strong className="text-right text-[#071922]">{dateTime(quote.valid_until)}</strong>
            </div>
          </div>
        </header>

        {(expired || cancelled) && (
          <div className="mt-4 border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-900">
            {cancelled
              ? "This quotation has been cancelled by Tripelor."
              : "This quotation has expired. Please contact Tripelor for an updated quotation."}
          </div>
        )}

        <section className="compact-section mt-5 grid gap-3 border-b border-[#d8cdb9] pb-5 sm:grid-cols-2 lg:grid-cols-3">
          {(quote.check_in || quote.check_out) && (
            <>
              <MiniDetail icon={CalendarDays} label="Check-in" value={date(quote.check_in)} />
              <MiniDetail icon={CalendarDays} label="Check-out" value={date(quote.check_out)} />
            </>
          )}
          {quote.property_name && <MiniDetail icon={MapPin} label="Property" value={quote.property_name} />}
          {quote.room_name && <MiniDetail icon={CheckCircle2} label="Room" value={quote.room_name} />}
          {quote.meal_plan && <MiniDetail icon={CheckCircle2} label="Meal plan" value={quote.meal_plan} />}
          <MiniDetail
            icon={Users}
            label="Travellers"
            value={`${quote.adults} adult${quote.adults === 1 ? "" : "s"} · ${quote.children} child${quote.children === 1 ? "" : "ren"} · ${quote.rooms} room${quote.rooms === 1 ? "" : "s"}`}
          />
        </section>

        <section className="compact-section mt-5">
          <div className="overflow-hidden border border-[#d8cdb9]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#f0e8da] text-[10px] uppercase tracking-[.12em] text-[#6f6047]">
                <tr>
                  <th className="px-3 py-3">Item</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Details</th>
                  <th className="px-3 py-3 text-center">Qty</th>
                  <th className="px-3 py-3 text-right">Rate</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(quote.items || []).map((item, index) => (
                  <tr key={item.id || index} className="border-t border-[#ded5c5] align-top">
                    <td className="px-3 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#9c7d3d]">
                        {categoryLabel(item.category)}
                      </p>
                      <p className="mt-1 font-semibold">{item.label}</p>
                      {item.details && <p className="mt-1 text-xs leading-5 text-[#687377] sm:hidden">{item.details}</p>}
                    </td>
                    <td className="hidden max-w-[320px] px-3 py-3 text-xs leading-5 text-[#687377] sm:table-cell">{item.details || "—"}</td>
                    <td className="px-3 py-3 text-center">{item.quantity}</td>
                    <td className="px-3 py-3 text-right">{usd(item.unitPrice)}</td>
                    <td className="px-3 py-3 text-right font-semibold text-[#8d7037]">{usd(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="compact-section mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div>
            {quote.notes && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#8d7037]">Notes</p>
                <p className="mt-2 whitespace-pre-line text-xs leading-5 text-[#58656c]">{quote.notes}</p>
              </div>
            )}

            {quote.terms && (
              <div className={quote.notes ? "mt-4 border-t border-[#e1d8ca] pt-4" : ""}>
                <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[#8d7037]">Quotation conditions</p>
                <p className="terms-copy mt-2 whitespace-pre-line text-xs leading-5 text-[#687377]">{quote.terms}</p>
              </div>
            )}
          </div>

          <aside className="border border-[#bfa66e] bg-[#071922] p-5 text-white">
            <div className="space-y-2 text-xs">
              <p className="flex justify-between gap-4 text-white/55"><span>Subtotal</span><strong className="text-white">{usd(quote.subtotal)}</strong></p>
              {Number(quote.discount_amount) > 0 && (
                <p className="flex justify-between gap-4 text-white/55"><span>Discount</span><strong className="text-emerald-300">− {usd(quote.discount_amount)}</strong></p>
              )}
              {Number(quote.fees_amount) > 0 && (
                <p className="flex justify-between gap-4 text-white/55"><span>Taxes / fees</span><strong className="text-white">{usd(quote.fees_amount)}</strong></p>
              )}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#d9bd7b]">Final selling price</p>
              <p className="quote-total font-display mt-2 text-4xl text-[#ead7aa]">{usd(quote.total)}</p>
            </div>
          </aside>
        </section>

        <footer className="compact-section mt-5 flex flex-col gap-4 border-t border-[#d8cdb9] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#8d7037]">
              <Headphones className="h-4 w-4" /> Tripelor Travel Advisor
            </p>
            <p className="mt-1 text-xs leading-5 text-[#687377]">
              Availability is not held until Tripelor confirms the booking and payment conditions. Changes to dates, occupancy or inclusions may require a revised quotation.
            </p>
          </div>
          <div className="no-print shrink-0">
            {!cancelled && (
              <ManualQuotationActions
                reference={quote.reference}
                customerName={quote.customer_name}
                total={Number(quote.total)}
              />
            )}
          </div>
        </footer>
      </section>
    </main>
  );
}

function MiniDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#ded5c5] bg-[#f8f4ec] p-3">
      <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#8d7037]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#39484e]">{value}</p>
    </div>
  );
}
