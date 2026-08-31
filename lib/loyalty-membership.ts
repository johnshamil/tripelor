export const POINTS_PER_NIGHT = 100;
export const POINTS_PER_REWARD_NIGHT = 2000;

export const MEMBERSHIP_TIERS = [
  {
    name: "Bronze",
    minimum: 0,
    benefits: ["Tripelor member dashboard", "Earn points on completed room nights"],
  },
  {
    name: "Silver",
    minimum: 2000,
    benefits: ["Reward-night eligibility", "Priority booking support"],
  },
  {
    name: "Gold",
    minimum: 5000,
    benefits: ["Priority concierge support", "Early access to selected packages"],
  },
  {
    name: "Black",
    minimum: 10000,
    benefits: ["Private trip-planning priority", "Signature member recognition"],
  },
] as const;

export function getMembership(lifetimePoints: number) {
  const lifetime = Math.max(0, Number(lifetimePoints) || 0);
  let index = 0;
  for (let i = MEMBERSHIP_TIERS.length - 1; i >= 0; i -= 1) {
    if (lifetime >= MEMBERSHIP_TIERS[i].minimum) {
      index = i;
      break;
    }
  }

  const current = MEMBERSHIP_TIERS[index];
  const next = MEMBERSHIP_TIERS[index + 1] || null;
  const range = next ? next.minimum - current.minimum : 0;
  const progress = next
    ? Math.max(0, Math.min(100, ((lifetime - current.minimum) / range) * 100))
    : 100;

  return {
    current,
    next,
    progress: Math.round(progress),
    pointsToNext: next ? Math.max(0, next.minimum - lifetime) : 0,
    tierIndex: index,
  };
}
