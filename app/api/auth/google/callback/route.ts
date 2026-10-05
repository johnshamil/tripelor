import { NextRequest, NextResponse } from "next/server";
import { setSession, supabaseAuth } from "@/lib/auth-server";
import { customerDestination, GOOGLE_NEXT_COOKIE, GOOGLE_VERIFIER_COOKIE, googleFlowCookieOptions } from "@/lib/google-oauth";
import { notifyCustomerSignIn } from "@/lib/signin-notifications";

export const dynamic = "force-dynamic";

function redirectAndClear(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, "", { ...googleFlowCookieOptions, maxAge: 0 });
  response.cookies.set(GOOGLE_NEXT_COOKIE, "", { ...googleFlowCookieOptions, maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const verifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;
  const code = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.searchParams.get("error") === "access_denied") {
    return redirectAndClear(request, "/login?google=cancelled");
  }
  if (!verifier || !code) {
    return redirectAndClear(request, "/login?google=failed");
  }

  try {
    const response = await supabaseAuth("token?grant_type=pkce", {
      method: "POST",
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    if (!response.ok) return redirectAndClear(request, "/login?google=failed");
    const session = await response.json();
    if (!session.access_token || !session.user?.id) {
      return redirectAndClear(request, "/login?google=failed");
    }

    setSession(session.access_token, session.refresh_token, session.expires_in);
    await notifyCustomerSignIn(session.user);
    const destination = customerDestination(request.cookies.get(GOOGLE_NEXT_COOKIE)?.value);
    return redirectAndClear(request, destination);
  } catch {
    return redirectAndClear(request, "/login?google=failed");
  }
}
