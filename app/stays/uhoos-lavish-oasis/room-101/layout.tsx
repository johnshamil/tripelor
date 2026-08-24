import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROOM 101 at Uhoo's Lavish Oasis | Felidhoo Maldives",
  description:
    "View ROOM 101 at Uhoo's Lavish Oasis in Felidhoo, Maldives. See room photos, check availability and book your local-island stay with Tripelor.",
  alternates: { canonical: "/stays/uhoos-lavish-oasis/room-101" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/stays/uhoos-lavish-oasis/room-101",
    title: "ROOM 101 | Uhoo's Lavish Oasis, Felidhoo",
    description: "Room photos, availability and booking for ROOM 101 in Felidhoo, Maldives.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
