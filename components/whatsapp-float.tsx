"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppFloat(){
  const message=encodeURIComponent("Hello Tripelor, I would like help planning my Maldives stay.");
  return <a href={`https://wa.me/9609429403?text=${message}`} target="_blank" rel="noreferrer" aria-label="Chat with Tripelor on WhatsApp" className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 font-semibold text-black shadow-2xl transition hover:-translate-y-1 hover:scale-[1.03] active:scale-95">
    <MessageCircle className="h-5 w-5"/><span className="hidden sm:inline">WhatsApp Tripelor</span>
  </a>;
}
