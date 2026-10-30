"use client";

import { useEffect } from "react";

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export default function MarketLanguageSync({ code }: { code: string }) {
  useEffect(() => {
    const current = readCookie("tripelor_lang");
    if (current === code) return;

    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `tripelor_lang=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;

    const professional = code === "it" || code === "ru";
    const googleValue = professional ? "" : `/en/${code}`;
    document.cookie = `googtrans=${googleValue}; path=/; max-age=${googleValue ? maxAge : 0}; SameSite=Lax`;

    if (location.hostname === "tripelor.com" || location.hostname.endsWith(".tripelor.com")) {
      document.cookie = `tripelor_lang=${encodeURIComponent(code)}; path=/; domain=.tripelor.com; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `googtrans=${googleValue}; path=/; domain=.tripelor.com; max-age=${googleValue ? maxAge : 0}; SameSite=Lax`;
    }

    try { localStorage.setItem("tripelor_language", code); } catch {}

    if (professional) {
      window.dispatchEvent(new Event("tripelor:language-changed"));
    } else {
      window.location.reload();
    }
  }, [code]);

  return null;
}
