"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gift,
  Heart,
  MessageCircle,
  Percent,
  Plane,
  Share2,
  Sparkles,
  Users,
} from "lucide-react";

type Property = { slug: string; name: string; island: string };

export default function MemberGrowthHub({ properties }: { properties: Property[] }) {
  const [user, setUser] = useState<any>(undefined);
  const [bookings, setBookings] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [holds, setHolds] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [occasion, setOccasion] = useState("none");
  const [occasionDate, setOccasionDate] = useState("");
  const [budget, setBudget] = useState("");
  const [nights, setNights] = useState("");
  const [style, setStyle] = useState("");
  const [marketing, setMarketing] = useState(false);

  const [holdProperty, setHoldProperty] = useState(properties[0]?.slug || "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [holdNotes, setHoldNotes] = useState("");

  async function loadMemberTools() {
    const [authResponse, growthResponse, bookingResponse] = await Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }),
      fetch("/api/account/member-growth", { cache: "no-store" }),
      fetch("/api/account/bookings", { cache: "no-store" }),
    ]);
    const auth = await authResponse.json();
    if (!auth?.user) {
      setUser(null);
      return;
    }
    setUser(auth.user);
    if (growthResponse.ok) {
      const growth = await growthResponse.json();
      setPreferences(growth.preferences || null);
      setHolds(growth.holds || []);
      if (growth.preferences) {
        setOccasion(growth.preferences.occasion || "none");
        setOccasionDate(growth.preferences.occasion_date || "");
        setBudget(growth.preferences.preferred_budget_usd == null ? "" : String(growth.preferences.preferred_budget_usd));
        setNights(growth.preferences.preferred_nights == null ? "" : String(growth.preferences.preferred_nights));
        setStyle(growth.preferences.preferred_style || "");
        setMarketing(Boolean(growth.preferences.marketing_opt_in));
      }
    }
    if (bookingResponse.ok) {
      const data = await bookingResponse.json();
      setBookings(data.bookings || []);
    }
  }

  useEffect(() => {
    void loadMemberTools().catch(() => setStatus("Unable to load all member tools right now."));
  }, []);

  const trip = useMemo(() => {
    return [...bookings]
      .filter((booking) => String(booking.status || "").toLowerCase() !== "cancelled")
      .sort((a, b) => String(b.check_in || "").localeCompare(String(a.check_in || "")))[0] || null;
  }, [bookings]);

  const progress = useMemo(() => {
    let value = 20;
    if (trip) value += 35;
    if (Number(trip?.speedboat_seats || 0) > 0) value += 15;
    if (trip?.activities || trip?.package_name) value += 15;
    if (String(trip?.payment_status || "").toLowerCase() === "paid") value += 15;
    return Math.min(100, value);
  }, [trip]);

  async function savePreferences(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/account/member-growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "preferences",
          occasion,
          occasionDate: occasionDate || null,
          preferredBudgetUsd: budget,
          preferredNights: nights,
          preferredStyle: style,
          marketingOptIn: marketing,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save preferences.");
      setPreferences(result.preferences);
      setStatus("Your Tripelor travel preferences are saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save preferences.");
    } finally {
      setBusy(false);
    }
  }

  async function requestHold(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/account/member-growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hold",
          propertySlug: holdProperty,
          checkIn: checkIn || null,
          checkOut: checkOut || null,
          notes: holdNotes,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to request a hold.");
      setStatus(result.message);
      setHoldNotes("");
      await loadMemberTools();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to request a hold.");
    } finally {
      setBusy(false);
    }
  }

  if (user === undefined) return <main className="container py-20 text-gray-400">Loading Tripelor member tools…</main>;

  if (!user) {
    return (
      <main className="bg-[#071b24] text-white">
        <div className="container flex min-h-[70vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-3xl border border-[#d9bd7b]/30 bg-white/[.04] p-8 text-center">
            <Gift className="mx-auto h-8 w-8 text-[#d9bd7b]" />
            <p className="eyebrow mt-5">Tripelor Maldives Pass</p>
            <h1 className="font-display mt-3 text-5xl">Unlock your member travel tools.</h1>
            <p className="mt-5 leading-7 text-white/60">
              Join free to get 100 welcome points, private deal tools, price alerts, trip planning, budget matching and local Tripelor support.
            </p>
            <Link href="/signup?next=%2Fmember-tools" className="btn-gold mt-7 w-full justify-center">Create free account</Link>
          </div>
        </div>
      </main>
    );
  }

  const whatsappPlan = encodeURIComponent(
    "Hello Tripelor, I would like help with my saved Maldives plan." +
      (trip ? "\nStay: " + (trip.property_name || "Tripelor stay") + "\nDates: " + (trip.check_in || "") + " to " + (trip.check_out || "") : "") +
      (preferences?.preferred_budget_usd ? "\nBudget: USD " + preferences.preferred_budget_usd : "") +
      (preferences?.occasion && preferences.occasion !== "none" ? "\nOccasion: " + preferences.occasion : ""),
  );

  return (
    <main className="container max-w-6xl py-10 pb-24 md:py-16">
      <p className="eyebrow">Tripelor Member Growth Hub</p>
      <h1 className="font-display mt-3 text-5xl md:text-6xl">More reasons to come back to Tripelor.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-400">
        Your Maldives Pass now connects planning tools, private member opportunities, price watching, group planning and direct local support.
      </p>

      {status && <p role="status" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm">{status}</p>}

      <section className="mt-8 rounded-3xl border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">My trip planning progress</p>
            <h2 className="mt-2 text-2xl font-bold">{progress}% ready</h2>
            <p className="mt-2 text-sm text-gray-400">
              {trip ? "Keep adding transfer, experiences and payment details to complete your journey." : "Start with a stay or itinerary and Tripelor will build your progress from there."}
            </p>
          </div>
          <span className="text-4xl font-bold text-gold">{progress}%</span>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gold" style={{ width: progress + "%" }} />
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { href: "/secret-deals", icon: Percent, title: "Secret Maldives Deals", body: "Open private Tripelor deal opportunities and member-first offers." },
          { href: "/maldives-matchmaker", icon: Sparkles, title: "My Maldives Match Score", body: "Answer a few questions and find the stays that best match your style and budget." },
          { href: "/maldives-budget-calculator", icon: Calculator, title: "Maldives Budget Calculator", body: "See what kind of Tripelor stay fits your accommodation budget." },
          { href: "/speedboat", icon: Plane, title: "Airport Transfer Checker", body: "Use your flight and travel date to find Tripelor transfer options." },
          { href: "/holiday-shortlist", icon: Share2, title: "Share My Maldives Plan", body: "Invite your partner, family or friends to compare stays and vote together." },
          { href: "/account/availability-alerts", icon: BellRing, title: "Room Availability Alerts", body: "Watch a preferred room and receive an email if it opens for your dates." },
          { href: "/free-maldives-itinerary", icon: CalendarDays, title: "Free Maldives Itinerary", body: "Build a day-by-day Maldives plan around your travel style." },
          { href: "/account#referral-rewards", icon: Users, title: "Invite & Earn", body: "Share Tripelor with friends and use your referral rewards." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 transition hover:border-gold/40">
              <Icon className="h-5 w-5 text-gold" />
              <h2 className="mt-4 font-semibold">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-gray-400">{item.body}</p>
              <span className="mt-4 inline-block text-xs font-semibold text-gold">Open →</span>
            </Link>
          );
        })}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <form onSubmit={savePreferences} className="rounded-3xl border border-white/10 bg-white/[.025] p-6">
          <Heart className="h-6 w-6 text-gold" />
          <h2 className="mt-4 text-2xl font-bold">Birthday, honeymoon & occasion offers</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Save what you are celebrating so Tripelor can tailor relevant trip ideas. Marketing messages remain optional.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Occasion
              <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3">
                <option value="none">No special occasion</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="honeymoon">Honeymoon</option>
                <option value="family">Family trip</option>
                <option value="friends">Friends trip</option>
                <option value="other">Other celebration</option>
              </select>
            </label>
            <label className="text-sm">Occasion date
              <input type="date" value={occasionDate} onChange={(e) => setOccasionDate(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3" />
            </label>
            <label className="text-sm">Preferred budget (USD)
              <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3" placeholder="1200" />
            </label>
            <label className="text-sm">Preferred nights
              <input type="number" min="1" max="60" value={nights} onChange={(e) => setNights(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3" placeholder="5" />
            </label>
            <label className="text-sm sm:col-span-2">Travel style
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3">
                <option value="">Flexible</option>
                <option value="romance">Romantic</option>
                <option value="family">Family</option>
                <option value="ocean">Ocean & snorkeling</option>
                <option value="adventure">Adventure</option>
                <option value="relax">Relaxed</option>
              </select>
            </label>
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm text-gray-300">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1" />
            Send me occasional Tripelor offers related to my travel preferences.
          </label>
          <button disabled={busy} className="btn-gold mt-5 w-full justify-center disabled:opacity-50">
            <Gift className="h-4 w-4" /> Save my travel preferences
          </button>
        </form>

        <form onSubmit={requestHold} className="rounded-3xl border border-gold/25 bg-gold/[.05] p-6">
          <Clock3 className="h-6 w-6 text-gold" />
          <h2 className="mt-4 text-2xl font-bold">Request a 24-hour deal hold</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Ask Tripelor to check whether a selected rate or room can be held while you decide. This request does not itself reserve inventory or guarantee a price.
          </p>
          <label className="mt-5 block text-sm">Property
            <select required value={holdProperty} onChange={(e) => setHoldProperty(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3">
              {properties.map((property) => <option key={property.slug} value={property.slug}>{property.name} · {property.island}</option>)}
            </select>
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm">Check-in
              <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3" />
            </label>
            <label className="text-sm">Check-out
              <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black px-3" />
            </label>
          </div>
          <label className="mt-4 block text-sm">What should Tripelor check?
            <textarea value={holdNotes} onChange={(e) => setHoldNotes(e.target.value)} maxLength={1000} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-3 py-3" placeholder="Room type, meal plan or the offer you are considering" />
          </label>
          <button disabled={busy || !holdProperty} className="btn-gold mt-5 w-full justify-center disabled:opacity-50">
            <Clock3 className="h-4 w-4" /> Ask Tripelor to check a 24-hour hold
          </button>
        </form>
      </section>

      {holds.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">My deal-hold requests</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {holds.map((hold) => (
              <article key={hold.id} className="rounded-2xl border border-white/10 p-5">
                <div className="flex justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{hold.property_name}</h3>
                    <p className="mt-1 text-xs text-gray-400">{hold.check_in && hold.check_out ? hold.check_in + " → " + hold.check_out : "Dates to be confirmed"}</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gold">{hold.status}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10 rounded-3xl border border-gold/30 bg-gradient-to-r from-gold/10 to-transparent p-6 md:flex md:items-center md:justify-between">
        <div>
          <MessageCircle className="h-6 w-6 text-gold" />
          <h2 className="mt-3 text-2xl font-bold">Send my Tripelor plan to WhatsApp</h2>
          <p className="mt-2 text-sm text-gray-400">Continue with the local Tripelor team using your current member plan.</p>
        </div>
        <a href={"https://wa.me/9609429403?text=" + whatsappPlan} target="_blank" rel="noreferrer" className="btn-gold mt-5 justify-center md:mt-0">
          <MessageCircle className="h-4 w-4" /> Continue on WhatsApp
        </a>
      </section>

      <section className="mt-8 rounded-3xl border border-white/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Members see selected opportunities first</p>
        <h2 className="mt-2 text-2xl font-bold">Member-first access</h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Tripelor can release selected private packages and partner opportunities to members before broader public promotion. Availability and timing vary by offer.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/secret-deals" className="btn-gold">Open Secret Deals</Link>
          <Link href="/account#referral-rewards" className="btn-outline"><CheckCircle2 className="h-4 w-4" /> Invite a friend</Link>
        </div>
      </section>
    </main>
  );
}
