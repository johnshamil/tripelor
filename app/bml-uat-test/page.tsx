"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState = { status: "loading" | "signed-out" | "signed-in" | "error"; email?: string };
type Verification = { status: "none" | "loading" | "verified" | "pending" | "error"; message?: string };
const testerEmail = "johnshamil87@gmail.com";

export default function BmlUatTestPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [verification, setVerification] = useState<Verification>({ status: "none" });
  const [returned, setReturned] = useState(false);

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
    if (loading || !authorized) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/bml/uat/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to start test payment.");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start BML UAT test.");
      setLoading(false);
    }
  }

  return <main className="mx-auto max-w-xl px-5 py-16">
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-slate-900">
      <h1 className="text-2xl font-bold">Tripelor · BML UAT payment test</h1>
      <p className="mt-3">Sandbox only · MVR 1.00 test transaction · No hotel booking is made.</p>
      <p className="mt-2 text-sm">Only use the test cards supplied by BML, never a real bank card.</p>
      {auth.status === "loading" && <p className="mt-5">Checking your Tripelor sign-in…</p>}
      {auth.status === "signed-out" && <div className="mt-5">
        <p className="font-semibold">Sign in to Tripelor first (not the BML dashboard).</p>
        <Link className="mt-3 inline-block rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white" href="/login?next=%2Fbml-uat-test">Sign in to Tripelor</Link>
      </div>}
      {auth.status === "error" && <p className="mt-5 text-red-700" role="alert">Unable to check your Tripelor session. Reload this page and try again.</p>}
      {auth.status === "signed-in" && <div className="mt-5">
        <p className="text-sm">Signed in as: <strong>{auth.email}</strong></p>
        {!authorized && <p className="mt-2 text-red-700">This is not the authorized test account. Sign out and sign in using {testerEmail}.</p>}
      </div>}
      {returned && authorized && <div role="status" className="mt-5 rounded-lg border border-amber-300 bg-white p-4">
        <p className="font-semibold">BML payment verification</p>
        <p className={verification.status === "verified" ? "mt-2 text-green-800" : "mt-2 text-amber-900"}>
          {verification.message || "The bank redirect has not been verified yet."}
        </p>
        <p className="mt-2 text-xs">This sandbox test never changes a Tripelor booking or marks a customer payment as paid.</p>
      </div>}
      {authorized && <button type="button" disabled={loading} onClick={start} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Opening secure payment page…" : "Start MVR 1.00 test payment"}
      </button>}
      {message && <p role="alert" className="mt-4 text-red-700">{message}</p>}
    </section>
  </main>;
}
