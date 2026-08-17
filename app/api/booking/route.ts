const BOOKING_EMAIL = "bookings@tripelor.com";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return Response.json({ error: "Email service is not configured yet." }, { status: 500 });

    const body = await request.json();
    const {
      packageName, packagePrice, propertyName, fullName, email, phone, destination,
      checkIn, checkOut, nights, adults, children, roomType, rooms, mealPlan,
      nightlyRate, estimatedTotal, specialRequests,
    } = body;

    if (!fullName || !email || !checkIn || !checkOut) {
      return Response.json({ error: "Name, email, check-in and check-out are required." }, { status: 400 });
    }

    const bookingTitle = packageName || propertyName || destination || "Tripelor booking";
    const subject = `New Tripelor booking request - ${escapeHtml(bookingTitle)} - ${escapeHtml(fullName)}`;

    const adminHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6">
        <div style="background:#0a0a0a;color:#d4af37;padding:22px 26px;border-radius:14px 14px 0 0">
          <h1 style="margin:0;font-size:24px">New Tripelor Booking Request</h1>
        </div>
        <div style="border:1px solid #e5e5e5;border-top:0;padding:26px;border-radius:0 0 14px 14px">
          <p>A customer submitted a booking request through Tripelor.</p>
          <table style="width:100%;border-collapse:collapse"><tbody>
            ${packageName ? `<tr><td style="padding:8px 0;font-weight:bold">Package</td><td>${escapeHtml(packageName)}</td></tr>` : ""}
            ${packagePrice ? `<tr><td style="padding:8px 0;font-weight:bold">Package Price</td><td style="font-weight:bold">USD ${escapeHtml(packagePrice)}</td></tr>` : ""}
            <tr><td style="padding:8px 0;font-weight:bold">Stay / Hotel</td><td>${escapeHtml(propertyName || "Not decided")}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Name</td><td>${escapeHtml(fullName)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Email</td><td>${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Phone</td><td>${escapeHtml(phone || "Not provided")}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Destination</td><td>${escapeHtml(destination)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Check-in</td><td>${escapeHtml(checkIn)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Check-out</td><td>${escapeHtml(checkOut)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Nights</td><td>${escapeHtml(nights)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Adults</td><td>${escapeHtml(adults)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Children</td><td>${escapeHtml(children)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Room</td><td>${escapeHtml(roomType)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Rooms</td><td>${escapeHtml(rooms)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Meal Plan</td><td>${escapeHtml(mealPlan)}</td></tr>
            ${nightlyRate ? `<tr><td style="padding:8px 0;font-weight:bold">Nightly Rate</td><td>USD ${escapeHtml(nightlyRate)} per room/night</td></tr>` : ""}
            ${estimatedTotal ? `<tr><td style="padding:8px 0;font-weight:bold">Booking Total</td><td style="font-weight:bold">USD ${escapeHtml(estimatedTotal)}</td></tr>` : ""}
            <tr><td style="padding:8px 0;font-weight:bold">Special Request</td><td>${escapeHtml(specialRequests || "None")}</td></tr>
          </tbody></table>
          <p style="margin-top:24px;color:#666;font-size:13px">Please confirm availability and final booking details with the customer.</p>
        </div>
      </div>`;

    const { response: adminResponse, result: adminResult } = await sendResend(apiKey, {
      from: "Tripelor Bookings <onboarding@resend.dev>",
      to: [BOOKING_EMAIL],
      reply_to: email,
      subject,
      html: adminHtml,
    });

    if (!adminResponse.ok) {
      console.error("Resend admin email error", adminResult);
      return Response.json({ error: adminResult?.message || "Unable to send booking email." }, { status: 500 });
    }

    const customerHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6">
        <div style="background:#0a0a0a;color:#d4af37;padding:22px 26px;border-radius:14px 14px 0 0">
          <h1 style="margin:0;font-size:24px">Tripelor Booking Request Received</h1>
        </div>
        <div style="border:1px solid #e5e5e5;border-top:0;padding:26px;border-radius:0 0 14px 14px">
          <p>Dear ${escapeHtml(fullName)},</p>
          <p>Thank you for choosing Tripelor. We have received your booking request and will confirm availability shortly.</p>
          <table style="width:100%;border-collapse:collapse"><tbody>
            ${packageName ? `<tr><td style="padding:8px 0;font-weight:bold">Package</td><td>${escapeHtml(packageName)}</td></tr>` : ""}
            ${packagePrice ? `<tr><td style="padding:8px 0;font-weight:bold">Package Price</td><td>USD ${escapeHtml(packagePrice)}</td></tr>` : ""}
            <tr><td style="padding:8px 0;font-weight:bold">Stay / Hotel</td><td>${escapeHtml(propertyName || "To be confirmed")}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Check-in</td><td>${escapeHtml(checkIn)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Check-out</td><td>${escapeHtml(checkOut)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Nights</td><td>${escapeHtml(nights)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Adults</td><td>${escapeHtml(adults)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Children</td><td>${escapeHtml(children)}</td></tr>
            <tr><td style="padding:8px 0;font-weight:bold">Meal Plan</td><td>${escapeHtml(mealPlan)}</td></tr>
            ${estimatedTotal ? `<tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="font-weight:bold">USD ${escapeHtml(estimatedTotal)}</td></tr>` : ""}
          </tbody></table>
          <p style="margin-top:24px">This email confirms that we received your request. Your reservation is not final until Tripelor confirms availability.</p>
          <p>Regards,<br><strong>Tripelor</strong></p>
        </div>
      </div>`;

    try {
      const { response: customerResponse, result: customerResult } = await sendResend(apiKey, {
        from: "Tripelor Bookings <onboarding@resend.dev>",
        to: [email],
        subject: `Tripelor booking request received - ${escapeHtml(bookingTitle)}`,
        html: customerHtml,
      });
      if (!customerResponse.ok) console.error("Resend customer confirmation error", customerResult);
    } catch (customerError) {
      console.error("Customer confirmation email error", customerError);
    }

    return Response.json({ success: true, id: adminResult.id });
  } catch (error) {
    console.error("Booking email error", error);
    return Response.json({ error: "Something went wrong while sending the booking request." }, { status: 500 });
  }
}
