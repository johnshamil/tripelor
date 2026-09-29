import { isAdminEmail, requireUser } from "@/lib/auth-server";

const PROMOTION_END_ISO = "2026-12-30T18:59:59.999Z";

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin access is not configured.");
  return { url, key };
}

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) {
      return Response.json({ error: "Admin access required." }, { status: 403 });
    }

    const { url, key } = supabaseConfig();
    const headers = { apikey: key, Authorization: `Bearer ${key}` };

    const [eventsResponse, referralsResponse, usersResponse] = await Promise.all([
      fetch(
        `${url}/rest/v1/referral_share_events?select=user_id,owner_email,referral_code,action,channel,created_at&created_at=lte.${encodeURIComponent(PROMOTION_END_ISO)}&order=created_at.desc&limit=2000`,
        { headers, cache: "no-store" },
      ),
      fetch(
        `${url}/rest/v1/referrals?select=code,status,created_at,rewarded_at&order=created_at.desc&limit=2000`,
        { headers, cache: "no-store" },
      ),
      fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, {
        headers,
        cache: "no-store",
      }),
    ]);

    const [eventsText, referralsText, usersText] = await Promise.all([
      eventsResponse.text(),
      referralsResponse.text(),
      usersResponse.text(),
    ]);

    const events = eventsText ? JSON.parse(eventsText) : [];
    const referrals = referralsText ? JSON.parse(referralsText) : [];
    const usersData = usersText ? JSON.parse(usersText) : {};

    if (!eventsResponse.ok) throw new Error(events?.message || "Unable to load referral shares.");
    if (!referralsResponse.ok) throw new Error(referrals?.message || "Unable to load referral results.");
    if (!usersResponse.ok) throw new Error(usersData?.message || usersData?.msg || "Unable to load users.");

    const namesByEmail = new Map<string, string>();
    for (const account of usersData.users || []) {
      const email = String(account.email || "").trim().toLowerCase();
      if (!email) continue;
      namesByEmail.set(
        email,
        account.user_metadata?.full_name || account.user_metadata?.name || "",
      );
    }

    const referralStats = new Map<
      string,
      { rewarded: number; pending: number; qualified: number; cancelled: number }
    >();

    for (const referral of Array.isArray(referrals) ? referrals : []) {
      const code = String(referral.code || "");
      if (!code) continue;
      const stats = referralStats.get(code) || { rewarded: 0, pending: 0, qualified: 0, cancelled: 0 };
      const status = String(referral.status || "pending");
      if (status in stats) stats[status as keyof typeof stats] += 1;
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
        };
        return {
          ...participant,
          rewardedReferrals: stats.rewarded,
          pendingReferrals: stats.pending + stats.qualified,
          cancelledReferrals: stats.cancelled,
        };
      })
      .sort((a, b) => String(b.lastSharedAt).localeCompare(String(a.lastSharedAt)));

    return Response.json({
      promotion: {
        title: "Referral Lucky Draw 2026",
        prize: "3-night stay at Uhoo’s Lavish Oasis, V. Felidhoo with Half Board and a Thinadhoo day visit",
        endsAt: PROMOTION_END_ISO,
        totalParticipants: participants.length,
        totalShareActions: Array.isArray(events) ? events.length : 0,
      },
      participants,
    });
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
