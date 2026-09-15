"use client";
import { normalizePropertyKnowDetails, propertyKnowFields } from "@/lib/property-model";
import type { PropertyKnowDetails } from "@/lib/property-model";

export default function PropertyKnowEditor({ value, onChange }: { value?: PropertyKnowDetails; onChange: (value: PropertyKnowDetails) => void }) {
  const details = normalizePropertyKnowDetails(value);
  return <section className="rounded-2xl border border-gold/20 bg-white/[.025] p-5 md:p-6">
    <h3 className="text-lg font-semibold">Know Before You Book</h3>
    <p className="mt-2 text-sm leading-6 text-gray-400">Add confirmed information for guests. Leave anything unconfirmed blank to show Ask Tripelor. These details are public when you publish this property.</p>
    <p className="mt-2 text-xs leading-5 text-gold">Preview Property includes your unsaved changes. Use local Maldives times for check-in and check-out.</p>
    <div className="mt-5 space-y-5">{propertyKnowFields.map(field => <label key={field.key} className="grid gap-2 text-sm">
      <span className="font-medium text-white/85">{field.label}</span>
      <span className="text-xs leading-5 text-gray-400">{field.hint}</span>
      <textarea rows={3} maxLength={2000} value={details[field.key]} onChange={event => onChange({ ...details, [field.key]: event.target.value })} placeholder="Leave blank if not confirmed" className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 leading-6 outline-none focus:border-gold"/>
    </label>)}</div>
  </section>;
}
