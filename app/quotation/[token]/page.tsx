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
  customer_email: string;
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
    `${url}/rest/v1/manual_quotations?share_token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
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
  return `USD ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  return (
    <main className="manual-quote-page bg-[#f1ebdf] text-[#071922]">
      <style>{`
        @media print {
          body.manual-quote-print-mode header,
          body.manual-quote-print-mode footer,
          body.manual-quote-print-mode .no-print { display: none !important; }
          body.manual-quote-print-mode { background: white !important; }
          body.manual-quote-print-mode .manual-quote-page { background: white !important; }
          body.manual-quote-print-mode .manual-quote-card { box-shadow: none !important; }
          body.manual-quote-print-mode .manual-quote-dark { background: white !important; color: #071922 !important; }
        }
      `}</style>

      <section className="manual-quote-dark relative overflow-hidden bg-[#06151c] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(217,189,123,.18),transparent_32%),linear-gradient(135deg,#06151c,#0b2731)]" />
        <div className="container relative py-14 md:py-20">
          <p className="eyebrow">Tripelor official quotation</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-display text-5xl leading-tight md:text-7xl">Your Maldives quotation</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/60">
                Prepared for <strong className="text-white">{quote.customer_name}</strong>.
              </p>
            </div>
            <div className="border border-white/10 bg-white/[.035] px-5 py-4">
              <p className="text-[10px] uppercase tracking-[.18em] text-white/35">Quotation reference</p>
              <p className="font-display mt-2 text-2xl text-gold">{quote.reference}</p>
              <p className="mt-2 text-xs text-white/45">Created {dateTime(quote.created_at)}</p>
            </div>
          </div>

          {(expired || cancelled) && (
            <div className="mt-7 border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              {cancelled ? "This quotation has been cancelled by Tripelor." : "This quotation has expired. Please contact Tripelor for an updated price and availability check."}
            </div>
          )}
        </div>
      </section>

      <section className="container grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="space-y-6">
          <article className="manual-quote-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-[0_25px_80px_rgba(34,43,46,.08)] md:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">Travel details</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(quote.check_in || quote.check_out) && (
                <>
                  <Detail icon={CalendarDays} label="Check-in" value={date(quote.check_in)} />
                  <Detail icon={CalendarDays} label="Check-out" value={date(quote.check_out)} />
                </>
              )}
              {quote.property_name && <Detail icon={MapPin} label="Property" value={quote.property_name} />}
              {quote.room_name && <Detail icon={CheckCircle2} label="Room" value={quote.room_name} />}
              {quote.meal_plan && <Detail icon={CheckCircle2} label="Meal plan" value={quote.meal_plan} />}
              <Detail
                icon={Users}
                label="Travellers"
                value={`${quote.adults} adult${quote.adults === 1 ? "" : "s"} · ${quote.children} child${quote.children === 1 ? "" : "ren"} · ${quote.rooms} room${quote.rooms === 1 ? "" : "s"}`}
              />
            </div>
          </article>

          <div className="space-y-4">
            {(quote.items || []).map((item, index) => (
              <article key={item.id || index} className="manual-quote-card border border-[#d0c5b0] bg-[#fffdf8] p-6 shadow-[0_18px_60px_rgba(34,43,46,.06)] md:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">
                      {String(index + 1).padStart(2, "0")} · {item.category}
                    </p>
                    <h2 className="font-display mt-2 text-3xl">{item.label}</h2>
                    {item.details && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687377]">{item.details}</p>}
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xs text-[#899194]">{item.quantity} × {usd(item.unitPrice)}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#8d7037]">{usd(item.lineTotal)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {(quote.notes || quote.terms) && (
            <article className="manual-quote-card border border-[#d0c5b0] bg-[#f8f4ec] p-6 md:p-8">
              {quote.notes && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">Notes</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#58656c]">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div className={quote.notes ? "mt-7 border-t border-[#d8cdb9] pt-7" : ""}>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d7037]">Quotation conditions</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#58656c]">{quote.terms}</p>
                </div>
              )}
            </article>
          )}
        </div>

        <aside className="manual-quote-card manual-quote-dark border border-[#c9a86a]/40 bg-[#071922] p-6 text-white shadow-2xl lg:sticky lg:top-28 md:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d9bd7b]">Quotation total</p>
          <p className="font-display mt-3 text-5xl text-[#ead7aa]">{usd(quote.total)}</p>

          <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm">
            <p className="flex justify-between gap-4 text-white/55"><span>Subtotal</span><strong className="text-white">{usd(quote.subtotal)}</strong></p>
            {Number(quote.discount_amount) > 0 && (
              <p className="flex justify-between gap-4 text-white/55"><span>Discount</span><strong className="text-emerald-300">− {usd(quote.discount_amount)}</strong></p>
            )}
            {Number(quote.fees_amount) > 0 && (
              <p className="flex justify-between gap-4 text-white/55"><span>Taxes / fees</span><strong className="text-white">{usd(quote.fees_amount)}</strong></p>
            )}
          </div>

          <p className="mt-5 text-xs leading-6 text-white/45">
            Valid until {dateTime(quote.valid_until)} Maldives time. Availability is not held until Tripelor confirms the booking and payment conditions.
          </p>

          {!cancelled && (
            <ManualQuotationActions
              reference={quote.reference}
              customerName={quote.customer_name}
              total={Number(quote.total)}
              customerEmail={quote.customer_email}
            />
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#ead7aa]">
              <Headphones className="h-4 w-4" /> Tripelor Travel Advisor
            </p>
            <p className="mt-3 text-sm leading-6 text-white/55">
              To change dates, room type, meal plan, transfer or excursions, contact Tripelor and we will issue an updated quotation.
            </p>
            <a
              href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20need%20help%20with%20my%20quotation."
              className="no-print mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#ead7aa] underline underline-offset-4"
            >
              WhatsApp Tripelor
            </a>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#ded5c5] bg-[#f8f4ec] p-4">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[#8d7037]">
        <Icon className="h-4 w-4" /> {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#39484e]">{value}</p>
    </div>
  );
}
