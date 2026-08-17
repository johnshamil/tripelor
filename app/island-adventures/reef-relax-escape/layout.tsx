import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Reef & Relax Escape | 5-Night Snorkeling Package",
  description: "Book the Maldives Reef & Relax Escape: a 5-night Maldives package with Half Board meals and snorkeling. View photos, inclusions and booking details with Tripelor.",
  keywords: ["Maldives Reef and Relax Escape", "5 night Maldives package", "Maldives snorkeling package", "Half Board Maldives package", "Tripelor"],
  alternates: { canonical: "https://tripelor.com/island-adventures/reef-relax-escape" },
  openGraph: {
    title: "Maldives Reef & Relax Escape | Tripelor",
    description: "Five relaxing nights with Half Board meals and a snorkeling experience in the Maldives.",
    url: "https://tripelor.com/island-adventures/reef-relax-escape",
    siteName: "Tripelor",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
