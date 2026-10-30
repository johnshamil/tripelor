"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, LockKeyhole, Tag } from "lucide-react";

export default function PropertyGrowthTools({
  propertySlug,
  propertyName,
  startingFrom,
  firstRoom,
}: {
  propertySlug: string;
  propertyName: string;
  startingFrom: number;
  firstRoom?: string;
}) {
  const [user, setUser] = useState<any>(undefined);
  const [priceState, setPriceState] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  const returnTo = "/stays/" + propertySlug;

  async function watchPrice() {
    setBusy(true);
    setPriceState("");
    try {
      const response = await fetch("/api/account/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertySlug }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = "/signup?next=" + encodeURIComponent(returnTo);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Unable to create price alert.");
      setPriceState(
        "Watching from USD " +
          Number(result.price).toFixed(2) +
          ". We’ll email you if the published starting price drops.",
      );
    } catch (error) {
      setPriceState(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const availabilityParams = new URLSearchParams({ property: propertyName });
  if (firstRoom) availabilityParams.set("roomType", firstRoom);
  const availabilityHref = "/account/availability-alerts?" + availabilityParams.toString();

  const memberHref = user
    ? "/build-your-trip?member=1&property=" + encodeURIComponent(propertyName)
    : "/signup?next=" + encodeURIComponent(returnTo + "?member=1");

  return (
    <section className="border-y border-white/10 bg-[#071b24]">
      <div className="container py-12 md:py-14">
        <div className="max-w-3xl">
          <p className="eyebrow">Free Tripelor member tools</p>
          <h2 className="font-display mt-3 text-4xl text-white md:text-5xl">Watch it. Plan it. Unlock more.</h2>
          <p className="mt-3 text-sm leading-7 text-white/55">
            Create a free Tripelor account to keep an eye on your Maldives trip without needing to book today.
          </p>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <Tag className="h-5 w-5 text-[#d9bd7b]" />
            <h3 className="mt-4 font-semibold text-white">Notify me when price drops</h3>
            <p className="mt-2 text-xs leading-5 text-white/50">
              {startingFrom > 0
                ? "Watch the current published starting price from USD " + startingFrom + "."
                : "Available for properties with a published numeric rate."}
            </p>
            {startingFrom > 0 && (
              <button
                type="button"
                onClick={watchPrice}
                disabled={busy}
                className="btn-gold mt-4 min-h-11 w-full justify-center text-xs disabled:opacity-60"
              >
                {busy ? "Saving…" : "Watch this price"}
              </button>
            )}
            {priceState && <p className="mt-3 text-xs leading-5 text-[#e7d6ad]">{priceState}</p>}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <Bell className="h-5 w-5 text-[#d9bd7b]" />
            <h3 className="mt-4 font-semibold text-white">Notify me when rooms become available</h3>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Choose your dates and we’ll email you when your preferred room becomes available.
            </p>
            <Link href={availabilityHref} className="btn-outline mt-4 min-h-11 w-full justify-center text-xs">
              Set availability alert
            </Link>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
            <CalendarDays className="h-5 w-5 text-[#d9bd7b]" />
            <h3 className="mt-4 font-semibold text-white">Get my free Maldives itinerary</h3>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Build a simple day-by-day Maldives plan around your travel style.
            </p>
            <Link href="/free-maldives-itinerary" className="btn-outline mt-4 min-h-11 w-full justify-center text-xs">
              Create free itinerary
            </Link>
          </article>

          <article className="rounded-2xl border border-[#d9bd7b]/35 bg-[#d9bd7b]/10 p-5">
            <LockKeyhole className="h-5 w-5 text-[#ead7aa]" />
            <h3 className="mt-4 font-semibold text-white">{user ? "Member rate unlocked" : "Unlock member price"}</h3>
            <p className="mt-2 text-xs leading-5 text-white/55">
              {user
                ? "You’re signed in. Ask Tripelor for the best private member rate available for your dates."
                : "Join free to unlock private member-rate requests and Tripelor member offers."}
            </p>
            <Link href={memberHref} className="btn-gold mt-4 min-h-11 w-full justify-center text-xs">
              {user ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Request member rate
                </>
              ) : (
                "Unlock free"
              )}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
