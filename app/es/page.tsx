import type { Metadata } from "next";
import GlobalMarketLanding from "@/components/global-market-landing";
import { globalMarketPages } from "@/lib/global-market-pages";

const market = globalMarketPages["es"];

export const metadata: Metadata = {
  title: market.title,
  description: market.description,
  alternates: {
    canonical: "https://tripelor.com/es",
    languages: {
      "x-default": "https://tripelor.com",
      en: "https://tripelor.com",
      it: "https://tripelor.com/it",
      de: "https://tripelor.com/de",
      ru: "https://tripelor.com/ru",
      "zh-CN": "https://tripelor.com/zh",
      fr: "https://tripelor.com/fr",
      es: "https://tripelor.com/es",
    },
  },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/es",
    siteName: "Tripelor",
    title: market.title,
    description: market.description,
    images: [{ url: "/properties/rivethi-beach-hotel/1719713475.jpeg", width: 1200, height: 630, alt: "Tripelor Maldives" }],
  },
  twitter: {
    card: "summary_large_image",
    title: market.title,
    description: market.description,
    images: ["/properties/rivethi-beach-hotel/1719713475.jpeg"],
  },
};

export default function MarketPage() {
  return <GlobalMarketLanding market={market} />;
}
