import "../styles/globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://tripelor.com"),
  title: {
    default: "Tripelor | Maldives Guesthouses & Island Packages",
    template: "%s | Tripelor",
  },
  description: "Book Maldives guesthouses, island stays and adventure packages with Tripelor. Explore Uhoo's Lavish Oasis, Masfalhi View Inn, snorkeling, fishing, island hopping and more.",
  keywords: [
    "Tripelor",
    "Maldives guesthouse",
    "Maldives holiday packages",
    "Felidhoo guesthouse",
    "Vaavu Atoll guesthouse",
    "Uhoo's Lavish Oasis",
    "Masfalhi View Inn",
    "Maldives island packages",
    "Maldives snorkeling package",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "https://tripelor.com",
    siteName: "Tripelor",
    title: "Tripelor | Maldives Guesthouses & Island Packages",
    description: "Discover Maldives guesthouses, island stays and adventure packages with Tripelor.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Navbar/><main>{children}</main><Footer/></body></html>;
}
