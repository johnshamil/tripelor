import { setSession, supabaseAuth } from "@/lib/auth-server";
import { notifyCustomerSignIn } from "@/lib/signin-notifications";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }
    const response = await supabaseAuth("token?grant_type=password", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: result?.error_description || result?.msg || "Incorrect email or password." },
        { status: response.status },
      );
    }
    if (!result.access_token || !result.user?.id) {
      return Response.json({ error: "Unable to create your session. Please try again." }, { status: 502 });
    }
    setSession(result.access_token, result.refresh_token, result.expires_in);
    await notifyCustomerSignIn(result.user);
    return Response.json({ success: true, user: result.user });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to log in." },
      { status: 500 },
    );
  }
}
