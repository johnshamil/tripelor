export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return Response.json({ error: "Review database is not configured." }, { status: 500 });
    }

    const url = `${supabaseUrl}/rest/v1/reviews?select=id,property_name,guest_name,country,rating,review_title,review_text,stay_date,created_at&status=eq.approved&order=created_at.desc`;
    const dbResponse = await fetch(url, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });

    if (!dbResponse.ok) {
      console.error("Supabase review fetch failed:", await dbResponse.text());
      return Response.json({ error: "Unable to load reviews." }, { status: 500 });
    }

    const reviews = await dbResponse.json();
    return Response.json({ reviews });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Unable to load reviews." }, { status: 500 });
  }
}
