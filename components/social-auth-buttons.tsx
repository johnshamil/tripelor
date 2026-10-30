"use client";

import { useEffect, useState } from "react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M21.35 11.1H12v2.98h5.38c-.23 1.52-1.74 4.46-5.38 4.46A6.54 6.54 0 1 1 12 5.46c2.07 0 3.46.88 4.25 1.64l2.9-2.8C17.28 2.56 14.88 1.5 12 1.5a10.5 10.5 0 1 0 0 21c6.06 0 10.08-4.26 10.08-10.26 0-.69-.08-1.2-.17-1.71l-.56.57Z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="currentColor" d="M16.37 12.14c.02 2.05 1.8 2.73 1.82 2.74-.02.05-.28.97-.94 1.91-.57.81-1.17 1.62-2.1 1.64-.91.02-1.21-.54-2.26-.54-1.04 0-1.38.52-2.24.56-.9.03-1.59-.89-2.17-1.69-1.18-1.7-2.08-4.81-.87-6.91.6-1.04 1.68-1.7 2.85-1.72.89-.02 1.73.6 2.27.6.54 0 1.56-.74 2.63-.63.45.02 1.71.18 2.52 1.37-.07.04-1.5.88-1.51 2.67Zm-1.71-5.17c.48-.58.81-1.39.72-2.2-.69.03-1.53.46-2.03 1.04-.45.52-.84 1.34-.74 2.13.77.06 1.56-.39 2.05-.97Z"/>
    </svg>
  );
}

export default function SocialAuthButtons({ nextPath = "/account" }: { nextPath?: string }) {
  const [providers, setProviders] = useState({ google: false, apple: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/providers", { cache: "no-store" })
      .then(response => response.json())
      .then(data => setProviders({ google: Boolean(data.google), apple: Boolean(data.apple) }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || (!providers.google && !providers.apple)) return null;

  const href = (provider: "google" | "apple") =>
    `/auth/oauth/start?provider=${provider}&next=${encodeURIComponent(nextPath || "/account")}`;

  return (
    <div className="mt-7">
      <div className="grid gap-3">
        {providers.google && (
          <a href={href("google")} className="flex min-h-12 items-center justify-center gap-3 border border-[#cfc4af] bg-white px-4 text-sm font-semibold text-[#071922] transition hover:border-[#9c7d3d]">
            <GoogleIcon /> Continue with Google
          </a>
        )}
        {providers.apple && (
          <a href={href("apple")} className="flex min-h-12 items-center justify-center gap-3 bg-black px-4 text-sm font-semibold text-white transition hover:bg-[#171717]">
            <AppleIcon /> Continue with Apple
          </a>
        )}
      </div>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#ddd3c2]" />
        <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#8b9496]">or use email</span>
        <span className="h-px flex-1 bg-[#ddd3c2]" />
      </div>
    </div>
  );
}
