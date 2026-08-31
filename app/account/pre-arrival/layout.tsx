import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Pre-Arrival Concierge | Tripelor",
  description: "Share your arrival and stay preferences with the Tripelor concierge before your Maldives journey.",
};

export default function PreArrivalLayout({children}: {children: React.ReactNode}) {
  return children;
}
