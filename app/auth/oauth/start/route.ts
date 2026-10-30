import { NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/auth-server";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/account";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.redirect(new URL("/login?social=unsupported", url.origin));
  }

  const next = safeNext(url.searchParams.get("next"));
  const callback = new URL("/auth/social-callback", url.origin);
  callback.searchParams.set("next", next);

  const authPath = `authorize?provider=${encodeURIComponent(provider)}&redirect_to=${encodeURIComponent(callback.toString())}`;
  const response = await supabaseAuth(authPath, { redirect: "manual" });
  const location = response.headers.get("location");

  if (!location) {
    return NextResponse.redirect(new URL(`/login?social=${provider}-unavailable`, url.origin));
  }

  return NextResponse.redirect(location);
}
