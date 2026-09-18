import type { QuotedLine } from "@/lib/trip-cart";
import { stayCartId } from "@/lib/trip-cart";
import { fiveNight, threeNight } from "@/lib/island-packages";
import { localizePackages, localizedVaavuBlue, localizedVaavuExcursion } from "@/lib/package-translations";
import type { ProfessionalLocale } from "@/lib/professional-translations";

export function localizeQuotedLine(item: QuotedLine, locale: ProfessionalLocale): QuotedLine {
  if (locale === "en") return item;

  if (item.productId === "package:vaavu-blue-escape") {
    const localized = localizedVaavuBlue(locale);
    return localized ? { ...item, inclusions: localized.inclusions } : item;
  }

  if (item.productId.startsWith("excursion:")) {
    const slug = item.productId.slice("excursion:".length);
    const localized = localizedVaavuExcursion(slug, locale);
    return localized
      ? { ...item, name: localized.name, inclusions: localized.highlights, duration: localized.duration || item.duration }
      : item;
  }

  if (item.productId.startsWith("stay:")) {
    const packages = localizePackages([...threeNight, ...fiveNight], locale);
    const localized = packages.find(pkg => stayCartId(pkg.slug, pkg.nights) === item.productId);
    return localized ? { ...item, name: localized.name, inclusions: localized.items } : item;
  }

  return item;
}
