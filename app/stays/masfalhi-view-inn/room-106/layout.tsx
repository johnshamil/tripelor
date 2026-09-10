import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Family Room with Sea View at Masfalhi View Inn | Felidhoo Maldives",
  description:
    "View the Family Room with Sea View at Masfalhi View Inn in V. Felidhoo, Maldives. See room details, check availability and book with Tripelor.",
  alternates: { canonical: "/stays/masfalhi-view-inn/room-106" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/stays/masfalhi-view-inn/room-106",
    title: "Family Room with Sea View | Masfalhi View Inn",
    description: "Sea-view family accommodation, availability and booking at Masfalhi View Inn in V. Felidhoo.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
