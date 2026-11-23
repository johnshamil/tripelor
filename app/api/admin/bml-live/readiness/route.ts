import { currentUser, isAdminEmail } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only BML live cutover readiness snapshot.
 *
 * This endpoint MUST NEVER start a transaction, return credentials, or mark a
 * booking paid. Production checkout is deliberately not wired up yet.
 * A passing credential-presence check does not imply payment readiness.
 */
export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Sign in required." }, { status: 401, headers });
    if (!isAdminEmail(user.email)) return Response.json({ error: "Admin access required." }, { status: 403, headers });

    const liveEnabled = process.env.BML_LIVE_PAYMENTS_ENABLED === "true";
    const credentialsPresent = Boolean(
      process.env.BML_LIVE_API_KEY && process.env.BML_LIVE_APPLICATION_ID
    );

    // Do not change these to true until tested production implementations exist.
    const bookingLedgerReady = false;
    const signedWebhookReady = false;
    const bankVerifiedSettlementReady = false;
    const liveTestPassed = false;

    const blockers = [
      ...(!credentialsPresent ? ["Rotated BML production credentials have not been installed."] : []),
      ...(!bookingLedgerReady ? ["No durable, approved-price booking payment ledger is deployed."] : []),
      ...(!signedWebhookReady ? ["Production signed webhook verification is not deployed."] : []),
      ...(!bankVerifiedSettlementReady ? ["Bank-verified payment reconciliation is not deployed."] : []),
      ...(!liveTestPassed ? ["A controlled production payment test has not been verified."] : []),
      ...(!liveEnabled ? ["The production payment switch is disabled."] : []),
    ];

    return Response.json({
      environment: "production",
      paymentsEnabled: liveEnabled,
      credentialsPresent,
      ready: blockers.length === 0,
      blockers,
    }, { headers });
  } catch {
    return Response.json({ error: "Unable to verify live payment readiness." }, { status: 503, headers });
  }
}
