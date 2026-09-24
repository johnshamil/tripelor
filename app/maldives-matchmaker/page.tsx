import MaldivesMatchmaker from "@/components/maldives-matchmaker";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Maldives Matchmaker | Tripelor",
  description: "Answer a few quick questions and let Tripelor match you with Maldives stays based on your dates, travellers, budget and travel style.",
};

export default async function MaldivesMatchmakerPage() {
  const properties = await publishedProperties();
  return <MaldivesMatchmaker properties={properties} />;
}
