import { propertyAdmin, propertyDB, propertyError, sameOrigin } from "@/lib/property-store";

const BOOKING_EMAIL = "bookings@tripelor.com";

const REQUEST_STATUSES = ["pending", "confirmed", "declined", "completed", "cancelled"];

function shortText(value: unknown, max: number, fallback = "") {
  if (typeof value !== "string" || value.length > max) throw new Error("Please shorten the transfer details and try again.");
  return value.trim() || fallback;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
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

function niceTime(value: unknown) {
  if (typeof value !== "string" || !value) return "To be confirmed";
  return new Date(`2000-01-01T${value.slice(0, 5)}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function confirmationHtml(transfer: Record<string, unknown>) {
  const name = escapeHtml(transfer.guest_name);
  const rows = [
    ["Request reference", transfer.request_reference], ["Route", transfer.route], ["Operator", transfer.operator],
    ["Arrival", `${transfer.arrival_date || "TBC"} at ${niceTime(transfer.arrival_time)}`],
    ["Recommended departure", niceTime(transfer.requested_departure)], ["Flight", transfer.flight_number || "Not provided"],
    ["Seats", transfer.seats], ["Total", `USD ${Number(transfer.total || 0).toFixed(2)}`],
  ].map(([label, value]) => `<tr><td style="padding:8px 0;font-weight:bold">${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6"><div style="background:#071922;color:#d9bd7b;padding:22px 26px"><h1>Transfer Confirmed</h1></div><div style="padding:26px;border:1px solid #eee"><p>Dear ${name},</p><p>Greetings from Tripelor, Maldives. Your transfer for ${escapeHtml(transfer.route)} is confirmed.</p><table style="width:100%"><tbody>${rows}</tbody></table><p style="margin-top:22px"><strong>Important:</strong> Please be ready at the agreed pickup point at least 15 minutes before departure. Keep your flight details available for the transfer team.</p><p>If you need assistance, reply to this email and our team will help you.</p><p>Thank you for choosing Tripelor.</p><p>Best regards,<br><strong>Tripelor</strong><br>Travel &amp; Accommodation Services<br><a href="https://www.tripelor.com">www.tripelor.com</a><br>${BOOKING_EMAIL}</p></div></div>`;
}

export async function GET() {
  try {
    await propertyAdmin();
    const [schedules, requests] = await Promise.all([
      propertyDB("speedboat_schedule?select=*&order=route.asc,day_of_week.asc,departure_time.asc"),
      propertyDB("transfer_requests?select=*&order=arrival_date.asc,arrival_time.asc,created_at.desc&limit=300"),
    ]);
    return Response.json({ schedules, requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return propertyError(error);
  }
}

export async function POST(request: Request) {
  try {
    await propertyAdmin();
    sameOrigin(request);
    const body = await request.text();
    if (body.length > 12000) throw new Error("Transfer details are too large.");
    const input = JSON.parse(body);
    const operation = String(input?.operation || "");

    if (operation === "createRequest") {
      const required = (value: unknown, max: number) => {
        const text = shortText(value, max);
        if (!text) throw new Error("Please complete all required transfer details.");
        return text;
      };
      const route = required(input.route, 120);
      const operator = required(input.operator, 100);
      const guestName = required(input.guestName, 160);
      const guestEmail = required(input.guestEmail, 240).toLowerCase();
      const guestPhone = required(input.guestPhone, 80);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) throw new Error("Enter a valid customer email.");
      const date = required(input.travelDate, 10);
      const arrival = required(input.arrivalTime, 5);
      const departure = required(input.departureTime, 5);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date + "T12:00:00Z")) || new Date(date + "T12:00:00Z").toISOString().slice(0, 10) !== date) throw new Error("Enter a valid travel date.");
      if (![arrival, departure].every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) throw new Error("Enter valid times.");
      if (departure < arrival) throw new Error("Departure must be on or after the ready time. Use the departure date for overnight transfers.");
      const seats = Number(input.seats);
      const fare = Number(input.pricePerPerson);
      if (!Number.isInteger(seats) || seats < 1 || seats > 100) throw new Error("Enter 1 to 100 passengers.");
      if (input.pricePerPerson === "" || !Number.isFinite(fare) || fare < 0 || fare > 100000) throw new Error("Enter a valid fare.");
      const rows = await propertyDB("transfer_requests", { method: "POST", body: JSON.stringify({
        request_reference: "TR-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        route, operator, guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone,
        arrival_date: date, arrival_time: arrival, requested_departure: departure,
        flight_number: shortText(input.flightNumber || "", 30),
        seats, price_per_person: Math.round(fare * 100) / 100,
        total: Math.round(fare * 100) * seats / 100,
        admin_note: shortText(input.adminNote || "", 2000), notes: "", status: "pending"
      }) });
      if (!rows[0]) throw new Error("Unable to create transfer.");
      return Response.json({ request: rows[0] }, { status: 201 });
    }
    if (operation === "updateRequest") {
      if (typeof input.id !== "string" || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("Choose a valid transfer request.");
      const status = String(input.status || "");
      if (!REQUEST_STATUSES.includes(status)) throw new Error("Choose a valid transfer status.");
      const adminNote = shortText(input.adminNote || "", 2000);
      const existingRows = await propertyDB(`transfer_requests?id=eq.${input.id}&limit=1`);
      const existing = existingRows[0];
      if (!existing) return Response.json({ error: "Transfer request not found." }, { status: 404 });
      const becameConfirmed = status === "confirmed" && existing.status !== "confirmed" && !existing.confirmation_sent_at;
      const rows = await propertyDB(`transfer_requests?id=eq.${input.id}`, { method: "PATCH", body: JSON.stringify({ status, admin_note: adminNote, updated_at: new Date().toISOString() }) });
      if (!rows.length) return Response.json({ error: "Transfer request not found." }, { status: 404 });
      let emailWarning = "";
      if (becameConfirmed) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) emailWarning = "Transfer confirmed, but email service is not configured.";
        else {
          try {
            const sent = await sendResend(apiKey, { from: "Tripelor Transfers <bookings@tripelor.com>", to: [existing.guest_email], reply_to: BOOKING_EMAIL, subject: `Transfer confirmed ${existing.request_reference} - Tripelor`, html: confirmationHtml({ ...existing, status, admin_note: adminNote }) });
            if (!sent.response.ok) emailWarning = sent.result?.message || "Transfer confirmed, but the customer email could not be sent.";
            else await propertyDB(`transfer_requests?id=eq.${input.id}`, { method: "PATCH", body: JSON.stringify({ confirmation_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
          } catch (emailError) { console.error("Transfer confirmation email error", emailError); emailWarning = "Transfer confirmed, but the customer email could not be sent."; }
        }
      }
      const refreshed = await propertyDB(`transfer_requests?id=eq.${input.id}&limit=1`);
      return Response.json({ request: refreshed[0] || rows[0], emailWarning });
    }

    if (operation === "deleteSchedule") {
      const id = Number(input.id);
      if (!Number.isInteger(id) || id < 1) throw new Error("Choose a valid departure.");
      const rows = await propertyDB(`speedboat_schedule?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
      if (!rows.length) return Response.json({ error: "Departure not found." }, { status: 404 });
      return Response.json({ schedule: rows[0] });
    }

    if (operation !== "saveSchedule") throw new Error("Choose a transfer action.");
    const dayOfWeek = Number(input.dayOfWeek);
    const departureTime = shortText(input.departureTime, 8);
    const operator = shortText(input.operator, 100, "Dream Speed");
    const route = shortText(input.route, 120, "Male to Felidhoo");
    const notes = shortText(input.notes || "", 500);
    const capacity = Number(input.capacity);
    const pricePerPerson = Number(input.pricePerPerson);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new Error("Choose a valid day of the week.");
    if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(departureTime)) throw new Error("Choose a valid departure time.");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw new Error("Capacity must be between 1 and 100 seats.");
    if (!Number.isFinite(pricePerPerson) || pricePerPerson < 0 || pricePerPerson > 100000) throw new Error("Enter a valid fare per person.");
    const payload = { operator, route, day_of_week: dayOfWeek, departure_time: departureTime, active: Boolean(input.active), capacity, price_per_person: pricePerPerson, notes };
    const id = Number(input.id);
    const rows = Number.isInteger(id) && id > 0
      ? await propertyDB(`speedboat_schedule?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await propertyDB("speedboat_schedule", { method: "POST", body: JSON.stringify(payload) });
    if (!rows.length) return Response.json({ error: "Departure not found." }, { status: 404 });
    return Response.json({ schedule: rows[0] });
  } catch (error) {
    return propertyError(error);
  }
}
