"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Gift,
  Link2,
  MessageCircle,
  QrCode,
  Share2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

const PROMOTION_END_LABEL = "30 December 2026";

function formatHistoryDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-GB", {
      timeZone: "Indian/Maldives",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

export default function ReferralRewardsCard({ email }: { email: string }) {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [promotionRecorded, setPromotionRecorded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  async function refreshReferralData() {
    if (!email) return;
    const response = await fetch(`/api/referrals?email=${encodeURIComponent(email)}`, {
      cache: "no-store",
    });
    const result = await response.json();
    if (response.ok) setData(result);
  }

  useEffect(() => {
    refreshReferralData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const referralCode = data?.code || "";
  const link = referralCode
    ? `${
        typeof window !== "undefined" ? window.location.origin : "https://tripelor.com"
      }/booking?ref=${encodeURIComponent(referralCode)}`
    : "";

  useEffect(() => {
    if (!link) {
      setQrDataUrl("");
      return;
    }

    QRCode.toDataURL(link, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [link]);

  if (!data?.code) return null;

  const discountPercent = Number(data.discountPercent) || 20;
  const rewardPoints = Number(data.rewardPoints) || 100;
  const promotion = data.promotion || {};
  const totalEntries = Number(promotion.totalEntries || 0);
  const entryHistory = Array.isArray(promotion.entryHistory) ? promotion.entryHistory : [];
  const daysLeft = promotion.ended
    ? 0
    : Math.max(
        0,
        Math.ceil(
          (new Date(promotion.endsAt || "2026-12-30T18:59:59.999Z").getTime() - Date.now()) /
            86400000,
        ),
      );

  const rewarded = (data.referrals || []).filter(
    (item: any) => item.status === "rewarded",
  ).length;

  const pending = (data.referrals || []).filter(
    (item: any) => item.status !== "rewarded" && item.status !== "cancelled",
  ).length;

  async function recordPromotionAction(action: "share" | "copy", channel: string) {
    try {
      const response = await fetch("/api/referrals/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, channel }),
      });

      if (response.ok) {
        setPromotionRecorded(true);
        await refreshReferralData();
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
        title: "Tripelor Share & Win – Maldives Escape",
        text: `Planning a Maldives trip? Use my Tripelor referral link and save ${discountPercent}% on your first eligible booking.`,
        url: link,
      });
      await recordPromotionAction("share", "native_share");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  async function shareWhatsApp() {
    const message = [
      "Planning a Maldives escape? 🏝️",
      `Use my Tripelor referral link and save ${discountPercent}% on your first eligible booking.`,
      "",
      link,
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );

    await recordPromotionAction("share", "whatsapp");
  }

  return (
    <section
      id="referral-rewards"
      className="mt-8 scroll-mt-28 overflow-hidden rounded-[2rem] border border-gold/25 bg-gradient-to-br from-gold/[.10] via-black to-black p-6 md:p-8"
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[.28em] text-gold">Referral Rewards</p>
          <h2 className="mt-2 text-3xl font-bold">
            Your Friend Saves {discountPercent}%. You Earn {rewardPoints} Points.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">
            Invite your friends and family to discover the Maldives with Tripelor.
            When they make an eligible booking using your referral link or code,
            they receive {discountPercent}% off. After they complete their stay,
            you receive {rewardPoints} Tripelor Points.
          </p>
        </div>
        <Gift className="h-10 w-10 shrink-0 text-gold" />
      </div>

      <div className="mt-7 overflow-hidden rounded-3xl border border-gold/40 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.24),transparent_36%),linear-gradient(135deg,rgba(217,189,123,.14),rgba(255,255,255,.025))] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-gold">
                <Trophy className="h-3.5 w-3.5" />
                Tripelor Share & Win
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/60">
                <CalendarDays className="h-4 w-4 text-gold" />
                {promotion.ended
                  ? "Promotion closed"
                  : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
              </span>
            </div>

            <h3 className="mt-4 text-2xl font-bold md:text-3xl">
              Share your referral code for a chance to win a Maldives escape.
            </h3>
            <p className="mt-3 text-sm leading-7 text-gray-300">
              One lucky winner will receive a <strong>3-night stay at Uhoo’s Lavish Oasis,
              V. Felidhoo</strong> with <strong>Half Board meals</strong> and a
              <strong> day visit to Thinadhoo</strong>. Promotion ends on {PROMOTION_END_LABEL}.
            </p>

            <div
              className={`mt-5 flex items-center gap-3 rounded-2xl border p-4 ${
                promotion.qualified
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-white/10 bg-black/20"
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  promotion.qualified
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/5 text-gray-500"
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${
                    promotion.qualified ? "text-emerald-200" : "text-white"
                  }`}
                >
                  {promotion.qualified
                    ? "Qualified — You’re Participating"
                    : "Not yet qualified for the draw"}
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {promotion.qualified
                    ? `Your name is on the Qualified Participants list${
                        promotion.qualifiedAt
                          ? ` · joined ${formatHistoryDate(promotion.qualifiedAt)}`
                          : ""
                      }.`
                    : "Use Share, WhatsApp, or Copy Referral Link once and you will automatically join the qualified list."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] uppercase tracking-[.14em] text-gray-500">Your entries</p>
                <p className="mt-1 text-3xl font-black text-gold">{totalEntries}</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {promotion.shared ? "You’re in the draw." : "Share once to enter."}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] uppercase tracking-[.14em] text-gray-500">Referred friends</p>
                <p className="mt-1 text-3xl font-black text-white">{promotion.referredBookings || 0}</p>
                <p className="mt-1 text-[11px] text-gray-500">+3 entries each</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] uppercase tracking-[.14em] text-gray-500">Completed stays</p>
                <p className="mt-1 text-3xl font-black text-white">{promotion.completedReferrals || 0}</p>
                <p className="mt-1 text-[11px] text-gray-500">+5 bonus entries each</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-gray-400">
              <strong className="text-white">How Lucky Draw entries work:</strong> your first recorded
              Share or Copy action gives you 1 entry. Each unique referred friend with an eligible
              booking adds 3 entries, and each referred stay that is completed adds another 5 bonus
              entries. Repeatedly pressing Share or Copy does not create extra base entries.
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={shareWhatsApp}
                disabled={Boolean(promotion.ended)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 text-sm font-bold text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-4 w-4" />
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={share}
                disabled={Boolean(promotion.ended)}
                className="btn-gold min-h-[48px] justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                {promotion.shared ? "Share Again" : "Share & Enter Draw"}
              </button>
              <button
                type="button"
                onClick={copy}
                disabled={Boolean(promotion.ended)}
                className="btn-outline min-h-[48px] justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Link Copied" : "Copy Referral Link"}
              </button>
            </div>

            {promotionRecorded && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Qualified! Your name has been added to the Lucky Draw participant list.
              </div>
            )}
          </div>

          <div className="flex min-w-[210px] flex-col items-center justify-center rounded-2xl border border-gold/25 bg-black/30 p-5 text-center">
            <Trophy className="h-9 w-9 text-gold" />
            <p className="mt-3 text-xs uppercase tracking-[.16em] text-gray-500">Grand Prize</p>
            <p className="mt-1 text-xl font-black text-gold">3 Nights</p>
            <p className="mt-1 text-sm font-semibold text-white/90">Uhoo’s Lavish Oasis</p>
            <p className="mt-1 text-xs text-white/60">V. Felidhoo</p>
            <div className="mt-4 w-full border-t border-white/10 pt-4 text-sm font-semibold text-white/80">
              Half Board
              <span className="mx-2 text-gold">+</span>
              Thinadhoo Day Visit
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="overflow-hidden rounded-3xl border border-gold/30 bg-[radial-gradient(circle_at_top_left,rgba(217,189,123,.16),transparent_32%),rgba(255,255,255,.025)] p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                Your Personal Share Card
              </p>
              <h3 className="mt-1 text-xl font-bold">Share Maldives savings with your friends.</h3>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-gold/30 bg-gradient-to-br from-[#0b2731] via-[#071922] to-black p-5 shadow-[0_22px_60px_rgba(0,0,0,.35)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-gold">
                  Tripelor Share & Win
                </p>
                <p className="mt-3 text-2xl font-black leading-tight text-white">
                  Your Friend Saves {discountPercent}%
                </p>
                <p className="mt-1 text-sm font-semibold text-gold">
                  You earn {rewardPoints} Tripelor Points after their completed stay.
                </p>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[.05] p-3">
                  <p className="text-[9px] uppercase tracking-[.14em] text-white/40">Referral code</p>
                  <p className="mt-1 font-mono text-xl font-black tracking-[.12em] text-white">
                    {data.code}
                  </p>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/55">
                  Scan the QR code or use the referral link to book with Tripelor.
                </p>
              </div>

              <div className="mx-auto flex w-[170px] shrink-0 flex-col items-center rounded-2xl bg-white p-3 text-center text-black">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code for your Tripelor referral link"
                    className="h-[145px] w-[145px]"
                  />
                ) : (
                  <div className="flex h-[145px] w-[145px] items-center justify-center bg-gray-100">
                    <QrCode className="h-9 w-9 text-gray-400" />
                  </div>
                )}
                <p className="mt-2 text-[10px] font-black uppercase tracking-[.12em]">
                  Scan to save {discountPercent}%
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-gold">Win a Maldives Escape</p>
              <p className="mt-1 text-[11px] leading-5 text-white/55">
                3 nights at Uhoo’s Lavish Oasis, V. Felidhoo · Half Board · Thinadhoo Day Visit
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={shareWhatsApp}
              disabled={Boolean(promotion.ended)}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-bold text-black disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              Share Referral on WhatsApp
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={Boolean(promotion.ended)}
              className="btn-outline min-h-[46px] justify-center gap-2 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Copy Referral Link
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[.025] p-5 md:p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-gold" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-gold">
                My Entry History
              </p>
              <h3 className="mt-1 text-xl font-bold">{totalEntries} total entries</h3>
            </div>
          </div>

          {entryHistory.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-center">
              <Trophy className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-3 text-sm font-semibold">No entries yet</p>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Share your referral link once to receive your first Lucky Draw entry.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {entryHistory.map((item: any) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{item.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-black text-gold">
                      +{item.entries}
                    </span>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[.1em] text-gray-600">
                    {formatHistoryDate(item.at)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/[.06] p-4 text-xs leading-5 text-gray-400">
            <strong className="text-gold">Entry formula:</strong> 1 first-share entry + 3 per
            unique referred friend who books + 5 bonus entries when that friend completes their stay.
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-3xl border border-white/10 bg-white/[.03] p-5 md:p-6">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-gold" />
          <h3 className="text-lg font-bold">How referral rewards work</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">1</span>
            <p className="mt-3 font-semibold">Share your referral</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Send your personal Tripelor referral link to friends through WhatsApp,
              social media, email, or messaging apps.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">2</span>
            <p className="mt-3 font-semibold">Your friend books</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Your friend starts from your referral link or uses your referral code.
              They receive {discountPercent}% off an eligible Tripelor booking.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">3</span>
            <p className="mt-3 font-semibold">They complete their stay</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              The referral remains pending until your referred guest successfully
              completes the eligible stay.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-black text-black">4</span>
            <p className="mt-3 font-semibold">You earn Tripelor Points</p>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Once the stay is completed, {rewardPoints} Tripelor Points are awarded
              to you for the successful referral.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
        <p className="text-xs uppercase tracking-[.18em] text-gray-500">Your referral link</p>
        <p className="mt-2 font-mono text-xl font-black tracking-[.12em] text-gold">{data.code}</p>
        <p className="mt-3 break-all text-xs text-gray-500">{link}</p>
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
          <p className="mt-2 text-xs text-gray-500">Points per completed referral</p>
          <p className="mt-2 text-2xl font-bold text-gold">{rewardPoints}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-gold/20 bg-gold/[.06] p-4">
        <p className="text-sm font-semibold text-gold">Important to know</p>
        <p className="mt-2 text-xs leading-6 text-gray-400">
          For reliable referral tracking, ask your friend to begin their booking from
          your personal referral link or use your referral code. The {discountPercent}%
          referral discount applies once per eligible booking. Tripelor Points are
          awarded only after the referred guest completes their stay. Lucky Draw
          participation is recorded when you use the Tripelor Share, WhatsApp, or Copy
          buttons while signed in. Opening WhatsApp records the website share action;
          Tripelor cannot see what happens inside WhatsApp after it opens.
        </p>
      </div>
    </section>
  );
}
