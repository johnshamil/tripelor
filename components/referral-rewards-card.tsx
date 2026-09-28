"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Gift,
  Link2,
  Share2,
  Trophy,
  Users,
} from "lucide-react";

const PROMOTION_END_LABEL = "30 December 2026";

export default function ReferralRewardsCard({ email }: { email: string }) {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [promotionRecorded, setPromotionRecorded] = useState(false);

  useEffect(() => {
    if (!email) return;

    fetch(`/api/referrals?email=${encodeURIComponent(email)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then(setData)
      .catch(() => {});
  }, [email]);

  if (!data?.code) return null;

  const discountUsd = Number(data.discountUsd) || 20;
  const rewardPoints = Number(data.rewardPoints) || 100;
  const link = `${
    typeof window !== "undefined" ? window.location.origin : "https://tripelor.com"
  }/booking?ref=${encodeURIComponent(data.code)}`;

  const rewarded = (data.referrals || []).filter(
    (item: any) => item.status === "rewarded",
  ).length;

  const pending = (data.referrals || []).filter(
    (item: any) => item.status !== "rewarded" && item.status !== "cancelled",
  ).length;

  async function recordPromotionAction(
    action: "share" | "copy",
    channel: string,
  ) {
    try {
      const response = await fetch("/api/referrals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, channel }),
      });

      if (response.ok) {
        setPromotionRecorded(true);
      }
    } catch {
      // Sharing should still work even if promotion tracking is temporarily unavailable.
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    await recordPromotionAction("copy", "copy_link");
  }

  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }

    try {
      await navigator.share({
        title: "Tripelor Referral – Save $20",
        text: `Your first eligible Tripelor booking gets USD ${discountUsd} off with my referral link.`,
        url: link,
      });
      await recordPromotionAction("share", "native_share");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  return (
    <section
      id="referral-rewards"
      className="mt-8 scroll-mt-28 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-gold/[.10] via-black to-black p-6 md:p-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-gold">
            Referral Rewards
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Your Friend Saves ${discountUsd}. You Earn {rewardPoints} Points.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
            Invite your friends and family to discover the Maldives with Tripelor.
            When they make an eligible booking using your unique referral link or
            code, they receive USD {discountUsd} off. After they complete their
            stay, you receive {rewardPoints} Tripelor Points.
          </p>
        </div>
        <Gift className="h-10 w-10 shrink-0 text-gold" />
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-gold/35 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.22),transparent_36%),linear-gradient(135deg,rgba(217,189,123,.14),rgba(255,255,255,.025))] p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-gold">
                <Trophy className="h-3.5 w-3.5" />
                Referral Lucky Draw
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                <CalendarDays className="h-4 w-4 text-gold" />
                Ends {PROMOTION_END_LABEL}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold md:text-3xl">
              Share your referral code for a chance to win a FREE 3-night Half Board stay.
            </h3>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              Use your personal Tripelor referral link and share it with your friends.
              The promotion ends on {PROMOTION_END_LABEL}. One winner will be selected
              after the promotion closes. Let&apos;s see who&apos;s lucky!
            </p>
            <p className="mt-3 text-xs leading-6 text-gray-500">
              To make sure your participation is recorded, use the Copy or Share buttons
              below while signed in to your Tripelor account.
            </p>
          </div>

          <div className="flex min-w-[180px] flex-col items-center justify-center rounded-2xl border border-gold/25 bg-black/30 p-5 text-center">
            <Trophy className="h-8 w-8 text-gold" />
            <p className="mt-3 text-xs uppercase tracking-[.16em] text-gray-500">Prize</p>
            <p className="mt-1 text-lg font-black text-gold">3 Nights</p>
            <p className="text-sm font-semibold text-white/80">Half Board</p>
          </div>
        </div>

        {promotionRecorded && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Your referral promotion activity has been recorded.
          </div>
        )}
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-bold">How referral rewards work</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">
              1
            </span>
            <p className="mt-3 font-semibold">Share your referral</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Copy your personal Tripelor referral link or share it directly with
              friends through WhatsApp, social media, email, or messaging apps.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">
              2
            </span>
            <p className="mt-3 font-semibold">Your friend books</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Your friend starts their booking from your referral link or uses
              your referral code. They receive USD {discountUsd} off an eligible
              Tripelor booking.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">
              3
            </span>
            <p className="mt-3 font-semibold">They complete their stay</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              The referral remains pending until your referred guest successfully
              completes the eligible stay.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">
              4
            </span>
            <p className="mt-3 font-semibold">You earn Tripelor Points</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Once the stay is completed, {rewardPoints} Tripelor Points are
              awarded to you for the successful referral.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <p className="text-xs uppercase tracking-[.18em] text-gray-500">
            Your referral code
          </p>
          <p className="mt-2 text-3xl font-black tracking-[.16em] text-gold">
            {data.code}
          </p>
          <p className="mt-3 break-all text-xs text-gray-500">{link}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-64">
          <button onClick={copy} className="btn-outline gap-2">
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={share} className="btn-gold gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 p-4">
          <Users className="h-5 w-5 text-gold" />
          <p className="mt-2 text-xs text-gray-500">Friends pending</p>
          <p className="text-2xl font-bold">{pending}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-4">
          <Gift className="h-5 w-5 text-gold" />
          <p className="mt-2 text-xs text-gray-500">Rewards earned</p>
          <p className="text-2xl font-bold">{rewarded}</p>
        </div>

        <div className="rounded-2xl border border-white/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-gold" />
          <p className="mt-2 text-xs text-gray-500">
            Points per completed referral
          </p>
          <p className="mt-2 text-2xl font-bold text-gold">{rewardPoints}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[.06] p-4">
        <p className="text-sm font-semibold text-gold">Important to know</p>
        <p className="mt-2 text-xs leading-6 text-gray-400">
          For reliable referral tracking, ask your friend to begin their booking
          from your personal referral link or use your referral code. The USD{" "}
          {discountUsd} referral discount applies once per eligible booking.
          Tripelor Points are awarded only after the referred guest completes
          their stay. Promotion share activity is recorded only when you use the
          Tripelor Copy or Share buttons while signed in.
        </p>
      </div>
    </section>
  );
}
