"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/account";
}

export default function SocialCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const query = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const next = safeNext(query.get("next"));
        const accessToken = hash.get("access_token") || "";
        const refreshToken = hash.get("refresh_token") || "";
        const expiresIn = Number(hash.get("expires_in") || 3600);

        if (!accessToken) {
          setError(hash.get("error_description") || query.get("error_description") || "Social sign-in did not return a valid session.");
          return;
        }

        history.replaceState(null, "", window.location.pathname + window.location.search);

        const response = await fetch("/api/auth/social-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, refreshToken, expiresIn }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to complete social sign-in.");

        window.location.replace(next);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to complete social sign-in.");
      }
    })();
  }, []);

  return (
    <main className="bg-[#f1ebdf] text-[#071922]">
      <div className="container flex min-h-[65vh] items-center justify-center py-12">
        <div className="w-full max-w-md border border-[#d0c5b0] bg-[#fffdf8] p-8 text-center shadow-[0_30px_100px_rgba(34,43,46,.12)]">
          {error ? (
            <>
              <h1 className="font-display text-4xl">Sign-in could not be completed.</h1>
              <p className="mt-4 text-sm leading-7 text-[#687377]">{error}</p>
              <Link href="/login" className="btn-gold mt-6 justify-center">Back to Sign In</Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl">Connecting your Tripelor account…</h1>
              <p className="mt-4 text-sm leading-7 text-[#687377]">Your Maldives Pass and saved journey will be ready in a moment.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
