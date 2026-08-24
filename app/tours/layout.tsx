import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Experiences | Snorkeling, Mantas, Dolphins & Island Trips",
  description:
    "Discover Maldives experiences with Tripelor including snorkeling, manta and dolphin trips, sandbanks, fishing and local island adventures in Vaavu Atoll.",
  keywords: [
    "Maldives snorkeling",
    "Maldives manta trip",
    "Maldives dolphin cruise",
    "Vaavu Atoll excursions",
    "Maldives sandbank trip",
    "Maldives fishing trip",
  ],
  alternates: { canonical: "/tours" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/tours",
    title: "Maldives Experiences | Tripelor",
    description:
      "Snorkeling, mantas, dolphins, sandbanks, fishing and local island experiences in the Maldives.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
