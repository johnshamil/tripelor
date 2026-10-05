export const REFERRAL_PROMOTION = {
  slug: "share-and-win-2026",
  title: "Tripelor Share & Win – Maldives Escape",
  prize:
    "5-night stay at Uhoo’s Lavish Oasis, V. Felidhoo with Half Board meals and a day visit to Thinadhoo",
  endsAt: "2026-12-30T18:59:59.999Z",
  baseShareEntries: 1,
  referredBookingEntries: 3,
  completedStayBonusEntries: 5,
} as const;

export type ReferralPromotionStats = {
  shareActions: number;
  referredBookings: number;
  completedReferrals: number;
};

export function calculateReferralPromotionEntries(stats: ReferralPromotionStats) {
  if (stats.shareActions <= 0) {
    return {
      totalEntries: 0,
      shareEntries: 0,
      bookingEntries: 0,
      completedBonusEntries: 0,
    };
  }

  const shareEntries = REFERRAL_PROMOTION.baseShareEntries;
  const bookingEntries =
    Math.max(0, stats.referredBookings) * REFERRAL_PROMOTION.referredBookingEntries;
  const completedBonusEntries =
    Math.max(0, stats.completedReferrals) * REFERRAL_PROMOTION.completedStayBonusEntries;

  return {
    totalEntries: shareEntries + bookingEntries + completedBonusEntries,
    shareEntries,
    bookingEntries,
    completedBonusEntries,
  };
}

export function referralPromotionEnded(now = new Date()) {
  return now.getTime() > new Date(REFERRAL_PROMOTION.endsAt).getTime();
}
