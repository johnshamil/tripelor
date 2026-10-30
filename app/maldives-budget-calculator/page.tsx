import type { Metadata } from "next";
import MaldivesBudgetCalculator from "@/components/maldives-budget-calculator";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Maldives Budget Calculator",
  description: "See which Tripelor Maldives stays fit your accommodation budget, then unlock member results and build a personalized trip.",
};

export default async function MaldivesBudgetCalculatorPage() {
  const properties = await publishedProperties();
  const stays = properties.map((property) => {
    const values = [
      ...property.rooms.map((room) => Number(room.sellingRate)),
      ...property.seasonalRates.map((rate) => Number(rate.sellingRate)),
    ].filter((value) => Number.isFinite(value) && value > 0);
    return {
      slug: property.slug,
      name: property.name,
      island: property.island,
      startingFrom: values.length ? Math.min(...values) : 0,
    };
  });

  return <MaldivesBudgetCalculator stays={stays} />;
}
