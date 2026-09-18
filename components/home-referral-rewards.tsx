"use client";

import Link from "next/link";
import { ArrowRight, Gift, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { translations, type ProfessionalLocale } from "@/lib/professional-translations";

type Member = {
  email?: string;
  fullName?: string;
};

const SESSION_KEY = "tripelor_referral_welcome_seen_v1";

export default function HomeReferralRewards({ locale = "en" }: { locale?: ProfessionalLocale }) {
  const copy = translations[locale].referral;
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
  const cta = member ? copy.open : copy.join;

  return (
    <>
      <section className="relative z-20 overflow-hidden border-b border-[#f4dfaa]/60 bg-gradient-to-r from-[#b88a35] via-[#ead7aa] to-[#b88a35] text-[#071922] shadow-[0_8px_24px_rgba(0,0,0,.18)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,.42),transparent_22%),radial-gradient(circle_at_85%_50%,rgba(255,255,255,.26),transparent_18%)]" />
        <div className="container relative flex min-h-[64px] flex-col items-center justify-center gap-2 py-3 text-center sm:flex-row sm:gap-4 sm:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#071922]/15 bg-[#071922]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {copy.newReward}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold sm:text-base">
            <Gift className="h-5 w-5 shrink-0" aria-hidden="true" />
            <strong className="font-black">{copy.title}</strong>
            <span className="hidden sm:inline">—</span>
            <span>{copy.banner}</span>
          </span>
          <Link
            href={href}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#071922] px-4 py-2 text-xs font-bold text-[#f6e7bf] shadow-[0_8px_22px_rgba(7,25,34,.28)] transition hover:-translate-y-0.5 hover:bg-black"
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
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border-2 border-[#ead7aa]/70 bg-[radial-gradient(circle_at_top_right,rgba(234,215,170,.30),transparent_34%),linear-gradient(145deg,#0b2731_0%,#06151c_55%,#03090d_100%)] p-6 text-white shadow-[0_35px_120px_rgba(0,0,0,.68),0_0_45px_rgba(217,189,123,.16)] sm:p-8"
          >
            <button
              type="button"
              onClick={close}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 transition hover:text-white"
              aria-label={copy.close}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#ead7aa]/55 bg-[#ead7aa]/15 shadow-[0_0_25px_rgba(234,215,170,.18)]">
                <Sparkles className="h-6 w-6 text-[#f3dfaa]" aria-hidden="true" />
              </div>
              <span className="rounded-full border border-[#ead7aa]/35 bg-[#ead7aa]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.22em] text-[#f3dfaa]">
                {copy.welcomeReward}
              </span>
            </div>

            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.28em] text-[#ead7aa]">
              {copy.eyebrow}
            </p>
            <h2 id="welcome-reward-title" className="font-display mt-3 text-4xl leading-tight sm:text-5xl">
              {copy.headline}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/65 sm:text-base">{copy.body}</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#ead7aa]/35 bg-[#ead7aa]/10 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]">
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">{copy.friendReceives}</p>
                <p className="mt-2 text-3xl font-black text-[#f3dfaa]">{copy.usd20}</p>
              </div>
              <div className="rounded-2xl border border-[#ead7aa]/35 bg-[#ead7aa]/10 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,.03)]">
                <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/50">{copy.youEarn}</p>
                <p className="mt-2 text-3xl font-black text-[#f3dfaa]">{copy.points100}</p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={href} onClick={close} className="btn-gold flex-1 justify-center">
                {cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button type="button" onClick={close} className="btn-outline flex-1 justify-center">
                {copy.maybeLater}
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-5 text-white/40">{copy.note}</p>
          </section>
        </div>
      )}
    </>
  );
}
