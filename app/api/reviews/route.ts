const OWNER = "bookings@tripelor.com";

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    const b = await req.json();

    if (!b.property || !b.name || !b.email || !b.rating || !b.review || b.permission !== "yes") {
      return Response.json(
        { error: "Please complete all required fields and publication permission." },
        { status: 400 }
      );
    }

    const rating = Math.max(1, Math.min(5, Number(b.rating) || 0));
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: "Review database is not configured." }, { status: 500 });
    }

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/reviews`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        property_name: String(b.property),
        guest_name: String(b.name),
        country: b.country ? String(b.country) : null,
        rating,
        review_title: b.title ? String(b.title) : null,
        review_text: String(b.review),
        stay_date: b.stayDate ? String(b.stayDate) : null,
        status: "pending",
      }),
      cache: "no-store",
    });

    if (!dbResponse.ok) {
      const text = await dbResponse.text();
      console.error("Supabase review insert failed:", text);
      return Response.json({ error: "Unable to save your review." }, { status: 500 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const html = `<div style="font-family:Arial,sans-serif;max-width:700px;margin:auto">
        <h1>New Tripelor Guest Review</h1>
        <p><b>Status:</b> Pending approval</p>
        <hr>
        <p><b>Property:</b> ${esc(b.property)}</p>
        <p><b>Guest:</b> ${esc(b.name)}</p>
        <p><b>Email (private):</b> ${esc(b.email)}</p>
        <p><b>Country:</b> ${esc(b.country || "Not provided")}</p>
        <p><b>Date of stay:</b> ${esc(b.stayDate || "Not provided")}</p>
        <p><b>Rating:</b> ${"★".repeat(rating)}${"☆".repeat(5 - rating)}</p>
        <p><b>Title:</b> ${esc(b.title || "No title")}</p>
        <h3>Review</h3>
        <p>${esc(b.review).replace(/\n/g, "<br>")}</p>
      </div>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Tripelor Reviews <bookings@tripelor.com>",
          to: [OWNER],
          bcc: ["johnshamil87@gmail.com"],
          reply_to: b.email,
          subject: `New ${rating}-star Tripelor review - ${esc(b.name)}`,
          html,
        }),
      });
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json(
      { error: "Something went wrong while submitting your review." },
      { status: 500 }
    );
  }
}
