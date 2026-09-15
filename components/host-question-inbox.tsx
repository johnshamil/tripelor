"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminHostQuestion, HostQuestion } from "@/lib/host-questions";
import HostAudio from "@/components/host-audio";
import HostMediaUpload from "@/components/host-media-upload";

const field = "w-full min-w-0 rounded-xl border border-white/20 bg-[#071922] p-3 text-base leading-7 outline-none focus:border-gold";
const date = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Indian/Maldives" }).format(new Date(value));

export default function HostQuestionInbox({ admin = false }: { admin?: boolean }) {
  const [rows, setRows] = useState<AdminHostQuestion[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [filter, setFilter] = useState("pending"), [offset, setOffset] = useState(0), [hasMore, setHasMore] = useState(false), [editing, setEditing] = useState<string | null>(null);
  const endpoint = admin ? "/api/admin/host-questions" : "/api/host-questions";

  async function load(page = offset, selection = filter) {
    setLoading(true); setError("");
    try {
      const res = await fetch(endpoint + "?offset=" + page + (admin ? "&filter=" + selection : ""), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to load questions.");
      setRows(data.questions); setHasMore(data.hasMore); setOffset(page); setFilter(selection); setEditing(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load questions."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(0); }, []);
  const controlsDisabled = loading || editing !== null;

  return <section className="host-surface container py-6 pb-28 md:py-12">
    <Link href={admin ? "/admin" : "/account"} className="inline-flex min-h-12 items-center gap-2 text-sm text-gold"><ArrowLeft className="h-4 w-4" aria-hidden="true"/>{admin ? "Back to admin" : "Back to My Trip"}</Link>
    <p className="eyebrow mt-3">{admin ? "Tripelor inbox" : "A Message From Your Island"}</p>
    <h1 className="mt-3 text-[1.8rem] font-semibold leading-tight sm:text-3xl md:text-5xl">{admin ? "Host Questions" : "My Host Messages"}</h1>
    <p className="mt-3 max-w-2xl text-base leading-7 text-gray-300">{admin ? "Work with the host, then publish a personal reply to the guest." : "Your questions and private replies, all in one place."}</p>

    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {admin && <div role="group" aria-label="Filter host questions" className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/15 p-2">
        {[["pending", "Waiting"], ["answered", "Answered"], ["all", "All"]].map(([value, label]) => <button key={value} type="button" disabled={controlsDisabled} aria-pressed={filter === value} onClick={() => load(0, value)} className={"min-h-12 rounded-xl px-3 py-2 text-sm font-medium disabled:opacity-50 " + (filter === value ? "bg-gold text-[#071922]" : "text-gray-200 hover:bg-white/10")}>{label}</button>)}
      </div>}
      <button type="button" disabled={controlsDisabled} onClick={() => load()} className="btn-outline w-full gap-2 normal-case tracking-normal disabled:opacity-50 sm:w-auto"><RefreshCw aria-hidden="true" className={"h-4 w-4 " + (loading ? "animate-spin" : "")}/>{loading ? "Loading…" : "Refresh messages"}</button>
    </div>
    {editing && <p className="mt-3 text-sm leading-6 text-gray-400">Finish and close the reply editor to refresh or switch views.</p>}
    {!admin && <p className="mt-3 text-sm leading-6 text-gray-400">Tap Refresh messages to check for a new reply.</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 p-4 text-sm leading-6 text-red-200">{error}</p>}
    {loading && rows.length === 0 && <p role="status" className="mt-7 rounded-2xl border border-white/10 p-5 text-gray-300">Loading your messages…</p>}
    {!loading && !error && rows.length === 0 && <div className="mt-6 rounded-2xl border border-white/15 bg-white/[.025] p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{admin ? (filter === "pending" ? "You’re all caught up" : "No questions in this view") : "Meet your island host"}</h2>
      <p className="mt-2 text-base leading-7 text-gray-300">{admin ? "New guest questions will appear here." : "Open a property and ask its host about the room, meals or island. Your reply will appear here."}</p>
      {!admin && <Link href="/stays" className="btn-gold mt-5 w-full normal-case tracking-normal sm:w-auto">Explore stays</Link>}
    </div>}

    <div className="mt-6 space-y-5">{rows.map(row => <article key={row.id} className="min-w-0 rounded-2xl border border-white/15 bg-white/[.025] p-4 sm:p-6">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gold">{row.topic} · {date(row.created_at)}</p>
        <span className={"rounded-full px-3 py-2 text-xs font-medium " + (row.replied_at ? "bg-emerald-400/10 text-emerald-200" : "bg-gold/10 text-gold")}>{row.replied_at ? "Reply ready" : "Awaiting reply"}</span>
      </div>
      <h2 className="mt-3 break-words text-xl font-semibold">{row.property_name}</h2>
      {admin && <p className="mt-2 break-words text-sm leading-6 text-gray-400">{row.guest_name || "Guest"} · {row.guest_email}</p>}
      <p className="mt-4 whitespace-pre-line break-words text-base leading-7 text-gray-200">{row.question}</p>
      {row.replied_at ? <PublishedReply row={row}/> : <p className="mt-4 text-sm leading-6 text-gray-400">{admin ? "This guest is waiting for a reply." : "Tripelor has your question and will coordinate a reply with the host."}</p>}
      {admin && (editing === row.id
        ? <ReplyEditor key={row.id} question={row} onSaved={saved => setRows(current => current.map(r => r.id === saved.id ? saved : r))} onClose={() => setEditing(null)}/>
        : <button type="button" disabled={editing !== null} onClick={() => setEditing(row.id)} className="btn-gold mt-5 w-full normal-case tracking-normal disabled:opacity-50 sm:w-auto">{row.replied_at ? "Edit reply" : "Write a reply"}</button>)}
    </article>)}</div>
    {(offset > 0 || hasMore) && <nav aria-label="Message pages" className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <button disabled={controlsDisabled || offset === 0} onClick={() => load(Math.max(0, offset - 20))} className="btn-outline px-3 normal-case tracking-normal disabled:opacity-40">Previous</button>
      <span className="whitespace-nowrap text-sm text-gray-400">Page {offset / 20 + 1}</span>
      <button disabled={controlsDisabled || !hasMore} onClick={() => load(offset + 20)} className="btn-outline px-3 normal-case tracking-normal disabled:opacity-40">Next</button>
    </nav>}
  </section>;
}

function PublishedReply({ row }: { row: HostQuestion }) {
  return <div className="mt-5 min-w-0 rounded-xl border border-gold/20 bg-gold/5 p-3 sm:p-5">
    <p className="break-words text-sm font-semibold leading-6 text-gold">{row.reply_name} · {row.replied_at ? date(row.replied_at) : "Reply preview"}</p>
    {row.reply_text && <p className="mt-3 whitespace-pre-line break-words text-base leading-7 text-gray-200">{row.reply_text}</p>}
    {row.reply_audio && <div className="mt-4 min-w-0">
      <HostAudio file={row.reply_audio} label={"Voice reply from " + row.reply_name}/>
      <details className="mt-2"><summary className="min-h-12 cursor-pointer py-3 text-sm text-gold">Read the voice transcript</summary><p className="whitespace-pre-line break-words text-base leading-7 text-gray-200">{row.reply_transcript}</p></details>
    </div>}
  </div>;
}

function ReplyEditor({ question, onSaved, onClose }: { question: AdminHostQuestion; onSaved: (value: AdminHostQuestion) => void; onClose: () => void }) {
  const [name, setName] = useState(question.draft_name), [text, setText] = useState(question.draft_text), [audio, setAudio] = useState(question.draft_audio), [transcript, setTranscript] = useState(question.draft_transcript);
  const [uploading, setUploading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [preview, setPreview] = useState(false);
  const busy = uploading || saving;
  async function save(action: "draft" | "publish") {
    if (busy) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const res = await fetch("/api/admin/host-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: question.id, version: question.version, action, name, text, audio, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save reply.");
      onSaved(data.question);
      setNotice(action === "draft" ? "Draft saved. The guest cannot see these edits yet." : "Reply published to this guest's Host Messages.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save reply."); }
    finally { setSaving(false); }
  }
  return <div className="mt-6 min-w-0 border-t border-white/15 pt-5">
    <h3 className="font-semibold">{question.replied_at ? "Update this reply" : "Reply to this guest"}</h3>
    <p className="mt-2 text-sm leading-6 text-gray-400">Use the name of the person replying. Only this guest can see the published reply.</p>
    <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4">
      <label className="grid min-w-0 gap-2 text-sm">Reply author<input maxLength={120} value={name} onChange={e => setName(e.target.value)} className={field} placeholder="Host's name or Tripelor team"/></label>
      <label className="grid min-w-0 gap-2 text-sm">Personal reply<textarea rows={5} maxLength={5000} value={text} onChange={e => setText(e.target.value)} className={field} placeholder="Write a helpful, personal answer…"/></label>
    </fieldset>
    <details open={Boolean(question.draft_audio || question.draft_transcript)} className="mt-4 min-w-0 rounded-xl border border-white/15 p-3 sm:p-4">
      <summary className="min-h-12 cursor-pointer py-3 text-sm font-medium text-gold">Add a voice reply (optional)</summary>
      <HostMediaUpload kind="reply" section="audio" questionId={question.id} value={audio} onChange={setAudio} onBusyChange={setUploading} disabled={busy}/>
      <label className="mt-4 grid min-w-0 gap-2 text-sm">Voice transcript<textarea disabled={busy} rows={4} maxLength={5000} value={transcript} onChange={e => setTranscript(e.target.value)} className={field} placeholder="Type the words spoken in the recording."/></label>
    </details>
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/30 p-3 text-sm leading-6 text-red-200">{error}</p>}
    <p role="status" className="mt-4 text-sm leading-6 text-gold">{notice}</p>
    {preview && <section aria-label="Reply preview"><PublishedReply row={{ ...question, reply_name: name, reply_text: text, reply_audio: audio, reply_transcript: transcript, replied_at: null }}/></section>}
    <div className="mt-5 grid gap-3 sm:max-w-xl">
      <button disabled={busy} onClick={() => save("publish")} className="btn-gold w-full normal-case tracking-normal disabled:opacity-50">{saving ? "Saving…" : "Publish reply to guest"}</button>
      <div className="grid grid-cols-2 gap-3">
        <button disabled={busy} onClick={() => save("draft")} className="btn-outline px-3 normal-case tracking-normal disabled:opacity-50">Save draft</button>
        <button disabled={busy} onClick={() => setPreview(v => !v)} aria-expanded={preview} className="btn-outline px-3 normal-case tracking-normal disabled:opacity-50">{preview ? "Hide preview" : "Preview reply"}</button>
      </div>
      <button disabled={busy} onClick={onClose} className="min-h-12 px-3 text-sm text-gray-300 disabled:opacity-50">Close editor</button>
    </div>
  </div>;
}
