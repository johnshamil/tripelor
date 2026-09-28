import crypto from "crypto";
import { requireUser } from "@/lib/auth-server";

const PROMOTION_END = new Date("2026-12-30T18:59:59.999Z");

function referralCodeFor(email: string) {
  return `TRP${crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex")
    .slice(0, 7)
    .toUpperCase()}`;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Referral service is not configured.");
  return { url, key };
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const email = String(user.email || "").trim().toLowerCase();
    if (!email) return Response.json({ error: "Your account email is required." }, { status: 400 });

    if (Date.now() > PROMOTION_END.getTime()) {
      return Response.json(
        { error: "The 2026 referral lucky draw has ended.", promotionEnded: true },
        { status: 410 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action === "share" ? "share" : body?.action === "copy" ? "copy" : "";
    if (!action) return Response.json({ error: "Invalid referral share action." }, { status: 400 });

    const channel = String(body?.channel || (action === "share" ? "native_share" : "copy_link"))
      .trim()
      .slice(0, 40) || "web";

    const code = referralCodeFor(email);
    const { url, key } = supabaseConfig();
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };

    const codeResponse = await fetch(
      `${url}/rest/v1/referral_codes?on_conflict=owner_email`,
      {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ code, owner_email: email }),
        cache: "no-store",
      },
    );

    if (!codeResponse.ok) {
      const details = await codeResponse.text();
      console.error("Unable to ensure referral code before tracking share", details);
      throw new Error("Unable to record your referral activity.");
    }

    const shareResponse = await fetch(`${url}/rest/v1/referral_share_events`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        user_id: user.id,
        owner_email: email,
        referral_code: code,
        action,
        channel,
      }),
      cache: "no-store",
    });

    if (!shareResponse.ok) {
      const details = await shareResponse.text();
      console.error("Unable to record referral share", details);
      throw new Error("Unable to record your referral activity.");
    }

    return Response.json({
      ok: true,
      code,
      promotionEndsAt: PROMOTION_END.toISOString(),
      message: "Your referral promotion activity has been recorded.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return Response.json({ error: "Please log in to join the referral promotion." }, { status: 401 });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to record referral activity." },
      { status: 500 },
    );
  }
}
