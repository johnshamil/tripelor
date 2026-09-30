import { randomUUID } from "node:crypto";
import { currentUser, isAdminEmail } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const statuses = new Set(["draft", "sent", "accepted", "cancelled"]);
const categories = new Set(["stay", "transfer", "excursion", "other"]);

function cfg() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Quotation storage is not configured.");
  return { url, key };
}

async function requireAdmin() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdminEmail(user.email)) throw new Error("FORBIDDEN");
  return user;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to manage quotations.";
  if (message === "UNAUTHORIZED") return Response.json({ error: "Please sign in." }, { status: 401 });
  if (message === "FORBIDDEN") return Response.json({ error: "Admin access required." }, { status: 403 });
  return Response.json({ error: message }, { status: 500 });
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanMoney(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 10_000_000) return 0;
  return Math.round(number * 100) / 100;
}

function cleanInteger(value: unknown, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
}

function cleanDate(value: unknown) {
  const text = cleanText(value, 10);
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  const parsed = new Date(`${text}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text ? text : "";
}

function cleanItems(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 30) {
    throw new Error("Add between 1 and 30 quotation items.");
  }

  return value.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const categoryRaw = cleanText(item.category, 30);
    const category = categories.has(categoryRaw) ? categoryRaw : "other";
    const label = cleanText(item.label, 180);
    const details = cleanText(item.details, 500);
    const quantity = cleanInteger(item.quantity, 1, 100, 1);
    const unitPrice = cleanMoney(item.unitPrice);
    if (!label) throw new Error(`Add a description for quotation item ${index + 1}.`);
    return {
      id: cleanText(item.id, 80) || `item-${index + 1}`,
      category,
      label,
      details,
      quantity,
      unitPrice,
      lineTotal: Math.round(quantity * unitPrice * 100) / 100,
    };
  });
}

function createReference() {
  const now = new Date();
  const yy = String(now.getUTCFullYear()).slice(-2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `QTN-${yy}${mm}${dd}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export async function GET() {
  try {
    await requireAdmin();
    const { url, key } = cfg();
    const response = await fetch(
      `${url}/rest/v1/manual_quotations?select=*&order=created_at.desc&limit=250`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
      },
    );
    const raw = await response.text();
    const rows = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(rows?.message || "Unable to load quotations.");
    return Response.json(
      {
        quotations: rows.map((row: any) => ({
          ...row,
          share_url: `/quotation/${row.share_token}`,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new Error("FORBIDDEN");
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ error: "Please submit a valid quotation." }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") || 0) > 50_000) {
      return Response.json({ error: "This quotation is too large." }, { status: 413 });
    }

    const body = await request.json();
    const customerName = cleanText(body?.customerName, 120);
    const customerEmail = cleanText(body?.customerEmail, 250).toLowerCase();
    const customerPhone = cleanText(body?.customerPhone, 60);
    const propertyName = cleanText(body?.propertyName, 180);
    const roomName = cleanText(body?.roomName, 180);
    const mealPlan = cleanText(body?.mealPlan, 100);
    const checkIn = cleanDate(body?.checkIn);
    const checkOut = cleanDate(body?.checkOut);
    const adults = cleanInteger(body?.adults, 1, 20, 2);
    const children = cleanInteger(body?.children, 0, 20, 0);
    const rooms = cleanInteger(body?.rooms, 1, 20, 1);
    const notes = cleanText(body?.notes, 3000);
    const terms = cleanText(body?.terms, 5000);
    const discountAmount = cleanMoney(body?.discountAmount);
    const feesAmount = cleanMoney(body?.feesAmount);
    const validHours = cleanInteger(body?.validHours, 1, 720, 48);
    const items = cleanItems(body?.items);

    if (!customerName) return Response.json({ error: "Customer name is required." }, { status: 400 });
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return Response.json({ error: "Enter a valid customer email." }, { status: 400 });
    }
    if ((checkIn && !checkOut) || (!checkIn && checkOut) || (checkIn && checkOut && checkOut <= checkIn)) {
      return Response.json({ error: "Choose valid check-in and check-out dates." }, { status: 400 });
    }

    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    if (discountAmount > subtotal) {
      return Response.json({ error: "Discount cannot be more than the subtotal." }, { status: 400 });
    }
    const total = Math.round((subtotal - discountAmount + feesAmount) * 100) / 100;
    const reference = createReference();
    const validUntil = new Date(Date.now() + validHours * 60 * 60 * 1000).toISOString();

    const payload = {
      reference,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      property_name: propertyName,
      room_name: roomName,
      meal_plan: mealPlan,
      check_in: checkIn || null,
      check_out: checkOut || null,
      adults,
      children,
      rooms,
      currency: "USD",
      items,
      subtotal,
      discount_amount: discountAmount,
      fees_amount: feesAmount,
      total,
      notes,
      terms,
      status: "draft",
      valid_until: validUntil,
      created_by: String(user.email || ""),
      updated_at: new Date().toISOString(),
    };

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/manual_quotations`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const raw = await response.text();
    const rows = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(rows?.message || "Unable to create quotation.");
    const row = rows?.[0];
    if (!row) throw new Error("Quotation was not returned after saving.");

    return Response.json(
      {
        quotation: {
          ...row,
          share_url: `/quotation/${row.share_token}`,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) throw new Error("FORBIDDEN");

    const body = await request.json();
    const id = cleanText(body?.id, 60);
    const status = cleanText(body?.status, 30);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid quotation." }, { status: 400 });
    if (!statuses.has(status)) return Response.json({ error: "Invalid quotation status." }, { status: 400 });

    const { url, key } = cfg();
    const response = await fetch(`${url}/rest/v1/manual_quotations?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
      cache: "no-store",
    });
    const raw = await response.text();
    const rows = raw ? JSON.parse(raw) : [];
    if (!response.ok) throw new Error(rows?.message || "Unable to update quotation.");
    return Response.json({ quotation: rows?.[0] || null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
