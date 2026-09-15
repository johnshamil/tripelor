"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PropertyHost } from "@/lib/property-model";
import { hostMediaUrl, hostTopics } from "@/lib/host-questions";
import HostAudio from "@/components/host-audio";

export default function PropertyHostMessage({ host, propertyId, propertyName, slug, preview = false }: {
  host?: PropertyHost; propertyId: string; propertyName: string; slug: string; preview?: boolean;
}) {
  const [open, setOpen] = useState(false), [topic, setTopic] = useState<string>("Room");
  const [question, setQuestion] = useState(""), [busy, setBusy] = useState(false);
  const [error, setError] = useState(""), [sent, setSent] = useState(false), [signIn, setSignIn] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const draftKey = "tripelor-host-question-" + propertyId;

  useEffect(() => {
    if (preview) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(draftKey) || "{}");
      if (typeof saved.question === "string") { setQuestion(saved.question.slice(0, 1500)); setOpen(true); }
      if (hostTopics.includes(saved.topic)) setTopic(saved.topic);
    } catch {}
  }, [draftKey, preview]);

  if (!host?.enabled) return null;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (preview || busy) return;
    setBusy(true); setError(""); setSignIn(false);
    try {
      const res = await fetch("/api/host-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, topic, question }),
      });
      const data = await res.json();
      if (res.status === 401) {
        setSignIn(true);
        try { sessionStorage.setItem(draftKey, JSON.stringify({ topic, question })); } catch {}
        return;
      }
      if (!res.ok) throw new Error(data.error || "Unable to send your question.");
      setSent(true); setQuestion("");
      try { sessionStorage.removeItem(draftKey); } catch {}
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to send your question."); }
    finally { setBusy(false); }
  }

  return (
    <section id="island-host" aria-labelledby="island-host-title" className="host-surface container scroll-mt-32 py-8 md:py-16">
      <div className="min-w-0 rounded-3xl border border-gold/25 bg-[#0b2731] p-4 sm:p-6 md:p-10">
        <p className="text-[11px] uppercase tracking-[.16em] text-gold">Meet the person behind your stay</p>
        <h2 id="island-host-title" className="font-display mt-3 text-[1.8rem] leading-tight sm:text-3xl md:text-4xl">A Message From Your Island</h2>
        <div className="mt-6 flex min-w-0 items-center gap-4">
          {host.photo
            ? <img src={hostMediaUrl(host.photo)} alt={host.name + ", your host at " + propertyName} loading="lazy" className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"/>
            : <div aria-hidden="true" className="h-20 w-20 shrink-0 rounded-2xl bg-white/5"/>}
          <div className="min-w-0">
            <h3 className="break-words text-xl font-semibold">{host.name || "Your island host"}</h3>
            <p className="mt-1 break-words text-sm leading-6 text-gold">{propertyName}</p>
          </div>
        </div>
        <p className={"mt-5 whitespace-pre-line break-words text-base leading-7 text-gray-200 " + (!readMore && host.introduction.length > 280 ? "line-clamp-4" : "")}>{host.introduction}</p>
        {host.introduction.length > 280 && <button type="button" aria-expanded={readMore} onClick={() => setReadMore(v => !v)} className="min-h-12 text-sm text-gold underline underline-offset-4">{readMore ? "Show less" : "Read the full introduction"}</button>}
        {host.audio && <div className="mt-5 min-w-0 max-w-xl rounded-2xl border border-white/10 bg-black/15 p-3 sm:p-4">
          <p className="mb-3 text-sm font-medium text-gold">Listen to your host</p>
          <HostAudio file={host.audio} label={"Voice welcome from " + host.name}/>
          <details className="mt-2">
            <summary className="min-h-12 cursor-pointer py-3 text-sm text-gold">Read the transcript</summary>
            <p className="whitespace-pre-line break-words text-base leading-7 text-gray-200">{host.transcript || "Transcript not added yet."}</p>
          </details>
        </div>}
        <p className="mt-6 text-sm leading-6 text-gray-300">Ask about your stay and get a personal reply in My Trip. Tripelor coordinates with your host and handles booking and payment.</p>
        <button type="button" disabled={preview || busy} onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="host-question-form" className="btn-gold mt-5 w-full normal-case tracking-normal disabled:opacity-50 sm:w-auto">
          {preview ? "Ask your host · Preview" : open ? "Close question form" : "Ask your host"}
        </button>

        {open && !preview && <div id="host-question-form" className="mt-6 min-w-0 max-w-2xl border-t border-white/15 pt-5">
          {sent ? <div role="status" className="rounded-2xl border border-gold/25 bg-gold/5 p-4">
            <p className="font-semibold text-gold">Your question is with Tripelor.</p>
            <p className="mt-2 text-sm leading-6 text-gray-300">We’ll coordinate the reply with your host. Check My Trip → Host Messages for the answer.</p>
            <Link className="btn-outline mt-4 w-full normal-case tracking-normal sm:w-auto" href="/account/host-questions">View my host messages</Link>
          </div> : <form onSubmit={submit} className="space-y-5">
            <fieldset disabled={busy}>
              <legend className="mb-3 text-sm font-medium">What would you like to know?</legend>
              <div className="flex flex-wrap gap-2">{hostTopics.map(t => <label key={t} className="cursor-pointer">
                <input type="radio" name={"host-topic-" + propertyId} value={t} checked={topic === t} onChange={() => setTopic(t)} className="peer sr-only"/>
                <span className="flex min-h-12 items-center rounded-xl border border-white/20 px-4 py-3 text-sm text-gray-200 peer-checked:border-gold peer-checked:bg-gold/15 peer-checked:text-gold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-gold peer-disabled:opacity-50">{t}</span>
              </label>)}</div>
            </fieldset>
            <label className="grid min-w-0 gap-2 text-sm font-medium">Your question
              <textarea disabled={busy} value={question} onChange={e => setQuestion(e.target.value)} required maxLength={1500} rows={4} placeholder="For example: Is there a quiet room for our family?" aria-describedby="host-question-count" className="w-full min-w-0 rounded-xl border border-white/20 bg-[#071922] p-3 text-base leading-7 outline-none focus:border-gold"/>
            </label>
            <p id="host-question-count" className="text-right text-xs text-gray-400">{question.length} / 1,500</p>
            <p className="text-sm leading-6 text-gray-400">Sign in to send and receive a private reply. Please leave payment details and sensitive documents out of your question.</p>
            {error && <p role="alert" className="rounded-xl border border-red-400/30 p-3 text-sm leading-6 text-red-200">{error}</p>}
            {signIn ? <div role="status">
              <p className="text-sm leading-6 text-gold">Your question is saved in this browser tab.</p>
              <Link href={"/login?next=" + encodeURIComponent("/stays/" + slug + "#island-host")} className="btn-gold mt-3 w-full normal-case tracking-normal sm:w-auto">Sign in to continue</Link>
            </div> : <button disabled={busy || !question.trim()} className="btn-gold w-full normal-case tracking-normal disabled:opacity-50 sm:w-auto">{busy ? "Sending…" : "Send question"}</button>}
          </form>}
        </div>}
      </div>
    </section>
  );
}
