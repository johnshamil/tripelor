"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";

const SESSION_KEY = "tripelor_exit_prompt_seen_v1";

export default function SignupExitPrompt() {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState("/");

  useEffect(() => {
    if (!window.location.pathname.startsWith("/stays/")) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setPath(window.location.pathname + window.location.search);

    const reveal = () => {
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, "1");
      setOpen(true);
    };

    const onMouseLeave = (event: MouseEvent) => {
      if (event.clientY <= 8) reveal();
    };

    document.addEventListener("mouseleave", onMouseLeave);
    const timer = window.setTimeout(reveal, 45000);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(timer);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-x-3 bottom-4 z-[80] mx-auto max-w-xl rounded-3xl border border-[#d9bd7b]/45 bg-[#06151c]/95 p-5 text-white shadow-2xl backdrop-blur-xl md:bottom-6">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/15"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="pr-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#d9bd7b]">
          <BellRing className="h-4 w-4" /> Before you go
        </p>
        <h2 className="font-display mt-3 text-3xl">Save this stay and watch the price.</h2>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Create a free Tripelor account to unlock price-drop alerts, room availability alerts, 100 welcome points and member-rate requests.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href={"/signup?next=" + encodeURIComponent(path)} className="btn-gold justify-center">
            Save this stay free
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="btn-outline justify-center border-white/25 text-white">
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
