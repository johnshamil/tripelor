"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BellOff, Tag } from "lucide-react";

export default function PriceAlertManager() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/account/price-alerts", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to load price alerts.");
    setAlerts(result.alerts || []);
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load alerts."));
  }, []);

  async function cancel(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/price-alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to cancel alert.");
      await load();
      setMessage("Price alert cancelled.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to cancel alert.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container max-w-4xl py-10 pb-24 md:py-16">
      <Link href="/account" className="inline-flex min-h-11 items-center gap-2 text-sm text-gray-400">
        <ArrowLeft className="h-4 w-4" /> My account
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[.24em] text-gold">Member watchlist</p>
      <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
        <Tag className="h-7 w-7 text-gold" /> Price-drop alerts
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400">
        We’ll email you once when a watched property’s published Tripelor starting price drops below the price you first watched.
      </p>

      {message && <p className="mt-5 rounded-xl border border-gold/30 p-4 text-sm">{message}</p>}

      <div className="mt-8 grid gap-4">
        {alerts.length ? alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl border border-white/10 p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-semibold">{alert.property_name}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Watched from USD {Number(alert.baseline_price).toFixed(2)}
                  {alert.last_seen_price != null ? " · Latest USD " + Number(alert.last_seen_price).toFixed(2) : ""}
                </p>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-gold">
                {alert.status === "active" ? "Watching" : alert.status === "notified" ? "Price drop sent" : "Cancelled"}
              </span>
            </div>
            {alert.status === "active" && (
              <button
                disabled={busy}
                onClick={() => cancel(alert.id)}
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-gray-400 underline disabled:opacity-50"
              >
                <BellOff className="h-4 w-4" /> Cancel alert
              </button>
            )}
          </article>
        )) : (
          <p className="rounded-2xl border border-white/10 p-6 text-sm text-gray-400">
            No price alerts yet. Open a Tripelor stay and tap “Watch this price”.
          </p>
        )}
      </div>
    </main>
  );
}
