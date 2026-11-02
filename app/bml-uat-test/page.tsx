"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState = { status: "loading" | "signed-out" | "signed-in" | "error"; email?: string };
const testerEmail = "johnshamil87@gmail.com";

export default function BmlUatTestPage() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [returned, setReturned] = useState(false);

  useEffect(() => {
    setReturned(new URLSearchParams(window.location.search).has("returned"));
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to check your Tripelor session.");
        return response.json();
      })
      .then((data) => setAuth(data.user?.email
        ? { status: "signed-in", email: data.user.email }
        : { status: "signed-out" }))
      .catch(() => setAuth({ status: "error" }));
  }, []);

  const authorized = auth.status === "signed-in" && auth.email?.toLowerCase() === testerEmail;

  async function start() {
    if (loading || !authorized) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/bml/uat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
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
      {authorized && <button type="button" disabled={loading} onClick={start} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Opening secure payment page…" : "Start MVR 1.00 test payment"}
      </button>}
      {message && <p role="alert" className="mt-4 text-red-700">{message}</p>}
      {returned && <p className="mt-4 text-sm font-semibold">Returned from BML. Payment status is NOT verified yet; this return alone does not mean payment succeeded.</p>}
    </section>
  </main>;
}
