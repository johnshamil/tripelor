import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/favicon.ico",
  "/tripelor-favicon.svg",
];

function isPublic(pathname:string){
  if (pathname.startsWith("/_next/")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/uhoos/")) return true;
  if (pathname.startsWith("/packages/")) return true;
  if (/\.(?:png|jpg|jpeg|webp|svg|gif|ico|mp4|webm|woff2?)$/i.test(pathname)) return true;
  return PUBLIC_PATHS.some(p=>pathname===p || pathname.startsWith(`${p}/`));
}

export function middleware(request:NextRequest){
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const accessToken = request.cookies.get("tripelor_access_token")?.value;
  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
