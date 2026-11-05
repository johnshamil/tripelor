import {
  apiJson, cleanText, enquiryDB, enquiryError, jsonBody, money,
  PartnerEnquiryError, sameOrigin, validUuid,
} from "@/lib/partner-enquiry-server";

export const dynamic = "force-dynamic";

async function resolveRequest(token: string) {
  if (!validUuid(token)) throw new PartnerEnquiryError("Quotation link not found.", 404);
  const rows = await enquiryDB("partner_enquiry_requests?secure_token=eq." + token + "&limit=1");
  const quote = rows[0];
  if (!quote) throw new PartnerEnquiryError("Quotation link not found.", 404);
  if (quote.status === "cancelled" || new Date(quote.expires_at).getTime() < Date.now()) {
    throw new PartnerEnquiryError("This quotation link has expired. Contact Tripelor.", 410);
  }
  const [enquiries, partners] = await Promise.all([
    enquiryDB("partner_enquiries?id=eq." + quote.enquiry_id +
      "&select=reference,start_date,end_date,nights_min,nights_max,adults,children,meal_plan,requirements,status&limit=1"),
    enquiryDB("partner_contacts?id=eq." + quote.partner_id + "&select=name,island&limit=1"),
  ]);
  if (!enquiries[0] || enquiries[0].status === "closed" || !partners[0]) {
    throw new PartnerEnquiryError("This enquiry is no longer available.", 410);
  }
  return { quote, enquiry: enquiries[0], partner: partners[0] };
}

export async function GET(_request: Request, context: { params: { token: string } }) {
  try {
    const { quote, enquiry, partner } = await resolveRequest(context.params.token);
    // Do not send guest name, email, phone, partner email or confidential admin fields.
    return apiJson({
      reference: enquiry.reference,
      partnerName: partner.name, island: partner.island,
      startDate: enquiry.start_date, endDate: enquiry.end_date,
      nightsMin: enquiry.nights_min, nightsMax: enquiry.nights_max,
      adults: enquiry.adults, children: enquiry.children,
      mealPlan: enquiry.meal_plan, requirements: enquiry.requirements,
      status: quote.status, expiresAt: quote.expires_at,
    });
  } catch (error) { return enquiryError(error); }
}

export async function POST(request: Request, context: { params: { token: string } }) {
  try {
    sameOrigin(request);
    const body = await jsonBody(request);
    const { quote } = await resolveRequest(context.params.token);
    if (quote.status !== "pending") {
      throw new PartnerEnquiryError("A response has already been recorded for this link.", 409);
    }
    const action = body?.action === "decline" ? "decline" : "quote";
    let patch: Record<string, unknown>;
    if (action === "decline") {
      patch = { status: "declined", submitted_at: new Date().toISOString() };
    } else {
      const availability = cleanText(body?.availability, 600);
      const inclusions = cleanText(body?.inclusions, 3000);
      const exclusions = cleanText(body?.exclusions, 2000);
      const terms = cleanText(body?.terms, 2000);
      const currency = body?.currency;
      const wholesale = money(body?.wholesaleTotal);
      if (!["USD", "MVR"].includes(currency) || !availability || !inclusions || wholesale <= 0) {
        throw new PartnerEnquiryError("Enter availability, B2B price, currency and inclusions.");
      }
      patch = {
        status: "quoted", submitted_at: new Date().toISOString(),
        availability, inclusions, exclusions, terms,
        currency, wholesale_total: wholesale,
      };
    }
    // Atomic status filter prevents a second submission from overwriting the first.
    const saved = await enquiryDB(
      "partner_enquiry_requests?id=eq." + quote.id + "&status=eq.pending",
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    if (!saved.length) throw new PartnerEnquiryError("This quotation has already been submitted.", 409);
    return apiJson({ success: true, status: saved[0].status });
  } catch (error) { return enquiryError(error); }
}
