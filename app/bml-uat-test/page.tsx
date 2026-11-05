"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState = { status: "loading" | "signed-out" | "signed-in" | "error"; email?: string };
type Verification = { status: "none" | "loading" | "verified" | "pending" | "error"; message?: string };
const testerEmail = "johnshamil87@gmail.com";
const consentVersion = "tripelor-bml-uat-2026-11-05";

export default function BmlUatTestPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState<Verification>({ status: "none" });
  const [returned, setReturned] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Unable to check your Tripelor session.");
        return response.json();
      })
      .then(data => setAuth(data.user?.email
        ? { status: "signed-in", email: data.user.email }
        : { status: "signed-out" }))
      .catch(() => setAuth({ status: "error" }));
  }, []);

  useEffect(() => {
    if (auth.status !== "signed-in" || auth.email?.toLowerCase() !== testerEmail) return;
    const params = new URLSearchParams(window.location.search);
    const didReturn = params.has("returned");
    setReturned(didReturn);
    if (!didReturn) return;
    const transactionId = params.get("transactionId") || params.get("transaction_id") || "";
    if (!transactionId) {
      setVerification({ status: "pending", message: "BML returned to Tripelor without a transaction ID. No payment has been verified. Check the test transaction in the BML UAT portal." });
      return;
    }
    setVerification({ status: "loading", message: "Asking BML to verify the transaction status…" });
    fetch(`/api/bml/uat/status?transactionId=${encodeURIComponent(transactionId)}`, { cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "BML status verification failed.");
        setVerification({ status: data.confirmed ? "verified" : "pending", message: data.message });
      })
      .catch(error => setVerification({ status: "error", message: error instanceof Error ? error.message : "Unable to verify payment." }));
  }, [auth.status, auth.email]);

  const authorized = auth.status === "signed-in" && auth.email?.toLowerCase() === testerEmail;

  async function start() {
    if (loading || !authorized || !accepted) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/bml/uat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptedTerms: true, acceptedTermsVersion: consentVersion }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to start test payment.");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start BML UAT test.");
      setLoading(false);
    }
  }

  return <main className="mx-auto max-w-2xl px-4 py-12 text-slate-900">
    <section className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50 shadow-xl">
      <div className="bg-[#071922] px-6 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Merchant checkout · UAT demonstration only</p>
        <h1 className="mt-3 text-2xl font-bold">Tripelor · BML payment test</h1>
        <p className="mt-2 text-sm text-white/75">Sandbox transaction only. No hotel booking, real card payment or live charge is created.</p>
      </div>
      <div className="space-y-5 p-6">
        <div className="rounded-xl border border-amber-300 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Order summary — before payment</p>
          <div className="mt-3 flex justify-between gap-3 text-sm"><span>Tripelor BML UAT payment demonstration</span><span className="font-semibold">MVR 1.00</span></div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total due</span><span>MVR 1.00</span></div>
          <p className="mt-2 text-xs text-slate-600">Transaction currency: Maldivian Rufiyaa (MVR). Merchant outlet country: Republic of Maldives.</p>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4">
          <h2 className="text-sm font-bold">Merchant identity and contact information</h2>
          <dl className="mt-3 space-y-2 text-sm leading-6">
            <div><dt className="inline font-semibold">Trading name: </dt><dd className="inline">Tripelor</dd></div>
            <div><dt className="inline font-semibold">Legal merchant: </dt><dd className="inline">Nexus Gaming Pvt Ltd (C03772023)</dd></div>
            <div><dt className="inline font-semibold">Merchant outlet country: </dt><dd className="inline">Republic of Maldives</dd></div>
            <div><dt className="inline font-semibold">Business / correspondence address: </dt><dd className="inline">M. Metro Villa, 6th Floor, Shaariuvarudhee, Maafannu, Malé, Republic of Maldives</dd></div>
            <div><dt className="inline font-semibold">Customer support: </dt><dd className="inline"><a className="underline" href="mailto:bookings@tripelor.com">bookings@tripelor.com</a> · <a className="underline" href="tel:+9609429403">+960 942 9403</a></dd></div>
          </dl>
        </div>

        <div className="rounded-xl border border-slate-300 bg-[#050505] p-4 text-white">
          <h2 className="text-xs font-semibold uppercase tracking-wide">Card brands — BML-provided artwork</h2>
          <img src="/bml-accepted-card-brands.webp" width={736} height={150} alt="American Express, Visa, Mastercard, Maestro and UnionPay card acceptance marks" className="mt-2 h-auto w-full" />
          <p className="text-xs text-white/65">Available payment methods depend on your BML merchant configuration.</p>
        </div>

        <div className="rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6">
          <h2 className="font-bold">Terms, cancellation/refund rules and data protection</h2>
          <p className="mt-2">This is a single MVR 1.00 sandbox payment demonstration, not a purchase of accommodation or services. For customer bookings, Tripelor confirms availability, final price, payment schedule and applicable supplier-specific cancellation/refund terms before requesting payment.</p>
          <p className="mt-2">You will be redirected to the BML Payment Gateway to process your transaction. Your card information is entered directly into BML's payment form over an encrypted HTTPS connection. Tripelor does not collect or store card numbers, card expiry dates or CVV security codes.</p>
          <p className="mt-2">Please retain a copy of your transaction record, receipt, purchase terms and cancellation/refund policy for your records.</p>
          <p className="mt-2">Review our <Link className="font-semibold underline" href="/travel-info#terms" target="_blank">Purchase Terms</Link>, <Link className="font-semibold underline" href="/travel-info#cancellation" target="_blank">Cancellation and Refund Policy</Link>, <Link className="font-semibold underline" href="/travel-info#privacy" target="_blank">Privacy Policy</Link> and <Link className="font-semibold underline" href="/travel-info#payment-security" target="_blank">Payment Security Policy</Link>.</p>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-400 bg-white p-4 text-sm leading-6">
          <input type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-amber-600" aria-required="true" />
          <span><strong>I agree.</strong> I have reviewed and accept the purchase terms, cancellation/refund disclosures and privacy information, and understand I am authorizing an MVR 1.00 BML UAT test transaction (not a confirmed reservation).</span>
        </label>

        {auth.status === "loading" && <p className="text-sm">Checking your Tripelor sign-in…</p>}
        {auth.status === "signed-out" && <div className="text-sm">
          <p className="font-semibold">Sign in to Tripelor first (not the BML dashboard).</p>
          <Link className="mt-3 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white" href="/login?next=%2Fbml-uat-test">Sign in to Tripelor</Link>
        </div>}
        {auth.status === "error" && <p className="text-sm text-red-700" role="alert">Unable to check your Tripelor session. Reload this page and try again.</p>}
        {auth.status === "signed-in" && <div className="text-sm">
          <p>Signed in as <strong>{auth.email}</strong></p>
          {!authorized && <p className="mt-2 text-red-700">This is not the authorized test account. Use {testerEmail}.</p>}
        </div>}
        {returned && authorized && <div role="status" className="rounded-lg border border-amber-300 bg-white p-4">
          <p className="font-semibold">BML payment verification</p>
          <p className={verification.status === "verified" ? "mt-2 text-green-800" : "mt-2 text-amber-900"}>{verification.message || "The bank redirect has not been verified yet."}</p>
          <p className="mt-2 text-xs">This test does not modify a Tripelor booking or mark any customer payment paid.</p>
        </div>}
        {authorized && <button type="button" disabled={loading || !accepted} onClick={start} className="w-full rounded-xl bg-slate-900 px-5 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
          {loading ? "Opening BML secure payment page…" : "Accept terms and proceed to BML · MVR 1.00"}
        </button>}
        {!accepted && <p className="text-center text-xs text-amber-900">Accept the terms above to enable the payment button.</p>}
        {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      </div>
    </section>
  </main>;
}
