"use client";

import { normalizePropertyArrival } from "@/lib/property-model";
import type { PropertyArrival } from "@/lib/property-model";

const fields: { key: keyof PropertyArrival; label: string; placeholder: string }[] = [
  { key: "meetingPoint", label: "Airport meeting point", placeholder: "Explain where guests should meet and how to recognise their representative." },
  { key: "contactName", label: "Guest-facing contact person or team", placeholder: "Name or team guests may contact" },
  { key: "contactDetails", label: "Guest-facing contact details", placeholder: "Phone, WhatsApp or email approved for public display" },
  { key: "journeyTime", label: "Journey time", placeholder: "Describe the approximate duration for each available transfer." },
  { key: "lateArrival", label: "Late flights and missed transfers", placeholder: "Explain whom to contact, available alternatives and any extra costs." },
  { key: "islandWelcome", label: "Arriving on the island", placeholder: "Explain the jetty meeting point, directions and check-in arrangements." },
];
export default function PropertyArrivalEditor({ value, onChange }: { value?: PropertyArrival; onChange: (value: PropertyArrival) => void }) {
  const arrival = normalizePropertyArrival(value);
  return <section className="rounded-2xl border border-gold/20 bg-white/[.025] p-5 md:p-6">
    <h3 className="text-lg font-semibold">Your arrival, explained</h3>
    <p className="mt-2 text-sm leading-6 text-gray-400">Optional information shown on this property's page. Transfer options and prices use the Transfer options field under Booking conditions.</p>
    <p className="mt-2 text-xs leading-5 text-gold">Only enter contacts approved for guests to see. Private partner contacts are kept separate. Preview Property includes your unsaved changes.</p>
    <div className="mt-5 space-y-4">{fields.map(field => <label key={field.key} className="grid gap-2 text-sm">
      <span className="font-medium text-white/85">{field.label}</span>
      <textarea rows={field.key === "contactName" ? 2 : 3} maxLength={2000} value={arrival[field.key]} onChange={event => onChange({ ...arrival, [field.key]: event.target.value })} placeholder={field.placeholder} className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 leading-6 outline-none focus:border-gold"/>
    </label>)}</div>
  </section>;
}
