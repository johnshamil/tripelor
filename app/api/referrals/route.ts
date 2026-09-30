import crypto from "crypto";
import { requireUser } from "@/lib/auth-server";
import {
  calculateReferralPromotionEntries,
  REFERRAL_PROMOTION,
  referralPromotionEnded,
} from "@/lib/referral-promotion";

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key || "",
  Authorization: `Bearer ${key || ""}`,
  "Content-Type": "application/json",
};

function codeFor(email: string) {
  return `TRP${crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 7)
    .toUpperCase()}`;
}

function maskEmail(value: string) {
  const email = value.trim().toLowerCase();
  const [name, domain] = email.split("@");
  if (!name || !domain) return "Referred friend";
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return `${visible}•••@${domain}`;
}

export async function GET(req: Request) {
  if (!url || !key) {
    return Response.json({ error: "Referral service not configured" }, { status: 500 });
  }

  let user;
  try {
    user = await requireUser();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }
    throw error;
  }

  const u = new URL(req.url);
  const email = (u.searchParams.get("email") || "").trim().toLowerCase();
  const signedInEmail = String(user.email || "").trim().toLowerCase();

  if (!email) return Response.json({ error: "Email required" }, { status: 400 });
  if (!signedInEmail || email !== signedInEmail) {
    return Response.json({ error: "You can only view your own referral activity." }, { status: 403 });
  }

  const code = codeFor(email);

  await fetch(`${url}/rest/v1/referral_codes?on_conflict=owner_email`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ code, owner_email: email }),
  });

  const [referralResponse, shareResponse, campaignShareResponse, campaignReferralResponse] =
    await Promise.all([
      fetch(
        `${url}/rest/v1/referrals?select=id,status,reward_points,discount_percent,referred_email,created_at,rewarded_at&code=eq.${encodeURIComponent(code)}&order=created_at.desc`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      ),
      fetch(
        `${url}/rest/v1/referral_share_events?select=id,action,channel,created_at&owner_email=eq.${encodeURIComponent(email)}&created_at=lte.${encodeURIComponent(REFERRAL_PROMOTION.endsAt)}&order=created_at.desc&limit=2000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      ),
      fetch(
        `${url}/rest/v1/referral_share_events?select=owner_email,referral_code,created_at&created_at=lte.${encodeURIComponent(REFERRAL_PROMOTION.endsAt)}&order=created_at.desc&limit=5000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      ),
      fetch(
        `${url}/rest/v1/referrals?select=code,status,referred_email,created_at,rewarded_at&order=created_at.desc&limit=5000`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
      ),
    ]);

  const refs = referralResponse.ok ? await referralResponse.json() : [];
  const shareEvents = shareResponse.ok ? await shareResponse.json() : [];
  const campaignShareEvents = campaignShareResponse.ok ? await campaignShareResponse.json() : [];
  const campaignReferrals = campaignReferralResponse.ok ? await campaignReferralResponse.json() : [];

  const eligibleReferrals = (Array.isArray(refs) ? refs : []).filter(
    (item: any) => String(item.status || "") !== "cancelled",
  );

  const referredFriends = new Map<string, any>();
  const completedFriends = new Map<string, any>();

  for (const item of eligibleReferrals) {
    const referredEmail = String(item.referred_email || "").trim().toLowerCase();
    if (!referredEmail) continue;

    const existing = referredFriends.get(referredEmail);
    if (!existing || String(item.created_at) < String(existing.created_at)) {
      referredFriends.set(referredEmail, item);
    }

    if (String(item.status || "") === "rewarded") {
      const completedExisting = completedFriends.get(referredEmail);
      const rewardedAt = item.rewarded_at || item.created_at;
      if (
        !completedExisting ||
        String(rewardedAt) < String(completedExisting.rewarded_at || completedExisting.created_at)
      ) {
        completedFriends.set(referredEmail, item);
      }
    }
  }

  const entryBreakdown = calculateReferralPromotionEntries({
    shareActions: Array.isArray(shareEvents) ? shareEvents.length : 0,
    referredBookings: referredFriends.size,
    completedReferrals: completedFriends.size,
  });

  const campaignParticipants = new Map<
    string,
    {
      referralCode: string;
      referredEmails: Set<string>;
      completedEmails: Set<string>;
    }
  >();

  for (const event of Array.isArray(campaignShareEvents) ? campaignShareEvents : []) {
    const ownerEmail = String(event.owner_email || "").trim().toLowerCase();
    const referralCode = String(event.referral_code || "").trim().toUpperCase();
    const participantKey = ownerEmail || referralCode;
    if (!participantKey) continue;

    if (!campaignParticipants.has(participantKey)) {
      campaignParticipants.set(participantKey, {
        referralCode,
        referredEmails: new Set<string>(),
        completedEmails: new Set<string>(),
      });
    }
  }

  const participantByCode = new Map<
    string,
    { referralCode: string; referredEmails: Set<string>; completedEmails: Set<string> }
  >();

  for (const participant of Array.from(campaignParticipants.values())) {
    if (participant.referralCode) participantByCode.set(participant.referralCode, participant);
  }

  for (const referral of Array.isArray(campaignReferrals) ? campaignReferrals : []) {
    const referralCode = String(referral.code || "").trim().toUpperCase();
    const participant = participantByCode.get(referralCode);
    if (!participant) continue;

    const referredEmail = String(referral.referred_email || "").trim().toLowerCase();
    const status = String(referral.status || "");
    if (!referredEmail || status === "cancelled") continue;

    participant.referredEmails.add(referredEmail);
    if (status === "rewarded") participant.completedEmails.add(referredEmail);
  }

  let campaignTotalEntries = 0;
  for (const participant of Array.from(campaignParticipants.values())) {
    const totals = calculateReferralPromotionEntries({
      shareActions: 1,
      referredBookings: participant.referredEmails.size,
      completedReferrals: participant.completedEmails.size,
    });
    campaignTotalEntries += totals.totalEntries;
  }

  const entryHistory: Array<{
    id: string;
    type: "share" | "booking" | "completed";
    title: string;
    detail: string;
    entries: number;
    at: string;
  }> = [];

  const sortedShares = [...(Array.isArray(shareEvents) ? shareEvents : [])].sort((a, b) =>
    String(a.created_at).localeCompare(String(b.created_at)),
  );

  const firstShare = sortedShares[0];
  if (firstShare) {
    entryHistory.push({
      id: `share-${firstShare.id || firstShare.created_at}`,
      type: "share",
      title: "Entered the Lucky Draw",
      detail:
        firstShare.channel === "whatsapp"
          ? "First referral share opened through WhatsApp."
          : firstShare.action === "copy"
            ? "First referral link copy recorded."
            : "First referral share recorded.",
      entries: 1,
      at: firstShare.created_at,
    });
  }

  Array.from(referredFriends.entries()).forEach(([friendEmail, item]) => {
    entryHistory.push({
      id: `booking-${item.id || friendEmail}`,
      type: "booking",
      title: "Referred friend booked",
      detail: `${maskEmail(friendEmail)} made an eligible Tripelor booking.`,
      entries: 3,
      at: item.created_at,
    });
  });

  Array.from(completedFriends.entries()).forEach(([friendEmail, item]) => {
    entryHistory.push({
      id: `completed-${item.id || friendEmail}`,
      type: "completed",
      title: "Referred stay completed",
      detail: `${maskEmail(friendEmail)} completed their eligible Tripelor stay.`,
      entries: 5,
      at: item.rewarded_at || item.created_at,
    });
  });

  entryHistory.sort((a, b) => String(b.at).localeCompare(String(a.at)));

  return Response.json({
    code,
    discountPercent: 20,
    rewardPoints: 100,
    referrals: refs,
    promotion: {
      ...REFERRAL_PROMOTION,
      ...entryBreakdown,
      shared: entryBreakdown.shareEntries > 0,
      qualified: Boolean(firstShare),
      qualifiedAt: firstShare?.created_at || null,
      participationStatus: firstShare ? "qualified" : "not_entered",
      shareActions: Array.isArray(shareEvents) ? shareEvents.length : 0,
      referredBookings: referredFriends.size,
      completedReferrals: completedFriends.size,
      campaignTotalEntries,
      campaignParticipants: campaignParticipants.size,
      entryHistory,
      ended: referralPromotionEnded(),
    },
  });
}

export async function POST(req: Request) {
  if (!url || !key) {
    return Response.json({ error: "Referral service not configured" }, { status: 500 });
  }

  const b = await req.json();
  const code = String(b.code || "").trim().toUpperCase();
  if (!code) {
    return Response.json({ valid: false, error: "Enter a referral code." }, { status: 400 });
  }

  const r = await fetch(
    `${url}/rest/v1/referral_codes?select=code,owner_email&code=eq.${encodeURIComponent(code)}&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    },
  );
  const rows = r.ok ? await r.json() : [];
  if (!rows.length) {
    return Response.json({ valid: false, error: "Referral code not found." }, { status: 404 });
  }

  return Response.json({ valid: true, code, discountPercent: 20, rewardPoints: 100 });
}
