const BOOKING_EMAIL = "johnshamil87@gmail.com";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Email service is not configured yet." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      destination,
      checkIn,
      checkOut,
      nights,
      adults,
      children,
      roomType,
      rooms,
      mealPlan,
      specialRequests,
    } = body;

    if (!fullName || !email || !checkIn || !checkOut) {
      return Response.json(
        { error: "Name, email, check-in and check-out are required." },
        { status: 400 }
      );
    }

    const subject = `New Tripelor booking request - ${escapeHtml(fullName)}`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;color:#111;line-height:1.6">
        <div style="background:#0a0a0a;color:#d4af37;padding:22px 26px;border-radius:14px 14px 0 0">
          <h1 style="margin:0;font-size:24px">New Tripelor Booking Request</h1>
        </div>
        <div style="border:1px solid #e5e5e5;border-top:0;padding:26px;border-radius:0 0 14px 14px">
          <p>A customer submitted a hotel booking request through Tripelor.</p>
          <table style="width:100%;border-collapse:collapse">
            <tbody>
              <tr><td style="padding:8px 0;font-weight:bold">Name</td><td>${escapeHtml(fullName)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Email</td><td>${escapeHtml(email)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Phone / WhatsApp</td><td>${escapeHtml(phone || "Not provided")}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Destination</td><td>${escapeHtml(destination)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Check-in</td><td>${escapeHtml(checkIn)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Check-out</td><td>${escapeHtml(checkOut)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Nights</td><td>${escapeHtml(nights)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Adults</td><td>${escapeHtml(adults)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Children</td><td>${escapeHtml(children)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Room</td><td>${escapeHtml(roomType)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Rooms</td><td>${escapeHtml(rooms)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Meal Plan</td><td>${escapeHtml(mealPlan)}</td></tr>
              <tr><td style="padding:8px 0;font-weight:bold">Special Request</td><td>${escapeHtml(specialRequests || "None")}</td></tr>
            </tbody>
          </table>
          <p style="margin-top:24px;color:#666;font-size:13px">Submitted from the Tripelor website booking form.</p>
        </div>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tripelor Bookings <onboarding@resend.dev>",
        to: [BOOKING_EMAIL],
        reply_to: email,
        subject,
        html,
      }),
    });

    const result = await resendResponse.json();
    if (!resendResponse.ok) {
      console.error("Resend error", result);
      return Response.json(
        { error: result?.message || "Unable to send booking email." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Booking email error", error);
    return Response.json(
      { error: "Something went wrong while sending the booking request." },
      { status: 500 }
    );
  }
}
