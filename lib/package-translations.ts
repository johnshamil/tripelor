import type { StayPackage } from "@/lib/island-packages";
import type { ProfessionalLocale } from "@/lib/professional-translations";

type LocalizedPackage = Pick<StayPackage, "name" | "label" | "description" | "items">;

const it: Record<string, LocalizedPackage> = {
  "reef-relax-escape": {
    name: "Maldive Reef & Relax",
    label: "Relax e snorkeling",
    description: "Una fuga rilassante per due con mezza pensione e snorkeling nelle limpide acque tropicali delle Maldive.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Mezza pensione", "Esperienza di snorkeling"],
  },
  "5-night-island-adventure": {
    name: "Avventura sull'isola · 5 notti",
    label: "Avventura completa",
    description: "Cinque notti per due con mezza pensione, snorkeling, banco di sabbia, delfini, pesca e island hopping.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Mezza pensione", "Snorkeling + banco di sabbia", "Crociera con i delfini + pesca", "Island hopping"],
  },
  "ocean-discovery-escape": {
    name: "Maldive Ocean Discovery",
    label: "Avventura con pensione completa",
    description: "Una fuga più ricca per due con pensione completa, snorkeling, pesca notturna e island hopping.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Pensione completa", "Snorkeling", "Pesca notturna + island hopping"],
  },
  "beach-bbq-dinner-escape": {
    name: "Fuga con cena BBQ sulla spiaggia",
    label: "BBQ sulla spiaggia",
    description: "Una fuga romantica per due con una speciale cena barbecue sulla spiaggia, tramonto e snorkeling.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Mezza pensione", "Cena BBQ sulla spiaggia", "Tramonto + snorkeling"],
  },
  "honeymoon-island-escape": {
    name: "Fuga romantica per luna di miele",
    label: "Luna di miele",
    description: "Un pacchetto romantico con pensione completa, cena sulla spiaggia, banco di sabbia ed esperienze sull'oceano.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Pensione completa", "Cena romantica sulla spiaggia", "Banco di sabbia + crociera con i delfini"],
  },
  "manta-dolphin-adventure": {
    name: "Avventura tra mante e delfini",
    label: "Avventura marina",
    description: "Un'avventura sull'oceano per due con escursione alla ricerca delle mante quando le condizioni lo consentono, crociera con i delfini e snorkeling.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Mezza pensione", "Escursione mante", "Crociera con i delfini + snorkeling"],
  },
  "sunset-sandbank-escape": {
    name: "Tramonto & banco di sabbia",
    label: "Romanticismo sull'isola",
    description: "Cinque notti romantiche per due con mezza pensione, tempo su un banco di sabbia e crociera al tramonto.",
    items: ["5 notti per 2 adulti", "1 camera presso Uhoo's Lavish Oasis", "Mezza pensione", "Escursione al banco di sabbia", "Crociera al tramonto + snorkeling"],
  },
};

const ru: Record<string, LocalizedPackage> = {
  "reef-relax-escape": {
    name: "Maldive Reef & Relax",
    label: "Отдых и снорклинг",
    description: "Спокойный отдых для двоих с полупансионом и снорклингом в тёплой прозрачной воде Мальдив.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полупансион", "Снорклинг"],
  },
  "5-night-island-adventure": {
    name: "Островное приключение · 5 ночей",
    label: "Полное приключение",
    description: "Пять ночей для двоих с полупансионом, снорклингом, песчаной отмелью, дельфинами, рыбалкой и поездкой по островам.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полупансион", "Снорклинг + песчаная отмель", "Круиз с дельфинами + рыбалка", "Поездка по островам"],
  },
  "ocean-discovery-escape": {
    name: "Maldive Ocean Discovery",
    label: "Приключение с полным пансионом",
    description: "Насыщенный отдых для двоих с полным пансионом, снорклингом, ночной рыбалкой и поездкой по островам.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полный пансион", "Снорклинг", "Ночная рыбалка + поездка по островам"],
  },
  "beach-bbq-dinner-escape": {
    name: "Пляжный BBQ-ужин",
    label: "BBQ на пляже",
    description: "Романтический отдых для двоих со специальным ужином-барбекю на пляже, закатом и снорклингом.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полупансион", "BBQ-ужин на пляже", "Закат + снорклинг"],
  },
  "honeymoon-island-escape": {
    name: "Островной медовый месяц",
    label: "Медовый месяц",
    description: "Романтический пакет с полным пансионом, ужином на пляже, песчаной отмелью и океанскими впечатлениями.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полный пансион", "Романтический ужин на пляже", "Песчаная отмель + круиз с дельфинами"],
  },
  "manta-dolphin-adventure": {
    name: "Манты и дельфины",
    label: "Морское приключение",
    description: "Океанское приключение для двоих: поездка к мантам при подходящих условиях, круиз с дельфинами и снорклинг.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полупансион", "Экскурсия к мантам", "Круиз с дельфинами + снорклинг"],
  },
  "sunset-sandbank-escape": {
    name: "Закат и песчаная отмель",
    label: "Островная романтика",
    description: "Романтические пять ночей для двоих с полупансионом, отдыхом на песчаной отмели и круизом на закате.",
    items: ["5 ночей для 2 взрослых", "1 номер в Uhoo's Lavish Oasis", "Полупансион", "Поездка на песчаную отмель", "Круиз на закате + снорклинг"],
  },
};

function adaptThreeNight(pkg: LocalizedPackage, locale: ProfessionalLocale): LocalizedPackage {
  if (locale === "it") {
    return {
      ...pkg,
      name: pkg.name.replace("5 notti", "3 notti"),
      description: pkg.description.replace(/Cinque notti/gi, "Tre notti").replace(/cinque notti/gi, "tre notti"),
      items: pkg.items.map((item) => item.startsWith("5 notti") ? "3 notti per 2 adulti" : item),
    };
  }
  if (locale === "ru") {
    return {
      ...pkg,
      name: pkg.name.replace("5 ночей", "3 ночи"),
      description: pkg.description.replace(/Пять ночей/gi, "Три ночи").replace(/пять ночей/gi, "три ночи"),
      items: pkg.items.map((item) => item.startsWith("5 ночей") ? "3 ночи для 2 взрослых" : item),
    };
  }
  return pkg;
}

export function localizePackages(items: StayPackage[], locale: ProfessionalLocale): StayPackage[] {
  if (locale === "en") return items;
  const dictionary = locale === "it" ? it : ru;
  return items.map((pkg) => {
    const translated = dictionary[pkg.slug];
    if (!translated) return pkg;
    const localized = pkg.nights === 3 ? adaptThreeNight(translated, locale) : translated;
    return { ...pkg, ...localized };
  });
}
