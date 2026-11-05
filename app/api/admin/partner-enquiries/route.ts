import { randomUUID } from "node:crypto";
import {
  apiJson, cleanText, enquiryDB, enquiryError, integer, jsonBody, money,
  PartnerEnquiryError, requirePartnerAdmin, sameOrigin, validDate, validUuid,
} from "@/lib/partner-enquiry-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePartnerAdmin();
    const [partners, enquiries, requests] = await Promise.all([
      enquiryDB("partner_contacts?select=*&order=name.asc&limit=200"),
      enquiryDB("partner_enquiries?select=*&order=created_at.desc&limit=200"),
      enquiryDB("partner_enquiry_requests?select=*&order=created_at.desc&limit=700"),
    ]);
    return apiJson({ partners, enquiries, requests });
  } catch (error) { return enquiryError(error); }
}

async function sendToPartner(
  address: string, name: string, enquiry: any, requestRow: any, url: string,
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const text = [
    "Dear " + name + ",",
    "",
    "Greetings from Tripelor Maldives.",
    "Please review this holiday enquiry and submit your best B2B quotation.",
    "",
    "Reference: " + enquiry.reference,
    "Travel window: " + enquiry.start_date + " to " + enquiry.end_date,
    "Nights: " + enquiry.nights_min + "–" + enquiry.nights_max,
    "Guests: " + enquiry.adults + " adults, " + enquiry.children + " children",
    "Meals: " + enquiry.meal_plan,
    "Requirements: " + enquiry.requirements,
    "",
    "Submit your wholesale quotation securely:",
    url,
    "",
    "Guest name, email and phone are intentionally withheld.",
    "Thank you,",
    "Tripelor Reservations Team",
  ].join("\n");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": "partner-request/" + requestRow.id,
    },
    body: JSON.stringify({
      from: process.env.TRIPELOR_EMAIL_FROM || "Tripelor Reservations <bookings@tripelor.com>",
      to: [address],
      subject: "Tripelor B2B holiday enquiry " + enquiry.reference,
      text,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
  return response.ok;
}

export async function POST(request: Request) {
  try {
    await requirePartnerAdmin();
    sameOrigin(request);
    const body = await jsonBody(request);
    const action = cleanText(body?.action, 30);

    if (action === "add-partner") {
      const name = cleanText(body?.name, 150);
      const island = cleanText(body?.island, 120);
      const email = cleanText(body?.email, 250).toLowerCase();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new PartnerEnquiryError("Enter the partner name and a valid email address.");
      }
      const rows = await enquiryDB("partner_contacts", {
        method: "POST", body: JSON.stringify({ name, island, email }),
      });
      return apiJson({ partner: rows[0] }, 201);
    }

    if (action === "add-enquiry") {
      const guestName = cleanText(body?.guestName, 120);
      const guestEmail = cleanText(body?.guestEmail, 250).toLowerCase();
      const guestPhone = cleanText(body?.guestPhone, 60);
      const startDate = validDate(body?.startDate);
      const endDate = validDate(body?.endDate);
      const nightsMin = integer(body?.nightsMin, 1, 60);
      const nightsMax = integer(body?.nightsMax, 1, 60);
      const adults = integer(body?.adults, 1, 20);
      const children = integer(body?.children, 0, 20);
      const budgetUsd = money(body?.budgetUsd || 0, 1000000);
      const mealPlan = cleanText(body?.mealPlan, 100);
      const requirements = cleanText(body?.requirements, 4000);
      if (!guestName || !startDate || !endDate || endDate < startDate ||
          nightsMax < nightsMin || requirements.length < 5) {
        throw new PartnerEnquiryError("Add the guest, valid date range, nights and requirements.");
      }
      if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        throw new PartnerEnquiryError("Guest email is invalid.");
      }
      const reference = "TPE-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") +
        "-" + randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
      const rows = await enquiryDB("partner_enquiries", {
        method: "POST",
        body: JSON.stringify({
          reference, guest_name: guestName, guest_email: guestEmail,
          guest_phone: guestPhone, start_date: startDate, end_date: endDate,
          nights_min: nightsMin, nights_max: nightsMax, adults, children,
          budget_usd: budgetUsd, meal_plan: mealPlan || "Full Board", requirements,
        }),
      });
      return apiJson({ enquiry: rows[0] }, 201);
    }

    if (action === "forward") {
      const enquiryId = body?.enquiryId;
      const partnerIds = Array.isArray(body?.partnerIds) ? [...new Set(body.partnerIds)] : [];
      if (!validUuid(enquiryId) || partnerIds.length < 1 || partnerIds.length > 10 ||
          !partnerIds.every(validUuid)) {
        throw new PartnerEnquiryError("Select an enquiry and up to 10 partners.");
      }
      const [enquiries, partners] = await Promise.all([
        enquiryDB("partner_enquiries?id=eq." + enquiryId + "&limit=1"),
        enquiryDB("partner_contacts?id=in.(" + partnerIds.join(",") + ")&active=eq.true"),
      ]);
      const enquiry = enquiries[0];
      if (!enquiry || enquiry.status === "closed") throw new PartnerEnquiryError("Enquiry unavailable.", 404);
      if (partners.length !== partnerIds.length) throw new PartnerEnquiryError("One or more partners are unavailable.");

      const results = [];
      for (const partner of partners) {
        let rows = await enquiryDB(
          "partner_enquiry_requests?on_conflict=enquiry_id,partner_id",
          {
            method: "POST",
            headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
            body: JSON.stringify({ enquiry_id: enquiryId, partner_id: partner.id }),
          },
        );
        if (!rows.length) {
          rows = await enquiryDB(
            "partner_enquiry_requests?enquiry_id=eq." + enquiryId +
            "&partner_id=eq." + partner.id + "&limit=1",
          );
        }
        const item = rows[0];
        if (!item) continue;
        const link = new URL("/partner-quote/" + item.secure_token, request.url).toString();
        let emailStatus = item.email_status;
        // Retry failed or unsent mail only when forwarding is explicitly requested.
        if (item.status === "pending" && item.email_status !== "sent" &&
            new Date(item.expires_at).getTime() > Date.now() && process.env.RESEND_API_KEY) {
          let sent = false;
          try { sent = await sendToPartner(partner.email, partner.name, enquiry, item, link); }
          catch { sent = false; }
          emailStatus = sent ? "sent" : "failed";
          await enquiryDB("partner_enquiry_requests?id=eq." + item.id, {
            method: "PATCH",
            body: JSON.stringify({
              email_status: emailStatus,
              last_sent_at: sent ? new Date().toISOString() : item.last_sent_at,
            }),
          });
        }
        results.push({ partnerId: partner.id, partnerName: partner.name, link, emailStatus });
      }
      await enquiryDB("partner_enquiries?id=eq." + enquiryId, {
        method: "PATCH",
        body: JSON.stringify({ status: "sent", updated_at: new Date().toISOString() }),
      });
      return apiJson({ forwarded: results });
    }

    throw new PartnerEnquiryError("Unsupported enquiry action.");
  } catch (error) { return enquiryError(error); }
}

export async function PATCH(request: Request) {
  try {
    await requirePartnerAdmin();
    sameOrigin(request);
    const body = await jsonBody(request);
    if (!validUuid(body?.id) || !["new", "sent", "quoted", "closed"].includes(body?.status)) {
      throw new PartnerEnquiryError("Invalid enquiry or status.");
    }
    const rows = await enquiryDB("partner_enquiries?id=eq." + body.id, {
      method: "PATCH",
      body: JSON.stringify({ status: body.status, updated_at: new Date().toISOString() }),
    });
    if (!rows.length) throw new PartnerEnquiryError("Enquiry not found.", 404);
    return apiJson({ enquiry: rows[0] });
  } catch (error) { return enquiryError(error); }
}
