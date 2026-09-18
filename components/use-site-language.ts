"use client";

import { useEffect, useState } from "react";
import { professionalLocale, type ProfessionalLocale } from "@/lib/professional-translations";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export function useSiteLanguage(): ProfessionalLocale {
  const [locale, setLocale] = useState<ProfessionalLocale>("en");

  useEffect(() => {
    const refresh = () => setLocale(professionalLocale(readCookie("tripelor_lang")));
    refresh();
    window.addEventListener("tripelor:language-changed", refresh);
    return () => window.removeEventListener("tripelor:language-changed", refresh);
  }, []);

  return locale;
}
