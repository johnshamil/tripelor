import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Ocean Discovery Escape | 5-Night Full Board Package",
  description: "Book the Maldives Ocean Discovery Escape: 5 nights with Full Board, snorkeling, night fishing and island hopping. View package details and photos with Tripelor.",
  keywords: ["Maldives Ocean Discovery Escape", "Full Board Maldives package", "Maldives night fishing package", "Maldives snorkeling and island hopping", "5 night Maldives package", "Tripelor"],
  alternates: { canonical: "https://tripelor.com/island-adventures/ocean-discovery-escape" },
  openGraph: {
    title: "Maldives Ocean Discovery Escape | Tripelor",
    description: "Five nights with Full Board, snorkeling, night fishing and island hopping in the Maldives.",
    url: "https://tripelor.com/island-adventures/ocean-discovery-escape",
    siteName: "Tripelor",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
