"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, BellRing, Clock3, Gift, LockKeyhole, Sparkles, UserPlus, WalletCards } from "lucide-react";

type Member = { email?: string; fullName?: string };

type PassState = {
  createdAt: number;
  expiresAt: number;
  stay?: string;
  source?: string;
};

const STORAGE_KEY = "tripelor_maldives_pass_v1";
const WINDOW_MS = 24 * 60 * 60 * 1000;

function loadPass(): PassState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PassState;
    if (!parsed?.createdAt || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePass(state: PassState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function durationLabel(ms: number) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

export default function MaldivesPass({ compact = false }: { compact?: boolean }) {
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [pass, setPass] = useState<PassState | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stay = params.get("stay") || undefined;
    const source = params.get("source") || "website";
    const current = loadPass();
    const active = current && current.expiresAt > Date.now()
      ? { ...current, stay: stay || current.stay, source: source || current.source }
      : {
          createdAt: Date.now(),
          expiresAt: Date.now() + WINDOW_MS,
          stay,
          source,
        };
    savePass(active);
    setPass(active);
    setRemaining(Math.max(0, active.expiresAt - Date.now()));

    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, active.expiresAt - Date.now()));
    }, 1000);

    void fetch("/api/auth/me", { cache: "no-store" })
      .then(response => response.json().then(data => ({ ok: response.ok, data })))
      .then(({ ok, data }) => setMember(ok && data?.user ? data.user : null))
      .catch(() => setMember(null));

    return () => window.clearInterval(timer);
  }, []);

  const next = useMemo(() => {
    if (typeof window === "undefined") return "/maldives-pass";
    return `${window.location.pathname}${window.location.search}`;
  }, []);

  if (!pass || member === undefined) {
    return <div className={compact ? "min-h-44" : "min-h-72"} />;
  }

  const expired = remaining <= 0;
  const stayLabel = pass.stay ? pass.stay.replace(/-/g, " ") : "your Maldives trip";

  if (compact) {
    return (
      <section className="rounded-3xl border border-[#c8aa67]/35 bg-[linear-gradient(135deg,#071922,#0b2731)] p-6 text-white shadow-[0_20px_70px_rgba(7,25,34,.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#e2bd68]">
              <WalletCards className="h-4 w-4" /> Tripelor Maldives Pass
            </p>
            <h2 className="font-display mt-3 text-3xl">Unlock your private Maldives price check.</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Save {stayLabel}, private deals, alerts and your quote journey in one free member pass.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/70">
          {["Private price check", "Secret Deals", "Availability alerts", "Tripelor Points"].map(item => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[.05] px-3 py-1.5">{item}</span>
          ))}
        </div>
        <Link href="/maldives-pass" className="btn-gold mt-6 w-full justify-center">
          Unlock My Maldives Pass <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[#d9bd7b]/35 bg-[radial-gradient(circle_at_top_right,rgba(217,189,123,.22),transparent_30%),linear-gradient(145deg,#0b2731,#06151c_62%,#03090d)] text-white shadow-[0_35px_100px_rgba(7,25,34,.25)]">
      <div className="grid gap-0 lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-7 md:p-10">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-[#e2bd68]">
            <WalletCards className="h-4 w-4" /> Tripelor Maldives Pass
          </p>
          <h1 className="font-display mt-4 text-4xl leading-tight md:text-6xl">
            One free pass for your whole Maldives journey.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 md:text-base">
            Unlock a private price check, save stays and trip ideas, receive availability alerts, collect Tripelor Points and keep your concierge support connected to one account.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              [LockKeyhole, "Private price check", "Get a member-only Tripelor price review based on published rates and your dates."],
              [BellRing, "Availability alerts", "Watch a preferred stay and get notified when rooms open for your dates."],
              [Gift, "Secret Deals", "See private deal matches based on budget, month and travel style."],
              [BadgeCheck, "Member journey", "Keep quotes, requests, points and concierge support together."],
            ].map(([Icon, title, body]) => {
              const FeatureIcon = Icon as typeof LockKeyhole;
              return (
                <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
                  <FeatureIcon className="h-5 w-5 text-[#e2bd68]" />
                  <h2 className="mt-3 font-semibold">{title as string}</h2>
                  <p className="mt-2 text-xs leading-5 text-white/45">{body as string}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/15 p-7 md:p-10 lg:border-l lg:border-t-0">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Your private price window</p>
          <div className="mt-3 flex items-center gap-3">
            <Clock3 className="h-6 w-6 text-[#e2bd68]" />
            <span className="font-mono text-3xl tracking-wider text-[#f3dfaa]">{expired ? "EXPIRED" : durationLabel(remaining)}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">
            This is a saved Tripelor price-check window, not a reservation or inventory hold. Availability and final selling price are confirmed before booking.
          </p>

          {member ? (
            <>
              <div className="mt-7 rounded-2xl border border-[#d9bd7b]/25 bg-[#d9bd7b]/10 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-[#f3dfaa]"><Sparkles className="h-4 w-4" /> Maldives Pass active</p>
                <p className="mt-2 text-xs leading-5 text-white/55">
                  {member.fullName ? `${member.fullName}, ` : ""}your pass is connected to your Tripelor account.
                </p>
              </div>
              <div className="mt-5 grid gap-3">
                <Link href="/secret-deals" className="btn-gold justify-center">Open My Private Deals <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/build-your-trip" className="btn-outline justify-center">Build My Trip</Link>
                <Link href="/account" className="btn-outline justify-center">Open My Tripelor</Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-7 rounded-2xl border border-[#d9bd7b]/25 bg-[#d9bd7b]/10 p-5">
                <p className="text-sm font-semibold text-[#f3dfaa]">Save this Pass before your window ends.</p>
                <p className="mt-2 text-xs leading-5 text-white/55">Create a free Tripelor account so this trip can continue into private deals, quotes, alerts and concierge support.</p>
              </div>
              <div className="mt-5 grid gap-3">
                <Link href={`/signup?next=${encodeURIComponent(next)}&pass=1`} className="btn-gold justify-center">
                  <UserPlus className="h-4 w-4" /> Create Free Account & Save
                </Link>
                <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-outline justify-center">Already a member? Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
