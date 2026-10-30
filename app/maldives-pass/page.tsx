import type { Metadata } from "next";
import MaldivesPass from "@/components/maldives-pass";

export const metadata: Metadata = {
  title: "Tripelor Maldives Pass | Private Deals, Alerts & Member Travel",
  description: "Unlock your free Tripelor Maldives Pass for private price checks, Secret Deals, availability alerts, Tripelor Points, saved trips and local concierge support.",
  alternates: { canonical: "https://tripelor.com/maldives-pass" },
};

export default function MaldivesPassPage() {
  return (
    <main className="bg-[#f1ebdf] py-10 text-[#071922] md:py-16">
      <div className="container">
        <MaldivesPass />
      </div>
    </main>
  );
}
