import SecretDeals from "@/components/secret-deals";
import { publishedProperties } from "@/lib/property-store";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Secret Maldives Deals | Tripelor",
  description: "Unlock private Tripelor Maldives stay options based on your budget, travel month, destination and holiday style.",
};

export default async function SecretDealsPage() {
  return <SecretDeals properties={await publishedProperties()} />;
}
