"use client";

import { Copy, Mail, MessageCircle, Printer, Share2 } from "lucide-react";
import { useState } from "react";

export default function ManualQuotationActions({
  reference,
  customerName,
  total,
  currency,
  customerEmail,
}: {
  reference: string;
  customerName: string;
  total: number;
  currency: "USD" | "MVR";
  customerEmail?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    const text = `Tripelor quotation ${reference} for ${customerName} · ${currency} ${total.toFixed(2)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Tripelor Quotation ${reference}`, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Share cancellation requires no action.
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function print() {
    document.body.classList.add("manual-quote-print-mode");
    window.print();
    window.setTimeout(() => document.body.classList.remove("manual-quote-print-mode"), 300);
  }

  const message = encodeURIComponent(
    `Hello, please find your Tripelor quotation ${reference} for ${currency} ${total.toFixed(2)}: ${typeof window !== "undefined" ? window.location.href : ""}`,
  );

  return (
    <div className="no-print mt-6 grid gap-2 sm:grid-cols-2">
      <button type="button" onClick={share} className="btn-gold justify-center">
        <Share2 className="h-4 w-4" /> Share Quote
      </button>
      <button type="button" onClick={copy} className="btn-outline justify-center">
        <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy Link"}
      </button>
      <a
        href={`https://wa.me/?text=${message}`}
        target="_blank"
        rel="noreferrer"
        className="btn-outline justify-center"
      >
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <button type="button" onClick={print} className="btn-outline justify-center">
        <Printer className="h-4 w-4" /> Save / Print PDF
      </button>
      {customerEmail && (
        <a
          href={`mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(`Tripelor Quotation ${reference}`)}&body=${message}`}
          className="btn-outline justify-center sm:col-span-2"
        >
          <Mail className="h-4 w-4" /> Email Quote
        </a>
      )}
    </div>
  );
}
