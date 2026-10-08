"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Gift,
  MapPin,
  Sparkles,
  Trophy,
  Utensils,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      const outsideDialog = !dialogRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || outsideDialog)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, close]);

  const href = member ? "/account#referral-rewards" : "/signup?next=%2Faccount%23referral-rewards";
  const cta = member ? copy.openShareWin : copy.joinShareWin;

  return (
    <>
      <section className="relative z-20 overflow-hidden border-b border-[#d9bd7b]/30 bg-[#07161d] text-white shadow-[0_12px_34px_rgba(0,0,0,.24)]">
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

      {/* Keep the welcome dialog outside the animated page's containing block. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010406]/60 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-win-home-title"
            className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-x-hidden overflow-y-auto overscroll-contain rounded-[2.25rem] border border-[#d9bd7b]/45 bg-[#061118] text-white shadow-[0_40px_140px_rgba(0,0,0,.82),0_0_70px_rgba(217,189,123,.10)] sm:max-h-[calc(100dvh-3rem)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(217,189,123,.18),transparent_30%),radial-gradient(circle_at_10%_95%,rgba(68,126,142,.10),transparent_32%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ead7aa] to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-[#d9bd7b]/10" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-[#d9bd7b]/10" />

            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-white/50 backdrop-blur transition hover:border-[#d9bd7b]/35 hover:text-white"
              aria-label={copy.close}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative grid lg:grid-cols-[1.18fr_.82fr]">
              <div className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9bd7b]/35 bg-[#d9bd7b]/10 text-[#ead7aa]">
                    <Crown className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.30em] text-[#d9bd7b]">
                      {copy.homePromoBadge}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-white/35">{copy.homePromoEnds}</p>
                  </div>
                </div>

                {qualified && member && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {copy.homeQualified}
                  </div>
                )}

                <div className="mt-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[.32em] text-[#d9bd7b]">
                    {copy.homePromoEyebrow}
                  </p>
                  <h2
                    id="share-win-home-title"
                    className="font-display mt-3 max-w-xl text-[2.7rem] leading-[.98] tracking-[-.02em] text-[#f8f3e8] sm:text-6xl"
                  >
                    {copy.homePromoHeadline}
                  </h2>
                  <div className="mt-5 h-px w-16 bg-[#d9bd7b]/60" />
                  <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-[15px]">
                    {member ? copy.homePromoMemberBody : copy.homePromoGuestBody}
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                      Referral Benefit
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[#ead7aa]">20%</p>
                    <p className="mt-1 text-xs text-white/45">Friend saving</p>
                  </div>
                  <div className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                      Your Reward
                    </p>
                    <p className="mt-2 text-xl font-semibold text-[#ead7aa]">100</p>
                    <p className="mt-1 text-xs text-white/45">Tripelor Points</p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={href}
                    onClick={close}
                    className="inline-flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b88a35] via-[#ead7aa] to-[#c49b4e] px-5 text-sm font-black text-[#061118] shadow-[0_14px_34px_rgba(217,189,123,.18)] transition hover:-translate-y-0.5"
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={close}
                    className="min-h-[50px] flex-1 rounded-full border border-white/10 bg-white/[.025] px-5 text-sm font-semibold text-white/55 transition hover:border-[#d9bd7b]/30 hover:text-white"
                  >
                    {copy.exploreFirst}
                  </button>
                </div>

                <p className="mt-4 text-center text-[10px] leading-5 text-white/25">
                  {copy.homePromoNote}
                </p>
              </div>

              <aside className="relative border-t border-[#d9bd7b]/15 bg-[linear-gradient(180deg,rgba(217,189,123,.08),rgba(0,0,0,.14))] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.30em] text-[#d9bd7b]">
                      Grand Prize
                    </p>
                    <p className="font-display mt-3 text-7xl leading-none text-[#f2dfae]">05</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[.22em] text-white/45">
                      Nights
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d9bd7b]/30 bg-[#d9bd7b]/10 text-[#ead7aa]">
                    <Trophy className="h-5 w-5" />
                  </span>
                </div>

                <div className="mt-8 space-y-5">
                  <div className="flex items-start gap-3 border-b border-white/[.07] pb-5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d9bd7b]" />
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                        {copy.homePrizeStayLabel}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-white/80">
                        {copy.homePrizeStay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-b border-white/[.07] pb-5">
                    <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-[#d9bd7b]" />
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                        {copy.homePrizeMealLabel}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white/80">{copy.homePrizeMeal}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#d9bd7b]" />
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">
                        {copy.homePrizeExtraLabel}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-white/80">
                        {copy.homePrizeExtra}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-[#d9bd7b]/18 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-[#ead7aa]">
                    <Gift className="h-4 w-4" />
                    <p className="text-[10px] font-black uppercase tracking-[.18em]">How to enter</p>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-white/40">{copy.homeEntryLine}</p>
                </div>
              </aside>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
