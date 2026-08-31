"use client";

import Link from "next/link";
import {Award, Check, Crown, Gem, Gift, ShieldCheck, Sparkles, Star, TrendingUp} from "lucide-react";
import {getMembership, MEMBERSHIP_TIERS, POINTS_PER_REWARD_NIGHT} from "@/lib/loyalty-membership";

type LoyaltyTransaction = {
  created_at?: string;
  description?: string;
  id: string;
  points: number;
};

export default function Rewards2Card({
  user,
  loyalty,
}: {
  user: {fullName?: string; email: string};
  loyalty: any;
}) {
  const points = Number(loyalty?.account?.points_balance || 0);
  const lifetime = Number(loyalty?.account?.lifetime_points || points);
  const transactions: LoyaltyTransaction[] = Array.isArray(loyalty?.transactions) ? loyalty.transactions : [];
  const membership = loyalty?.membership || getMembership(lifetime);
  const tier = membership.current;
  const next = membership.next;
  const progress = Number(membership.progress || 0);
  const pointsToNext = Number(membership.pointsToNext || 0);
  const tierIndex = Number(membership.tierIndex || 0);
  const rewardNights = Math.floor(points / POINTS_PER_REWARD_NIGHT);
  const pointsToReward = points >= POINTS_PER_REWARD_NIGHT ? 0 : POINTS_PER_REWARD_NIGHT - points;

  return (
    <section className="mt-8 space-y-5" aria-labelledby="tripelor-privilege-title">
      <div className="membership-card relative overflow-hidden rounded-[2rem] border border-gold/35 p-6 md:p-9">
        <div className="membership-glow" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-5 lg:block">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.32em] text-[#e3ca91]">
                  <Sparkles className="h-4 w-4" /> Tripelor Privilege
                </p>
                <h2 id="tripelor-privilege-title" className="font-display mt-3 text-3xl text-white md:text-5xl">
                  {user.fullName || "Tripelor Member"}
                </h2>
                <p className="mt-2 text-xs text-white/45">{user.email}</p>
              </div>
              <div className="tier-seal mt-0 lg:mt-7">
                {tier.name === "Black" ? <Gem className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
                <span>{tier.name} Member</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-end gap-x-4 gap-y-2">
              <strong className="font-display text-6xl font-normal leading-none text-[#e3ca91] md:text-7xl">
                {points.toLocaleString("en-US")}
              </strong>
              <div className="pb-1">
                <p className="text-sm font-semibold uppercase tracking-[.18em] text-white">Tripelor Points</p>
                <p className="mt-1 text-xs text-white/45">{lifetime.toLocaleString("en-US")} lifetime points</p>
              </div>
            </div>
          </div>

          <div className="tier-progress-ring" style={{"--tier-progress": `${progress * 3.6}deg`} as React.CSSProperties}>
            <div>
              {next ? (
                <>
                  <strong>{pointsToNext.toLocaleString("en-US")}</strong>
                  <span>points to {next.name}</span>
                </>
              ) : (
                <>
                  <Crown className="mx-auto h-7 w-7 text-[#e3ca91]" />
                  <span>Highest tier</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-9">
          <div className="h-px bg-gradient-to-r from-[#e3ca91] via-[#e3ca91]/40 to-white/10">
            <div className="h-px bg-[#e3ca91]" style={{width: `${progress}%`}} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {MEMBERSHIP_TIERS.map((item, index) => {
              const reached = index <= tierIndex;
              const current = index === tierIndex;
              return (
                <div key={item.name} className={`text-center ${current ? "text-[#e3ca91]" : reached ? "text-white/75" : "text-white/30"}`}>
                  <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-[10px] ${current ? "border-[#e3ca91] bg-[#e3ca91] text-[#071922]" : reached ? "border-white/35 bg-white/10" : "border-white/15"}`}>
                    {reached ? <Check className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <p className="mt-2 text-[9px] font-semibold uppercase tracking-[.13em] md:text-[10px]">{item.name}</p>
                  <p className="mt-1 text-[9px] text-white/35">{item.minimum.toLocaleString("en-US")} pts</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_1.15fr]">
        <article className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-gold">
            <ShieldCheck className="h-5 w-5" />
            <h3 className="font-semibold">{tier.name} benefits</h3>
          </div>
          <div className="mt-5 space-y-3">
            {tier.benefits.map((benefit: string) => (
              <div key={benefit} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                  <Check className="h-3 w-3" />
                </span>
                {benefit}
              </div>
            ))}
          </div>
          {next && (
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-gray-500">
              Reach {next.minimum.toLocaleString("en-US")} lifetime points to unlock {next.name}.
            </p>
          )}
        </article>

        <article className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-gold">
            <Gift className="h-5 w-5" />
            <h3 className="font-semibold">Available rewards</h3>
          </div>
          {rewardNights > 0 ? (
            <>
              <p className="font-display mt-5 text-4xl text-white">
                {rewardNights} reward night{rewardNights > 1 ? "s" : ""}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Redeem {POINTS_PER_REWARD_NIGHT.toLocaleString("en-US")} available points for one night, subject to availability.
              </p>
              <a href="https://wa.me/9609429403?text=Hello%20Tripelor%2C%20I%20would%20like%20to%20redeem%20my%20Tripelor%20Points." className="btn-gold mt-5 w-full">
                Redeem Points
              </a>
            </>
          ) : (
            <>
              <p className="font-display mt-5 text-3xl text-white">{pointsToReward.toLocaleString("en-US")} points to a reward night</p>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Every completed eligible room night brings you closer to your next Maldives escape.
              </p>
              <Link href="/booking" className="btn-outline mt-5 w-full">Book & Earn</Link>
            </>
          )}
        </article>

        <article className="card p-5 md:p-6">
          <div className="flex items-center gap-2 text-gold">
            <TrendingUp className="h-5 w-5" />
            <h3 className="font-semibold">How points work</h3>
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Completed room nights</span>
              <strong className="text-gold">100 pts/night</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Completed referral</span>
              <strong className="text-gold">100 pts</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Tier calculation</span>
              <strong className="text-white/70">Lifetime points</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-300">Reward balance</span>
              <strong className="text-white/70">Available points</strong>
            </div>
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-gray-500">
            Redeeming points reduces your available balance, but never lowers your membership tier.
          </p>
        </article>
      </div>

      <article className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" />
            <h3 className="font-semibold">Recent points activity</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="h-3.5 w-3.5" /> {lifetime.toLocaleString("en-US")} lifetime
          </div>
        </div>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No points activity yet. Complete your first eligible stay to start earning.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {transactions.slice(0, 6).map(transaction => (
              <div key={transaction.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[.025] p-4">
                <div>
                  <p className="text-sm font-medium">{transaction.description || "Tripelor Points activity"}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString("en-GB") : ""}
                  </p>
                </div>
                <strong className={Number(transaction.points) >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {Number(transaction.points) >= 0 ? "+" : ""}{Number(transaction.points)} pts
                </strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
