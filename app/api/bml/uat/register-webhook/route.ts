import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-time UAT registration of Tripelor's signed webhook URL with BML.
 * Registers the public Tripelor callback URL, which requires BML's signed
 * webhook headers. Only the authenticated UAT tester may invoke this action.
 * No real payments or booking updates are enabled here.
 */
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const tester = process.env.BML_UAT_TESTER_EMAIL;
    if (!user || !tester || user.email?.toLowerCase() !== tester.toLowerCase()) {
      return Response.json({ error: "Authorized Tripelor UAT sign-in required." }, { status: 403 });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }
    const apiKey = process.env.BML_UAT_API_KEY;
    const hook = "https://www.tripelor.com/api/bml/uat/notify";
    if (!apiKey) {
      return Response.json({ error: "BML UAT webhook configuration missing." }, { status: 503 });
    }
    let parsed: URL;
    try { parsed = new URL(hook); }
    catch { return Response.json({ error: "Invalid UAT webhook URL configuration." }, { status: 503 }); }
    if (parsed.protocol !== "https:" ||
        parsed.hostname !== "www.tripelor.com" ||
        parsed.pathname !== "/api/bml/uat/notify" || parsed.search) {
      return Response.json({ error: "Unsafe UAT callback URL configuration." }, { status: 503 });
    }

    // Diagnose public reachability before asking BML to validate the URL.
    // A harmless unsigned UAT registration probe MUST receive HTTP 200.
    // No secrets, transaction data, or callback body are sent.
    let endpointStatus: number;
    try {
      const probe = await fetch(hook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Originator": "Tripelor-UAT-registration-check",
        },
        body: "{}",
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      endpointStatus = probe.status;
    } catch {
      return Response.json({
        registered: false,
        error: "Tripelor callback URL is not reachable from the server. Registration was not attempted.",
        endpointStatus: null,
      }, { status: 503 });
    }
    if (endpointStatus !== 200) {
      return Response.json({
        registered: false,
        error: "Tripelor's public callback must return HTTP 200 to BML's unsigned registration probe. Registration was not attempted.",
        endpointStatus,
      }, { status: 503 });
    }

    // BML Connect API: register callback once, independent of the customer's
    // browser redirect. Never return the URL or provider response unchanged.
    const response = await fetch(
      "https://api.uat.merchants.bankofmaldives.com.mv/public/webhooks",
      {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ hookUrl: hook }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      // Return only a strict, safely filtered BML error category. Never echo
      // the provider's raw response; it may include tokens, merchant details,
      // or the callback URL. The tester can share this diagnostic safely.
      let reason: string | null = null;
      try {
        const raw = (await response.text()).slice(0, 4000);
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const fields = [parsed.code, parsed.errorCode, parsed.error, parsed.message];
        for (const field of fields) {
          if (typeof field !== "string") continue;
          const value = field.trim();
          if (value.length >= 3 && value.length <= 180 &&
              /^[A-Za-z0-9 _.,:;()\-]+$/.test(value) &&
              !/(secret|key|token|password|authorization|credential|signature|https?|bypass|bearer)/i.test(value)) {
            reason = value;
            break;
          }
        }
      } catch {
        // Non-JSON/unsafe upstream data must not be shown.
      }
      return Response.json({
        registered: false,
        error: response.status === 409
          ? "BML reports a registration conflict. Check whether this webhook already exists."
          : "BML rejected the webhook registration.",
        providerStatus: response.status,
        providerReason: reason,
      }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({
      registered: true,
      message: "BML accepted the UAT webhook registration request. A new test payment is needed to verify actual delivery.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "BML UAT webhook registration could not be completed." }, { status: 502 });
  }
}
