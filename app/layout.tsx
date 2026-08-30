import "../styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WhatsAppFloat from "@/components/whatsapp-float";
import SmoothExperience from "@/components/smooth-experience";

export const metadata: Metadata = {
  metadataBase: new URL("https://tripelor.com"),
  title: {
    default: "Tripelor | Maldives Guesthouses, Packages & Local Island Holidays",
    template: "%s | Tripelor",
  },
  description:
    "Plan a Maldives local island holiday with Tripelor. Book guesthouses in Felidhoo, couple packages, snorkeling, manta and dolphin experiences, and speedboat transfers.",
  keywords: [
    "Tripelor",
    "Maldives guesthouse",
    "Maldives local island holiday",
    "Maldives holiday packages",
    "Felidhoo guesthouse",
    "Vaavu Atoll guesthouse",
    "Uhoo's Lavish Oasis",
    "Maldives couple packages",
    "Maldives snorkeling package",
    "Maldives manta package",
    "Felidhoo Maldives",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/tripelor-favicon.svg?v=3", type: "image/svg+xml" }],
    shortcut: "/tripelor-favicon.svg?v=3",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://tripelor.com",
    siteName: "Tripelor",
    title: "Tripelor | Maldives Guesthouses, Packages & Local Island Holidays",
    description:
      "Stay on a real Maldives island. Discover Felidhoo guesthouses, couple packages, snorkeling, marine adventures and speedboat transfers with Tripelor.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tripelor | Maldives Local Island Holidays",
    description:
      "Guesthouses, couple packages, snorkeling experiences and transfers in the Maldives.",
  },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  "@id": "https://tripelor.com/#organization",
  name: "Tripelor",
  url: "https://tripelor.com",
  email: "bookings@tripelor.com",
  telephone: "+9609429403",
  description:
    "Maldives travel agency offering local island guesthouse stays, couple packages, marine experiences and transfer assistance.",
  areaServed: { "@type": "Country", name: "Maldives" },
  address: { "@type": "PostalAddress", addressCountry: "MV" },
};
const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://tripelor.com/#website",
  url: "https://tripelor.com",
  name: "Tripelor",
  inLanguage: "en",
  publisher: { "@id": "https://tripelor.com/#organization" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
        <Navbar />
        <main><SmoothExperience>{children}</SmoothExperience></main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
