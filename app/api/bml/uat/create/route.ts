import { createHash, randomUUID } from "node:crypto";
import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** UAT integration smoke test only. It does not create or confirm a Tripelor booking. */
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ error: "Please sign in to Tripelor on this Preview website before testing." }, { status: 401 });
    }
    if (!process.env.BML_UAT_TESTER_EMAIL || user.email?.toLowerCase() !== process.env.BML_UAT_TESTER_EMAIL.toLowerCase()) {
      return Response.json({ error: "Use the authorized Tripelor tester account to continue." }, { status: 403 });
    }
    const origin = new URL(request.url).origin;
    if (request.headers.get("origin") !== origin) {
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    }
    // BML requires affirmative acceptance of disclosures before the hosted card page.
    // This is a fixed-price UAT demonstration; production will also need a durable
    // acceptance record linked to the real booking and payment intent.
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Invalid payment request." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 1024) {
      return Response.json({ error: "Payment request too large." }, { status: 413 });
    }
    const rawBody = await request.text();
    if (rawBody.length > 1024) {
      return Response.json({ error: "Payment request too large." }, { status: 413 });
    }
    let consent: any;
    try { consent = JSON.parse(rawBody); } catch {
      return Response.json({ error: "Invalid consent payload." }, { status: 400 });
    }
    if (consent?.acceptedTerms !== true || consent?.acceptedTermsVersion !== "tripelor-bml-uat-2026-11-05") {
      return Response.json({ error: "You must accept the purchase terms and disclosures before payment." }, { status: 400 });
    }

    const apiKey = process.env.BML_UAT_API_KEY;
    const appId = process.env.BML_UAT_APPLICATION_ID;
    if (!apiKey || !appId) return Response.json({ error: "BML UAT configuration missing." }, { status: 503 });

    // BML's official PHP SDK signs amount/currency/apiKey and adds these API fields.
    // Amount uses minor units: MVR 1.00 = 100 laari. Never accept amounts from the client.
    const amount = 100;
    const currency = "MVR";
    const signature = createHash("sha1").update(`amount=${amount}&currency=${currency}&apiKey=${apiKey}`).digest("hex");
    const localId = `TRP-UAT-${randomUUID()}`;
    // The registered webhook receives primary transaction state notifications.
    // Do not derive this URL from the browser Host header, and never expose
    // any webhook bypass secret to the client.
    const hook = process.env.BML_UAT_WEBHOOK_URL || "";
    if (hook) {
      const parsed = new URL(hook);
      if (parsed.protocol !== "https:" || parsed.pathname !== "/api/bml/uat/webhook" ||
          !(parsed.hostname.endsWith(".vercel.app") || parsed.hostname.endsWith(".tripelor.com"))) {
        return Response.json({ error: "Invalid BML UAT webhook configuration." }, { status: 503 });
      }
    }
    const response = await fetch("https://api.uat.merchants.bankofmaldives.com.mv/public/transactions", {
      method: "POST",
      headers: { Authorization: apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        amount, currency, localId, signature, apiVersion: "2.0",
        appVersion: "tripelor-nextjs-uat", signMethod: "sha1",
        redirectUrl: `${origin}/bml-uat-test?returned=1`,
        ...(hook ? { webhook: hook } : {})
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    const raw = await response.text();
    let result: Record<string, any> = {};
    try { result = JSON.parse(raw); } catch { /* Do not expose raw provider diagnostics. */ }
    if (!response.ok || result.error || result.success === false) {
      return Response.json({ error: "BML rejected the test transaction. Verify your UAT configuration and app permissions." }, { status: 502 });
    }
    // Only BML's fixed UAT host may be returned as a payment redirect.
    const possible = [result.url, result.redirectUrl, result.paymentUrl, result.data?.url, result.data?.redirectUrl, result.data?.paymentUrl];
    let checkoutUrl: string | null = null;
    for (const value of possible) {
      if (typeof value !== "string") continue;
      try {
        const parsed = new URL(value);
        if (parsed.protocol === "https:" && parsed.hostname.endsWith(".bankofmaldives.com.mv")) { checkoutUrl = parsed.href; break; }
      } catch { /* skip */ }
    }
    if (!checkoutUrl) return Response.json({ error: "BML returned a transaction, but the redirect field needs verification against their current API documentation. No booking was changed." }, { status: 502 });
    return Response.json({ checkoutUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "BML UAT connection could not be completed. No booking was changed." }, { status: 502 });
  }
}
