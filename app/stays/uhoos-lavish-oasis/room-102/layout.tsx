import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Double Deluxe Room at Uhoo's Lavish Oasis | Felidhoo Maldives",
  description:
    "View the Double Deluxe Room at Uhoo's Lavish Oasis in Felidhoo, Maldives. See room photos, check availability and book your local-island stay with Tripelor.",
  alternates: { canonical: "/stays/uhoos-lavish-oasis/room-102" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/stays/uhoos-lavish-oasis/room-102",
    title: "Double Deluxe Room | Uhoo's Lavish Oasis, Felidhoo",
    description: "Room photos, availability and booking for the Double Deluxe Room in Felidhoo, Maldives.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
