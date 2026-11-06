import { currentUser } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tester-only read of server-verified BML notifications from Tripelor Staging.
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    const allowed = process.env.BML_UAT_TESTER_EMAIL;
    if (!user || !allowed || user.email?.toLowerCase() !== allowed.toLowerCase()) {
      return Response.json({ error: "UAT tester sign-in required" }, { status: 403 });
    }
    const transactionId = new URL(request.url).searchParams.get("transactionId") || "";
    if (!/^[A-Za-z0-9_-]{4,100}$/.test(transactionId)) {
      return Response.json({ error: "Invalid transaction ID" }, { status: 400 });
    }
    const url = process.env.BML_UAT_STAGING_URL?.replace(/\/$/, "");
    const key = process.env.BML_UAT_STAGING_SERVICE_ROLE_KEY;
    if (!url || !key || new URL(url).hostname !== "cxlidghyytyehhlhxvte.supabase.co") {
      return Response.json({ error: "Staging webhook storage not configured" }, { status: 503 });
    }
    const r = await fetch(
      `${url}/rest/v1/bml_uat_webhook_notifications?transaction_id=eq.${encodeURIComponent(transactionId)}&select=verified_state,received_at&order=received_at.desc&limit=10`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store",
        signal: AbortSignal.timeout(12000) }
    );
    if (!r.ok) return Response.json({ error: "Could not read webhook records" }, { status: 503 });
    const rows = await r.json() as Array<{ verified_state: string; received_at: string }>;
    return Response.json({
      received: rows.length > 0,
      confirmed: rows.some(row => row.verified_state === "CONFIRMED"),
      latestState: rows[0]?.verified_state || null,
      message: rows.length === 0
        ? "No signed webhook event has arrived for this transaction yet."
        : rows.some(row => row.verified_state === "CONFIRMED")
          ? "Verified BML CONFIRMED webhook recorded in Tripelor Staging."
          : "Signed webhook recorded; BML status is " + rows[0].verified_state,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to check BML webhook status" }, { status: 503 });
  }
}
