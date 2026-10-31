import { setSession, supabaseAuth } from "@/lib/auth-server";
import { notifyCustomerSignIn } from "@/lib/signin-notifications";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;
    if (origin && ![requestOrigin, "https://tripelor.com", "https://www.tripelor.com"].includes(origin)) {
      return Response.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const body = await request.json();
    const accessToken = typeof body?.accessToken === "string" ? body.accessToken : "";
    const refreshToken = typeof body?.refreshToken === "string" ? body.refreshToken : "";
    const expiresIn = Math.max(300, Math.min(86400, Number(body?.expiresIn || 3600)));

    if (!accessToken || accessToken.length > 5000 || refreshToken.length > 5000) {
      return Response.json({ error: "Invalid social login session." }, { status: 400 });
    }

    const userResponse = await supabaseAuth("user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) {
      return Response.json({ error: "Unable to verify social login." }, { status: 401 });
    }
    const user = await userResponse.json();
    if (!user?.id) {
      return Response.json({ error: "Unable to verify social login." }, { status: 401 });
    }

    setSession(accessToken, refreshToken || undefined, expiresIn);
    await notifyCustomerSignIn(user);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Unable to complete social login." }, { status: 500 });
  }
}
