import { currentUser } from "@/lib/auth-server";
import { validateProperty } from "@/lib/property-model";
import { managedProperties, propertyDB, sameOrigin } from "@/lib/property-store";

function partnerError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to complete this action.";
  const safeMessage = message === "UNAUTHORIZED" ? "Please sign in." : message === "FORBIDDEN" ? "Partner access required." : message;
  return Response.json({ error: safeMessage }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400 });
}

function emailFor(user: any) {
  const email = typeof user?.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!email) throw new Error("FORBIDDEN");
  return email;
}

async function assignedProperty(email: string, id?: string) {
  const properties = await managedProperties();
  const property = properties.find((item) => (item.partnerEmail || "").trim().toLowerCase() === email && (!id || item.id === id));
  if (!property) throw new Error("This email is not assigned to a Tripelor property yet.");
  return property;
}

function noteValue(value: unknown) {
  if (typeof value !== "string" || value.length > 2000) throw new Error("Keep your review note under 2,000 characters.");
  return value.trim();
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    const email = emailFor(user);
    const properties = (await managedProperties()).filter((item) => (item.partnerEmail || "").trim().toLowerCase() === email);
    const submissions = properties.length
      ? await propertyDB(`property_partner_submissions?partner_email=eq.${encodeURIComponent(email)}&status=eq.pending&select=*&order=created_at.desc`)
      : [];
    const propertyIds = new Set(properties.map((item) => item.id));
    return Response.json({
      properties,
      submissions: submissions.filter((item: any) => propertyIds.has(item.property_id)),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return partnerError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("UNAUTHORIZED");
    sameOrigin(request);
    const email = emailFor(user);
    const body = await request.text();
    if (body.length > 180000) throw new Error("Property details are too large.");
    const input = JSON.parse(body);
    if (!input || typeof input.id !== "string" || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("Choose a valid assigned property.");
    const property = await assignedProperty(email, input.id);
    const value = validateProperty({
      ...input,
      id: property.id,
      slug: property.slug,
      status: "draft",
      partnerEmail: property.partnerEmail,
    });
    const note = noteValue(input.reviewNote || "");
    const existing = await propertyDB(`property_partner_submissions?property_id=eq.${property.id}&partner_email=eq.${encodeURIComponent(email)}&status=eq.pending&select=id&limit=1`);
    const payload = {
      property_id: property.id,
      partner_email: email,
      data: value.data,
      note,
      base_updated_at: property.updated_at,
    };
    const rows = existing[0]
      ? await propertyDB(`property_partner_submissions?id=eq.${existing[0].id}&status=eq.pending`, { method: "PATCH", body: JSON.stringify(payload) })
      : await propertyDB("property_partner_submissions", { method: "POST", body: JSON.stringify(payload) });
    return Response.json({ submission: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return partnerError(error);
  }
}
