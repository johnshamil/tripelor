import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masfalhi View Inn Maldives | Island Guesthouse | Tripelor",
  description: "Discover Masfalhi View Inn in the Maldives. Comfortable island guesthouse accommodation with Bed & Breakfast, Half Board and Full Board meal plans. Book through Tripelor.",
  keywords: ["Masfalhi View Inn", "Maldives guesthouse", "Maldives local island hotel", "island guesthouse Maldives", "Tripelor Maldives"],
  alternates: { canonical: "https://tripelor.com/stays/masfalhi-view-inn" },
  openGraph: {
    title: "Masfalhi View Inn | Maldives Guesthouse",
    description: "Comfortable Maldives guesthouse accommodation with flexible meal plans.",
    url: "https://tripelor.com/stays/masfalhi-view-inn",
    siteName: "Tripelor",
    type: "website",
    images: [{ url: "https://tripelor.com/images%20(3).jpeg", alt: "Masfalhi View Inn Maldives" }],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
