"use client";

import Link from "next/link";
import { LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import TripelorMark from "@/components/tripelor-mark";

type User = { email: string; fullName: string; isAdmin?: boolean };

const primaryLinks = [
  ["/stays", "Stays"],
  ["/island-adventures", "Packages"],
  ["/experience-bundles", "Experiences"],
  ["/speedboat", "Transfers"],
  ["/reviews", "Reviews"],
];

const mobileLinks = [
  ["/", "Home"],
  ...primaryLinks,
  ["/account#referral-rewards", "Referral & Earn"],
  ["/contact", "Contact"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#041117]/95 backdrop-blur-xl">
      <div className="container flex h-[64px] items-center justify-between md:h-[76px]">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-2.5 md:gap-3"
          aria-label="Tripelor home"
        >
          <TripelorMark className="h-9 w-9 text-[#d9bd7b] transition duration-300 group-hover:text-[#f2dfb6] md:h-11 md:w-11" />
          <span>
            <span className="font-display block text-[1.18rem] leading-none tracking-[.08em] text-white md:text-[1.35rem]">
              TRIPELOR
            </span>
            <span className="mt-1 block text-[7px] uppercase tracking-[.26em] text-[#c9a86a] md:text-[8px] md:tracking-[.3em]">
              Maldives Travel
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {primaryLinks.map(([href, label]) => (
            <Link key={href} href={href} className="nav-tab">
              {label}
            </Link>
          ))}
          <Link href="/account" className="nav-tab gap-2" aria-label="My Tripelor account">
            <UserRound className="h-4 w-4" /> {user ? "My Trip" : "Sign In"}
          </Link>
          <Link href="/build-your-trip" className="btn-gold min-h-[44px] px-5 py-2">
            Plan My Trip
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[.04] text-white transition active:scale-95 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-[64px] z-[100] h-[calc(100dvh-64px)] overflow-hidden border-t border-white/10 bg-[#041117] md:top-[76px] md:h-[calc(100dvh-76px)] lg:hidden">
          <div className="flex h-full flex-col overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 md:px-6 md:pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[.25em] text-[#c9a86a]">Explore Tripelor</p>
              <p className="text-[10px] text-white/35">Tap anywhere to continue</p>
            </div>

            <nav className="grid" aria-label="Mobile navigation">
              {mobileLinks.map(([href, label], index) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="font-display flex min-h-[54px] items-center justify-between border-b border-white/10 text-xl text-white/90 active:bg-white/[.04] md:min-h-[58px] md:text-2xl"
                >
                  {label}
                  <span className="font-sans text-[9px] text-[#c9a86a]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-4">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex min-h-[50px] items-center gap-2 text-white/75"
              >
                <UserRound className="h-5 w-5 text-[#c9a86a]" /> {user ? "My Tripelor Account" : "Sign In to Tripelor"}
              </Link>
              {user && (
                <button
                  onClick={logout}
                  className="flex min-h-[50px] w-full items-center gap-2 text-left text-red-300"
                >
                  <LogOut className="h-5 w-5" /> Log Out
                </button>
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              <Link
                href="/build-your-trip"
                onClick={() => setOpen(false)}
                className="btn-gold min-h-[52px] w-full px-3 text-center text-xs"
              >
                Plan Trip
              </Link>
              <Link
                href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast"
                onClick={() => setOpen(false)}
                className="btn-outline min-h-[52px] w-full px-3 text-center text-xs"
              >
                Book Stay
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
