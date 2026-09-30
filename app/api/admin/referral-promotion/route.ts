import crypto from "crypto";
import { isAdminEmail, requireUser } from "@/lib/auth-server";
import {
  calculateReferralPromotionEntries,
  REFERRAL_PROMOTION,
  referralPromotionEnded,
} from "@/lib/referral-promotion";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin access is not configured.");
  return { url, key };
}

async function loadPromotionData(\n  { requireReferralStats = false }: { requireReferralStats?: boolean } = {},\n) {
  const { url, key } = supabaseConfig();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const [eventsResponse, referralsResponse, usersResponse, winnerResponse] = await Promise.all([
    fetch(
      `${url}/rest/v1/referral_share_events?select=user_id,owner_email,referral_code,action,channel,created_at&created_at=lte.${encodeURIComponent(REFERRAL_PROMOTION.endsAt)}&order=created_at.desc&limit=5000`,
      { headers, cache: "no-store" },
    ),
    fetch(
      `${url}/rest/v1/referrals?select=code,status,referred_email,created_at,rewarded_at&order=created_at.desc&limit=5000`,
      { headers, cache: "no-store" },
    ),
    fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, {
      headers,
      cache: "no-store",
    }),
    fetch(
      `${url}/rest/v1/referral_promotion_winners?select=*&campaign_slug=eq.${encodeURIComponent(REFERRAL_PROMOTION.slug)}&limit=1`,
      { headers, cache: "no-store" },
    ),
  ]);

  const [eventsText, referralsText, usersText, winnerText] = await Promise.all([
    eventsResponse.text(),
    referralsResponse.text(),
    usersResponse.text(),
    winnerResponse.text(),
  ]);

  const events = eventsText ? JSON.parse(eventsText) : [];
  const referrals = referralsText ? JSON.parse(referralsText) : [];
  const usersData = usersText ? JSON.parse(usersText) : {};
  const winnerRows = winnerText ? JSON.parse(winnerText) : [];

  if (!eventsResponse.ok) throw new Error(events?.message || "Unable to load referral shares.");
  if (!referralsResponse.ok && requireReferralStats) {\n    throw new Error(referrals?.message || "Unable to load referral results.");\n  }
  // User names are optional enrichment. Share events are the source of truth for qualification.
  if (!winnerResponse.ok) {
    throw new Error(winnerRows?.message || "Unable to load referral winner.");
  }

  const namesByEmail = new Map<string, string>();
  for (const account of usersResponse.ok && Array.isArray(usersData?.users) ? usersData.users : []) {
    const email = String(account.email || "").trim().toLowerCase();
    if (!email) continue;
    namesByEmail.set(
      email,
      account.user_metadata?.full_name || account.user_metadata?.name || "",
    );
  }

  const referralStats = new Map<
    string,
    {
      rewarded: number;
      pending: number;
      qualified: number;
      cancelled: number;
      eligibleEmails: Set<string>;
      rewardedEmails: Set<string>;
    }
  >();

  for (const referral of Array.isArray(referrals) ? referrals : []) {
    const code = String(referral.code || "");
    if (!code) continue;

    const stats =
      referralStats.get(code) || {
        rewarded: 0,
        pending: 0,
        qualified: 0,
        cancelled: 0,
        eligibleEmails: new Set<string>(),
        rewardedEmails: new Set<string>(),
      };

    const status = String(referral.status || "pending");
    if (status === "rewarded") stats.rewarded += 1;
    else if (status === "qualified") stats.qualified += 1;
    else if (status === "cancelled") stats.cancelled += 1;
    else stats.pending += 1;

    const referredEmail = String(referral.referred_email || "").trim().toLowerCase();
    if (referredEmail && status !== "cancelled") stats.eligibleEmails.add(referredEmail);
    if (referredEmail && status === "rewarded") stats.rewardedEmails.add(referredEmail);

    referralStats.set(code, stats);
  }

  const byUser = new Map<string, any>();

  for (const event of Array.isArray(events) ? events : []) {
    const email = String(event.owner_email || "").trim().toLowerCase();
    const keyId = String(event.user_id || email);
    if (!keyId) continue;

    const existing = byUser.get(keyId) || {
      userId: event.user_id,
      email,
      fullName: namesByEmail.get(email) || "",
      referralCode: event.referral_code || "",
      qualificationStatus: "qualified",
      qualifiedAt: event.created_at,
      shareCount: 0,
      nativeShares: 0,
      linkCopies: 0,
      firstSharedAt: event.created_at,
      lastSharedAt: event.created_at,
    };

    existing.shareCount += 1;
    if (event.action === "share") existing.nativeShares += 1;
    if (event.action === "copy") existing.linkCopies += 1;

    if (String(event.created_at) < String(existing.firstSharedAt)) {
      existing.firstSharedAt = event.created_at;
      existing.qualifiedAt = event.created_at;
    }
    if (String(event.created_at) > String(existing.lastSharedAt)) {
      existing.lastSharedAt = event.created_at;
    }

    byUser.set(keyId, existing);
  }

  const participants = Array.from(byUser.values())
    .map((participant) => {
      const stats = referralStats.get(participant.referralCode) || {
        rewarded: 0,
        pending: 0,
        qualified: 0,
        cancelled: 0,
        eligibleEmails: new Set<string>(),
        rewardedEmails: new Set<string>(),
      };

      const referredBookings = stats.eligibleEmails.size;
      const completedReferrals = stats.rewardedEmails.size;
      const entries = calculateReferralPromotionEntries({
        shareActions: participant.shareCount,
        referredBookings,
        completedReferrals,
      });

      return {
        ...participant,
        rewardedReferrals: completedReferrals,
        pendingReferrals: Math.max(0, referredBookings - completedReferrals),
        cancelledReferrals: stats.cancelled,
        referredBookings,
        ...entries,
      };
    })
    .sort((a, b) => {
      if (b.totalEntries !== a.totalEntries) return b.totalEntries - a.totalEntries;
      return String(b.lastSharedAt).localeCompare(String(a.lastSharedAt));
    });

  const winnerRow = Array.isArray(winnerRows) ? winnerRows[0] : null;
  const winner = winnerRow
    ? {
        id: winnerRow.id,
        email: winnerRow.owner_email,
        fullName: namesByEmail.get(String(winnerRow.owner_email || "").toLowerCase()) || "",
        referralCode: winnerRow.referral_code,
        entriesAtSelection: winnerRow.entries_at_selection,
        selectedAt: winnerRow.selected_at,
        selectedBy: winnerRow.selected_by,
      }
    : null;

  const totalEntries = participants.reduce(
    (sum, participant) => sum + Number(participant.totalEntries || 0),
    0,
  );

  return {
    promotion: {
      ...REFERRAL_PROMOTION,
      ended: referralPromotionEnded(),
      totalParticipants: participants.length,
      totalShareActions: Array.isArray(events) ? events.length : 0,
      totalEntries,
    },
    participants,
    winner,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    return Response.json(await loadPromotionData());
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load referral promotion." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    if (!referralPromotionEnded()) {
      return Response.json(
        { error: "The winner can be selected only after the promotion closes on 30 December 2026." },
        { status: 409 },
      );
    }

    const current = await loadPromotionData({ requireReferralStats: true });
    if (current.winner) {
      return Response.json(
        { error: "A winner has already been selected for this promotion.", winner: current.winner },
        { status: 409 },
      );
    }

    const eligible = current.participants.filter(
      (participant: any) => Number(participant.totalEntries || 0) > 0,
    );
    const totalEntries = eligible.reduce(
      (sum: number, participant: any) => sum + Number(participant.totalEntries || 0),
      0,
    );

    if (!eligible.length || totalEntries <= 0) {
      return Response.json({ error: "There are no eligible entries to draw from." }, { status: 400 });
    }

    const winningIndex = crypto.randomInt(totalEntries);
    let cursor = 0;
    let selected = eligible[0];

    for (const participant of eligible) {
      cursor += Number(participant.totalEntries || 0);
      if (winningIndex < cursor) {
        selected = participant;
        break;
      }
    }

    const { url, key } = supabaseConfig();
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };

    const insertResponse = await fetch(`${url}/rest/v1/referral_promotion_winners`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        campaign_slug: REFERRAL_PROMOTION.slug,
        winner_user_id: selected.userId || null,
        owner_email: selected.email,
        referral_code: selected.referralCode,
        entries_at_selection: selected.totalEntries,
        selected_by: String(user.email || ""),
        selection_snapshot: {
          participant_count: eligible.length,
          total_entries: totalEntries,
          winning_index: winningIndex,
          rules: {
            base_share_entries: REFERRAL_PROMOTION.baseShareEntries,
            referred_booking_entries: REFERRAL_PROMOTION.referredBookingEntries,
            completed_stay_bonus_entries: REFERRAL_PROMOTION.completedStayBonusEntries,
          },
        },
      }),
      cache: "no-store",
    });

    const insertText = await insertResponse.text();
    const inserted = insertText ? JSON.parse(insertText) : [];

    if (!insertResponse.ok) {
      throw new Error(inserted?.message || "Unable to save the selected winner.");
    }

    return Response.json({
      success: true,
      winner: {
        email: selected.email,
        fullName: selected.fullName,
        referralCode: selected.referralCode,
        entriesAtSelection: selected.totalEntries,
        selectedAt: inserted?.[0]?.selected_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in." }, { status: 401 });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to select referral winner." },
      { status: 500 },
    );
  }
}
