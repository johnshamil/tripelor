"use client";

import { Globe2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Language = {
  code: string;
  label: string;
  short: string;
};

const LANGUAGES: Language[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "it", label: "Italiano", short: "IT" },
  { code: "ru", label: "Русский", short: "RU" },
  { code: "de", label: "Deutsch", short: "DE" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "es", label: "Español", short: "ES" },
  { code: "pt", label: "Português", short: "PT" },
  { code: "ar", label: "العربية", short: "AR" },
  { code: "zh-CN", label: "中文", short: "中文" },
  { code: "ja", label: "日本語", short: "日本" },
  { code: "ko", label: "한국어", short: "한국" },
  { code: "th", label: "ไทย", short: "TH" },
  { code: "hi", label: "हिन्दी", short: "HI" },
  { code: "dv", label: "ދިވެހި", short: "DV" },
];

const STORAGE_KEY = "tripelor_language";
const GOOGLE_TRANSLATE_SCRIPT = "tripelor-google-translate-script";
const GOOGLE_TRANSLATE_MOUNT = "tripelor-google-translate-element";

declare global {
  interface Window {
    google?: any;
    tripelorGoogleTranslateInit?: () => void;
  }
}

let loader: Promise<void> | null = null;

function readCookieLanguage() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return value.split("/").filter(Boolean).pop() || "";
}

function readTripelorLanguage() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)tripelor_lang=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function savedLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    return readTripelorLanguage() || readCookieLanguage() || localStorage.getItem(STORAGE_KEY) || "en";
  } catch {
    return readTripelorLanguage() || readCookieLanguage() || "en";
  }
}

function setLanguageCookies(code: string) {
  const professional = code === "it" || code === "ru";
  const googleValue = code === "en" || professional ? "" : `/en/${code}`;
  const googleMaxAge = googleValue ? 60 * 60 * 24 * 365 : 0;
  const languageMaxAge = 60 * 60 * 24 * 365;

  document.cookie = `tripelor_lang=${encodeURIComponent(code)}; path=/; max-age=${languageMaxAge}; SameSite=Lax`;
  document.cookie = `googtrans=${googleValue}; path=/; max-age=${googleMaxAge}; SameSite=Lax`;

  if (location.hostname === "tripelor.com" || location.hostname.endsWith(".tripelor.com")) {
    document.cookie = `tripelor_lang=${encodeURIComponent(code)}; path=/; domain=.tripelor.com; max-age=${languageMaxAge}; SameSite=Lax`;
    document.cookie = `googtrans=${googleValue}; path=/; domain=.tripelor.com; max-age=${googleMaxAge}; SameSite=Lax`;
  }

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Language selection still works with the cookie.
  }

  window.dispatchEvent(new Event("tripelor:language-changed"));
}

function ensureTranslateMount() {
  let mount = document.getElementById(GOOGLE_TRANSLATE_MOUNT);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = GOOGLE_TRANSLATE_MOUNT;
    mount.setAttribute("aria-hidden", "true");
    mount.style.position = "fixed";
    mount.style.left = "-10000px";
    mount.style.top = "-10000px";
    mount.style.width = "1px";
    mount.style.height = "1px";
    mount.style.overflow = "hidden";
    document.body.appendChild(mount);
  }
  return mount;
}

function initGoogleTranslate(resolve: () => void) {
  const google = window.google;
  if (!google?.translate?.TranslateElement) return false;
  const mount = ensureTranslateMount();
  if (!mount.dataset.initialized) {
    new google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: LANGUAGES.filter((language) => language.code !== "en")
          .map((language) => language.code)
          .join(","),
        autoDisplay: false,
      },
      GOOGLE_TRANSLATE_MOUNT,
    );
    mount.dataset.initialized = "true";
  }
  resolve();
  return true;
}

function loadGoogleTranslate() {
  if (typeof window === "undefined") return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    if (initGoogleTranslate(resolve)) return;

    window.tripelorGoogleTranslateInit = () => {
      if (!initGoogleTranslate(resolve)) {
        reject(new Error("Translation service unavailable."));
      }
    };

    let script = document.getElementById(GOOGLE_TRANSLATE_SCRIPT) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_TRANSLATE_SCRIPT;
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=tripelorGoogleTranslateInit";
      script.async = true;
      script.onerror = () => {
        loader = null;
        reject(new Error("Translation service failed to load."));
      };
      document.head.appendChild(script);
    }
  });

  return loader;
}

function waitForTranslateSelect(timeout = 4000): Promise<HTMLSelectElement | null> {
  const started = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        resolve(select);
        return;
      }
      if (Date.now() - started >= timeout) {
        resolve(null);
        return;
      }
      window.setTimeout(check, 80);
    };
    check();
  });
}

export default function LanguageSwitcher({
  fullWidth = false,
  compact = false,
}: {
  fullWidth?: boolean;
  compact?: boolean;
}) {
  const [language, setLanguage] = useState("en");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = savedLanguage();
    if (LANGUAGES.some((item) => item.code === code)) setLanguage(code);
    if (code !== "it" && code !== "ru" && code !== "en") {
      loadGoogleTranslate().catch(() => {});
    }
  }, []);

  const current = useMemo(
    () => LANGUAGES.find((item) => item.code === language) || LANGUAGES[0],
    [language],
  );

  async function changeLanguage(code: string) {
    if (code === language || busy) return;
    setBusy(true);
    setLanguage(code);
    setLanguageCookies(code);

    if (code === "en" || code === "it" || code === "ru") {
      window.location.reload();
      return;
    }

    try {
      await loadGoogleTranslate();
      const translateSelect = await waitForTranslateSelect();
      if (translateSelect) {
        translateSelect.value = code;
        translateSelect.dispatchEvent(new Event("change", { bubbles: true }));
        document.documentElement.lang = code;
        setBusy(false);
        return;
      }
    } catch {
      // Reload lets Google Translate retry using the saved language cookie.
    }

    window.location.reload();
  }

  return (
    <label
      className={[
        "group relative inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[.04] text-white transition hover:border-[#d9bd7b]/45 hover:bg-white/[.07]",
        fullWidth ? "w-full px-4" : compact ? "px-3" : "px-3.5",
      ].join(" ")}
      title="Choose your language"
    >
      <Globe2 className="h-4 w-4 shrink-0 text-[#d9bd7b]" aria-hidden="true" />
      <span className={compact ? "text-[11px] font-semibold" : "text-xs font-semibold"}>
        {compact ? current.short : language === "it" ? "Lingua" : language === "ru" ? "Язык" : "Language"}
      </span>
      <select
        value={language}
        disabled={busy}
        onChange={(event) => changeLanguage(event.target.value)}
        aria-label="Choose website language"
        className={[
          "absolute inset-0 h-full w-full cursor-pointer opacity-0",
          busy ? "cursor-wait" : "",
        ].join(" ")}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      {!compact && <span className="ml-auto text-[10px] uppercase tracking-[.15em] text-white/40">{current.short}</span>}
    </label>
  );
}
