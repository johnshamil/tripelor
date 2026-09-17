"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, BedDouble, CheckCircle2, Compass, MapPin, Waves, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import TripExperienceCatalog from "@/components/trip-experience-catalog";
import { addNights, findCartProduct, isDate, maldivesToday, quoteCart } from "@/lib/trip-cart";

const field = "mt-2 min-h-12 w-full rounded-xl border border-white/20 bg-[#041117] px-4 py-3 text-white focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold [color-scheme:dark]";
const usd = (value: number) => `USD ${value.toLocaleString("en-US")}`;
type User = { email: string; fullName: string };
type Receipt = { bookingReference: string; total: number };

export default function CartCheckout() {
  const { lines, ready, storageNotice, update, remove, complete } = useCart();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [view, setView] = useState<"explore" | "plan">("explore");
  const viewNavigation = useRef<HTMLDivElement>(null);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const sending = useRef(false);
  const total = lines.reduce((sum, line) => sum + (findCartProduct(line.productId)?.price || 0) * line.quantity, 0);

  function changeView(next: "explore" | "plan") {
    setView(next);
    viewNavigation.current?.scrollIntoView({ block: "start" });
    viewNavigation.current?.querySelector<HTMLButtonElement>(`[data-view="${next}"]`)?.focus({ preventScroll: true });
  }

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" }).then(response => response.json()).then(data => {
      setUser(data.user || null);
      if (data.user?.fullName) setName(data.user.fullName);
    }).catch(() => setUser(null));
  }, []);
  useEffect(() => { if (receipt) receiptHeading.current?.focus(); }, [receipt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    setError("");
    if (!user) { setError("Please sign in to send your booking request. Your trip plan will be kept."); return; }
    try { quoteCart(lines); } catch (e) { setError(e instanceof Error ? e.message : "Please check your trip plan."); return; }
    sending.current = true;
    setPending(true);
    const submitted = lines.map(line => ({ ...line }));
    try {
      const payload = { items: submitted, guestName: name.trim(), phone: phone.trim(), notes: notes.trim(), expectedTotal: total };
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify({ ...payload, account: user.email })));
      const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      if (!attempt.current) { try { attempt.current = JSON.parse(sessionStorage.getItem("tripelor-cart-attempt") || "null"); } catch { /* In-memory retry remains available. */ } }
      if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
      try { sessionStorage.setItem("tripelor-cart-attempt", JSON.stringify(attempt.current)); } catch { /* The current tab retains the retry key. */ }
      const response = await fetch("/api/cart-booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, submissionId: attempt.current.key }), signal: AbortSignal.timeout(45000) });
      const data = await response.json();
      if (response.status === 401) { setUser(null); throw new Error("Please sign in again. Your trip plan is still here."); }
      if (!response.ok) throw new Error(data.error || "We could not save your booking request. Please try again.");
      setReceipt({ bookingReference: data.bookingReference, total: data.total });
      complete(submitted);
      attempt.current = null;
      try { sessionStorage.removeItem("tripelor-cart-attempt"); } catch { /* Nothing else is required after a successful booking. */ }
    } catch (e) {
      setError(e instanceof Error && e.name !== "TimeoutError" && e.name !== "TypeError" ? e.message : "We could not confirm your request. Please retry; the same request will only be saved once.");
    } finally { setPending(false); sending.current = false; }
  }

  return <section className="container py-10 pb-28 md:py-16">
    <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gold/20 pb-8 md:pb-10">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[.25em] text-gold"><Compass aria-hidden="true" className="h-4 w-4" />A Maldives escape, made yours</p>
        <h1 className="font-display mt-4 text-4xl md:text-6xl">My Trip Plan</h1>
        <p className="mt-5 max-w-xl leading-7 text-gray-300">Explore all our packages and excursions in one place. Add your favourites, choose your dates, and let our island team bring your trip together.</p>
      </div>
      <Link href="/account/trip-requests" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-gold">My Trip Requests <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <ol aria-label="How to plan your trip" className="mt-6 grid gap-4 text-sm text-gray-300 sm:grid-cols-3">
      {["Choose your experiences", "Set your dates & guests", "Let us arrange your trip"].map((step, index) => <li key={step} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 text-xs text-gold">0{index + 1}</span>{step}</li>)}
    </ol>
    <div ref={viewNavigation} role="group" aria-label="My Trip Plan views" className="mt-8 grid scroll-mt-28 grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#041117] p-2 sm:max-w-xl">
      <button type="button" data-view="explore" aria-pressed={view === "explore"} aria-controls="trip-explore-view" disabled={pending} onClick={() => changeView("explore")} className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold disabled:opacity-60 ${view === "explore" ? "bg-gold text-[#071922]" : "text-gray-300 hover:bg-white/5"}`}>Explore all</button>
      <button type="button" data-view="plan" aria-pressed={view === "plan"} aria-controls="trip-selections-view" disabled={pending} onClick={() => changeView("plan")} className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold disabled:opacity-60 ${view === "plan" ? "bg-gold text-[#071922]" : "text-gray-300 hover:bg-white/5"}`}>My selections{ready ? ` (${lines.length})` : ""}</button>
    </div>
    {storageNotice && <p role="status" className="mt-5 rounded-xl border border-gold/30 p-4 text-sm text-gold">{storageNotice}</p>}
    {receipt && <div role="status" className="card mt-8 border-gold/40 p-6 md:p-8">
      <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-gold" />
      <h2 ref={receiptHeading} tabIndex={-1} className="font-display mt-4 text-3xl outline-none">Your trip is in good hands</h2>
      <p className="mt-3">Request received · <strong className="break-all text-gold">{receipt.bookingReference}</strong></p>
      <p className="mt-3 leading-7 text-gray-300">Your trip estimate is {usd(receipt.total)}. Our team will confirm availability, final details and payment with you.</p>
      <Link href="/account/trip-requests" className="btn-gold mt-6">View My Trip Requests</Link>
    </div>}
    <div id="trip-explore-view" hidden={view !== "explore"}><TripExperienceCatalog onViewPlan={() => changeView("plan")} /></div>
    <div id="trip-selections-view" hidden={view !== "plan"}>
    {!ready ? <p role="status" className="py-16 text-gray-300">Opening your trip plan…</p> : lines.length === 0 ? <div className="mt-10 rounded-3xl border border-gold/20 bg-gradient-to-br from-[#123039] to-[#06151c] p-6 md:p-12">
      <Compass aria-hidden="true" className="h-10 w-10 text-gold" />
      <h2 className="font-display mt-6 max-w-xl text-3xl leading-tight md:text-4xl">{receipt ? "There’s always another island to discover." : "Where will your Maldives story begin?"}</h2>
      <p className="mt-4 max-w-xl leading-7 text-gray-300">A quiet island stay, an afternoon on the reef, or a little of both. Choose what you love and start shaping your escape.</p>
      <button type="button" onClick={() => changeView("explore")} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-[#071922]">Explore packages & excursions <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></button>
    </div> : <form onSubmit={submit} className="mt-10 grid items-start gap-8 xl:gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <fieldset disabled={pending} className="min-w-0">
        <legend className="sr-only">Your selected stays and experiences</legend>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-3xl">Your island itinerary</h2><span className="text-xs text-gray-400">{lines.length} {lines.length === 1 ? "selection" : "selections"} · saved on this device</span></div>
        <ol className="space-y-6 border-l border-gold/25 pl-5 sm:pl-7">
        {lines.map((line, index) => {
          const product = findCartProduct(line.productId);
          if (!product) return null;
          const Icon = product.kind === "stay" ? BedDouble : Waves;
          return <li key={line.productId} className="relative">
            <span aria-hidden="true" className="absolute -left-[27px] top-8 h-3 w-3 rounded-full border border-gold bg-[#041117] sm:-left-[35px]" />
            <article className="min-w-0 rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="flex items-center gap-2 text-xs uppercase tracking-[.15em] text-gold"><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{String(index + 1).padStart(2, "0")} · {product.kind === "stay" ? "Island stay" : product.kind === "package" ? "Ocean escape" : "Island experience"}</p><h3 className="font-display mt-3 text-2xl leading-tight sm:text-3xl"><Link href={product.href} className="hover:text-gold">{product.name}</Link></h3></div>
                <button type="button" onClick={() => remove(line.productId)} aria-label={`Remove ${product.name} from my trip`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/5 hover:text-white"><X aria-hidden="true" className="h-4 w-4" /></button>
              </div>
              <p className="mt-4 text-sm text-gold">{usd(product.price)} per {product.unit}{product.nights ? ` · ${product.nights}-night stay` : ""}{product.duration ? ` · ${product.duration}` : ""}</p>
              <details className="mt-2 text-sm leading-6 text-gray-300"><summary className="min-h-10 cursor-pointer py-2">Your experience includes</summary><ul className="list-disc space-y-1 pl-5">{product.inclusions.map(item => <li key={item}>{item}</li>)}</ul></details>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-gray-300">{product.unit === "couple" ? "Couples (2 adults, 1 room each)" : "Guests joining"}<input type="number" required min={1} max={100} step={1} value={line.quantity || ""} aria-label={`${product.name}: ${product.unit === "couple" ? "couples" : "guests"}`} onChange={e => update(line.productId, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })} className={field} /></label>
                <label className="text-sm text-gray-300">{product.nights ? "Preferred check-in" : "Preferred experience date"}<input type="date" required min={maldivesToday()} max="9998-12-31" value={line.date} aria-label={`${product.name}: date`} onChange={e => update(line.productId, { date: e.target.value })} className={field} /></label>
              </div>
              {product.nights && isDate(line.date) && <p className="mt-3 text-sm text-gray-400">Check-out: {addNights(line.date, product.nights)} · {line.quantity * 2} adults · {line.quantity} {line.quantity === 1 ? "room" : "rooms"}</p>}
              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4"><span className="text-xs text-gray-400">Estimate for your {product.kind === "stay" ? "stay" : "experience"}</span><span className="font-semibold">{usd(product.price * line.quantity)}</span></div>
            </article>
          </li>;
        })}
        </ol>
        <button type="button" onClick={() => changeView("explore")} className="mt-5 inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-gold">Add more packages & excursions <ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
      </fieldset>
      <div className="min-w-0 rounded-3xl border border-gold/25 bg-gradient-to-br from-[#123039] to-[#07181f] p-6 sm:p-7 lg:sticky lg:top-28">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[.18em] text-gold"><MapPin aria-hidden="true" className="h-4 w-4" />Your island team</p>
        <h2 className="font-display mt-4 text-3xl">Let’s plan your escape</h2>
        <p className="mt-4 text-sm leading-6 text-gray-300">Tell us when you’d like to travel. We’ll help bring your chosen experiences together.</p>
        <div className="mt-6 border-y border-gold/20 py-5"><span className="text-xs uppercase tracking-[.18em] text-gray-300">Your trip estimate</span><strong className="font-display mt-2 block text-4xl text-gold">{usd(total)}</strong><p className="mt-2 text-xs leading-5 text-gray-400">Based on your selected guests and stays. Any separate transfers and final inclusions will be confirmed with you.</p></div>
        {user ? <fieldset disabled={pending} className="mt-6 space-y-4">
          <legend className="sr-only">Your contact details</legend>
          <label className="block text-sm text-gray-300">Your name<input className={field} autoComplete="name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="block text-sm text-gray-300">Email address<input className={`${field} text-gray-400`} type="email" value={user.email} readOnly /></label>
          <label className="block text-sm text-gray-300">Phone / WhatsApp (with country code)<input className={field} type="tel" autoComplete="tel" required minLength={6} maxLength={40} placeholder="+960…" value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label className="block text-sm text-gray-300">Make it yours (optional)<textarea className={field} rows={3} maxLength={2000} placeholder="Your island, hotel, a special occasion, or anything you’d love us to know" value={notes} onChange={e => setNotes(e.target.value)} /></label>
          <button type="submit" disabled={pending} className="btn-gold min-h-12 w-full gap-2 disabled:opacity-60">{pending ? "Sending your trip plan…" : "Request My Trip"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
          <p className="text-xs leading-6 text-gray-300">No payment is needed to send your plan. We’ll confirm availability and payment details with you before your trip is booked.</p>
        </fieldset> : user === undefined ? <p role="status" className="mt-6 text-sm text-gray-300">Checking your account…</p> : <div className="mt-6"><p className="text-sm leading-6 text-gray-300">Sign in to share your trip plan with our team and follow your request. Your selections will be kept.</p><Link href="/login?next=%2Fmy-trip" className="btn-gold mt-4 min-h-12 w-full">Sign in to Request My Trip</Link></div>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
        <Link href="/account/trip-requests" className="mt-5 inline-flex min-h-11 items-center text-sm text-gold">My Trip Requests →</Link>
      </div>
    </form>}
    </div>
  </section>;
}
