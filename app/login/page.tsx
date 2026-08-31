"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, Sparkles } from "lucide-react";
import TripelorMark from "@/components/tripelor-mark";

function safeNextPath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "";
}

function serviceName(path: string) {
  if (path.startsWith("/booking")) return "your private booking";
  if (path.startsWith("/build-your-trip")) return "the Private Trip Planner";
  if (path.startsWith("/speedboat")) return "the transfer concierge";
  if (path.startsWith("/account/guest-portal")) return "guest services";
  if (path.startsWith("/account")) return "My Tripelor";
  return "Tripelor services";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nextPath, setNextPath] = useState("");

  useEffect(() => {
    const hash = window.location.hash || "";
    const query = window.location.search || "";
    const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(query.replace(/^\?/, ""));
    const type = hashParams.get("type") || queryParams.get("type");
    const hasRecoveryToken = Boolean(
      hashParams.get("access_token") || queryParams.get("access_token") || queryParams.get("token_hash") || queryParams.get("code"),
    );
    if (type === "recovery" || hasRecoveryToken) {
      window.location.replace(`/reset-password${query}${hash}`);
      return;
    }
    setNextPath(safeNextPath(queryParams.get("next")));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to log in.");
      window.location.href = nextPath || "/account";
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to log in.");
    } finally {
      setBusy(false);
    }
  }

  const destination = serviceName(nextPath);
  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";

  return (
    <main className="bg-[#f1ebdf] text-[#071922]">
      <div className="container grid min-h-[calc(100vh-76px)] items-stretch py-8 lg:grid-cols-[1.05fr_.95fr] lg:py-12">
        <section className="relative hidden min-h-[680px] overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1800&q=90"
            alt="Maldives island and turquoise lagoon"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#031016] via-[#031016]/35 to-[#031016]/15" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#ead7aa]">
              <Sparkles className="h-4 w-4" /> Tripelor private travel
            </p>
            <h1 className="font-display mt-5 text-6xl leading-[1.02]">Your journey, thoughtfully kept together.</h1>
            <div className="mt-8 grid gap-3 text-sm text-white/70">
              {["Save your plans and preferences", "Keep booking requests in one place", "Reach your Tripelor concierge easily"].map((item) => (
                <p key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#d9bd7b]" /> {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center border border-[#d0c5b0] bg-[#fffdf8] px-6 py-10 shadow-[0_30px_100px_rgba(34,43,46,.12)] md:px-12 lg:border-l-0 xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center gap-3">
              <TripelorMark className="h-12 w-12 text-[#9c7d3d]" />
              <div>
                <p className="font-display text-xl tracking-[.09em]">TRIPELOR</p>
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-[.25em] text-[#8d7037]">Private member access</p>
              </div>
            </div>

            <p className="eyebrow mt-10 text-[#8d7037]">Welcome back</p>
            <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl">Continue to {destination}.</h2>
            <p className="mt-4 text-sm leading-7 text-[#687377]">
              Sign in so your request, preferences and concierge support remain connected to your Tripelor account.
            </p>

            <form onSubmit={submit} className="mt-8 grid gap-5">
              <label className="premium-label">
                <span>Email address</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="premium-control"
                />
              </label>
              <label className="premium-label">
                <span className="justify-between">
                  Password
                  <Link href="/forgot-password" className="normal-case tracking-normal text-[#8d7037] hover:underline">Forgot password?</Link>
                </span>
                <span className="relative block">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="premium-control pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#788286]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {status && <p className="border border-red-300 bg-red-50 p-3 text-sm text-red-800">{status}</p>}

              <button disabled={busy} className="btn-gold w-full disabled:opacity-60">
                <LogIn className="h-4 w-4" /> {busy ? "Signing in..." : "Sign In & Continue"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 border border-[#d8cdb8] bg-[#f8f4ec] p-4 text-sm text-[#58656c]">
              <p className="flex items-start gap-3 leading-6">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8d7037]" />
                You can explore Tripelor freely. Sign-in is requested only when you use a booking or travel service.
              </p>
            </div>

            <p className="mt-7 text-center text-sm text-[#687377]">
              New to Tripelor? <Link href={signupHref} className="font-semibold text-[#8d7037] hover:underline">Create your account</Link>
            </p>
            <p className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[.16em] text-[#899194]">
              <LockKeyhole className="h-3.5 w-3.5" /> Secure member access
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
