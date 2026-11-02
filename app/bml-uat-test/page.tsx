"use client";

import { useState } from "react";

export default function BmlUatTestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function start() {
    if (loading) return;
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/bml/uat/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to start test payment.");
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start BML UAT test.");
      setLoading(false);
    }
  }
  return <main className="mx-auto max-w-xl px-5 py-16">
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-slate-900">
      <h1 className="text-2xl font-bold">Tripelor · BML UAT payment test</h1>
      <p className="mt-3">Sandbox only · MVR 1.00 test transaction · No hotel booking is made.</p>
      <p className="mt-2 text-sm">Sign in using the authorized Tripelor tester account. Use only BML's supplied test cards; never use a real card in UAT.</p>
      <button type="button" disabled={loading} onClick={start} className="mt-6 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50">
        {loading ? "Opening secure payment page…" : "Start MVR 1.00 test payment"}
      </button>
      {message && <p role="alert" className="mt-4 text-red-700">{message}</p>}
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("returned") && <p className="mt-4 text-sm font-semibold">Returned from BML. Payment status is NOT verified yet; this return alone does not mean payment succeeded.</p>}
    </div>
  </main>;
}
