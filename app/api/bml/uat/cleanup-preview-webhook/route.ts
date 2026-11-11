import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Explicit opt-in cleanup for the old protected Vercel Preview webhook.
 * The public www.tripelor.com webhook stays registered.
 */
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const tester = process.env.BML_UAT_TESTER_EMAIL;
    if (!user || !tester || user.email?.toLowerCase() !== tester.toLowerCase()) {
      return Response.json({ error: "Authorized UAT tester required." }, { status: 403 });
    }
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    }
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "JSON required." }, { status: 415 });
    }
    const input = await request.json();
    if (input?.confirm !== "REMOVE_OLD_PREVIEW_WEBHOOK") {
      return Response.json({ error: "Explicit confirmation required." }, { status: 400 });
    }
    const apiKey = process.env.BML_UAT_API_KEY;
    const hook = process.env.BML_UAT_WEBHOOK_URL;
    if (!apiKey || !hook) return Response.json({ error: "Old UAT webhook settings unavailable." }, { status: 503 });
    const parsed = new URL(hook);
    if (parsed.protocol !== "https:" ||
        parsed.hostname !== "tripelor-git-feature-bml-uat-checkout-saamils-projects-890c2cf6.vercel.app" ||
        parsed.pathname !== "/api/bml/uat/webhook" ||
        !parsed.searchParams.has("x-vercel-protection-bypass")) {
      return Response.json({ error: "Old webhook URL verification failed; no deletion requested." }, { status: 409 });
    }
    const result = await fetch("https://api.uat.merchants.bankofmaldives.com.mv/public/webhooks", {
      method: "DELETE",
      headers: { Authorization: apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ hookUrl: hook }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!result.ok) return Response.json({
      removed: false, bankStatus: result.status,
      error: "BML did not confirm removal of the old Preview registration. The public webhook was not changed."
    }, { status: 502 });
    return Response.json({ removed: true, message: "BML accepted removal of the old protected Preview webhook registration. The public Tripelor callback remains registered." });
  } catch {
    return Response.json({ error: "Could not remove old Preview registration; public webhook remains unchanged." }, { status: 502 });
  }
}
