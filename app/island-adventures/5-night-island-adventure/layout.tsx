import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5-Night Maldives Island Adventure | Snorkeling, Dolphins & More",
  description: "Explore Tripelor's 5-Night Maldives Island Adventure with snorkeling, a sandbank trip, dolphin cruise, fishing and island hopping. View photos and book online.",
  keywords: ["5 night Maldives island adventure", "Maldives dolphin cruise package", "Maldives fishing package", "Maldives island hopping package", "Maldives snorkeling holiday", "Tripelor"],
  alternates: { canonical: "https://tripelor.com/island-adventures/5-night-island-adventure" },
  openGraph: {
    title: "5-Night Maldives Island Adventure | Tripelor",
    description: "Snorkeling, sandbank, dolphins, fishing and island hopping in one five-night Maldives package.",
    url: "https://tripelor.com/island-adventures/5-night-island-adventure",
    siteName: "Tripelor",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
