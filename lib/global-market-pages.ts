export type GlobalMarketPage = {
  code: string;
  hreflang: string;
  languageName: string;
  marketLabel: string;
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  accent: string;
  body: string;
  primaryCta: string;
  secondaryCta: string;
  memberCta: string;
  benefits: string[];
  trust: string[];
  searchTerms: string[];
};

export const globalMarketPages: Record<string, GlobalMarketPage> = {
  it: {
    code: "it",
    hreflang: "it",
    languageName: "Italiano",
    marketLabel: "Maldive per viaggiatori italiani",
    title: "Vacanze alle Maldive | Guesthouse, Pacchetti e Transfer | Tripelor",
    description: "Organizza le Maldive con Tripelor: guesthouse, soggiorni su isole locali, pacchetti, escursioni, transfer in motoscafo e preventivi personalizzati.",
    eyebrow: "Maldive · assistenza locale",
    headline: "Le Maldive,",
    accent: "organizzate con chi è qui.",
    body: "Scopri soggiorni autentici sulle isole locali, esperienze sull’oceano e transfer. Tripelor ti aiuta a confrontare le opzioni e preparare un viaggio su misura.",
    primaryCta: "Crea il tuo viaggio",
    secondaryCta: "Scopri i soggiorni",
    memberCta: "Unisciti a Tripelor",
    benefits: ["Guesthouse e hotel selezionati", "Preventivo personalizzato", "Escursioni e snorkeling", "Transfer aeroporto-isola", "Assistenza locale alle Maldive"],
    trust: ["Prezzi chiari", "Supporto WhatsApp", "Tripelor Points", "Offerte riservate ai membri"],
    searchTerms: ["guest house Maldive", "vacanze Maldive", "pacchetti Maldive", "isole locali Maldive"],
  },
  de: {
    code: "de",
    hreflang: "de",
    languageName: "Deutsch",
    marketLabel: "Malediven für Reisende aus Deutschland",
    title: "Malediven Urlaub | Gästehäuser, Inseln & Transfers | Tripelor",
    description: "Plane deinen Malediven-Urlaub mit Tripelor: Gästehäuser auf lokalen Inseln, Pakete, Ausflüge, Schnellboot-Transfers und persönliche Reiseangebote.",
    eyebrow: "Malediven · lokale Reisehilfe",
    headline: "Deine Maledivenreise,",
    accent: "persönlich geplant.",
    body: "Entdecke lokale Inseln, ausgewählte Unterkünfte, Meereserlebnisse und Transfers. Tripelor verbindet alles zu einer klaren, persönlichen Reise.",
    primaryCta: "Reise planen",
    secondaryCta: "Unterkünfte entdecken",
    memberCta: "Tripelor beitreten",
    benefits: ["Ausgewählte Gästehäuser und Hotels", "Persönliches Reiseangebot", "Schnorcheln und Ausflüge", "Flughafen- und Inseltransfers", "Lokale Unterstützung auf den Malediven"],
    trust: ["Klare Preise", "WhatsApp-Support", "Tripelor Points", "Private Mitgliederangebote"],
    searchTerms: ["Malediven Urlaub", "Malediven Gästehaus", "Malediven lokale Inseln", "Malediven Transfer"],
  },
  ru: {
    code: "ru",
    hreflang: "ru",
    languageName: "Русский",
    marketLabel: "Мальдивы для русскоязычных путешественников",
    title: "Отдых на Мальдивах | Гестхаусы, острова и трансферы | Tripelor",
    description: "Спланируйте Мальдивы с Tripelor: гестхаусы на локальных островах, пакеты, экскурсии, скоростные катера и персональные предложения.",
    eyebrow: "Мальдивы · местная поддержка",
    headline: "Ваши Мальдивы,",
    accent: "с поддержкой местной команды.",
    body: "Подберите проживание на локальных островах, морские впечатления и трансферы. Tripelor помогает собрать поездку в одном месте.",
    primaryCta: "Собрать поездку",
    secondaryCta: "Смотреть варианты",
    memberCta: "Вступить в Tripelor",
    benefits: ["Гестхаусы и отели", "Персональное предложение", "Снорклинг и экскурсии", "Трансферы аэропорт–остров", "Поддержка команды на Мальдивах"],
    trust: ["Понятные цены", "WhatsApp поддержка", "Tripelor Points", "Закрытые предложения"],
    searchTerms: ["отдых на Мальдивах", "гестхаус Мальдивы", "локальные острова Мальдивы", "трансфер Мальдивы"],
  },
  zh: {
    code: "zh",
    hreflang: "zh-CN",
    languageName: "中文",
    marketLabel: "马尔代夫自由行与本地岛度假",
    title: "马尔代夫自由行 | 本地岛住宿、行程与快艇接送 | Tripelor",
    description: "通过 Tripelor 规划马尔代夫旅行：本地岛民宿和酒店、海上活动、浮潜、快艇接送以及个性化行程报价。",
    eyebrow: "马尔代夫 · 当地旅行团队",
    headline: "你的马尔代夫之旅，",
    accent: "由当地团队帮你规划。",
    body: "探索本地岛住宿、海上体验和机场接送。Tripelor 帮你把住宿、活动和交通整合成清晰方便的旅行计划。",
    primaryCta: "开始规划行程",
    secondaryCta: "查看住宿",
    memberCta: "加入 Tripelor",
    benefits: ["精选民宿与酒店", "个性化旅行报价", "浮潜与海上活动", "机场与岛屿快艇接送", "马尔代夫当地支持"],
    trust: ["价格清晰", "WhatsApp 支持", "Tripelor Points", "会员专属优惠"],
    searchTerms: ["马尔代夫自由行", "马尔代夫本地岛", "马尔代夫民宿", "马尔代夫快艇接送"],
  },
  fr: {
    code: "fr",
    hreflang: "fr",
    languageName: "Français",
    marketLabel: "Maldives pour voyageurs francophones",
    title: "Voyage aux Maldives | Guesthouses, îles locales & transferts | Tripelor",
    description: "Organisez votre voyage aux Maldives avec Tripelor : guesthouses, îles locales, excursions, snorkeling, transferts en speedboat et devis personnalisés.",
    eyebrow: "Maldives · équipe locale",
    headline: "Vos Maldives,",
    accent: "organisées localement.",
    body: "Découvrez des hébergements sur les îles locales, des expériences en mer et des transferts. Tripelor réunit votre voyage en un seul endroit.",
    primaryCta: "Créer mon voyage",
    secondaryCta: "Découvrir les séjours",
    memberCta: "Rejoindre Tripelor",
    benefits: ["Guesthouses et hôtels sélectionnés", "Devis personnalisé", "Snorkeling et excursions", "Transferts aéroport–île", "Assistance locale aux Maldives"],
    trust: ["Prix transparents", "Support WhatsApp", "Tripelor Points", "Offres privées membres"],
    searchTerms: ["voyage Maldives", "guesthouse Maldives", "îles locales Maldives", "transfert Maldives"],
  },
  es: {
    code: "es",
    hreflang: "es",
    languageName: "Español",
    marketLabel: "Maldivas para viajeros hispanohablantes",
    title: "Viaje a Maldivas | Guesthouses, islas locales y traslados | Tripelor",
    description: "Organiza tu viaje a Maldivas con Tripelor: guesthouses, islas locales, excursiones, snorkel, traslados en lancha rápida y presupuestos personalizados.",
    eyebrow: "Maldivas · equipo local",
    headline: "Tus Maldivas,",
    accent: "organizadas desde aquí.",
    body: "Descubre alojamientos en islas locales, experiencias en el océano y traslados. Tripelor reúne tu viaje en un solo lugar.",
    primaryCta: "Crear mi viaje",
    secondaryCta: "Ver alojamientos",
    memberCta: "Unirme a Tripelor",
    benefits: ["Guesthouses y hoteles seleccionados", "Presupuesto personalizado", "Snorkel y excursiones", "Traslados aeropuerto–isla", "Asistencia local en Maldivas"],
    trust: ["Precios claros", "Soporte por WhatsApp", "Tripelor Points", "Ofertas privadas para miembros"],
    searchTerms: ["viaje Maldivas", "guesthouse Maldivas", "islas locales Maldivas", "traslado Maldivas"],
  },
};

export const marketCodes = Object.keys(globalMarketPages);
