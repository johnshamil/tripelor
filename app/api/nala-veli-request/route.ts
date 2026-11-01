import { randomUUID } from "node:crypto";
import { nalaMoney, nalaPrice, nalaProperties, nalaStay, nalaToday } from "@/lib/nala-veli";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const str = (value: unknown, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";
    const property = str(body.property), room = str(body.room);
    const start = str(body.start, 10), end = str(body.end, 10);
    const name = str(body.name, 120), email = str(body.email), phone = str(body.phone, 50), requests = str(body.requests, 800);
    const selectedRoom = nalaProperties.find(item => item.name === property)?.rooms.find(item => item.name === room);
    const stay = nalaStay(start, end);
    if (!selectedRoom || !name || !email.includes("@") || !phone || start < nalaToday() || !["priced", "quote"].includes(stay.status)) {
      return Response.json({ error: "Please choose valid booking details and a stay of 1–44 nights." }, { status: 400 });
    }
    const price = nalaPrice(selectedRoom, stay);
    const key = process.env.RESEND_API_KEY;
    if (!key) return Response.json({ error: "Booking request service unavailable." }, { status: 503 });
    const reference = `TRP-NV-${randomUUID().slice(0, 8).toUpperCase()}`;
    const details = [
      `Reference: ${reference}`, `Property: ${property}`, `Room: ${room}`,
      `Check-in: ${start}`, `Check-out: ${end}`, `Nights: ${stay.dates.length}`,
      `Guest: ${name}`, `Email: ${email}`, `Phone: ${phone}`,
      `Estimated accommodation total: ${price ? nalaMoney(price.total) : "Quote on request"}`,
      `Special requests: ${requests}`, "Status: PENDING SUPPLIER CONFIRMATION. No room held or payment taken.",
    ].join("\n");
    const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
    const send = await fetch("https://api.resend.com/emails", {
      method: "POST", headers,
      body: JSON.stringify({
        from: "Tripelor Bookings <bookings@tripelor.com>", to: ["bookings@tripelor.com"], reply_to: email,
        subject: `${reference} · Nala Veli booking request`, text: details,
      }),
    });
    if (!send.ok) return Response.json({ error: "Unable to deliver booking request. Please contact Tripelor directly." }, { status: 502 });
    await fetch("https://api.resend.com/emails", {
      method: "POST", headers,
      body: JSON.stringify({
        from: "Tripelor Bookings <bookings@tripelor.com>", to: [email],
        subject: `${reference} · Request received — not yet confirmed`,
        text: `Dear ${name},\n\nTripelor received your Nala Veli booking request.\n\n${details}\n\nThis is NOT a confirmed booking. We will contact Nala Veli for written availability confirmation and then send you final terms and payment instructions. No payment is due yet.\n\nTripelor`,
      }),
    }).catch(() => {});
    return Response.json({ success: true, reference, status: "pending_supplier_confirmation" });
  } catch {
    return Response.json({ error: "Unable to process booking request." }, { status: 500 });
  }
}
