import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Headphones,
  Hotel,
  Mail,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Ship,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import VoucherActions from "@/components/voucher-actions";

type Reservation = {
  booking_reference: string | null;
  property_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  status: string;
  payment_status: string;
  package_name: string | null;
  estimated_total: number | null;
  speedboat_seats: number;
  speedboat_total: number;
  activities: string | null;
  notes: string | null;
  meal_plan: string | null;
  adults: number;
  children: number;
};

async function getReservation(ref: string): Promise<Reservation | null> {
  try {
    const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key || !ref || ref === "Pending") return null;

    const response = await fetch(
      `${url}/rest/v1/reservations?booking_reference=eq.${encodeURIComponent(ref)}&select=booking_reference,property_name,room_type,check_in,check_out,guest_name,status,payment_status,package_name,estimated_total,speedboat_seats,speedboat_total,activities,notes,meal_plan,adults,children&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const result = await response.json();
    return result?.[0] || null;
  } catch {
    return null;
  }
}

function prettyDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams?: { name?: string; title?: string; dates?: string; ref?: string; total?: string };
}) {
  const ref = searchParams?.ref || "Pending";
  const booking = await getReservation(ref);
  const payment = booking?.payment_status?.toLowerCase() === "paid" ? "Paid" : "Payment pending";
  const guestName = booking?.guest_name || searchParams?.name || "Guest";
  const propertyName = booking?.property_name || searchParams?.title || "Tripelor Stay";

  return (
    <main className="bg-[#f1ebdf] pb-24 text-[#071922]">
      <style>{`@media print{header,footer,.no-print{display:none!important}body,main{background:white!important;color:#111!important}.voucher{box-shadow:none!important;border:1px solid #bbb!important;background:white!important;color:#111!important}.voucher *{color:#111!important}.voucher .gold{color:#8d7037!important}}`}</style>

      <section className="no-print relative overflow-hidden bg-[#06151c] text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#c9a86a]/10 blur-3xl" />
        <div className="container relative py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a86a]/45 bg-[#c9a86a]/10">
              <CheckCircle2 className="h-8 w-8 text-[#d9bd7b]" />
            </div>
            <p className="eyebrow mt-6">Travel request received</p>
            <h1 className="font-display mt-4 text-5xl leading-tight md:text-7xl">Your journey is in caring hands.</h1>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/55">
              Thank you, {guestName}. Your Tripelor concierge will personally review the details and share final confirmation and payment instructions.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-left">
              {[
                ["01", "Request received", true],
                ["02", "Concierge review", false],
                ["03", "Confirmation issued", false],
              ].map(([number, label, complete]) => (
                <div key={String(number)} className="bg-[#071922] p-4 md:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-xl italic text-[#d9bd7b]">{number}</p>
                    {complete && <Check className="h-4 w-4 text-[#d9bd7b]" />}
                  </div>
                  <p className={`mt-2 text-[9px] uppercase tracking-[.14em] md:text-[10px] ${complete ? "text-white" : "text-white/35"}`}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container pt-10">
        <section className="voucher mx-auto max-w-5xl overflow-hidden border border-[#c9b88f] bg-[#fffdf8] shadow-[0_30px_100px_rgba(34,43,46,.14)]">
          <div className="grid gap-6 border-b border-[#d8cdb8] bg-[#f8f2e7] p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <p className="gold flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.3em] text-[#8d7037]">
                <Sparkles className="h-4 w-4" /> Tripelor private travel
              </p>
              <h2 className="font-display mt-3 text-4xl md:text-5xl">Travel Request Voucher</h2>
              <p className="mt-2 text-sm text-[#687377]">A clear record of the journey you asked us to arrange.</p>
            </div>
            <div className="border border-[#c9b88f] bg-[#fffdf8] px-5 py-4 md:min-w-56">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#778184]">Request reference</p>
              <p className="gold font-display mt-2 text-3xl text-[#8d7037]">{ref}</p>
            </div>
          </div>

          <div className="p-7 md:p-10">
            <div className="grid gap-px overflow-hidden border border-[#d8cdb8] bg-[#d8cdb8] md:grid-cols-2">
              <VoucherDetail icon={Hotel} label="Selected stay" title={propertyName} detail={booking?.room_type || "Room details pending"} />
              <VoucherDetail
                icon={Users}
                label="Lead guest"
                title={guestName}
                detail={
                  booking
                    ? `${booking.adults} adult${booking.adults === 1 ? "" : "s"}${
                        booking.children
                          ? ` · ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                          : ""
                      }`
                    : "Guest details on confirmation"
                }
              />
            </div>

            <div className="mt-px grid gap-px overflow-hidden border border-[#d8cdb8] bg-[#d8cdb8] md:grid-cols-3">
              <VoucherDetail icon={CalendarDays} label="Check-in" title={booking ? prettyDate(booking.check_in) : searchParams?.dates || "Pending"} />
              <VoucherDetail icon={CalendarDays} label="Check-out" title={booking ? prettyDate(booking.check_out) : "See booking dates"} />
              <VoucherDetail icon={Utensils} label="Dining" title={booking?.meal_plan || "As requested"} />
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <JourneyDetail
                icon={PackageCheck}
                label="Package & activities"
                value={booking?.activities || booking?.package_name || "No package activities added"}
              />
              <JourneyDetail
                icon={Ship}
                label="Speedboat transfer"
                value={
                  booking && booking.speedboat_seats > 0
                    ? `${booking.speedboat_seats} seat${booking.speedboat_seats === 1 ? "" : "s"} requested`
                    : "Not added"
                }
                detail={booking && booking.speedboat_total > 0 ? `USD ${Number(booking.speedboat_total).toFixed(2)}` : undefined}
              />
              <JourneyDetail
                icon={CreditCard}
                label="Estimated total"
                value={`USD ${
                  booking?.estimated_total != null
                    ? Number(booking.estimated_total).toFixed(2)
                    : searchParams?.total || "0"
                }`}
                detail={payment}
                accent
              />
            </div>

            {booking?.notes && (
              <div className="mt-4 border border-[#d8cdb8] bg-[#f8f4ec] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#778184]">Special requests & notes</p>
                <p className="mt-3 text-sm leading-7 text-[#58656c]">{booking.notes}</p>
              </div>
            )}

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <div className="border border-[#c9b88f] bg-[#f3ead9] p-6">
                <ShieldCheck className="h-5 w-5 text-[#8d7037]" />
                <h3 className="font-display mt-4 text-2xl">Concierge review in progress</h3>
                <p className="mt-2 text-sm leading-7 text-[#58656c]">
                  Status: {booking?.status || "Pending"}. This voucher records your request; final confirmation and payment instructions are issued personally by Tripelor.
                </p>
              </div>
              <div className="border border-[#d8cdb8] bg-[#f8f4ec] p-6">
                <Headphones className="h-5 w-5 text-[#8d7037]" />
                <h3 className="font-display mt-4 text-2xl">Your travel support</h3>
                <p className="mt-2 text-sm leading-7 text-[#58656c]">
                  WhatsApp: +960 942 9403<br />
                  Email: bookings@tripelor.com
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-[#d8cdb8] pt-6 text-center text-[10px] uppercase tracking-[.15em] text-[#778184] md:flex-row md:items-center md:justify-between md:text-left">
              <span>Tripelor · Maldives</span>
              <span>Keep this voucher available during your journey</span>
            </div>
          </div>
        </section>

        <VoucherActions />

        <div className="no-print mx-auto mt-8 grid max-w-5xl gap-px overflow-hidden border border-[#d0c5b0] bg-[#d0c5b0] sm:grid-cols-3">
          <div className="bg-[#f8f4ec] p-5 text-center">
            <Mail className="mx-auto h-5 w-5 text-[#8d7037]" />
            <p className="mt-3 text-sm text-[#58656c]">A booking summary is also sent by email.</p>
          </div>
          <div className="bg-[#f8f4ec] p-5 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-[#8d7037]" />
            <p className="mt-3 text-sm text-[#58656c]">No automatic charge is taken.</p>
          </div>
          <a href="https://wa.me/9609429403" className="group bg-[#f8f4ec] p-5 text-center transition hover:bg-[#f3ead9]">
            <MessageCircle className="mx-auto h-5 w-5 text-[#8d7037]" />
            <p className="mt-3 text-sm text-[#58656c] group-hover:text-[#071922]">Contact your Tripelor concierge.</p>
          </a>
        </div>

        <div className="no-print mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-outline border-[#9c7d3d] text-[#7c622e]">
            Back Home
          </Link>
          <Link href="/account" className="btn-gold">
            My Trip <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

function VoucherDetail({
  icon: Icon,
  label,
  title,
  detail,
}: {
  icon: typeof Hotel;
  label: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="bg-[#fffdf8] p-6 md:p-7">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.17em] text-[#778184]">
        <Icon className="h-4 w-4 text-[#8d7037]" /> {label}
      </p>
      <p className="font-display mt-3 text-2xl">{title}</p>
      {detail && <p className="mt-1 text-sm text-[#687377]">{detail}</p>}
    </div>
  );
}

function JourneyDetail({
  icon: Icon,
  label,
  value,
  detail,
  accent = false,
}: {
  icon: typeof Hotel;
  label: string;
  value: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <div className={`border p-6 ${accent ? "border-[#c9b88f] bg-[#f3ead9]" : "border-[#d8cdb8] bg-[#f8f4ec]"}`}>
      <Icon className="h-5 w-5 text-[#8d7037]" />
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.17em] text-[#778184]">{label}</p>
      <p className={`mt-2 leading-6 ${accent ? "gold font-display text-2xl text-[#8d7037]" : "font-semibold"}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-[#687377]">{detail}</p>}
    </div>
  );
}
