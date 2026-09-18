"use client";

import Link from "next/link";
import { Copy, Download, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSiteLanguage } from "@/components/use-site-language";

export default function StoryPublicActions({ title }: { title: string }) {
  const locale = useSiteLanguage();
  const [copied, setCopied] = useState(false);
  const copy = locale === "it"
    ? { share: "Condividi", copy: "Copia link", copied: "Link copiato", pdf: "Salva PDF", plan: "Crea la mia fuga alle Maldive", text: "Scopri la mia Maldives Story creata con Tripelor." }
    : locale === "ru"
      ? { share: "Поделиться", copy: "Скопировать ссылку", copied: "Ссылка скопирована", pdf: "Сохранить PDF", plan: "Спланировать мои Мальдивы", text: "Посмотрите мою Maldives Story, созданную с Tripelor." }
      : { share: "Share Story", copy: "Copy Link", copied: "Link Copied", pdf: "Save PDF", plan: "Plan My Maldives Escape", text: "See my Maldives Story, created with Tripelor." };

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: copy.text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // Share sheet can be dismissed without an error message.
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="story-no-print flex flex-wrap justify-center gap-3">
      <button type="button" onClick={share} className="btn-gold gap-2">
        <Share2 className="h-4 w-4" /> {copy.share}
      </button>
      <button type="button" onClick={copyLink} className="btn-outline gap-2 border-white/25 text-white">
        <Copy className="h-4 w-4" /> {copied ? copy.copied : copy.copy}
      </button>
      <button type="button" onClick={() => window.print()} className="btn-outline gap-2 border-white/25 text-white">
        <Download className="h-4 w-4" /> {copy.pdf}
      </button>
      <Link href="/build-your-trip" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#e3ca91]/40 px-5 text-sm font-semibold text-[#e3ca91] transition hover:bg-[#e3ca91]/10">
        <Sparkles className="h-4 w-4" /> {copy.plan}
      </Link>
    </div>
  );
}
