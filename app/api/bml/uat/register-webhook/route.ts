import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-time UAT registration of Tripelor's signed webhook URL with BML.
 * Never returns the callback URL, which embeds a temporary Vercel
 * deployment-protection bypass token. Admin/tester access only.
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
    const hook = process.env.BML_UAT_WEBHOOK_URL;
    if (!apiKey || !hook) {
      return Response.json({ error: "BML UAT webhook configuration missing." }, { status: 503 });
    }
    let parsed: URL;
    try { parsed = new URL(hook); }
    catch { return Response.json({ error: "Invalid UAT webhook URL configuration." }, { status: 503 }); }
    if (parsed.protocol !== "https:" ||
        parsed.hostname !== "tripelor-git-feature-bml-uat-checkout-saamils-projects-890c2cf6.vercel.app" ||
        parsed.pathname !== "/api/bml/uat/webhook" ||
        !parsed.searchParams.has("x-vercel-protection-bypass")) {
      return Response.json({ error: "Unsafe UAT callback URL configuration." }, { status: 503 });
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
      // No raw error: some provider errors echo request URL/secret.
      return Response.json({
        registered: false,
        error: response.status === 409
          ? "The webhook may already be registered. Check BML UAT webhook settings."
          : "BML did not accept webhook registration. Contact BML support with the HTTP status code.",
        providerStatus: response.status,
      }, { status: 502 });
    }
    return Response.json({
      registered: true,
      message: "BML accepted the UAT webhook registration request. A new test payment is needed to verify actual delivery.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "BML UAT webhook registration could not be completed." }, { status: 502 });
  }
}
