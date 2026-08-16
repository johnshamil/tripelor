"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "9609429403";

export default function Page() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");

  function sendEnquiry() {
    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!phone.trim() && !email.trim()) {
      alert("Please enter your phone/WhatsApp number or email address.");
      return;
    }

    const whatsappMessage = [
      "Hello Tripelor,",
      "",
      "I would like to send a travel enquiry.",
      "",
      `Name: ${fullName.trim()}`,
      `Email: ${email.trim() || "Not provided"}`,
      `Phone / WhatsApp: ${phone.trim() || "Not provided"}`,
      `Destination: ${destination.trim() || "Not specified"}`,
      `Enquiry: ${message.trim() || "Please contact me with travel options."}`,
      "",
      "Please get back to me with more information and the best available options. Thank you.",
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    window.location.href = url;
  }

  return (
    <section className="container py-16">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-gold">Plan Your Journey</p>
          <h1 className="mt-2 text-5xl font-bold">Contact Tripelor</h1>
          <p className="mt-5 max-w-xl text-gray-400">
            Tell us where you want to travel, your dates, number of travelers and approximate budget. We’ll help you plan the rest.
          </p>
          <div className="mt-8 space-y-3 text-gray-300">
            <p><span className="text-gold">Email:</span> hello@tripelor.com</p>
            <p><span className="text-gold">WhatsApp:</span> +960 9429403</p>
            <p><span className="text-gold">Location:</span> Maldives</p>
          </div>
        </div>

        <form className="card grid gap-4 p-7" onSubmit={(e) => e.preventDefault()}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about your trip" rows={6} className="rounded-xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-gold" />
          <button type="button" onClick={sendEnquiry} className="btn-gold gap-2">
            <MessageCircle className="h-5 w-5" /> Send Enquiry on WhatsApp
          </button>
          <p className="text-xs text-gray-500">WhatsApp will open with your enquiry details ready to send to Tripelor.</p>
        </form>
      </div>
    </section>
  );
}
