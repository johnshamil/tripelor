"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkCheck, Gift, LogIn, UserPlus } from "lucide-react";
import { useSiteLanguage } from "@/components/use-site-language";

type Member = { email?: string; fullName?: string };

export default function QuoteMemberPrompt({ reference }: { reference: string }) {
  const locale = useSiteLanguage();
  const [member, setMember] = useState<Member | null | undefined>(undefined);
  const [nextPath, setNextPath] = useState("/account");

  useEffect(() => {
    setNextPath(`${window.location.pathname}${window.location.search}`);
    (async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await response.json();
        setMember(response.ok && data?.user ? data.user : null);
      } catch {
        setMember(null);
      }
    })();
  }, []);

  if (member === undefined) return null;

  const copy = locale === "it"
    ? {
        eyebrow: "Salva la tua proposta",
        title: "Crea il tuo account Tripelor gratuito.",
        body: "Tieni questa proposta a portata di mano, salva i tuoi piani e continua con offerte riservate, punti e assistenza concierge.",
        create: "Crea account e salva",
        login: "Hai già un account? Accedi",
        signedTitle: "Proposta pronta nel tuo viaggio Tripelor",
        signedBody: "Continua dal tuo account per tenere insieme richieste, preferenze e assistenza.",
        account: "Apri My Tripelor",
      }
    : locale === "ru"
      ? {
          eyebrow: "Сохраните предложение",
          title: "Создайте бесплатный аккаунт Tripelor.",
          body: "Сохраните это предложение, планы поездки, закрытые предложения, баллы и поддержку консьержа в одном месте.",
          create: "Создать аккаунт и сохранить",
          login: "Уже есть аккаунт? Войти",
          signedTitle: "Предложение готово в Tripelor",
          signedBody: "Откройте аккаунт, чтобы хранить запросы, планы и поддержку в одном месте.",
          account: "Открыть My Tripelor",
        }
      : {
          eyebrow: "Save your quote",
          title: "Create your free Tripelor account.",
          body: "Keep this quote handy, save your travel plans and continue with private deals, Tripelor Points and concierge support.",
          create: "Create Account & Save",
          login: "Already a member? Sign in",
          signedTitle: "Your quote is ready in Tripelor",
          signedBody: "Continue from your account to keep requests, preferences and concierge support together.",
          account: "Open My Tripelor",
        };

  if (member) {
    return (
      <section className="no-print mt-6 rounded-2xl border border-[#d9bd7b]/30 bg-[#0b2731] p-5 text-white sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e2bd68]">{copy.eyebrow}</p>
        <h2 className="font-display mt-2 text-2xl">{copy.signedTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-white/65">{copy.signedBody}</p>
        <Link href="/account" className="btn-gold mt-5 inline-flex">
          <BookmarkCheck className="h-4 w-4" /> {copy.account}
        </Link>
      </section>
    );
  }

  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}&quote=${encodeURIComponent(reference)}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <section className="no-print mt-6 overflow-hidden rounded-2xl border border-[#d9bd7b]/35 bg-[linear-gradient(135deg,#0b2731_0%,#06151c_65%,#03090d_100%)] p-5 text-white shadow-[0_18px_55px_rgba(4,17,23,.22)] sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e2bd68]/30 bg-[#e2bd68]/10">
          <Gift className="h-5 w-5 text-[#e2bd68]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e2bd68]">{copy.eyebrow}</p>
          <h2 className="font-display mt-2 text-3xl">{copy.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">{copy.body}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={signupHref} className="btn-gold flex-1 justify-center">
          <UserPlus className="h-4 w-4" /> {copy.create}
        </Link>
        <Link href={loginHref} className="btn-outline flex-1 justify-center">
          <LogIn className="h-4 w-4" /> {copy.login}
        </Link>
      </div>
    </section>
  );
}
