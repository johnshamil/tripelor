"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
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
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const sending = useRef(false);
  const total = lines.reduce((sum, line) => sum + (findCartProduct(line.productId)?.price || 0) * line.quantity, 0);

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
    if (!user) { setError("Please sign in to send your booking request. Your cart will be kept."); return; }
    try { quoteCart(lines); } catch (e) { setError(e instanceof Error ? e.message : "Please check your cart."); return; }
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
      if (response.status === 401) { setUser(null); throw new Error("Please sign in again. Your cart is still here."); }
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
    <p className="text-sm uppercase tracking-[.25em] text-gold">Your Maldives plans</p>
    <h1 className="font-display mt-3 text-4xl md:text-5xl">Your cart</h1>
    <p className="mt-4 max-w-2xl leading-7 text-gray-300">Pick your excursions and packages, choose dates, and send one booking request.</p>
    {storageNotice && <p role="status" className="mt-5 rounded-xl border border-gold/30 p-4 text-sm text-gold">{storageNotice}</p>}
    {receipt && <div role="status" className="card mt-8 border-gold/40 p-6 md:p-8">
      <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-gold" />
      <h2 ref={receiptHeading} tabIndex={-1} className="mt-4 text-2xl font-semibold outline-none">Booking request received</h2>
      <p className="mt-3">Reference: <strong className="break-all text-gold">{receipt.bookingReference}</strong></p>
      <p className="mt-2 text-gray-300">Estimated total: {usd(receipt.total)}. Tripelor will confirm availability, final details and payment with you. No payment has been taken.</p>
      <Link href="/account/cart-bookings" className="btn-gold mt-6">View my booking requests</Link>
    </div>}
    {!ready ? <p role="status" className="py-16 text-gray-300">Loading your cart…</p> : lines.length === 0 ? <div className="card mt-8 p-8 text-center md:p-12">
      <ShoppingCart aria-hidden="true" className="mx-auto h-10 w-10 text-gold" />
      <h2 className="mt-5 text-2xl">{receipt ? "Plan another island adventure" : "Your cart is ready for an adventure"}</h2>
      <p className="mt-3 text-gray-300">Add an excursion or a stay package to get started.</p>
      <Link href="/island-adventures" className="btn-gold mt-6">Explore packages & excursions</Link>
    </div> : <form onSubmit={submit} className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <legend className="sr-only">Selected excursions and packages</legend>
        {lines.map(line => {
          const product = findCartProduct(line.productId);
          if (!product) return null;
          return <article key={line.productId} className="card min-w-0 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-xs uppercase tracking-[.15em] text-gold">{product.kind === "stay" ? "Stay package" : product.kind === "package" ? "Ocean package" : "Excursion"}</p><h2 className="mt-2 text-xl font-semibold sm:text-2xl"><Link href={product.href} className="hover:text-gold">{product.name}</Link></h2></div>
              <button type="button" onClick={() => remove(line.productId)} aria-label={`Remove ${product.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-gray-300 hover:border-red-300 hover:text-red-300"><Trash2 aria-hidden="true" className="h-4 w-4" /></button>
            </div>
            <p className="mt-4 text-gold">{usd(product.price)} per {product.unit}{product.nights ? ` · entire ${product.nights}-night stay` : ""}{product.duration ? ` · ${product.duration}` : ""}</p>
            <details className="mt-3 text-sm leading-6 text-gray-300"><summary className="min-h-10 cursor-pointer py-2">What’s included</summary><ul className="list-disc space-y-1 pl-5">{product.inclusions.map(item => <li key={item}>{item}</li>)}</ul></details>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-gray-300">{product.unit === "couple" ? "Couples (2 adults, 1 room each)" : "Guests"}<input type="number" required min={1} max={100} step={1} value={line.quantity || ""} aria-label={`${product.name}: ${product.unit === "couple" ? "couples" : "guests"}`} onChange={e => update(line.productId, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })} className={field} /></label>
              <label className="text-sm text-gray-300">{product.nights ? "Preferred check-in date" : "Preferred excursion date"}<input type="date" required min={maldivesToday()} max="9998-12-31" value={line.date} aria-label={`${product.name}: date`} onChange={e => update(line.productId, { date: e.target.value })} className={field} /></label>
            </div>
            {product.nights && isDate(line.date) && <p className="mt-3 text-sm text-gray-400">Check-out: {addNights(line.date, product.nights)} · {line.quantity * 2} adults · {line.quantity} {line.quantity === 1 ? "room" : "rooms"}</p>}
            <p className="mt-5 border-t border-white/10 pt-4 text-right text-lg font-semibold">{usd(product.price * line.quantity)}</p>
          </article>;
        })}
        <Link href="/island-adventures" className="inline-flex min-h-12 items-center text-sm font-semibold text-gold">+ Add more packages & excursions</Link>
      </fieldset>
      <div className="card min-w-0 p-5 sm:p-7 lg:sticky lg:top-28">
        <h2 className="text-2xl font-semibold">Book your selection</h2>
        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-3 border-y border-white/10 py-5"><span className="text-gray-300">Estimated total</span><strong className="text-3xl text-gold">{usd(total)}</strong></div>
        <p className="mt-4 text-sm leading-6 text-gray-400">Excursions are priced per person. Stay packages are priced per couple for the full stay. Availability, final inclusions and any separate transfers are confirmed before payment.</p>
        {user ? <fieldset disabled={pending} className="mt-6 space-y-4">
          <legend className="sr-only">Booking contact details</legend>
          <label className="block text-sm text-gray-300">Full name<input className={field} autoComplete="name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="block text-sm text-gray-300">Account email<input className={`${field} text-gray-400`} type="email" value={user.email} readOnly /></label>
          <label className="block text-sm text-gray-300">Phone / WhatsApp (with country code)<input className={field} type="tel" autoComplete="tel" required minLength={6} maxLength={40} placeholder="+960…" value={phone} onChange={e => setPhone(e.target.value)} /></label>
          <label className="block text-sm text-gray-300">Notes (optional)<textarea className={field} rows={3} maxLength={2000} placeholder="Your island, hotel, or any special requests" value={notes} onChange={e => setNotes(e.target.value)} /></label>
          <p className="text-sm leading-6 text-gray-300">This sends a booking request. Your dates are confirmed by Tripelor, and no payment is taken at checkout.</p>
          <button type="submit" disabled={pending} className="btn-gold min-h-12 w-full disabled:opacity-60">{pending ? "Sending your request…" : "Book items in cart"}</button>
        </fieldset> : user === undefined ? <p role="status" className="mt-6 text-sm text-gray-300">Checking your account…</p> : <div className="mt-6"><p className="text-sm leading-6 text-gray-300">Sign in to book your selection and track your request. Your cart will be kept.</p><Link href="/login?next=%2Fcart" className="btn-gold mt-4 min-h-12 w-full">Sign in to book</Link></div>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-3 text-sm text-red-200">{error}</p>}
        <Link href="/account/cart-bookings" className="mt-5 inline-flex min-h-11 items-center text-sm text-gold">My booking requests →</Link>
      </div>
    </form>}
  </section>;
}
