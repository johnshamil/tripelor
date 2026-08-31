"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Headphones,
  Hotel,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Printer,
  ShieldCheck,
  Ship,
  Sparkles,
  TicketCheck,
  Users,
  Utensils,
  WalletCards,
  Waves,
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {properties} from "@/lib/properties";

type User = {email: string; fullName?: string};

type Booking = {
  activities?: string | null;
  adults?: number;
  booking_reference?: string | null;
  check_in: string;
  check_out: string;
  children?: number;
  estimated_total?: number | null;
  id: string;
  meal_plan?: string | null;
  notes?: string | null;
  package_name?: string | null;
  payment_status?: string | null;
  property_name: string;
  room_type?: string;
  rooms?: number;
  speedboat_seats?: number;
  speedboat_total?: number;
  status?: string;
};

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function prettyDate(value?: string, short = false) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnly(value));
}

function tripNights(checkIn: string, checkOut: string) {
  return Math.max(1, Math.round((dateOnly(checkOut).getTime() - dateOnly(checkIn).getTime()) / 86_400_000));
}

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

function statusStyle(status?: string) {
  const value = String(status || "pending").toLowerCase();
  if (value === "confirmed" || value === "completed") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-200";
  if (value === "cancelled") return "border-red-300/30 bg-red-400/10 text-red-200";
  return "border-amber-300/30 bg-amber-400/10 text-amber-100";
}

export default function TravelWalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const memberResponse = await fetch("/api/auth/me", {cache: "no-store"});
        const member = await memberResponse.json();
        if (!member.user) {
          window.location.href = "/login?next=%2Faccount%2Fwallet";
          return;
        }
        setUser(member.user);

        const bookingResponse = await fetch("/api/account/bookings", {cache: "no-store"});
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Unable to load your travel wallet.");
        setBookings(bookingData.bookings || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your travel wallet.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeBookings = useMemo(() => {
    const today = maldivesToday();
    return bookings
      .filter(booking => {
        const status = String(booking.status || "").toLowerCase();
        return status !== "cancelled" && booking.check_out && booking.check_out >= today;
      })
      .sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)));
  }, [bookings]);

  useEffect(() => {
    if (!selectedId && activeBookings[0]) setSelectedId(activeBookings[0].id);
  }, [activeBookings, selectedId]);

  const trip = activeBookings.find(booking => booking.id === selectedId) || activeBookings[0] || null;
  const property = trip ? properties.find(item => item.name.toLowerCase() === trip.property_name.toLowerCase()) : null;
  const image = property?.images?.[0] || "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
  const location = property?.location || "Maldives";
  const paymentPaid = String(trip?.payment_status || "").toLowerCase() === "paid";
  const activities = trip?.activities || trip?.package_name || "";
  const speedboatSeats = Number(trip?.speedboat_seats || 0);
  const guestCount = Number(trip?.adults || 0) + Number(trip?.children || 0);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${trip?.property_name || "Tripelor"}, ${location}`)}`;

  if (loading) {
    return <main className="container py-20 text-gray-400">Preparing your Tripelor Travel Wallet...</main>;
  }

  if (!user) return null;

  if (error) {
    return (
      <main className="container py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/5 p-8 text-center">
          <WalletCards className="mx-auto h-9 w-9 text-gold" />
          <h1 className="font-display mt-4 text-4xl">Travel Wallet unavailable</h1>
          <p className="mt-3 text-gray-400">{error}</p>
          <Link href="/account" className="btn-outline mt-6">Back to My Trip</Link>
        </div>
      </main>
    );
  }

  if (!trip) {
    return (
      <main className="container py-16 pb-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/[.03] p-8 text-center md:p-12">
          <WalletCards className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-5">Tripelor Digital Travel Wallet</p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">Your next journey will live here.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-gray-400">
            Once you have an active booking, your voucher, itinerary, transfer details and travel support will appear automatically.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">Build My Trip</Link>
            <Link href="/account" className="btn-outline">Back to Account</Link>
          </div>
        </div>
      </main>
    );
  }

  const nights = tripNights(trip.check_in, trip.check_out);

  return (
    <main className="travel-wallet-page bg-[#06151c] pb-24">
      <style>{`@media print {
        header, footer, .wallet-no-print { display: none !important; }
        body, .travel-wallet-page { background: white !important; color: #111 !important; }
        .travel-wallet-document { border: 1px solid #b9aa8b !important; box-shadow: none !important; }
        .travel-wallet-document, .travel-wallet-document * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .wallet-print-break { break-inside: avoid; }
      }`}</style>

      <section className="wallet-no-print container flex flex-col gap-5 py-8 md:flex-row md:items-center md:justify-between">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to My Trip
        </Link>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => window.print()} className="btn-gold gap-2">
            <Download className="h-4 w-4" /> Save as PDF
          </button>
          <button onClick={() => window.print()} className="btn-outline gap-2">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </section>

      {activeBookings.length > 1 && (
        <div className="wallet-no-print container mb-6">
          <label className="grid max-w-xl gap-2 text-xs font-semibold uppercase tracking-[.16em] text-white/50">
            Choose a journey
            <select
              value={trip.id}
              onChange={event => setSelectedId(event.target.value)}
              className="min-h-12 border border-gold/25 bg-[#0a222c] px-4 text-base normal-case tracking-normal text-white outline-none focus:border-gold"
            >
              {activeBookings.map(booking => (
                <option key={booking.id} value={booking.id}>
                  {booking.property_name} · {prettyDate(booking.check_in, true)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <article className="travel-wallet-document container overflow-hidden border border-gold/25 bg-[#071922] shadow-[0_35px_120px_rgba(0,0,0,.42)]">
        <section className="relative min-h-[520px] overflow-hidden">
          <img src={image} alt={trip.property_name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#031016]/[.98] via-[#031016]/[.83] to-[#031016]/[.35]" />
          <div className="relative z-10 flex min-h-[520px] flex-col justify-between p-7 md:p-12">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.32em] text-[#e3ca91]">
                  <Sparkles className="h-4 w-4" /> Tripelor Private Travel
                </p>
                <h1 className="font-display mt-3 text-4xl text-white md:text-6xl">Digital Travel Wallet</h1>
              </div>
              <span className={`inline-flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] ${statusStyle(trip.status)}`}>
                <CheckCircle2 className="h-4 w-4" /> {trip.status || "Pending"}
              </span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="flex items-center gap-2 text-sm text-white/65">
                  <MapPin className="h-4 w-4 text-[#e3ca91]" /> {location}
                </p>
                <h2 className="font-display mt-3 max-w-3xl text-5xl leading-none text-white md:text-7xl">{trip.property_name}</h2>
                <p className="mt-4 text-lg text-white/70">{trip.room_type || "Tripelor stay"} · {nights} night{nights === 1 ? "" : "s"}</p>
              </div>
              <div className="min-w-64 border border-white/15 bg-black/35 p-5 backdrop-blur-xl">
                <p className="text-[9px] uppercase tracking-[.2em] text-white/40">Journey reference</p>
                <p className="font-display mt-2 text-3xl text-[#e3ca91]">{trip.booking_reference || "Pending"}</p>
                <p className="mt-3 text-xs text-white/45">Lead traveller · {user.fullName || user.email}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-px bg-white/10 md:grid-cols-4">
          <WalletStat icon={CalendarDays} label="Arrival" value={prettyDate(trip.check_in, true)} />
          <WalletStat icon={CalendarDays} label="Departure" value={prettyDate(trip.check_out, true)} />
          <WalletStat icon={Users} label="Travellers" value={guestCount > 0 ? String(guestCount) : "To confirm"} />
          <WalletStat icon={Hotel} label="Rooms" value={String(trip.rooms || 1)} />
        </section>

        <div className="grid gap-8 p-6 md:p-10 xl:grid-cols-[1.05fr_.95fr]">
          <section className="wallet-print-break">
            <div className="flex items-center gap-3">
              <TicketCheck className="h-6 w-6 text-gold" />
              <div>
                <p className="eyebrow">Reservation voucher</p>
                <h2 className="font-display mt-1 text-3xl text-white">Your journey details</h2>
              </div>
            </div>

            <div className="mt-6 overflow-hidden border border-white/10">
              <WalletRow label="Property" value={trip.property_name} />
              <WalletRow label="Room" value={trip.room_type || "Room details pending"} />
              <WalletRow label="Meal plan" value={trip.meal_plan || "As booked"} />
              <WalletRow label="Guests" value={guestCount > 0 ? `${trip.adults || 0} adult${Number(trip.adults || 0) === 1 ? "" : "s"}${trip.children ? ` · ${trip.children} child${trip.children === 1 ? "" : "ren"}` : ""}` : "Guest details on booking"} />
              <WalletRow label="Booking status" value={trip.status || "Pending"} />
              <WalletRow label="Payment" value={paymentPaid ? "Paid" : "Payment pending"} accent />
            </div>

            {trip.notes && (
              <div className="mt-4 border border-gold/15 bg-gold/[.05] p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-gold">Special requests</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{trip.notes}</p>
              </div>
            )}
          </section>

          <section className="wallet-print-break">
            <div className="flex items-center gap-3">
              <Clock3 className="h-6 w-6 text-gold" />
              <div>
                <p className="eyebrow">Travel timeline</p>
                <h2 className="font-display mt-1 text-3xl text-white">Your itinerary at a glance</h2>
              </div>
            </div>

            <div className="mt-6 space-y-0">
              <TimelineItem icon={MapPin} title="Arrival in the Maldives" detail={prettyDate(trip.check_in)} />
              {speedboatSeats > 0 && (
                <TimelineItem
                  icon={Ship}
                  title="Speedboat transfer"
                  detail={`${speedboatSeats} seat${speedboatSeats === 1 ? "" : "s"} requested · departure time awaiting concierge confirmation`}
                />
              )}
              <TimelineItem
                icon={Hotel}
                title={`${nights}-night stay`}
                detail={`${trip.room_type || "Room"}${trip.meal_plan ? ` · ${trip.meal_plan}` : ""}`}
              />
              {activities && <TimelineItem icon={Waves} title="Experiences" detail={activities} />}
              <TimelineItem icon={CalendarDays} title="Departure" detail={prettyDate(trip.check_out)} last />
            </div>
          </section>
        </div>

        <section className="grid gap-px border-t border-white/10 bg-white/10 md:grid-cols-3">
          <InfoCard
            icon={CreditCard}
            label="Payment summary"
            title={paymentPaid ? "Payment received" : "Payment pending"}
            detail={trip.estimated_total != null ? `Journey total · USD ${Number(trip.estimated_total).toFixed(2)}` : "Final amount will be confirmed by Tripelor."}
          />
          <InfoCard
            icon={Ship}
            label="Transfer"
            title={speedboatSeats > 0 ? `${speedboatSeats} seat${speedboatSeats === 1 ? "" : "s"} requested` : "Not added"}
            detail={Number(trip.speedboat_total || 0) > 0 ? `Transfer total · USD ${Number(trip.speedboat_total).toFixed(2)}` : "Contact your concierge to arrange a transfer."}
          />
          <InfoCard
            icon={PackageCheck}
            label="Package & experiences"
            title={activities || "No activities added"}
            detail={activities ? "Included in your Tripelor journey." : "Add an island or ocean experience anytime."}
          />
        </section>

        <section className="wallet-print-break grid gap-px border-t border-white/10 bg-white/10 lg:grid-cols-[1fr_1fr]">
          <div className="bg-[#0a2029] p-6 md:p-8">
            <div className="flex items-center gap-2 text-gold">
              <MapPin className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[.18em]">Property information</p>
            </div>
            <h3 className="font-display mt-4 text-3xl text-white">{trip.property_name}</h3>
            <p className="mt-2 text-sm text-white/55">{location}</p>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="wallet-no-print luxury-link mt-5">Open location map</a>
          </div>
          <div className="bg-[#0b252f] p-6 md:p-8">
            <div className="flex items-center gap-2 text-gold">
              <Headphones className="h-5 w-5" />
              <p className="text-xs font-semibold uppercase tracking-[.18em]">Private concierge</p>
            </div>
            <h3 className="font-display mt-4 text-3xl text-white">Tripelor is with you.</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              For booking support, transfer confirmation or assistance during your stay, contact the Tripelor team.
            </p>
            <div className="wallet-no-print mt-5 flex flex-wrap gap-3">
              <a href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20need%20help%20with%20my%20travel%20wallet." className="btn-gold gap-2">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <a href="tel:+9609429403" className="btn-outline gap-2">
                <Phone className="h-4 w-4" /> Call
              </a>
            </div>
            <p className="mt-5 text-xs text-white/40">+960 942 9403 · bookings@tripelor.com</p>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-[#041117] px-6 py-5 text-[9px] uppercase tracking-[.16em] text-white/35 md:flex-row md:items-center md:justify-between">
          <span>Tripelor · Maldives Private Travel</span>
          <span>Keep this wallet available throughout your journey</span>
        </div>
      </article>

      <section className="wallet-no-print container mt-7">
        <div className="grid gap-px overflow-hidden border border-gold/15 bg-gold/15 md:grid-cols-3">
          <div className="bg-[#071922] p-5 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-gold" />
            <p className="mt-3 text-sm text-white/55">Only you can access this wallet after secure login.</p>
          </div>
          <button onClick={() => window.print()} className="bg-[#071922] p-5 text-center transition hover:bg-[#0b2731]">
            <Download className="mx-auto h-5 w-5 text-gold" />
            <p className="mt-3 text-sm text-white/55">Save a PDF copy for offline access.</p>
          </button>
          <a href="https://wa.me/9609429403" className="bg-[#071922] p-5 text-center transition hover:bg-[#0b2731]">
            <MessageCircle className="mx-auto h-5 w-5 text-gold" />
            <p className="mt-3 text-sm text-white/55">One-tap access to your concierge.</p>
          </a>
        </div>
      </section>
    </main>
  );
}

function WalletStat({icon: Icon, label, value}: {icon: typeof CalendarDays; label: string; value: string}) {
  return (
    <div className="bg-[#0a2029] p-5 md:p-6">
      <p className="flex items-center gap-2 text-[9px] uppercase tracking-[.18em] text-white/40">
        <Icon className="h-4 w-4 text-gold" /> {label}
      </p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}

function WalletRow({label, value, accent = false}: {label: string; value: string; accent?: boolean}) {
  return (
    <div className="grid gap-2 border-b border-white/10 bg-white/[.025] px-5 py-4 last:border-b-0 sm:grid-cols-[140px_1fr] sm:items-center">
      <span className="text-[9px] font-semibold uppercase tracking-[.16em] text-white/35">{label}</span>
      <span className={accent ? "font-semibold text-gold" : "text-sm text-white/75"}>{value}</span>
    </div>
  );
}

function TimelineItem({
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
    <div className="grid grid-cols-[38px_1fr] gap-4">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <Icon className="h-4 w-4" />
        </span>
        {!last && <span className="h-full w-px bg-gradient-to-b from-gold/40 to-white/10" />}
      </div>
      <div className={last ? "pb-0 pt-1" : "pb-7 pt-1"}>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-white/45">{detail}</p>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  title,
  detail,
}: {
  icon: typeof CreditCard;
  label: string;
  title: string;
  detail: string;
}) {
  return (
    <div className="wallet-print-break bg-[#081c24] p-6 md:p-8">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-4 text-[9px] font-semibold uppercase tracking-[.17em] text-white/35">{label}</p>
      <h3 className="mt-2 font-semibold leading-6 text-white">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-white/45">{detail}</p>
    </div>
  );
}
