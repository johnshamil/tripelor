import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { properties } from "@/lib/properties";
import { propertyPhotoUrl } from "@/lib/property-model";
import type { PublicProperty } from "@/lib/property-model";

export default function PropertyCards({ managedProperties = [], featured = false }: { managedProperties?: PublicProperty[]; featured?: boolean }) {
  const cards = new Map(properties.map(property => [property.slug, {
    slug: property.slug, name: property.name, location: property.location,
    image: property.images[0], description: property.description, startingFrom: property.startingFrom,
  }]));
  for (const property of managedProperties) {
    const rates = property.rooms.map(room => room.sellingRate).filter(rate => Number.isFinite(rate) && rate > 0);
    cards.set(property.slug, {
      slug: property.slug, name: property.name, location: property.island,
      image: property.photos[0] ? propertyPhotoUrl(property.photos[0]) : cards.get(property.slug)?.image || "/properties/rivethi-beach-hotel/1719713475.jpeg",
      description: property.description, startingFrom: rates.length ? Math.min(...rates) : 0,
    });
  }
  const displayedProperties = Array.from(cards.values());
  const visibleProperties = displayedProperties;
  return <section id="properties" className="scroll-mt-24 bg-[#f1ebdf] text-[#071922]">
    <div className="container py-14 md:py-20">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow text-[#8d7037]">{featured ? "Featured properties" : "Explore Maldives stays"}</p>
          <h2 className="font-display mt-4 text-4xl md:text-5xl">Find your island home.</h2>
          <p className="mt-4 leading-7 text-[#58656c]">From a relaxed island guesthouse to a beachfront stay, find somewhere that feels like you. Open a property to explore rooms, photos and meal plans.</p>
        </div>
        {featured && <Link href="/stays" className="inline-flex min-h-[48px] shrink-0 items-center gap-3 rounded-full border border-[#8d7037]/40 px-6 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8d7037]">View all stays <ArrowRight className="h-4 w-4" /></Link>}
      </div>
      <div className="mb-6"><Link href="/holiday-shortlist" className="inline-flex min-h-11 items-center rounded-full border border-[#8d7037]/40 px-5 text-sm font-semibold">Planning together? Share a holiday shortlist →</Link></div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleProperties.map(property => <Link key={property.slug} href={`/stays/${property.slug}`} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#d0c5b0] bg-[#f8f4ec] shadow-sm transition hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8d7037]">
          <div className="relative aspect-[5/4] overflow-hidden"><img src={property.image} alt={property.name} loading="lazy" className="h-full w-full object-cover transition duration-700 motion-safe:group-hover:scale-105 motion-reduce:transition-none" /></div>
          <div className="flex flex-1 flex-col p-6">
            <p className="flex items-center gap-2 text-xs text-[#745b2e]"><MapPin className="h-4 w-4 shrink-0" />{property.location}</p>
            <h3 className="font-display mt-3 text-3xl">{property.name}</h3>
            <p className="mb-6 mt-3 line-clamp-3 text-sm leading-6 text-[#58656c]">{property.description}</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[#d0c5b0] pt-5">
              <p className="text-sm text-[#745b2e]">{property.startingFrom > 0 ? <>From <strong className="text-xl">${property.startingFrom}</strong><span className="block text-xs text-[#58656c]">USD / room / night</span></> : "Rates on request"}</p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold">Explore rooms <ArrowRight className="h-4 w-4" /></span>
            </div>
          </div>
        </Link>)}
      </div>
      <p className="mt-6 text-xs leading-6 text-[#58656c]">Starting rates vary by dates, occupancy and meal plan. See each property for taxes, transfers and booking conditions.</p>
    </div>
  </section>;
}
