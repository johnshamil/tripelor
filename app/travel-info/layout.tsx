import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Felidhoo Maldives Travel Guide | Transfers, Local Island Tips & Info",
  description:
    "Plan your Felidhoo Maldives trip with Tripelor travel information, including local island transfers, speedboat guidance, arrival planning and useful travel tips.",
  keywords: [
    "Felidhoo travel guide",
    "Felidhoo Maldives transfer",
    "Vaavu Atoll travel",
    "Maldives local island travel guide",
    "Male to Felidhoo",
  ],
  alternates: { canonical: "/travel-info" },
  openGraph: {
    type: "article",
    url: "https://tripelor.com/travel-info",
    title: "Felidhoo Maldives Travel Guide | Tripelor",
    description:
      "Transfer guidance and practical information for planning a local-island holiday in Felidhoo, Maldives.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
