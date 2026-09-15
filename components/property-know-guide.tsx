import { normalizePropertyKnowDetails, propertyKnowFields } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

export default function PropertyKnowGuide({ property, preview = false }: { property: PublicProperty; preview?: boolean }) {
  const details = normalizePropertyKnowDetails(property.knowBeforeBooking);
  const askHref = (topic: string) => "https://wa.me/9609429403?text=" + encodeURIComponent("Hello Tripelor, I am interested in " + property.name + " (" + property.island + "). Could you please confirm " + topic + " before I book?");
  return <section id="know-before-you-book" aria-labelledby="know-before-heading" className="container py-10 md:py-16">
    <div className="rounded-3xl border border-gold/20 bg-white/[.025] p-6 md:p-10">
      <p className="text-xs uppercase tracking-[.2em] text-gold">Feel at home before you arrive</p>
      <h2 id="know-before-heading" className="mt-3 text-2xl font-semibold md:text-3xl">Know Before You Book</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">The practical details for your stay at {property.name}. Check-in and check-out times are local Maldives time.</p>
      <div className="mt-7 grid gap-3 md:grid-cols-2">{propertyKnowFields.map(field => <details key={field.key} className="min-w-0 rounded-2xl border border-white/10 p-4">
        <summary className="min-h-11 cursor-pointer rounded-lg py-2 font-medium text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
          {field.label}{!details[field.key] && <span className="ml-2 text-xs font-normal text-gray-400">· Ask Tripelor</span>}
        </summary>
        {details[field.key] ? <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-gray-300">{details[field.key]}</p> : <p className="mt-3 text-sm leading-7 text-gray-300">This detail has not been confirmed yet. Ask us about your requirements before booking.</p>}
        {preview ? <button type="button" disabled className="mt-3 min-h-11 px-2 text-sm text-gold opacity-60">Ask Tripelor · Preview</button> : <a href={askHref(field.label.toLowerCase())} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-gold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold" aria-label={"Ask Tripelor about " + field.label.toLowerCase()}>Ask Tripelor</a>}
      </details>)}</div>
      <p className="mt-4 text-xs leading-6 text-gray-400">{preview ? "Question links are disabled in preview." : "Ask Tripelor opens WhatsApp with the property and topic. Review and send your message."}</p>
    </div>
  </section>;
}
