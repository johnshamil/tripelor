import { setSession, supabaseAuth } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    if (!email || !password || !fullName) {
      return Response.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (String(password).length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const response = await supabaseAuth("signup", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        data: { full_name: fullName },
        options: { email_redirect_to: "https://tripelor.com/account" },
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: result?.msg || result?.error_description || "Unable to create account." },
        { status: response.status },
      );
    }

    if (result.access_token) {
      setSession(result.access_token, result.refresh_token, result.expires_in);
    }
    return Response.json({
      success: true,
      signedIn: Boolean(result.access_token),
      needsConfirmation: !result.access_token,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create account." },
      { status: 500 },
    );
  }
}
