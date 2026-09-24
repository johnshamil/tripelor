"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type AnalyticsEvent =
  | "page_view"
  | "property_view"
  | "booking_started"
  | "booking_completed"
  | "whatsapp_click"
  | "account_signup"
  | "account_login";

const VISITOR_KEY = "tripelor_visitor_id";
const SESSION_KEY = "tripelor_session_id";
const SOURCE_KEY = "tripelor_traffic_source";

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  const randomByte = () =>
    typeof crypto !== "undefined" && "getRandomValues" in crypto
      ? crypto.getRandomValues(new Uint8Array(1))[0]
      : Math.floor(Math.random() * 256);
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (character) =>
    (Number(character) ^ (randomByte() & (15 >> (Number(character) / 4)))).toString(16),
  );
}

function storedId(storage: Storage, key: string) {
  const current = storage.getItem(key);
  if (current) return current;
  const value = makeId();
  storage.setItem(key, value);
  return value;
}

function trafficDetails() {
  const params = new URLSearchParams(window.location.search);
  const campaignSource = params.get("utm_source");
  const campaignMedium = params.get("utm_medium");
  const campaignName = params.get("utm_campaign");
  const paidSource = params.has("gclid")
    ? "Google Ads"
    : params.has("fbclid")
      ? "Meta Ads"
      : params.has("yclid")
        ? "Yandex Ads"
        : "";

  let source = campaignSource || paidSource;
  if (!source && document.referrer) {
    try {
      const referrerHost = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (referrerHost && referrerHost !== window.location.hostname.replace(/^www\./, "")) {
        source = referrerHost;
      }
    } catch {}
  }

  if (source) sessionStorage.setItem(SOURCE_KEY, source);

  return {
    source: source || sessionStorage.getItem(SOURCE_KEY) || "Direct",
    campaignMedium: campaignMedium || undefined,
    campaignName: campaignName || undefined,
  };
}

function deviceType() {
  const userAgent = navigator.userAgent;
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

function sendEvent(eventName: AnalyticsEvent, path: string, metadata: Record<string, string | undefined> = {}) {
  const traffic = trafficDetails();
  const body = {
    eventName,
    path,
    visitorId: storedId(localStorage, VISITOR_KEY),
    sessionId: storedId(sessionStorage, SESSION_KEY),
    referrer: document.referrer || undefined,
    source: traffic.source,
    device: deviceType(),
    metadata: {
      ...metadata,
      campaignMedium: traffic.campaignMedium,
      campaignName: traffic.campaignName,
    },
  };

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

function inferredClickEvent(element: HTMLElement): AnalyticsEvent | null {
  const configured = element.dataset.analyticsEvent as AnalyticsEvent | undefined;
  if (configured) return configured;

  if (!(element instanceof HTMLAnchorElement)) return null;
  const href = element.getAttribute("href") || "";
  if (/wa\.me|whatsapp/i.test(href)) return "whatsapp_click";
  if (href.startsWith("/stays/")) return "property_view";
  if (href.startsWith("/booking") || href.startsWith("/build-your-trip")) return "booking_started";
  return null;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef("");

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || lastPath.current === pathname) return;
    lastPath.current = pathname;

    sendEvent("page_view", pathname, { title: document.title.slice(0, 160) });

    if (pathname.startsWith("/booking/confirmation")) {
      const conversionKey = `tripelor_conversion:${pathname}`;
      if (!sessionStorage.getItem(conversionKey)) {
        sessionStorage.setItem(conversionKey, "1");
        sendEvent("booking_completed", pathname);
      }
    }
  }, [pathname]);

  useEffect(() => {
    function trackClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button") : null;
      if (!target) return;
      const eventName = inferredClickEvent(target);
      if (!eventName) return;

      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "";
      sendEvent(eventName, window.location.pathname, {
        destination: href.slice(0, 300),
        label: (target.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
      });
    }

    document.addEventListener("click", trackClick, { capture: true });
    return () => document.removeEventListener("click", trackClick, { capture: true });
  }, []);

  useEffect(() => {
    function trackAccountEvent(event: Event) {
      const detail = (event as CustomEvent<{
        eventName?: "account_signup" | "account_login";
        metadata?: Record<string, string | undefined>;
      }>).detail;
      if (!detail || !["account_signup", "account_login"].includes(detail.eventName || "")) return;
      sendEvent(detail.eventName as AnalyticsEvent, window.location.pathname, detail.metadata || {});
    }

    window.addEventListener("tripelor:analytics", trackAccountEvent);
    return () => window.removeEventListener("tripelor:analytics", trackAccountEvent);
  }, []);

  return null;
}
