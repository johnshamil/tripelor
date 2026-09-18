"use client";

import Link from "next/link";
import { ArrowRight, Gift, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

type Member = {
  email?: string;
  fullName?: string;
};

const SESSION_KEY = "tripelor_referral_welcome_seen_v1";

export default function HomeReferralRewards() {
  const [member, setMember] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        if (response.ok && data?.user) setMember(data.user);
      } catch {
        // The rewards prompt can still be shown to signed-out visitors.
      }
    })();

    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        timer = setTimeout(() => setOpen(true), 900);
      }
    } catch {
      timer = setTimeout(() => setOpen(true), 900);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  function close() {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage restrictions.
    }
  }

  const href = member ? "/account#referral-rewards" : "/signup?next=%2Faccount";
  const cta = member ? "Open My Rewards" : "Join & Unlock Rewards";

  return (
    <>
      <section className="relative z-20 border-b border-[#d9bd7b]/25 bg-[#071922] text-white">
        <div className="container flex min-h-12 flex-col items-center justify-center gap-2 py-2 text-center sm:flex-row sm:gap-4 sm:text-left">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-[#ead7aa]">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Referral Rewards
          </span>
          <span className="text-sm text-white/75">
            Give a friend <strong className="font-semibold text-white">USD 20 off</strong> · Earn{" "}
            <strong className="font-semibold text-white">100 Tripelor Points</strong>
          </span>
          <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-[#ead7aa] underline decoration-[#ead7aa]/45 underline-offset-4"
          >
            {cta} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-[#02080c]/75 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-reward-title"
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-[#d9bd7b]/35 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.20),transparent_32%),linear-gradient(145deg,#0b2731_0%,#06151c_55%,#03090d_100%)] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 transition hover:text-white"
              aria-label="Close rewards welcome"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d9bd7b]/30 bg-[#d9bd7b]/10">
              <Sparkles className="h-5 w-5 text-[#ead7aa]" aria-hidden="true" />
            </div>

            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.28em] text-[#ead7aa]">
              Welcome to Tripelor Rewards
            </p>
            <h2 id="welcome-reward-title" className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
              Travel together. Get rewarded.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65 sm:text-base">
              Create your Tripelor account to unlock your personal referral link. Your friend receives USD 20 off an
              eligible booking, and you receive 100 Tripelor Points after their completed stay.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-[10px] uppercase tracking-[.18em] text-white/45">Friend receives</p>
                <p className="mt-2 text-2xl font-semibold text-[#ead7aa]">USD 20 off</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-[10px] uppercase tracking-[.18em] text-white/45">You earn</p>
                <p className="mt-2 text-2xl font-semibold text-[#ead7aa]">100 points</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={href} onClick={close} className="btn-gold flex-1 justify-center">
                {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button type="button" onClick={close} className="btn-outline flex-1 justify-center">
                Maybe Later
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-5 text-white/40">
              Referral discount applies to eligible bookings. Points are awarded after the referred guest completes
              their stay.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
