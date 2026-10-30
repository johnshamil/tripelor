import type { Metadata } from "next";
import MemberGrowthHub from "@/components/member-growth-hub";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tripelor Member Tools",
  description: "Use Tripelor member tools for Secret Deals, budget matching, price alerts, trip planning, deal-hold requests, group sharing and Maldives transfer help.",
};

export default async function MemberToolsPage() {
  const properties = (await publishedProperties()).map((property) => ({
    slug: property.slug,
    name: property.name,
    island: property.island,
  }));

  return <MemberGrowthHub properties={properties} />;
}
