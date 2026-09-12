import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Speedboat Transfer to Felidhoo | Tripelor",
  description:
    "Request a speedboat transfer to V. Felidhoo with Tripelor. Live departures show the current fare and seat capacity. Submit arrival date, time and seats at least 24 hours before arrival.",
  keywords: [
    "Felidhoo speedboat",
    "Male to Felidhoo speedboat",
    "Maldives speedboat transfer",
    "Vaavu Atoll speedboat",
    "Felidhoo transfer",
    "Tripelor speedboat",
  ],
  alternates: { canonical: "/speedboat" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/speedboat",
    title: "Speedboat Transfer to Felidhoo | Tripelor",
    description:
      "Request a Maldives speedboat transfer to Felidhoo with Tripelor. Check live departures and request seats at least 24 hours before arrival.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
