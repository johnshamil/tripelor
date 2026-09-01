"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  ShieldCheck,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import {useEffect, useMemo, useState} from "react";
import {properties} from "@/lib/properties";

type Booking = {
  booking_reference?: string | null;
  check_in: string;
  check_out: string;
  id: string;
  property_name: string;
  room_type?: string | null;
  status?: string | null;
};

type Preference = {
  allergies?: string | null;
  arrival_at?: string | null;
  bedding_preference?: string | null;
  celebration_notes?: string | null;
  celebration_type?: string | null;
  dietary_requirements?: string | null;
  early_check_in?: boolean;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  flight_number?: string | null;
  late_check_out?: boolean;
  notes?: string | null;
  preferred_activities?: string[];
  room_preferences?: string | null;
  status?: string | null;
  transfer_required?: boolean;
};

type ConciergeForm = {
  allergies: string;
  arrivalAt: string;
  beddingPreference: string;
  celebrationNotes: string;
  celebrationType: string;
  dietaryRequirements: string;
  earlyCheckIn: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  flightNumber: string;
  lateCheckOut: boolean;
  notes: string;
  preferredActivities: string[];
  roomPreferences: string;
  transferRequired: boolean;
};

const blankForm: ConciergeForm = {
  allergies: "",
  arrivalAt: "",
  beddingPreference: "",
  celebrationNotes: "",
  celebrationType: "none",
  dietaryRequirements: "",
  earlyCheckIn: false,
  emergencyContactName: "",
  emergencyContactPhone: "",
  flightNumber: "",
  lateCheckOut: false,
  notes: "",
  preferredActivities: [],
  roomPreferences: "",
  transferRequired: false,
};

const activities = [
  {value: "manta_encounter", label: "Manta encounter", detail: "Seasonal ocean experience"},
  {value: "turtle_snorkelling", label: "Turtle snorkelling", detail: "Guided reef discovery"},
  {value: "dolphin_cruise", label: "Dolphin cruise", detail: "A golden-hour journey"},
  {value: "sandbank_escape", label: "Private sandbank", detail: "Secluded island time"},
  {value: "sunset_fishing", label: "Sunset fishing", detail: "Traditional Maldivian outing"},
  {value: "island_hopping", label: "Island hopping", detail: "Discover local life"},
  {value: "shipwreck_snorkelling", label: "Shipwreck snorkelling", detail: "A signature underwater stop"},
  {value: "professional_photography", label: "Professional photography", detail: "Beautiful portraits and island memories"},
  {value: "professional_videography", label: "Cinematic videography", detail: "A professionally filmed journey"},
  {value: "drone_photo_video", label: "Drone photo & video", detail: "Aerial views of your Maldives escape"},
];

const fieldClass =
  "min-h-12 w-full rounded-xl border border-[#d8cdb8] bg-white px-4 text-[15px] text-[#09202a] outline-none transition placeholder:text-[#8b8477] focus:border-[#a98745] focus:ring-2 focus:ring-[#c6a45f]/20";

function maldivesToday() {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Indian/Maldives",
    year: "numeric",
  }).formatToParts(new Date());
  const value = (type: string) => parts.find(part => part.type === type)?.value || "";
  return value("year") + "-" + value("month") + "-" + value("day");
}

function prettyDate(value?: string | null) {
  if (!value) return "To be confirmed";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value + "T00:00:00Z"));
}

function maldivesDateTime(value?: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Indian/Maldives",
    year: "numeric",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(item => item.type === type)?.value || "";
  return part("year") + "-" + part("month") + "-" + part("day") + "T" + part("hour") + ":" + part("minute");
}

function fromPreference(preference: Preference | null): ConciergeForm {
  if (!preference) return {...blankForm};
  return {
    allergies: preference.allergies || "",
    arrivalAt: maldivesDateTime(preference.arrival_at),
    beddingPreference: preference.bedding_preference || "",
    celebrationNotes: preference.celebration_notes || "",
    celebrationType: preference.celebration_type || "none",
    dietaryRequirements: preference.dietary_requirements || "",
    earlyCheckIn: Boolean(preference.early_check_in),
    emergencyContactName: preference.emergency_contact_name || "",
    emergencyContactPhone: preference.emergency_contact_phone || "",
    flightNumber: preference.flight_number || "",
    lateCheckOut: Boolean(preference.late_check_out),
    notes: preference.notes || "",
    preferredActivities: preference.preferred_activities || [],
    roomPreferences: preference.room_preferences || "",
    transferRequired: Boolean(preference.transfer_required),
  };
}

export default function PreArrivalConciergePage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<ConciergeForm>(blankForm);
  const [preference, setPreference] = useState<Preference | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPreference, setLoadingPreference] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const memberResponse = await fetch("/api/auth/me", {cache: "no-store"});
        const member = await memberResponse.json();
        if (!member.user) {
          window.location.href = "/login?next=%2Faccount%2Fpre-arrival";
          return;
        }
        const bookingResponse = await fetch("/api/account/bookings", {cache: "no-store"});
        const bookingData = await bookingResponse.json();
        if (!bookingResponse.ok) throw new Error(bookingData.error || "Unable to load your journey.");
        setBookings(bookingData.bookings || []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load your journey.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeBookings = useMemo(() => {
    const today = maldivesToday();
    return bookings
      .filter(booking => String(booking.status || "").toLowerCase() !== "cancelled" && booking.check_out >= today)
      .sort((a, b) => a.check_in.localeCompare(b.check_in));
  }, [bookings]);

  useEffect(() => {
    if (!selectedId && activeBookings[0]) setSelectedId(activeBookings[0].id);
  }, [activeBookings, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    let current = true;
    (async () => {
      setLoadingPreference(true);
      setError("");
      setMessage("");
      try {
        const response = await fetch(
          "/api/account/pre-arrival?reservationId=" + encodeURIComponent(selectedId),
          {cache: "no-store"},
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load concierge details.");
        if (!current) return;
        setPreference(data.preference || null);
        setForm(fromPreference(data.preference || null));
      } catch (reason) {
        if (current) setError(reason instanceof Error ? reason.message : "Unable to load concierge details.");
      } finally {
        if (current) setLoadingPreference(false);
      }
    })();
    return () => {
      current = false;
    };
  }, [selectedId]);

  const trip = activeBookings.find(booking => booking.id === selectedId) || activeBookings[0] || null;
  const property = trip ? properties.find(item => item.name.toLowerCase() === trip.property_name.toLowerCase()) : null;
  const image = property?.images?.[0] || "/properties/uhoos-lavish-oasis/20250517_193323.jpg";
  const location = property?.location || "Maldives";

  function update<K extends keyof ConciergeForm>(key: K, value: ConciergeForm[K]) {
    setForm(current => ({...current, [key]: value}));
    setMessage("");
  }

  function toggleActivity(value: string) {
    update(
      "preferredActivities",
      form.preferredActivities.includes(value)
        ? form.preferredActivities.filter(item => item !== value)
        : [...form.preferredActivities, value],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!trip) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/account/pre-arrival", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({...form, reservationId: trip.id}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save your concierge details.");
      setPreference(data.preference || null);
      setForm(fromPreference(data.preference || null));
      setMessage("Your preferences are now with the Tripelor concierge.");
      window.scrollTo({top: 0, behavior: "smooth"});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save your concierge details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="container py-20 text-white/50">Preparing your private concierge...</main>;
  }

  if (!trip) {
    return (
      <main className="container py-16 pb-24">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-gold/20 bg-white/[.03] p-8 text-center md:p-12">
          <Plane className="mx-auto h-10 w-10 text-gold" />
          <p className="eyebrow mt-5">Pre-Arrival Concierge</p>
          <h1 className="font-display mt-3 text-4xl md:text-6xl">Your next journey will be prepared here.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/55">
            Once you have an active booking, you can share arrival details and personal stay preferences with your Tripelor concierge.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/build-your-trip" className="btn-gold">Build My Trip</Link>
            <Link href="/account" className="btn-outline">Back to Account</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#06151c] pb-24">
      <section className="container flex flex-wrap items-center justify-between gap-4 py-7">
        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to My Trip
        </Link>
        <Link href="/account/wallet" className="text-xs font-semibold uppercase tracking-[.16em] text-gold transition hover:text-white">
          Open Travel Wallet
        </Link>
      </section>

      <section className="container">
        <div className="relative min-h-[430px] overflow-hidden border border-gold/20">
          <img src={image} alt={trip.property_name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#021016]/[.98] via-[#021016]/[.82] to-[#021016]/[.3]" />
          <div className="relative z-10 flex min-h-[430px] flex-col justify-between p-7 md:p-11">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.3em] text-[#e3ca91]">
                  <Sparkles className="h-4 w-4" /> Tripelor Private Travel
                </p>
                <h1 className="font-display mt-4 max-w-3xl text-5xl leading-none text-white md:text-7xl">
                  Pre-Arrival Concierge
                </h1>
              </div>
              {preference && (
                <span className="inline-flex items-center gap-2 border border-emerald-300/30 bg-emerald-950/50 px-4 py-2 text-xs font-semibold uppercase tracking-[.12em] text-emerald-100 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4" /> {preference.status || "Submitted"}
                </span>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <p className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4 text-gold" /> {trip.property_name} · {location}
                </p>
                <h2 className="font-display mt-3 text-3xl text-white md:text-5xl">Let us prepare every detail.</h2>
                <p className="mt-3 max-w-2xl leading-7 text-white/60">
                  Share the preferences that will help your arrival feel effortless. The concierge will review your request and confirm arrangements with you.
                </p>
              </div>
              <div className="border border-white/15 bg-black/30 px-5 py-4 backdrop-blur">
                <p className="text-[9px] uppercase tracking-[.2em] text-white/40">Journey</p>
                <p className="mt-2 font-semibold text-white">{prettyDate(trip.check_in)} — {prettyDate(trip.check_out)}</p>
                <p className="mt-1 text-xs text-white/45">{trip.booking_reference || "Booking confirmed"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-px">
        <div className="border border-[#d8cdb8] bg-[#f2ede3] text-[#09202a] shadow-[0_35px_100px_rgba(0,0,0,.28)]">
          <div className="grid gap-5 border-b border-[#d8cdb8] bg-[#e8dfcf] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#8e6d32]">Your confirmed journey</p>
              <p className="font-display mt-2 text-3xl">{trip.property_name}</p>
              <p className="mt-1 text-sm text-[#526069]">{trip.room_type || "Tripelor stay"} · Arriving {prettyDate(trip.check_in)}</p>
            </div>
            {activeBookings.length > 1 && (
              <label className="grid gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-[#725d38]">
                Choose a journey
                <select
                  value={trip.id}
                  onChange={event => setSelectedId(event.target.value)}
                  className={fieldClass + " min-w-72 normal-case tracking-normal"}
                >
                  {activeBookings.map(booking => (
                    <option key={booking.id} value={booking.id}>
                      {booking.property_name} · {prettyDate(booking.check_in)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {message && (
            <div className="m-6 flex gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-50 p-5 text-emerald-900 md:mx-8" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{message}</p>
                <p className="mt-1 text-sm text-emerald-800/70">We will contact you if any detail needs confirmation.</p>
              </div>
            </div>
          )}
          {error && (
            <div className="m-6 rounded-2xl border border-red-700/20 bg-red-50 p-5 text-sm text-red-900 md:mx-8" role="alert">
              {error}
            </div>
          )}

          {loadingPreference ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-[#5d666b]">
              <Loader2 className="h-5 w-5 animate-spin text-[#a98745]" /> Preparing your preferences...
            </div>
          ) : (
            <form onSubmit={submit} className="p-6 md:p-8">
              <div className="mx-auto max-w-5xl space-y-7">
                <FormSection icon={Plane} eyebrow="01 · Arrival" title="Your arrival, arranged" description="Flight and transfer details help us coordinate the beginning of your island journey.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Flight number" hint="Optional">
                      <input value={form.flightNumber} onChange={event => update("flightNumber", event.target.value)} className={fieldClass} maxLength={40} placeholder="e.g. EK 656" />
                    </Field>
                    <Field label="Arrival at Velana Airport" hint="Maldives time">
                      <input type="datetime-local" value={form.arrivalAt} onChange={event => update("arrivalAt", event.target.value)} className={fieldClass} min={trip.check_in + "T00:00"} max={trip.check_out + "T23:59"} />
                    </Field>
                  </div>
                  <ChoiceCard checked={form.transferRequired} onChange={checked => update("transferRequired", checked)} title="Arrange my island transfer" detail="Tripelor will review availability and send the confirmed transfer time and price." />
                </FormSection>

                <FormSection icon={Utensils} eyebrow="02 · Comfort" title="Dining and room preferences" description="Small details make a stay feel personal. All fields are optional.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Dietary requirements">
                      <textarea value={form.dietaryRequirements} onChange={event => update("dietaryRequirements", event.target.value)} className={fieldClass + " min-h-28 py-3"} maxLength={600} placeholder="Vegetarian, halal, gluten-free, or other preferences" />
                    </Field>
                    <Field label="Allergies">
                      <textarea value={form.allergies} onChange={event => update("allergies", event.target.value)} className={fieldClass + " min-h-28 py-3"} maxLength={600} placeholder="Tell us what the property should know" />
                    </Field>
                    <Field label="Bedding preference">
                      <select value={form.beddingPreference} onChange={event => update("beddingPreference", event.target.value)} className={fieldClass}>
                        <option value="">Choose a preference</option>
                        <option value="double">One double bed</option>
                        <option value="twin">Twin beds</option>
                        <option value="no_preference">No preference</option>
                      </select>
                    </Field>
                    <Field label="Room preferences">
                      <input value={form.roomPreferences} onChange={event => update("roomPreferences", event.target.value)} className={fieldClass} maxLength={800} placeholder="Quiet room, lower floor, or other comfort notes" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={Heart} eyebrow="03 · Occasion" title="Make it memorable" description="Let us know if this journey marks a beautiful moment.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Celebration">
                      <select value={form.celebrationType} onChange={event => update("celebrationType", event.target.value)} className={fieldClass}>
                        <option value="none">No celebration</option>
                        <option value="honeymoon">Honeymoon</option>
                        <option value="anniversary">Anniversary</option>
                        <option value="birthday">Birthday</option>
                        <option value="other">Another occasion</option>
                      </select>
                    </Field>
                    <Field label="Celebration notes">
                      <input value={form.celebrationNotes} onChange={event => update("celebrationNotes", event.target.value)} className={fieldClass} maxLength={600} placeholder="Names, date, or the moment you have in mind" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={Waves} eyebrow="04 · Experiences" title="What would you love to discover?" description="Choose any experiences that interest you. Your concierge will confirm availability and pricing.">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {activities.map(activity => {
                      const selected = form.preferredActivities.includes(activity.value);
                      return (
                        <button key={activity.value} type="button" aria-pressed={selected} onClick={() => toggleActivity(activity.value)} className={"min-h-28 rounded-2xl border p-4 text-left transition " + (selected ? "border-[#a98745] bg-[#f7edd8] shadow-[inset_0_0_0_1px_#c6a45f]" : "border-[#d8cdb8] bg-white/60 hover:border-[#b69759]")}>
                          <span className={"flex h-6 w-6 items-center justify-center rounded-full border " + (selected ? "border-[#a98745] bg-[#a98745] text-white" : "border-[#c8bfae] text-transparent")}>
                            <Check className="h-4 w-4" />
                          </span>
                          <strong className="mt-3 block text-sm">{activity.label}</strong>
                          <span className="mt-1 block text-xs text-[#6e777b]">{activity.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormSection>

                <FormSection icon={Clock3} eyebrow="05 · Flexibility" title="A smoother stay" description="Requests are subject to availability and will remain unconfirmed until the concierge responds.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <ChoiceCard checked={form.earlyCheckIn} onChange={checked => update("earlyCheckIn", checked)} title="Request early check-in" detail="Awaiting property confirmation" />
                    <ChoiceCard checked={form.lateCheckOut} onChange={checked => update("lateCheckOut", checked)} title="Request late checkout" detail="Awaiting property confirmation" />
                  </div>
                </FormSection>

                <FormSection icon={ShieldCheck} eyebrow="06 · Contact" title="Emergency contact and final notes" description="Optional contact information is used only if we need assistance during your journey.">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="Emergency contact name">
                      <input value={form.emergencyContactName} onChange={event => update("emergencyContactName", event.target.value)} className={fieldClass} maxLength={100} placeholder="Full name" />
                    </Field>
                    <Field label="Emergency contact phone">
                      <input type="tel" value={form.emergencyContactPhone} onChange={event => update("emergencyContactPhone", event.target.value)} className={fieldClass} maxLength={60} placeholder="+960..." />
                    </Field>
                  </div>
                  <Field label="Anything else we should know?">
                    <textarea value={form.notes} onChange={event => update("notes", event.target.value)} className={fieldClass + " min-h-32 py-3"} maxLength={1200} placeholder="Share any detail that would help us prepare a more personal welcome" />
                  </Field>
                </FormSection>

                <div className="rounded-2xl border border-[#cfc3ac] bg-[#e8dfcf]/70 p-5">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8e6d32]" />
                    <div>
                      <p className="font-semibold">Private by design</p>
                      <p className="mt-1 text-sm leading-6 text-[#5d666b]">
                        These optional details are connected to your verified booking and used only to prepare your Tripelor journey. Do not upload passport, card or payment information here.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-[#d8cdb8] pt-7 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <CalendarClock className="h-4 w-4 text-[#8e6d32]" />
                      {preference ? "Update your concierge preferences anytime" : "Ready for concierge review"}
                    </p>
                    <p className="mt-1 text-xs text-[#6e777b]">Arrangements are confirmed separately by the Tripelor team.</p>
                  </div>
                  <button type="submit" disabled={saving} className="btn-gold min-h-12 min-w-56 gap-2 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {saving ? "Sending..." : preference ? "Update Concierge" : "Send to Concierge"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="container mt-7 grid gap-px overflow-hidden border border-gold/15 bg-gold/15 md:grid-cols-3">
        <div className="bg-[#071922] p-6">
          <Plane className="h-5 w-5 text-gold" />
          <p className="mt-3 font-semibold text-white">Arrival coordination</p>
          <p className="mt-1 text-sm text-white/45">We review your flight and transfer request together.</p>
        </div>
        <a href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20need%20help%20with%20my%20pre-arrival%20concierge." className="bg-[#071922] p-6 transition hover:bg-[#0b2731]">
          <MessageCircle className="h-5 w-5 text-gold" />
          <p className="mt-3 font-semibold text-white">WhatsApp concierge</p>
          <p className="mt-1 text-sm text-white/45">Chat with Tripelor about your request.</p>
        </a>
        <a href="tel:+9609429403" className="bg-[#071922] p-6 transition hover:bg-[#0b2731]">
          <Phone className="h-5 w-5 text-gold" />
          <p className="mt-3 font-semibold text-white">Call Tripelor</p>
          <p className="mt-1 text-sm text-white/45">+960 942 9403</p>
        </a>
      </section>
    </main>
  );
}

function FormSection({
  children,
  description,
  eyebrow,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  icon: typeof Plane;
  title: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[#d8cdb8] bg-[#fffdf8] p-5 shadow-[0_12px_30px_rgba(58,45,22,.05)] md:p-7">
      <div className="grid gap-4 border-b border-[#e3dac9] pb-5 md:grid-cols-[auto_1fr] md:items-start">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c5aa72] bg-[#f5ead5] text-[#8e6d32]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[.23em] text-[#9a793f]">{eyebrow}</p>
          <h2 className="font-display mt-1 text-3xl">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#687176]">{description}</p>
        </div>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function Field({children, hint, label}: {children: React.ReactNode; hint?: string; label: string}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[.12em] text-[#5b574e]">
        {label}
        {hint && <span className="text-[9px] font-normal tracking-[.08em] text-[#978f81]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ChoiceCard({
  checked,
  detail,
  onChange,
  title,
}: {
  checked: boolean;
  detail: string;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={"flex min-h-20 w-full items-center gap-4 rounded-2xl border p-4 text-left transition " + (checked ? "border-[#a98745] bg-[#f7edd8]" : "border-[#d8cdb8] bg-white/60 hover:border-[#b69759]")}
    >
      <span className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-full border " + (checked ? "border-[#a98745] bg-[#a98745] text-white" : "border-[#bdb39f] text-transparent")}>
        <Check className="h-4 w-4" />
      </span>
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block text-xs text-[#6e777b]">{detail}</span>
      </span>
    </button>
  );
}
