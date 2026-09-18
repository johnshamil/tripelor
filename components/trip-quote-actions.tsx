"use client";

import { useState } from "react";
import { ArrowRight, Copy, Download, Mail, MessageCircle, Share2, SlidersHorizontal } from "lucide-react";
import { CART_STORAGE_KEY, type CartLine } from "@/lib/trip-cart";
import { PLAN_START_STORAGE_KEY, resolveTripStart } from "@/lib/trip-itinerary";
import { useSiteLanguage } from "@/components/use-site-language";

export default function TripQuoteActions({
  reference,
  lines,
  total,
  requestHref,
  customizeHref,
}: {
  reference: string;
  lines: CartLine[];
  total: number;
  requestHref?: string;
  customizeHref?: string;
}) {
  const locale = useSiteLanguage();
  const [copied, setCopied] = useState(false);
  const copy = locale === "it"
    ? {
        share: "Condividi il viaggio",
        copy: "Copia link",
        copied: "Link copiato",
        whatsapp: "Invia su WhatsApp",
        email: "Invia via email",
        pdf: "Scarica proposta PDF",
        customize: "Personalizza il viaggio",
        request: "Richiedi questo viaggio",
        subject: `Proposta Tripelor ${reference}`,
        message: `Ecco la mia proposta Tripelor ${reference} — totale stimato USD ${total.toLocaleString("en-US")}.`,
      }
    : locale === "ru"
      ? {
          share: "Поделиться поездкой",
          copy: "Скопировать ссылку",
          copied: "Ссылка скопирована",
          whatsapp: "Отправить в WhatsApp",
          email: "Отправить по email",
          pdf: "Скачать PDF-предложение",
          customize: "Изменить поездку",
          request: "Запросить эту поездку",
          subject: `Предложение Tripelor ${reference}`,
          message: `Моё предложение Tripelor ${reference} — ориентировочная сумма USD ${total.toLocaleString("en-US")}.`,
        }
      : {
          share: "Share Trip",
          copy: "Copy Link",
          copied: "Link Copied",
          whatsapp: "Send to WhatsApp",
          email: "Email My Quote",
          pdf: "Download PDF Proposal",
          customize: "Customize Trip",
          request: "Request This Trip",
          subject: `Tripelor quote ${reference}`,
          message: `Here is my Tripelor quote ${reference} — estimated total USD ${total.toLocaleString("en-US")}.`,
        };

  function currentUrl() {
    return window.location.href;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(currentUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function shareTrip() {
    const url = currentUrl();
    if (navigator.share) {
      await navigator.share({ title: copy.subject, text: copy.message, url });
      return;
    }
    await copyLink();
  }

  function whatsapp() {
    const text = encodeURIComponent(`${copy.message}\n${currentUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function email() {
    const subject = encodeURIComponent(copy.subject);
    const body = encodeURIComponent(`${copy.message}\n\n${currentUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function savePlan() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
      localStorage.setItem(PLAN_START_STORAGE_KEY, resolveTripStart(lines));
    } catch {
      // Navigation still works; the destination will show the browser storage notice if needed.
    }
  }

  function customize() {
    if (customizeHref && customizeHref.startsWith("/")) {
      window.location.href = customizeHref;
      return;
    }
    savePlan();
    window.location.href = "/my-trip?view=plan";
  }

  function requestTrip() {
    if (requestHref && requestHref.startsWith("/booking?")) {
      window.location.href = requestHref;
      return;
    }
    savePlan();
    window.location.href = `/my-trip?view=plan&quote=${encodeURIComponent(reference)}#request-trip`;
  }

  function printPdf() {
    document.body.classList.add("quote-print-mode");
    const cleanup = () => document.body.classList.remove("quote-print-mode");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1500);
  }

  return (
    <div className="no-print mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={requestTrip} className="btn-gold w-full justify-center">
          {copy.request} <ArrowRight className="h-4 w-4" />
        </button>
        <button type="button" onClick={customize} className="btn-outline w-full justify-center">
          <SlidersHorizontal className="h-4 w-4" /> {copy.customize}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button type="button" onClick={shareTrip} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-white/75 hover:border-gold/30">
          <Share2 className="mx-auto mb-1 h-4 w-4 text-gold" /> {copy.share}
        </button>
        <button type="button" onClick={copyLink} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-white/75 hover:border-gold/30">
          <Copy className="mx-auto mb-1 h-4 w-4 text-gold" /> {copied ? copy.copied : copy.copy}
        </button>
        <button type="button" onClick={whatsapp} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-white/75 hover:border-gold/30">
          <MessageCircle className="mx-auto mb-1 h-4 w-4 text-gold" /> {copy.whatsapp}
        </button>
        <button type="button" onClick={email} className="min-h-11 rounded-xl border border-white/10 px-3 text-xs text-white/75 hover:border-gold/30">
          <Mail className="mx-auto mb-1 h-4 w-4 text-gold" /> {copy.email}
        </button>
        <button type="button" onClick={printPdf} className="col-span-2 min-h-11 rounded-xl border border-white/10 px-3 text-xs text-white/75 hover:border-gold/30 sm:col-span-1">
          <Download className="mx-auto mb-1 h-4 w-4 text-gold" /> {copy.pdf}
        </button>
      </div>
    </div>
  );
}
