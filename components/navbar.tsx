"use client";

import Link from "next/link";
import { Compass, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

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
      <div className="container flex h-[76px] items-center justify-between">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3"
          aria-label="Tripelor home"
        >
          <span className="flex h-10 w-10 items-center justify-center border border-[#c9a86a]/55 text-[#d9bd7b] transition group-hover:bg-[#c9a86a] group-hover:text-[#071922]">
            <Compass className="h-5 w-5" />
          </span>
          <span>
            <span className="font-display block text-[1.35rem] leading-none tracking-[.08em] text-white">
              TRIPELOR
            </span>
            <span className="mt-1 block text-[8px] uppercase tracking-[.3em] text-[#c9a86a]">
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
            <UserRound className="h-4 w-4" /> Account
          </Link>
          <Link href="/build-your-trip" className="btn-gold min-h-[44px] px-5 py-2">
            Plan My Trip
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center border border-white/15 bg-white/[.03] text-white transition active:scale-95 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-[76px] z-[100] h-[calc(100dvh-76px)] overflow-hidden border-t border-white/10 bg-[#041117] lg:hidden">
          <div className="flex h-full flex-col overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
            <p className="mb-3 text-[10px] uppercase tracking-[.28em] text-[#c9a86a]">Explore Tripelor</p>
            <nav className="grid" aria-label="Mobile navigation">
              {mobileLinks.map(([href, label], index) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="font-display flex min-h-[58px] items-center justify-between border-b border-white/10 text-2xl text-white/85"
                >
                  {label}
                  <span className="font-sans text-[10px] text-[#c9a86a]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="mt-5">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex min-h-[50px] items-center gap-2 text-white/70"
              >
                <UserRound className="h-5 w-5 text-[#c9a86a]" /> My Tripelor Account
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

            <div className="mt-auto grid gap-3 border-t border-white/10 pt-5">
              <Link
                href="/build-your-trip"
                onClick={() => setOpen(false)}
                className="btn-gold min-h-[52px] w-full"
              >
                Plan My Trip
              </Link>
              <Link
                href="/booking?property=Uhoo%27s%20Lavish%20Oasis&mealPlan=Bed%20%26%20Breakfast"
                onClick={() => setOpen(false)}
                className="btn-outline min-h-[52px] w-full"
              >
                Book a Stay
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
