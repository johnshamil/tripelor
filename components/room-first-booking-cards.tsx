import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { properties } from "@/lib/properties";
import { propertyPhotoUrl, type PublicProperty } from "@/lib/property-model";
import { translations, type ProfessionalLocale } from "@/lib/professional-translations";
import { coastalCopy } from "@/lib/coastal-copy";
import { matchesIsland, staySearchQuery, type StaySearch } from "@/lib/stay-search";

export default function PropertyCards({ managedProperties = [], featured = false, locale = "en", search }: {
  managedProperties?: PublicProperty[];
  featured?: boolean;
  locale?: ProfessionalLocale;
  search?: StaySearch;
}) {
  const copy = translations[locale].properties;
  const brand = coastalCopy[locale];
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
  const localizedDescriptions: Record<string, string> = {
    "uhoos-lavish-oasis": copy.uhoo,
    "masfalhi-view-inn": copy.masfalhi,
    "rivethi-beach-hotel": copy.rivethi,
  };
  const matched = Array.from(cards.values()).filter(property => matchesIsland(property.location, search?.island));
  const visible = featured ? matched.slice(0, 6) : matched;
  const query = search ? staySearchQuery(search) : "";

  return <section id="properties" className="coastal-property-section scroll-mt-32">
    <div className="container">
      <div className="coastal-section-heading">
        <div>
          <p className="coastal-eyebrow">{featured ? brand.goodPlaces : copy.explore}</p>
          <h2>{featured ? brand.stayTitle : copy.title}</h2>
          <p>{featured ? brand.chosen : copy.body}</p>
        </div>
        {featured && <Link href="/stays" className="coastal-text-link">{copy.viewAll}<ArrowRight /></Link>}
      </div>
      {visible.length ? <div className="coastal-property-grid">
        {visible.map(property => <Link key={property.slug} href={`/stays/${property.slug}${query ? `?${query}` : ""}`} className="coastal-property-card">
          <div className="coastal-property-image"><img src={property.image} alt={property.name} loading="lazy" width={600} height={480} /></div>
          <div className="coastal-property-info">
            <p className="coastal-property-location"><MapPin aria-hidden="true" />{property.location}</p>
            <h3>{property.name}</h3>
            <p className="coastal-property-description">{localizedDescriptions[property.slug] || property.description}</p>
            <div className="coastal-property-bottom">
              <p>{property.startingFrom > 0 ? <>{copy.from} <strong>USD {property.startingFrom}</strong><small>{copy.perNight}</small></> : copy.ratesRequest}</p>
              <span aria-label={copy.exploreRooms}><ArrowUpRight aria-hidden="true" /></span>
            </div>
          </div>
        </Link>)}
      </div> : <div className="coastal-search-summary"><p role="status">{brand.noStays}</p><Link href="/stays" className="coastal-text-link">{brand.allStays}<ArrowRight /></Link></div>}
      <div className="coastal-property-shortlist"><p className="coastal-property-note">{copy.note}</p><Link href="/holiday-shortlist" className="coastal-text-link">{copy.shortlist}<ArrowRight /></Link></div>
    </div>
  </section>;
}
