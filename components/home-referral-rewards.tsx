"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gift,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { translations, type ProfessionalLocale } from "@/lib/professional-translations";

type Member = {
  email?: string;
  fullName?: string;
};

const SESSION_KEY = "tripelor_share_and_win_home_seen_v2";

export default function HomeReferralRewards({ locale = "en" }: { locale?: ProfessionalLocale }) {
  const copy = translations[locale].referral;
  const [member, setMember] = useState<Member | null>(null);
  const [open, setOpen] = useState(false);
  const [qualified, setQualified] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Ignore storage restrictions.
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();

        if (response.ok && data?.user) {
          setMember(data.user);

          if (data.user.email) {
            try {
              const referralResponse = await fetch(
                `/api/referrals?email=${encodeURIComponent(data.user.email)}`,
                { cache: "no-store" },
              );
              const referralData = await referralResponse.json();
              if (referralResponse.ok) {
                setQualified(Boolean(referralData?.promotion?.qualified));
              }
            } catch {
              // Qualification is supplementary to the homepage promotion.
            }
          }
        }
      } catch {
        // The promotion can still be shown to signed-out visitors.
      }
    })();

    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        timer = setTimeout(() => setOpen(true), 250);
      }
    } catch {
      timer = setTimeout(() => setOpen(true), 250);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector('dialog[open], [aria-modal="true"]')) {
        event.preventDefault();
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const href = member ? "/account#referral-rewards" : "/signup?next=%2Faccount%23referral-rewards";
  const cta = member ? copy.openShareWin : copy.joinShareWin;

  return (
    <>
      <section className="coastal-referral-banner relative z-20 overflow-hidden border-b border-[#d9bd7b]/30 bg-[#07161d] text-white shadow-[0_12px_34px_rgba(0,0,0,.24)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(217,189,123,.16),transparent_30%),radial-gradient(circle_at_85%_50%,rgba(217,189,123,.10),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ead7aa]/70 to-transparent" />

        <div className="container relative flex min-h-[76px] flex-col items-center justify-center gap-3 py-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9bd7b]/35 bg-[#d9bd7b]/10 text-[#ead7aa]">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </span>

            <div>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="text-[9px] font-black uppercase tracking-[.28em] text-[#d9bd7b]">
                  {copy.newReward}
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-[#d9bd7b]/60 sm:block" />
                <span className="text-sm font-semibold text-white sm:text-[15px]">
                  {copy.homePromoTitle}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-white/45 sm:text-xs">
                {copy.promo}
              </p>
            </div>
          </div>

          <Link
            href={href}
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#d9bd7b]/45 bg-[#d9bd7b] px-5 py-2 text-[11px] font-black uppercase tracking-[.12em] text-[#07161d] shadow-[0_8px_24px_rgba(217,189,123,.18)] transition hover:-translate-y-0.5 hover:bg-[#ead7aa]"
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {open && createPortal(
        <section
          className="coastal-promo-notice"
          role="region"
          aria-labelledby="share-win-home-title"
        >
          <button type="button" onClick={close} className="coastal-promo-close" aria-label={copy.close}>
            <X aria-hidden="true" />
          </button>
          <p className="coastal-promo-label"><Gift aria-hidden="true" />{copy.newReward}</p>
          <h2 id="share-win-home-title">{copy.homePromoHeadline}</h2>
          <p className="coastal-promo-stay">{copy.homePrizeStay}</p>
          <p className="coastal-promo-ends">{copy.homePromoEnds}</p>
          {qualified && member && <p className="coastal-promo-qualified"><CheckCircle2 aria-hidden="true" />{copy.homeQualified}</p>}
          <Link href={href} onClick={close} className="coastal-button">{cta}<ArrowRight aria-hidden="true" /></Link>
        </section>,
        document.body,
      )}
    </>
  );
}
