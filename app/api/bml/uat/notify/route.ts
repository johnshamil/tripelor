export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public BML UAT webhook relay (NOT a checkout).
 *
 * The BML webhook is registered at the permanent merchant domain, without
 * Vercel Preview bypass tokens in the registered URL. Only server-side code
 * forwards it to Tripelor's protected Preview handler, which verifies BML's
 * signature, rechecks the transaction with BML, and writes a deduplicated
 * record to Tripelor Staging. Never modifies production reservations.
 *
 * An invalid/unverified callback cannot be acknowledged as paid.
 */
const PREVIEW_RECEIVER =
  "https://tripelor-git-feature-bml-uat-checkout-saamils-projects-890c2cf6.vercel.app/api/bml/uat/webhook";

export function GET() {
  return Response.json(
    { service: "Tripelor BML webhook", environment: "uat", status: "reachable" },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request: Request) {
  try {
    const bypass = process.env.BML_UAT_PREVIEW_BYPASS;
    if (!bypass || !/^[A-Za-z0-9]{32}$/.test(bypass)) {
      return Response.json({ error: "UAT webhook relay not configured." }, { status: 503 });
    }
    if (!request.headers.get("content-type")?.includes("application/json") ||
        Number(request.headers.get("content-length") || 0) > 16000) {
      return Response.json({ error: "Invalid webhook payload." }, { status: 400 });
    }

    // The Preview endpoint verifies these BML-signed headers with the private
    // BML API key. This relay cannot and does not bypass that verification.
    const nonce = request.headers.get("x-signature-nonce") || "";
    const timestamp = request.headers.get("x-signature-timestamp") || "";
    const signature = request.headers.get("x-signature") || "";
    if (!nonce || nonce.length > 256 || !/^[0-9]{10}$/.test(timestamp) ||
        !/^[a-f0-9]{64}$/i.test(signature)) {
      return Response.json({ error: "Signed BML webhook required." }, { status: 403 });
    }
    const raw = await request.text();
    if (raw.length > 16000) return Response.json({ error: "Payload exceeds limit." }, { status: 413 });

    const forwarded = await fetch(PREVIEW_RECEIVER, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/json",
        "x-signature-nonce": nonce,
        "x-signature-timestamp": timestamp,
        "x-signature": signature,
        "x-vercel-protection-bypass": bypass,
      },
      body: raw,
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (forwarded.ok) return new Response(null, { status: 204 });
    // Do not expose provider responses or protected deployment data.
    if (forwarded.status === 401 || forwarded.status === 403) {
      return Response.json({ error: "Invalid or unauthorized UAT callback." }, { status: 403 });
    }
    if (forwarded.status === 409) {
      return Response.json({ error: "Not a matching UAT transaction." }, { status: 409 });
    }
    return Response.json({ error: "UAT callback delivery temporarily unavailable." }, { status: 503 });
  } catch {
    return Response.json({ error: "UAT callback relay unavailable." }, { status: 503 });
  }
}
