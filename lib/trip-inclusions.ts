import { addNights, findCartProduct, isDate, type CartLine } from "./trip-cart";

// Activity categories reflect the published inclusions, not exact operator products.
const labels = {
  snorkeling: "snorkeling", sandbank: "a sandbank visit", dolphins: "dolphin experiences",
  fishing: "fishing", nightFishing: "night fishing", bbq: "a BBQ meal", islandHopping: "island hopping",
  turtles: "turtle spotting", sharks: "shark snorkeling", shipwreck: "shipwreck snorkeling",
  manta: "a manta excursion", sunset: "a sunset experience",
} as const;
type Activity = keyof typeof labels;
const stayActivities: Record<string, readonly Activity[]> = {
  "reef-relax-escape": ["snorkeling"],
  "5-night-island-adventure": ["snorkeling", "sandbank", "dolphins", "fishing", "islandHopping"],
  "ocean-discovery-escape": ["snorkeling", "fishing", "nightFishing", "islandHopping"],
  "beach-bbq-dinner-escape": ["snorkeling", "bbq", "sunset"],
  "honeymoon-island-escape": ["sandbank", "dolphins"],
  "manta-dolphin-adventure": ["manta", "dolphins", "snorkeling"],
  "sunset-sandbank-escape": ["sandbank", "sunset", "snorkeling"],
};
const activities: Record<string, readonly Activity[]> = {
  "package:vaavu-blue-escape": ["snorkeling", "sharks", "dolphins", "shipwreck", "turtles", "islandHopping"],
  "excursion:two-point-snorkeling": ["snorkeling"],
  "excursion:two-point-snorkeling-sandbank": ["snorkeling", "sandbank", "dolphins"],
  "excursion:turtle-shark-reef-snorkeling": ["snorkeling", "sharks", "turtles", "dolphins"],
  "excursion:guided-house-reef-snorkeling": ["snorkeling"],
  "excursion:night-fishing": ["fishing", "nightFishing"],
  "excursion:night-fishing-live-bbq": ["fishing", "nightFishing", "bbq"],
};
function activityTags(id: string) {
  return id.startsWith("stay:") ? stayActivities[id.split(":")[1]] || [] : activities[id] || [];
}

export type InclusionOverlap = { productId: string; packageName: string; activities: string[] };
export function findInclusionOverlaps(productId: string, lines: readonly CartLine[]): InclusionOverlap[] {
  const candidate = findCartProduct(productId);
  if (!candidate) return [];
  const selected = lines.find(line => line.productId === productId);
  const targetTags = activityTags(productId);
  return lines.flatMap(line => {
    const source = findCartProduct(line.productId);
    if (!source || source.kind === "excursion" || source.id === productId || line.quantity < 1) return [];
    if (selected && isDate(selected.date) && isDate(line.date)) {
      const targetEnd = addNights(selected.date, candidate.nights || 0);
      const sourceEnd = addNights(line.date, source.nights || 0);
      if (selected.date > sourceEnd || line.date > targetEnd) return [];
    }
    const shared = targetTags.filter(tag => activityTags(source.id).includes(tag));
    const specific = shared.filter(tag => tag !== "fishing" || !shared.includes("nightFishing"));
    return specific.length ? [{ productId: source.id, packageName: source.name, activities: specific.map(tag => labels[tag]) }] : [];
  }).sort((a, b) => b.activities.length - a.activities.length);
}
