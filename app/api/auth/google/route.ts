import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { customerDestination, GOOGLE_NEXT_COOKIE, GOOGLE_VERIFIER_COOKIE, googleFlowCookieOptions } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!supabaseUrl) {
    return NextResponse.redirect(new URL("/login?google=unavailable", request.url));
  }

  // A browser-bound verifier lets the callback exchange the code for the same
  // httpOnly session cookies as the existing email/password login.
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const callback = new URL("/api/auth/google/callback", request.url);
  const authorize = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callback.toString());
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "s256");

  const response = NextResponse.redirect(authorize);
  response.headers.set("Cache-Control", "private, no-store");
  response.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, googleFlowCookieOptions);
  response.cookies.set(GOOGLE_NEXT_COOKIE, customerDestination(request.nextUrl.searchParams.get("next")), googleFlowCookieOptions);
  return response;
}
