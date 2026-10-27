import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.TRIPELOR_MOCK_PREVIEW !== "1") return new NextResponse(null, { status: 404 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return new NextResponse(null, { status: 403 });
  const form = await request.formData();
  const role = form.get("role");
  if (!["member", "admin", "signout"].includes(String(role))) return new NextResponse(null, { status: 400 });
  const next = String(form.get("next") || (role === "admin" ? "/admin/properties" : "/"));
  const safe = next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : "/";
  const response = NextResponse.redirect(new URL(safe, request.url), 303);
  response.cookies.set("tripelor_access", role === "signout" ? "" : `mock-${role}`, {
    httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: role === "signout" ? 0 : 7200,
  });
  response.cookies.set("tripelor_refresh", "", { path: "/", maxAge: 0 });
  return response;
}