import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Island Packages & Experiences | Tripelor",
  description: "Explore Tripelor Maldives island packages with snorkeling, sandbank trips, dolphin cruises, fishing, island hopping and meal-plan stays. View details, photos and book online.",
  keywords: ["Maldives island packages", "Maldives snorkeling package", "Maldives guesthouse package", "Maldives local island holiday", "Maldives fishing package", "Tripelor packages"],
  alternates: { canonical: "https://tripelor.com/island-adventures" },
  openGraph: {
    title: "Maldives Island Packages | Tripelor",
    description: "Five-night Maldives packages combining island stays, meals and unforgettable ocean experiences.",
    url: "https://tripelor.com/island-adventures",
    siteName: "Tripelor",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
