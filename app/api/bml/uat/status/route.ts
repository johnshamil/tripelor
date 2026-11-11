import { currentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only UAT status check. Never marks a booking paid. */
export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Please sign in to Tripelor first." }, { status: 401 });
    const tester = process.env.BML_UAT_TESTER_EMAIL;
    if (!tester || user.email?.toLowerCase() !== tester.toLowerCase()) {
      return Response.json({ error: "Only the authorized tester may check UAT payments." }, { status: 403 });
    }
    const apiKey = process.env.BML_UAT_API_KEY;
    if (!apiKey) return Response.json({ error: "BML UAT is not configured." }, { status: 503 });

    const id = new URL(request.url).searchParams.get("transactionId") || "";
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
      return Response.json({ error: "Missing or invalid BML transaction ID." }, { status: 400 });
    }

    // The BML official Connect PHP SDK reads the transaction status using
    // GET /public/transactions/{id}, authenticated with the merchant API key.
    const response = await fetch(`https://api.uat.merchants.bankofmaldives.com.mv/public/transactions/${encodeURIComponent(id)}`, {
      headers: { Authorization: apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return Response.json({ error: "BML could not verify this transaction." }, { status: 502 });
    const data: any = await response.json();
    const txn = data?.data && typeof data.data === "object" && !Array.isArray(data.data) ? data.data : data;
    const state = typeof txn?.state === "string" ? txn.state.toUpperCase() : "UNKNOWN";
    // Prevent status lookup for unrelated merchant transactions from being
    // confused with Tripelor's fixed-value UAT test.
    const isOurTest = typeof txn?.localId === "string" &&
      txn.localId.startsWith("TRP-UAT-") &&
      txn.currency === "MVR" &&
      Number(txn.amount) === 100;
    if (!isOurTest) {
      return Response.json({ error: "The transaction details do not match the Tripelor UAT test. No booking was changed." }, { status: 409 });
    }
    return Response.json({
      state,
      confirmed: state === "CONFIRMED",
      message: state === "CONFIRMED" ? "BML confirms the MVR 1.00 sandbox payment."
        : state === "UNKNOWN" ? "BML did not provide a recognizable transaction status."
        : "BML reports this transaction as " + state + ".",
      bookingUpdated: false,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to verify the BML transaction right now; do not treat it as paid." }, { status: 502 });
  }
}
