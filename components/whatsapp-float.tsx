"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat() {
  const message = encodeURIComponent(
    "Hello Tripelor, I would like help planning my Maldives stay.",
  );

  return (
    <a
      href={`https://wa.me/9609429403?text=${message}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Tripelor on WhatsApp"
      className="fixed bottom-[6.25rem] right-3 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] font-semibold text-black shadow-2xl transition hover:-translate-y-1 hover:scale-[1.03] active:scale-95 md:bottom-5 md:right-5 md:h-auto md:w-auto md:gap-2 md:px-4 md:py-3"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden md:inline">WhatsApp Tripelor</span>
    </a>
  );
}
