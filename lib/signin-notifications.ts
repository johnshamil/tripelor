import { createHash } from "node:crypto";
import { isAdminEmail } from "@/lib/auth-server";

type SignedInCustomer = {
  id?: string;
  email?: string;
  last_sign_in_at?: string;
  user_metadata?: { full_name?: unknown; name?: unknown };
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Called only with Supabase's user after a successful session has been created.
// Email outages must never turn a successful customer login into an error.
export async function notifyCustomerSignIn(
  user: SignedInCustomer | null | undefined,
  event: "sign_in" | "new_account" = "sign_in",
): Promise<void> {
  try {
    if (!user?.id || !user.email || isAdminEmail(user.email)) return;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("Tripelor sign-in notification skipped: RESEND_API_KEY is not configured.");
      return;
    }

    const rawName = user.user_metadata?.full_name || user.user_metadata?.name;
    const name = typeof rawName === "string"
      ? rawName.replace(/[\r\n\t]/g, " ").trim().slice(0, 120) || "Not provided"
      : "Not provided";
    const parsedTime = new Date(user.last_sign_in_at || "");
    const signedInAt = Number.isNaN(parsedTime.getTime()) ? new Date() : parsedTime;
    const localTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Indian/Maldives", day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(signedInAt) + " MVT (UTC+05:00)";
    const title = event === "new_account" ? "New customer signed in" : "Customer signed in";
    const details = [
      ["Customer", name],
      ["Email", user.email],
      ["Sign-in time", localTime],
      ["Activity", event === "new_account" ? "Account created and signed in" : "Successful sign-in"],
    ];
    const body = JSON.stringify({
      from: "Tripelor Notifications <bookings@tripelor.com>",
      to: ["bookings@tripelor.com"],
      bcc: ["johnshamil87@gmail.com"],
      subject: `Tripelor · ${title}`,
      text: `${title}\n\n${details.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nView customers: https://www.tripelor.com/admin`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222"><div style="background:#0a0a0a;padding:24px;color:#d4af37"><h1 style="margin:0;font-size:22px">Tripelor</h1></div><div style="padding:24px"><h2>${title}</h2><table style="width:100%;border-collapse:collapse">${details.map(([label, value]) => `<tr><th style="padding:12px 8px 12px 0;text-align:left;vertical-align:top;border-bottom:1px solid #eee">${label}</th><td style="padding:12px 0;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`).join("")}</table><p style="margin-top:24px"><a href="https://www.tripelor.com/admin" style="color:#775c16">Open Tripelor Admin</a></p></div></div>`,
    });
    const eventKey = createHash("sha256").update(`${user.id}:${signedInAt.toISOString()}`).digest("hex");

    // Reuse exactly the same payload and key for a transient failure retry.
    // Await both bounded attempts so a serverless response cannot discard the send.
    let failedStatus: number | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
            "Idempotency-Key": `customer-sign-in/${eventKey}`,
          },
          body, cache: "no-store", signal: AbortSignal.timeout(2000),
        });
        if (response.ok) return;
        failedStatus = response.status;
        if (response.status < 500) break;
      } catch {
        // A timeout or connection error gets one retry with the same event key.
      }
    }
    console.warn("Tripelor sign-in notification could not be sent.", { status: failedStatus || "network_error" });
  } catch {
    console.warn("Tripelor sign-in notification failed; customer session remains active.");
  }
}
