import Link from "next/link";
import { normalizePropertyArrival } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

export default function PropertyArrivalGuide({ property, preview = false }: { property: PublicProperty; preview?: boolean }) {
  const arrival = normalizePropertyArrival(property.arrival);
  const sections = [
    { title: "Meet at the airport", text: arrival.meetingPoint },
    { title: "Your arrival contact", text: [arrival.contactName, arrival.contactDetails].filter(Boolean).join("\n") },
    { title: "Transfer options & prices", text: property.transfers },
    { title: "Journey time", text: arrival.journeyTime },
    { title: "If your flight arrives late", text: arrival.lateArrival },
    { title: "Welcome to the island", text: arrival.islandWelcome },
  ].filter(section => section.text?.trim());
  const message = ["Hello Tripelor, I need help with my arrival at " + property.name + " (" + property.island + ").", "", "Travel date:", "Flight number and arrival time:", "Number of guests:", "", "Please help me confirm the meeting point, suitable transfer and total price."].join("\n");
  return <section id="arrival" aria-labelledby="arrival-heading" className="container py-10 md:py-16">
    <div className="rounded-3xl border border-gold/20 bg-white/[.025] p-6 md:p-10">
      <p className="text-xs uppercase tracking-[.2em] text-gold">From landing to check-in</p>
      <h2 id="arrival-heading" className="mt-3 text-2xl font-semibold md:text-3xl">Your arrival, explained</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">Plan your journey to {property.name}. Ask Tripelor to confirm the arrangements for your flight before travelling.</p>
      {sections.length > 0 ? <div className="mt-7 grid gap-4 md:grid-cols-2">{sections.map(section => <article key={section.title} className="min-w-0 rounded-2xl border border-white/10 p-5">
        <h3 className="font-semibold text-gold">{section.title}</h3>
        <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-gray-300">{section.text}</p>
      </article>)}</div> : <p className="mt-6 text-sm text-gray-300">Ask Tripelor for the meeting point, transfer options and island arrival details for this stay.</p>}
      <p className="mt-5 text-xs leading-6 text-gray-400">For details not listed here, contact Tripelor. Your transfer is confirmed only after you receive confirmation from the team.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {preview ? <button type="button" disabled className="btn-gold min-h-11 opacity-60">Help with my arrival · Preview</button> : <a className="btn-gold min-h-11 text-center" href={"https://wa.me/9609429403?text=" + encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Help with my arrival</a>}
        {!preview && <Link className="btn-outline min-h-11" href="/speedboat">Explore transfers</Link>}
      </div>
      <p className="mt-3 text-xs text-gray-400">{preview ? "Arrival help is disabled in preview." : "Opens WhatsApp. Add your flight details, then review and send your message."}</p>
    </div>
  </section>;
}
