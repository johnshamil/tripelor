import CoupleMatch from "@/components/couple-match";
import { publishedProperties } from "@/lib/property-store";
export const dynamic = "force-dynamic";
export const metadata = { title: "Two Hearts, One Island", description: "Find common ground for your Maldives holiday.", robots:{index:false,follow:false}, referrer:"no-referrer" };
export default async function CoupleMatchPage() {
  return <CoupleMatch properties={await publishedProperties()} />;
}
