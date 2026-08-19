"use client";

import { FormEvent, useState } from "react";
import { Send, ShieldCheck, Star } from "lucide-react";

export default function ReviewsPage() {
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [rating, setRating] = useState(5);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setNotice("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const r = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, rating }),
      });
      const x = await r.json();
      if (!r.ok) throw new Error(x.error || "Unable to submit review.");
      setStatus("success");
      setNotice("Thank you! Your review has been submitted and is awaiting approval.");
      form.reset();
      setRating(5);
    } catch (err) {
      setStatus("error");
      setNotice(err instanceof Error ? err.message : "Unable to submit review.");
    }
  }

  return (
    <main className="container py-14 md:py-20">
      <p className="text-sm uppercase tracking-[.3em] text-gold">Guest experiences</p>
      <h1 className="mt-2 text-4xl font-bold md:text-6xl">Write a Review</h1>
      <p className="mt-5 max-w-3xl text-lg text-gray-400">
        Share your Tripelor stay experience. Reviews are checked before they appear publicly.
      </p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="card h-fit p-7">
          <Star className="h-8 w-8 text-gold" />
          <h2 className="mt-4 text-2xl font-bold">Your experience matters</h2>
          <p className="mt-3 leading-7 text-gray-400">
            Tell future travelers about your stay, service, comfort and favorite moments.
          </p>
          <div className="mt-6 flex gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-gray-300">
            <ShieldCheck className="h-5 w-5 shrink-0 text-gold" />
            Reviews are submitted as pending and are only published after Tripelor approval.
          </div>
        </aside>

        <form onSubmit={submit} className="card p-7 md:p-9">
          <h2 className="text-3xl font-bold">Leave a review</h2>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="text-sm">
              Property
              <select required name="property" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3">
                <option>Uhoo&apos;s Lavish Oasis</option>
                <option>Masfalhi View Inn</option>
              </select>
            </label>

            <label className="text-sm">
              Your name
              <input required name="name" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3" />
            </label>

            <label className="text-sm">
              Email
              <input required type="email" name="email" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3" />
            </label>

            <label className="text-sm">
              Country
              <input name="country" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3" placeholder="e.g. Maldives" />
            </label>

            <label className="text-sm">
              Date of stay
              <input type="date" name="stayDate" className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3" />
            </label>

            <label className="text-sm">
              Review title
              <input name="title" maxLength={100} className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3" placeholder="Wonderful island stay" />
            </label>
          </div>

          <div className="mt-6">
            <span className="text-sm">Your rating</span>
            <div className="mt-2 flex gap-2" aria-label={`${rating} star rating`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className={`text-3xl leading-none ${n <= rating ? "text-gold" : "text-gray-600"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 block text-sm">
            Your review
            <textarea
              required
              name="review"
              minLength={20}
              maxLength={1500}
              rows={7}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3"
              placeholder="Tell us about your stay, room, service, food, island experience and favorite moments..."
            />
          </label>

          <label className="mt-5 flex gap-3 text-sm text-gray-400">
            <input required type="checkbox" name="permission" value="yes" className="mt-1" />
            I confirm this is my genuine experience and give Tripelor permission to publish my name, country, rating and review.
          </label>

          <button disabled={status === "sending"} className="btn-gold mt-7 gap-2 disabled:opacity-60">
            <Send className="h-4 w-4" />
            {status === "sending" ? "Submitting..." : "Submit Review"}
          </button>

          {notice && (
            <p className={`mt-5 rounded-xl border p-4 text-sm ${status === "success" ? "border-green-500/30" : "border-red-500/30"}`}>
              {notice}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
