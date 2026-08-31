import type {Metadata} from "next";

export const metadata: Metadata = {
  title: "Digital Travel Wallet",
  description: "Your private Tripelor booking voucher, itinerary, transfer details and travel support in one place.",
};

export default function TravelWalletLayout({children}: {children: React.ReactNode}) {
  return children;
}
