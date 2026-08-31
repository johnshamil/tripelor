"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, UserPlus } from "lucide-react";
import TripelorMark from "@/components/tripelor-mark";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "";
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [nextPath, setNextPath] = useState("");

  useEffect(() => {
    setNextPath(safeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    setSuccess(false);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create account.");
      if (result.signedIn) {
        window.location.href = nextPath || "/account";
        return;
      }
      setSuccess(true);
      setStatus("Account created. Please check your email and confirm your address, then sign in to continue.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create account.");
    } finally {
      setBusy(false);
    }
  }

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <main className="bg-[#f1ebdf] py-10 text-[#071922] md:py-16">
      <div className="container">
        <div className="mx-auto grid max-w-5xl overflow-hidden border border-[#c9b88f] bg-[#fffdf8] shadow-[0_30px_100px_rgba(34,43,46,.12)] lg:grid-cols-[.72fr_1.28fr]">
          <aside className="bg-[#06151c] p-8 text-white md:p-10">
            <TripelorMark className="h-14 w-14 text-[#d9bd7b]" />
            <p className="eyebrow mt-9">Tripelor membership</p>
            <h1 className="font-display mt-4 text-4xl leading-tight">One account for your Maldives journey.</h1>
            <div className="mt-8 space-y-5">
              {[
                "Continue directly to the service you selected",
                "Keep booking requests and vouchers together",
                "Save plans and reach your concierge easily",
              ].map((item) => (
                <p key={item} className="flex items-start gap-3 text-sm leading-6 text-white/60">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d9bd7b]" /> {item}
                </p>
              ))}
            </div>
          </aside>

          <section className="p-7 md:p-10 lg:p-12">
            <p className="eyebrow text-[#8d7037]">Create your account</p>
            <h2 className="font-display mt-3 text-4xl md:text-5xl">Join Tripelor.</h2>
            <p className="mt-4 text-sm leading-7 text-[#687377]">Create your private travel profile and continue with your selected service.</p>

            <form onSubmit={submit} className="mt-8 grid gap-5">
              <label className="premium-label">
                <span>Full name</span>
                <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" autoComplete="name" className="premium-control" />
              </label>
              <label className="premium-label">
                <span>Email address</span>
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" className="premium-control" />
              </label>
              <label className="premium-label">
                <span>Password</span>
                <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" className="premium-control" />
              </label>

              {status && (
                <p className={`border p-4 text-sm leading-6 ${success ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>
                  {status}
                </p>
              )}

              <button disabled={busy} className="btn-gold w-full disabled:opacity-60">
                <UserPlus className="h-4 w-4" /> {busy ? "Creating your account..." : "Create Account"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[#687377]">
              Already a member? <Link href={loginHref} className="font-semibold text-[#8d7037] hover:underline">Sign in and continue</Link>
            </p>
            <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#899194]">
              <LockKeyhole className="h-3.5 w-3.5" /> Secure Tripelor account
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
