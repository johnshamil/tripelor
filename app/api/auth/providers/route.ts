import { supabaseAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await supabaseAuth("settings");
    if (!response.ok) return Response.json({ google: false, apple: false }, { status: 200 });
    const settings = await response.json();
    return Response.json({
      google: Boolean(settings?.external?.google),
      apple: Boolean(settings?.external?.apple),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ google: false, apple: false }, { status: 200 });
  }
}
