import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maldives Speedboat Transfer to Felidhoo | USD 50 Per Person",
  description:
    "Request a speedboat transfer to V. Felidhoo with Tripelor. Fare is USD 50 per person. Submit arrival date, time and seats at least 24 hours before arrival.",
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
      "Book a Maldives speedboat transfer to Felidhoo for USD 50 per person. Request seats at least 24 hours before arrival.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
