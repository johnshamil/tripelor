"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Headphones,
  Hotel,
  MessageCircle,
  Plane,
  Ship,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import type {ReactNode} from "react";

type User = {email: string; fullName?: string};
type Booking = {
  booking_reference?: string | null;
  check_in: string;
  check_out: string;
  id: string;
  property_name: string;
  room_type?: string | null;
  status?: string | null;
};

type Draft = {
  flightNumber: string;
  arrivalTime: string;
  transfer: string;
  bedPreference: string;
  dietary: string;
  celebration: string;
  interests: string[];
  specialRequest: string;
};

type StoredRequest = {
  flight_number?: string | null;
  arrival_time?: string | null;
  transfer_preference?: string | null;
  bed_preference?: string | null;
  dietary?: string | null;
  celebration?: string | null;
  interests?: string[] | null;
  special_request?: string | null;
  status?: string | null;
  submitted_at?: string | null;
};

const emptyDraft: Draft = {
  flightNumber: "",
  arrivalTime: "",
  transfer: "Please help arrange my speedboat transfer",
  bedPreference: "No preference",
  dietary: "",
  celebration: "",
  interests: [],
  specialRequest: "",
};

const experiences = [
  "Manta snorkeling",
  "Shark snorkeling",
  "Shipwreck visit",
  "Sandbank escape",
  "Dolphin cruise",
  "Night fishing",
];

const mediaServices = [
  "Professional island photography",
  "Cinematic trip videography",
  "Drone photography & videography",
];

const fieldClass =
  "mt-2 min-h-12 w-full border border-white/10 bg-white/[.04] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#c9a86a]/70 focus:bg-white/[.06]";

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

function prettyDate(value?: string) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function daysUntil(value?: string) {
  if (!value) return 0;
  const now = new Date(`${maldivesToday()}T00:00:00+05:00`).getTime();
  const target = new Date(`${value}T00:00:00+05:00`).getTime();
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}

function fromStored(request: StoredRequest): Draft {
  return {
    flightNumber: request.flight_number || "",
    arrivalTime: request.arrival_time || "",
    transfer: request.transfer_preference || emptyDraft.transfer,
    bedPreference: request.bed_preference || emptyDraft.bedPreference,
    dietary: request.dietary || "",
    celebration: request.celebration || "",
    interests: Array.isArray(request.interests) ? request.interests : [],
    specialRequest: request.special_request || "",
  };
}

export default function PreArrivalConciergePage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftReady, setDraftReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const memberResponse = await fetch("/api/auth/me", {cache: "no-store"});
        const member = await memberResponse.json();
        if (!member.user) {
          window.location.href = "/login?next=%2Faccount%2Fpre-arrival";
          return;
        }
        setUser(member.user);

        const bookingResponse = await fetch("/api/account/bookings", {cache: "no-store"});
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Unable to load your upcoming journey.");
        setBookings(bookingData.bookings || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your upcoming journey.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const upcomingBookings = useMemo(() => {
    const today = maldivesToday();
    return bookings
      .filter(booking => {
        const status = String(booking.status || "").toLowerCase();
        return status !== "cancelled" && booking.check_in && booking.check_in >= today;
      })
      .sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)));
  }, [bookings]);

  useEffect(() => {
    if (!selectedId && upcomingBookings[0]) setSelectedId(upcomingBookings[0].id);
  }, [selectedId, upcomingBookings]);

  const trip = upcomingBookings.find(booking => booking.id === selectedId) || upcomingBookings[0] || null;

  useEffect(() => {
    if (!trip?.id) return;
    let cancelled = false;
    setDraftReady(false);
    setRequestStatus("");
    setSubmittedAt("");
    setError("");

    (async () => {
      let localDraft = emptyDraft;
      try {
        const stored = window.localStorage.getItem(`tripelor-pre-arrival-${trip.id}`);
        if (stored) localDraft = {...emptyDraft, ...JSON.parse(stored)};
      } catch {
        localDraft = emptyDraft;
      }

      try {
        const response = await fetch(`/api/account/pre-arrival?reservationId=${encodeURIComponent(trip.id)}`, {cache: "no-store"});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load saved concierge preferences.");
        if (cancelled) return;
        if (data.request) {
          setDraft(fromStored(data.request));
          setRequestStatus(String(data.request.status || "new"));
          setSubmittedAt(String(data.request.submitted_at || ""));
        } else {
          setDraft(localDraft);
        }
      } catch (reason) {
        if (!cancelled) {
          setDraft(localDraft);
          setError(reason instanceof Error ? reason.message : "Unable to load saved concierge preferences.");
        }
      } finally {
        if (!cancelled) setDraftReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trip?.id]);

  useEffect(() => {
    if (!draftReady || !trip?.id) return;
    window.localStorage.setItem(`tripelor-pre-arrival-${trip.id}`, JSON.stringify(draft));
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 1200);
    return () => window.clearTimeout(timer);
  }, [draft, draftReady, trip?.id]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(current => ({...current, [key]: value}));
  }

  function toggleExperience(item: string) {
    setDraft(current => ({
      ...current,
      interests: current.interests.includes(item)
        ? current.interests.filter(value => value !== item)
        : [...current.interests, item],
    }));
  }

  async function submitToConcierge() {
    if (!trip) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/account/pre-arrival", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({reservationId: trip.id, ...draft}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit concierge request.");
      setRequestStatus(String(data.request?.status || "new"));
      setSubmittedAt(String(data.request?.submitted_at || new Date().toISOString()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit concierge request.");
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappMessage = trip
    ? [
        "Hello Tripelor, I have submitted my Pre-Arrival Concierge preferences.",
        "",
        `Guest: ${user?.fullName || user?.email || "Tripelor guest"}`,
        `Booking: ${trip.booking_reference || "Pending reference"}`,
        `Stay: ${trip.property_name}`,
        `Dates: ${prettyDate(trip.check_in)} to ${prettyDate(trip.check_out)}`,
        `Flight: ${draft.flightNumber || "Not provided"}${draft.arrivalTime ? ` · ${draft.arrivalTime}` : ""}`,
        `Transfer: ${draft.transfer}`,
        `Bed: ${draft.bedPreference}`,
        `Dietary / allergies: ${draft.dietary || "None provided"}`,
        `Celebration: ${draft.celebration || "None"}`,
        `Experiences: ${draft.interests.length ? draft.interests.join(", ") : "No preferences selected"}`,
        `Special request: ${draft.specialRequest || "None"}`,
      ].join("\n")
    : "";
  const whatsappHref = `https://wa.me/9609429403?text=${encodeURIComponent(whatsappMessage)}`;

  if (loading) return <main className="container py-20 text-white/45">Preparing your private pre-arrival concierge...</main>;
  if (!user) return null;

  if (!trip) {
    return (
      <main className="container py-16 pb-24">
        <div className="mx-auto max-w-3xl border border-gold/20 bg-white/[.03] p-8 text-center md:p-12">
          <Headphones className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-5">Tripelor Pre-Arrival Concierge</p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">We will prepare your next journey beautifully.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/45">
            Once you have an upcoming booking, your private pre-arrival checklist and preferences will appear here automatically.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">Build My Trip</Link>
            <Link href="/account" className="btn-outline">Back to Account</Link>
          </div>
        </div>
      </main>
    );
  }

  const remaining = daysUntil(trip.check_in);

  return (
    <main className="bg-[#06151c] pb-24 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(201,168,106,.16),transparent_38%)]">
        <div className="container py-8 md:py-12">
          <Link href="/account" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to My Trip
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.3em] text-[#e3ca91]">
                <Sparkles className="h-4 w-4" /> Tripelor Private Journey
              </p>
              <h1 className="font-display mt-5 max-w-4xl text-5xl leading-[1.02] md:text-7xl">Arrive with every detail already considered.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/55">
                Tell us how you would like to arrive, rest, eat and explore. Once submitted, your preferences appear directly in Tripelor&apos;s concierge operations dashboard.
              </p>
            </div>
            <div className="border border-[#c9a86a]/25 bg-black/25 p-6 backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[.2em] text-[#e3ca91]">Your arrival</p>
              <p className="font-display mt-2 text-4xl">{remaining}</p>
              <p className="text-sm text-white/45">day{remaining === 1 ? "" : "s"} until check-in</p>
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="font-semibold">{trip.property_name}</p>
                <p className="mt-1 text-sm text-white/45">{prettyDate(trip.check_in)}</p>
                {trip.booking_reference && <p className="mt-3 text-xs tracking-[.12em] text-[#e3ca91]">{trip.booking_reference}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mt-8 grid gap-7 xl:grid-cols-[1fr_330px]">
        <div className="space-y-7">
          {error && <div className="border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error}</div>}

          {requestStatus && (
            <div className="flex flex-col gap-3 border border-emerald-300/20 bg-emerald-400/[.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                <div>
                  <p className="font-semibold text-emerald-100">Your concierge request is with Tripelor.</p>
                  <p className="mt-1 text-xs text-emerald-100/55">
                    Status: {requestStatus}{submittedAt ? ` · Submitted ${new Intl.DateTimeFormat("en-GB", {dateStyle: "medium", timeStyle: "short"}).format(new Date(submittedAt))}` : ""}
                  </p>
                </div>
              </div>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="btn-outline gap-2 whitespace-nowrap">
                <MessageCircle className="h-4 w-4" /> WhatsApp Tripelor
              </a>
            </div>
          )}

          {upcomingBookings.length > 1 && (
            <section className="border border-white/10 bg-white/[.025] p-6">
              <label className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/45">
                Choose journey
                <select value={trip.id} onChange={event => setSelectedId(event.target.value)} className={fieldClass}>
                  {upcomingBookings.map(booking => (
                    <option key={booking.id} value={booking.id} className="bg-[#071922]">{booking.property_name} · {prettyDate(booking.check_in)}</option>
                  ))}
                </select>
              </label>
            </section>
          )}

          <ConciergeSection icon={Plane} eyebrow="Arrival" title="Meet your arrival smoothly">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="International flight number">
                <input value={draft.flightNumber} onChange={event => update("flightNumber", event.target.value)} placeholder="e.g. EK656" className={fieldClass} />
              </Field>
              <Field label="Expected arrival time in Malé">
                <input type="time" value={draft.arrivalTime} onChange={event => update("arrivalTime", event.target.value)} className={fieldClass} />
              </Field>
              <Field label="Speedboat transfer" wide>
                <select value={draft.transfer} onChange={event => update("transfer", event.target.value)} className={fieldClass}>
                  <option className="bg-[#071922]">Please help arrange my speedboat transfer</option>
                  <option className="bg-[#071922]">My transfer is already arranged</option>
                  <option className="bg-[#071922]">I am not sure yet — please advise me</option>
                </select>
              </Field>
            </div>
          </ConciergeSection>

          <ConciergeSection icon={Hotel} eyebrow="Stay preferences" title="Prepare the room around you">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Bed preference">
                <select value={draft.bedPreference} onChange={event => update("bedPreference", event.target.value)} className={fieldClass}>
                  <option className="bg-[#071922]">No preference</option>
                  <option className="bg-[#071922]">One large bed if available</option>
                  <option className="bg-[#071922]">Twin beds if available</option>
                </select>
              </Field>
              <Field label="Celebration or occasion">
                <input value={draft.celebration} onChange={event => update("celebration", event.target.value)} placeholder="Honeymoon, birthday, anniversary..." className={fieldClass} />
              </Field>
              <Field label="Dietary needs or allergies" wide>
                <textarea value={draft.dietary} onChange={event => update("dietary", event.target.value)} placeholder="Tell us about allergies, vegetarian preferences or anything the property should know." className={`${fieldClass} min-h-28 py-3`} />
              </Field>
            </div>
          </ConciergeSection>

          <ConciergeSection icon={Waves} eyebrow="Island time" title="What would you love to experience?">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map(item => {
                const active = draft.interests.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleExperience(item)}
                    className={`flex min-h-14 items-center justify-between border px-4 text-left text-sm transition ${active ? "border-[#c9a86a]/60 bg-[#c9a86a]/10 text-white" : "border-white/10 bg-white/[.025] text-white/55 hover:border-white/25"}`}
                  >
                    {item}
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#e3ca91]" />}
                  </button>
                );
              })}
            </div>
          </ConciergeSection>

          <ConciergeSection icon={Camera} eyebrow="Capture the journey" title="Preserve your Maldives memories beautifully">
            <p className="mb-5 max-w-2xl text-sm leading-6 text-white/45">
              Request a professional creator for portraits, cinematic travel footage or premium aerial coverage. Tripelor will confirm availability and pricing before your stay.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mediaServices.map(item => {
                const active = draft.interests.includes(item);
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleExperience(item)}
                    className={`flex min-h-20 items-center justify-between border px-4 text-left text-sm transition ${active ? "border-[#c9a86a]/60 bg-[#c9a86a]/10 text-white" : "border-white/10 bg-white/[.025] text-white/55 hover:border-white/25"}`}
                  >
                    {item}
                    {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#e3ca91]" />}
                  </button>
                );
              })}
            </div>
          </ConciergeSection>

          <ConciergeSection icon={MessageCircle} eyebrow="Personal touch" title="Anything else we should know?">
            <textarea
              value={draft.specialRequest}
              onChange={event => update("specialRequest", event.target.value)}
              placeholder="Early check-in, snorkeling equipment, accessibility needs, a surprise arrangement, or any other request..."
              className={`${fieldClass} min-h-36 py-3`}
            />
          </ConciergeSection>
        </div>

        <aside className="h-fit border border-[#c9a86a]/25 bg-[#0a222c] p-6 xl:sticky xl:top-28">
          <p className="eyebrow">Private concierge</p>
          <h2 className="font-display mt-3 text-3xl">Ready before you land.</h2>
          <div className="mt-6 space-y-4 text-sm text-white/55">
            <Summary icon={CalendarDays} label="Stay" value={`${prettyDate(trip.check_in)} — ${prettyDate(trip.check_out)}`} />
            <Summary icon={Ship} label="Transfer" value={draft.transfer} />
            <Summary icon={Utensils} label="Dining" value={draft.dietary || "No dietary notes yet"} />
            <Summary icon={Clock3} label="Arrival" value={draft.arrivalTime || "Time not added yet"} />
          </div>

          <div className="mt-7 border-t border-white/10 pt-6">
            <p className="flex items-center gap-2 text-xs text-white/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {saved ? "Draft saved on this device" : "Your draft saves automatically"}
            </p>
            <button disabled={submitting || !draftReady} onClick={submitToConcierge} className="btn-gold mt-5 w-full justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-45">
              <Headphones className="h-4 w-4" /> {submitting ? "Submitting…" : requestStatus ? "Update Concierge Request" : "Submit to Tripelor"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-5 text-white/35">
              Your submitted preferences are securely sent to the Tripelor Admin Concierge dashboard.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/account/wallet" className="border border-white/10 p-3 text-center text-xs text-white/55 transition hover:border-[#c9a86a]/40 hover:text-white">Travel Wallet</Link>
            <Link href="/speedboat" className="border border-white/10 p-3 text-center text-xs text-white/55 transition hover:border-[#c9a86a]/40 hover:text-white">Transfers</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ConciergeSection({icon: Icon, eyebrow, title, children}: {icon: LucideIcon; eyebrow: string; title: string; children: ReactNode}) {
  return (
    <section className="border border-white/10 bg-white/[.025] p-6 md:p-8">
      <div className="flex items-start gap-4 border-b border-white/10 pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[#c9a86a]/25 bg-[#c9a86a]/10">
          <Icon className="h-5 w-5 text-[#e3ca91]" />
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[.23em] text-[#c9a86a]">{eyebrow}</p>
          <h2 className="font-display mt-1 text-3xl">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({label, wide = false, children}: {label: string; wide?: boolean; children: ReactNode}) {
  return (
    <label className={`text-[10px] font-semibold uppercase tracking-[.16em] text-white/45 ${wide ? "md:col-span-2" : ""}`}>
      {label}
      {children}
    </label>
  );
}

function Summary({icon: Icon, label, value}: {icon: LucideIcon; label: string; value: string}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a86a]" />
      <div>
        <p className="text-[9px] uppercase tracking-[.16em] text-white/30">{label}</p>
        <p className="mt-1 leading-5 text-white/65">{value}</p>
      </div>
    </div>
  );
}
