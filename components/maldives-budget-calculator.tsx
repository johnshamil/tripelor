"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Calculator, CheckCircle2, LockKeyhole, Sparkles } from "lucide-react";

type StayOption = {
  slug: string;
  name: string;
  island: string;
  startingFrom: number;
};

export default function MaldivesBudgetCalculator({ stays }: { stays: StayOption[] }) {
  const [budget, setBudget] = useState(1200);
  const [nights, setNights] = useState(5);
  const [rooms, setRooms] = useState(1);
  const [user, setUser] = useState<any>(undefined);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  const results = useMemo(() => {
    return stays
      .filter((stay) => stay.startingFrom > 0)
      .map((stay) => ({
        ...stay,
        estimatedStay: stay.startingFrom * nights * rooms,
      }))
      .sort((a, b) => a.estimatedStay - b.estimatedStay);
  }, [stays, nights, rooms]);

  const fitting = results.filter((stay) => stay.estimatedStay <= budget);
  const closest = fitting.length ? fitting : results.slice(0, 3);

  return (
    <main className="bg-[#f1ebdf] text-[#071922]">
      <div className="container max-w-6xl py-12 md:py-16">
        <div className="max-w-3xl">
          <p className="eyebrow text-[#8d7037]">Tripelor Maldives Budget Calculator</p>
          <h1 className="font-display mt-3 text-5xl leading-tight md:text-7xl">What Maldives trip fits your budget?</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#5d696f]">
            Set your accommodation budget and trip length. Tripelor compares currently published starting rates.
            Transfers, taxes, seasonal pricing and activities may be additional and are confirmed before booking.
          </p>
        </div>

        <section className="mt-8 grid gap-5 rounded-3xl border border-[#d0c5b0] bg-[#fffdf8] p-6 md:grid-cols-3">
          <label className="text-sm font-semibold">
            Accommodation budget (USD)
            <input
              type="number"
              min="100"
              step="50"
              value={budget}
              onChange={(event) => setBudget(Math.max(100, Number(event.target.value) || 100))}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#c9b88f] bg-white px-4"
            />
          </label>
          <label className="text-sm font-semibold">
            Nights
            <select
              value={nights}
              onChange={(event) => setNights(Number(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#c9b88f] bg-white px-4"
            >
              {[3, 4, 5, 6, 7, 8, 10, 12, 14].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Rooms
            <select
              value={rooms}
              onChange={(event) => setRooms(Number(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#c9b88f] bg-white px-4"
            >
              {[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </section>

        <div className="mt-8 rounded-3xl bg-[#071b24] p-6 text-white md:p-8">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9bd7b]/10">
              <Calculator className="h-6 w-6 text-[#ead7aa]" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d9bd7b]">Your budget result</p>
              <h2 className="font-display mt-2 text-3xl">
                {fitting.length
                  ? fitting.length + " published Tripelor stay" + (fitting.length === 1 ? "" : "s") + " currently fit this accommodation budget."
                  : "No published starting rate fully fits this budget yet."}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Estimated stay budget: USD {budget.toLocaleString()} for {nights} nights and {rooms} room{rooms > 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>

        {user === undefined ? (
          <div className="mt-8 text-center text-sm text-[#5d696f]">Checking your Tripelor membership…</div>
        ) : user ? (
          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-[#8d7037]">Member results</p>
                <h2 className="font-display mt-2 text-4xl">Your closest Tripelor options.</h2>
              </div>
              <Link href="/maldives-matchmaker" className="btn-outline text-[#071922]">Get my Match Score</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {closest.slice(0, 6).map((stay) => (
                <article key={stay.slug} className="rounded-2xl border border-[#d0c5b0] bg-[#fffdf8] p-6">
                  <CheckCircle2 className="h-5 w-5 text-[#8d7037]" />
                  <p className="mt-4 text-xs uppercase tracking-[.14em] text-[#8d7037]">{stay.island}</p>
                  <h3 className="font-display mt-2 text-2xl">{stay.name}</h3>
                  <p className="mt-3 text-sm text-[#5d696f]">From USD {stay.startingFrom.toFixed(2)} / room / night</p>
                  <p className="mt-1 font-semibold">Estimated stay: USD {stay.estimatedStay.toFixed(2)}</p>
                  <Link href={"/stays/" + stay.slug} className="btn-gold mt-5 w-full justify-center">View stay</Link>
                </article>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-[#d0c5b0] bg-[#fffdf8] p-6 md:flex md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#8d7037]">Want Tripelor to optimize the full trip?</p>
                <p className="mt-2 text-sm text-[#5d696f]">Add transfers, meal preferences and experiences to get a personalized quote.</p>
              </div>
              <Link href={"/build-your-trip?budget=" + encodeURIComponent(String(budget)) + "&nights=" + nights} className="btn-gold mt-5 justify-center md:mt-0">
                <Sparkles className="h-4 w-4" /> Build within my budget
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-[#c9b88f] bg-[#fffdf8] p-8 text-center">
            <LockKeyhole className="mx-auto h-7 w-7 text-[#8d7037]" />
            <p className="eyebrow mt-4 text-[#8d7037]">Free member result</p>
            <h2 className="font-display mt-2 text-4xl">Unlock the stays that fit your budget.</h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5d696f]">
              Create your free Tripelor account to see matching stays, save your plan and request private member rates.
            </p>
            <Link href="/signup?next=%2Fmaldives-budget-calculator" className="btn-gold mt-6 justify-center">
              Unlock my budget results
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
