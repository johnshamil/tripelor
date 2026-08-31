import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "tripelor_access";
const REFRESH_COOKIE = "tripelor_refresh";

const PROTECTED_PREFIXES = [
  "/account",
  "/admin",
  "/booking",
  "/build-your-trip",
  "/speedboat",
  "/api/account",
  "/api/admin",
  "/api/booking",
  "/api/speedboat",
];

const PUBLIC_EXCEPTIONS = new Set([
  "/account/forgot-password",
  "/account/reset-password",
  "/api/speedboat/schedule",
]);

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function requiresLogin(pathname: string) {
  if (PUBLIC_EXCEPTIONS.has(pathname)) return false;
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function authConfig() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

async function accessTokenIsValid(accessToken: string) {
  const { url, key } = authConfig();
  if (!url || !key) return false;
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function refreshSession(refreshToken: string) {
  const { url, key } = authConfig();
  if (!url || !key) return null;
  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const session = await response.json();
    return session?.access_token ? session : null;
  } catch {
    return null;
  }
}

function unauthorizedResponse(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!requiresLogin(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken && (await accessTokenIsValid(accessToken))) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return unauthorizedResponse(request);

  const session = await refreshSession(refreshToken);
  if (!session) return unauthorizedResponse(request);

  request.cookies.set(ACCESS_COOKIE, session.access_token);
  if (session.refresh_token) request.cookies.set(REFRESH_COOKIE, session.refresh_token);
  const response = NextResponse.next({ request });
  const secureCookie = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" };
  response.cookies.set(ACCESS_COOKIE, session.access_token, {
    ...secureCookie,
    maxAge: Number(session.expires_in || 3600),
  });
  if (session.refresh_token) {
    response.cookies.set(REFRESH_COOKIE, session.refresh_token, {
      ...secureCookie,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|gif|ico|mp4|webm|woff2?)$).*)"],
};
