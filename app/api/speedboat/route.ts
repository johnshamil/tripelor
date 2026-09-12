import { currentUser } from "@/lib/auth-server";
import { propertyConfig } from "@/lib/property-store";

const BOOKING_EMAIL = "bookings@tripelor.com";
const BOOKING_BCC_EMAIL = "johnshamil87@gmail.com";
const PRICE_PER_PERSON = 50;

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function cleanText(value: unknown, max = 240, fallback = "") {
  if (typeof value !== "string" || value.length > max) throw new Error("Please shorten the transfer details and try again.");
  return value.trim() || fallback;
}

async function sendResend(apiKey: string, payload: Record<string, unknown>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  return { response, result };
}

async function saveTransferRequest(payload: Record<string, unknown>) {
  const { url, key } = propertyConfig();
  const response = await fetch(`${url}/rest/v1/transfer_requests`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(data?.message || "Unable to save the transfer request.");
  return data?.[0] || null;
}

async function scheduleFor(arrivalDate: string, scheduleId: number) {
  if (!Number.isInteger(scheduleId) || scheduleId < 1) throw new Error("Please select a published departure.");
  const { url, key } = propertyConfig();
  const day = new Date(arrivalDate + "T12:00:00Z").getUTCDay();
  const response = await fetch(`${url}/rest/v1/speedboat_schedule?id=eq.${scheduleId}&day_of_week=eq.${day}&active=eq.true&select=route,operator,price_per_person,capacity,departure_time`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Unable to check the departure. Please try again.");
  const rows = await response.json();
  if (!rows[0]) throw new Error("This departure is no longer available for your date. Please refresh and select another.");
  return rows[0];
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Please log in to request a speedboat transfer." }, { status: 401 });
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return Response.json({ error: "Email service is not configured yet." }, { status: 500 });
    const body = await request.json();
    const arrivalDate = cleanText(body.arrivalDate, 10);
    const arrivalTime = cleanText(body.arrivalTime, 8);
    const fullName = cleanText(body.fullName, 160);
    const email = cleanText(body.email, 240).toLowerCase();
    const phone = cleanText(body.phone, 80);
    const flightNumber = cleanText(body.flightNumber || "", 30).toUpperCase();
    const notes = cleanText(body.notes || "", 2000);
    let recommendedDeparture = "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(arrivalDate) || !/^\d{2}:\d{2}(?::\d{2})?$/.test(arrivalTime)) throw new Error("Please enter a valid arrival date and time.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Please enter a valid email address.");
    if (recommendedDeparture && !/^\d{2}:\d{2}(?::\d{2})?$/.test(recommendedDeparture)) throw new Error("Please choose a valid recommended departure.");
    const seats = Number(body.seats);
    if (!Number.isInteger(seats) || seats < 1 || seats > 100) throw new Error("Choose between 1 and 100 passenger seats.");
    const arrival = new Date(`${arrivalDate}T${arrivalTime}:00+05:00`);
    if (Number.isNaN(arrival.getTime())) throw new Error("Please enter a valid arrival date and time.");
    if (arrival.getTime() - Date.now() < 86400000) throw new Error("Speedboat requests must be submitted at least 24 hours before arrival.");
    const matchedSchedule = await scheduleFor(arrivalDate, Number(body.scheduleId));
    recommendedDeparture = String(matchedSchedule.departure_time).slice(0, 5);
    if (recommendedDeparture < arrivalTime.slice(0, 5)) throw new Error("Select a departure after your ready time.");
    const pricePerPerson = Number(matchedSchedule?.price_per_person ?? PRICE_PER_PERSON);
    const capacity = Number(matchedSchedule?.capacity || 0);
    if (capacity > 0 && seats > capacity) throw new Error(`That departure has only ${capacity} seats available.`);
    const operator = cleanText(matchedSchedule?.operator || "Dream Speed", 100, "Dream Speed");
    const total = seats * pricePerPerson;
    const requestReference = `TR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const transfer = await saveTransferRequest({
      request_reference: requestReference,
      route: matchedSchedule.route,
      operator,
      guest_name: fullName,
      guest_email: email,
      guest_phone: phone,
      flight_number: flightNumber,
      arrival_date: arrivalDate,
      arrival_time: arrivalTime,
      requested_departure: recommendedDeparture || null,
      seats,
      price_per_person: pricePerPerson,
      total,
      notes,
      status: "pending",
    });
    const rows = `<tr><td>Route</td><td>${escapeHtml(matchedSchedule.route)}</td></tr><tr><td>Operator</td><td>${escapeHtml(operator)}</td></tr><tr><td>Departure (Maldives time)</td><td>${escapeHtml(recommendedDeparture)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Request reference</td><td>${escapeHtml(requestReference)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Arrival date</td><td>${escapeHtml(arrivalDate)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Arrival time</td><td>${escapeHtml(arrivalTime)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Flight</td><td>${escapeHtml(flightNumber || "Not provided")}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Seats</td><td>${escapeHtml(seats)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Fare</td><td>USD ${escapeHtml(pricePerPerson)} per person</td></tr><tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="font-weight:bold">USD ${escapeHtml(total)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Payment</td><td>Payment arrangements will be confirmed by Tripelor</td></tr>`;
    const adminHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6"><div style="background:#0a0a0a;color:#d4af37;padding:22px 26px"><h1>New Speedboat Transfer Request</h1></div><div style="padding:26px;border:1px solid #eee"><table style="width:100%"><tbody><tr><td style="padding:8px 0;font-weight:bold">Guest</td><td>${escapeHtml(fullName)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Email</td><td>${escapeHtml(email)}</td></tr><tr><td style="padding:8px 0;font-weight:bold">Phone</td><td>${escapeHtml(phone)}</td></tr>${rows}<tr><td style="padding:8px 0;font-weight:bold">Notes</td><td>${escapeHtml(notes || "None")}</td></tr></tbody></table></div></div>`;
    const { response: adminResponse, result: adminResult } = await sendResend(apiKey, { from: "Tripelor Transfers <bookings@tripelor.com>", to: [BOOKING_EMAIL], bcc: [BOOKING_BCC_EMAIL], reply_to: email, subject: `New Tripelor transfer ${requestReference} - ${escapeHtml(fullName)}`, html: adminHtml });
    if (!adminResponse.ok) return Response.json({ error: adminResult?.message || "Unable to send speedboat request." }, { status: 500 });
    const customerHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6"><div style="background:#0a0a0a;color:#d4af37;padding:22px 26px"><h1>Speedboat Request Received</h1></div><div style="padding:26px;border:1px solid #eee"><p>Dear ${escapeHtml(fullName)},</p><p>We received your transfer request for ${escapeHtml(matchedSchedule.route)}.</p><table style="width:100%"><tbody>${rows}</tbody></table><p style="margin-top:22px">Tripelor will confirm the available speedboat schedule and seats with you. Requests must be made at least 24 hours before arrival.</p><p>Regards,<br><strong>Tripelor</strong></p></div></div>`;
    try { await sendResend(apiKey, { from: "Tripelor Transfers <bookings@tripelor.com>", to: [email], reply_to: BOOKING_EMAIL, subject: `Tripelor transfer request ${requestReference} received`, html: customerHtml }); } catch (customerError) { console.error("Speedboat customer email error", customerError); }
    return Response.json({ success: true, id: transfer?.id || adminResult.id, total, requestReference });
  } catch (error) {
    console.error("Speedboat request error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to send speedboat request." }, { status: 500 });
  }
}
