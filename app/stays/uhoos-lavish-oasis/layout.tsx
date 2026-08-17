import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uhoo's Lavish Oasis Felidhoo | Maldives Guesthouse | Tripelor",
  description: "Stay at Uhoo's Lavish Oasis in V. Felidhoo, Vaavu Atoll. Comfortable Maldives guesthouse rooms with Bed & Breakfast, Half Board and Full Board options. Book through Tripelor.",
  keywords: ["Uhoo's Lavish Oasis", "Felidhoo guesthouse", "Vaavu Atoll guesthouse", "Maldives local island guesthouse", "Felidhoo hotel", "Tripelor Maldives"],
  alternates: { canonical: "https://tripelor.com/stays/uhoos-lavish-oasis" },
  openGraph: {
    title: "Uhoo's Lavish Oasis | Felidhoo, Maldives",
    description: "A comfortable local-island guesthouse stay in V. Felidhoo with flexible meal plans.",
    url: "https://tripelor.com/stays/uhoos-lavish-oasis",
    siteName: "Tripelor",
    type: "website",
    images: [{ url: "https://tripelor.com/uhoos/WhatsApp%20Image%202026-08-17%20at%2015.30.23.jpeg", width: 1200, height: 630, alt: "Uhoo's Lavish Oasis Felidhoo Maldives" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
