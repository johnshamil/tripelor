import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROOM 106 at Masfalhi View Inn | Maldives",
  description:
    "View ROOM 106 at Masfalhi View Inn in the Maldives. See room details, check availability and book your local-island stay with Tripelor.",
  alternates: { canonical: "/stays/masfalhi-view-inn/room-106" },
  openGraph: {
    type: "website",
    url: "https://tripelor.com/stays/masfalhi-view-inn/room-106",
    title: "ROOM 106 | Masfalhi View Inn, Maldives",
    description: "Room details, availability and booking for ROOM 106 at Masfalhi View Inn.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
