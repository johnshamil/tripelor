import { currentUser, isAdminEmail } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export class PartnerEnquiryError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export async function requirePartnerAdmin() {
  const user = await currentUser();
  if (!user) throw new PartnerEnquiryError("Please sign in.", 401);
  if (!isAdminEmail(user.email)) throw new PartnerEnquiryError("Admin access required.", 403);
  return user;
}

export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    throw new PartnerEnquiryError("Request origin is not allowed.", 403);
  }
}

export async function jsonBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new PartnerEnquiryError("Send JSON data.", 415);
  }
  if (Number(request.headers.get("content-length") || 0) > 20000) {
    throw new PartnerEnquiryError("Request is too large.", 413);
  }
  try { return await request.json(); }
  catch { throw new PartnerEnquiryError("Invalid JSON request."); }
}

export function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

export function validDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}

export function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function integer(value: unknown, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new PartnerEnquiryError("Check guest counts and stay length.");
  }
  return number;
}

export function money(value: unknown, max = 10000000) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) {
    throw new PartnerEnquiryError("Enter a valid price.");
  }
  return Math.round(number * 100) / 100;
}

export async function enquiryDB(path: string, init: RequestInit = {}): Promise<any[]> {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new PartnerEnquiryError("Enquiry storage is not configured.", 503);
  const response = await fetch(url + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json",
      Prefer: "return=representation", ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (body?.code === "23505") throw new PartnerEnquiryError("That partner or enquiry already exists.", 409);
    throw new PartnerEnquiryError("Unable to load or save partner enquiry data. Check database migration.", 503);
  }
  return Array.isArray(body) ? body : [];
}

export function enquiryError(error: unknown) {
  const known = error instanceof PartnerEnquiryError;
  return Response.json(
    { error: known ? error.message : "Unable to complete partner enquiry request." },
    { status: known ? error.status : 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function apiJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}
