import IslandStory from "@/components/island-story";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your Island Story", description: "Shape a Maldives holiday around your mood, with published stays, meal plans and island experiences." };
export default async function IslandStoryPage({ searchParams }: { searchParams: Promise<{ story?: string | string[] }> }) {
  const params = await searchParams;
  const initial = typeof params.story === "string" && params.story.length <= 5000 ? params.story : "";
  const properties = await publishedProperties();
  return <IslandStory properties={properties} initial={initial} />;
}
