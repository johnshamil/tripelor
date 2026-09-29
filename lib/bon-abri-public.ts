// Retail prices in USD from the Bon Abri Maldives 2026/27 partner rate sheet.
// The supplier's contracted rates belong only in the protected admin record.
export type BonAbriPackage = {
  slug: string;
  name: string;
  nights: number;
  perPerson: number;
  summary: string;
  inclusions: readonly string[];
  note?: string;
};

export const BON_ABRI_PACKAGES: readonly BonAbriPackage[] = [
  {
    slug: "maldives-escape-5-nights",
    name: "Maldives Escape",
    nights: 5,
    perPerson: 341,
    summary: "Five nights in N. Magoodhoo with island dining and ocean time.",
    inclusions: ["5 nights' accommodation at Bon Abri Maldives", "Full Board meals", "Reef snorkeling and a sandbank visit", "Dolphin watching and a sunset cruise"],
    note: "The activities are arranged as two combined shared boat trips.",
  },
  {
    slug: "complete-maldives-holiday-7-nights",
    name: "Complete Maldives Holiday",
    nights: 7,
    perPerson: 506,
    summary: "Seven nights with a beach BBQ and three included experiences.",
    inclusions: ["7 nights' accommodation at Bon Abri Maldives", "Full Board meals", "Snorkeling and sandbank combined trip", "Beach BBQ", "Night-fishing trip"],
  },
  {
    slug: "maldives-fishing-holiday-7-nights",
    name: "Maldives Fishing Holiday",
    nights: 7,
    perPerson: 823.90,
    summary: "Four private fishing trips with an experienced local captain.",
    inclusions: ["7 nights' accommodation at Bon Abri Maldives", "Full Board meals", "4 private fishing trips totaling 16 hours", "Local captain and fishing equipment"],
    note: "Fishing styles, trips and locations depend on conditions and target species.",
  },
  {
    slug: "three-island-escape-9-nights",
    name: "Three-Island Escape",
    nights: 9,
    perPerson: 1017.50,
    summary: "Three nights each on Magoodhoo, Lhohi and Maafaru.",
    inclusions: ["9 nights' accommodation: 3 each on N. Magoodhoo, N. Lhohi and N. Maafaru", "Full Board meals", "Shared fishing trip", "Dolphin watching and sunset cruise", "Turtle snorkeling and sandbank trip", "Inter-island transfers, local boat crews and guides"],
    note: "The island order may change with weather, sea conditions and availability.",
  },
  {
    slug: "maldives-fishing-holiday-13-nights",
    name: "Maldives Fishing Holiday",
    nights: 13,
    perPerson: 1980,
    summary: "An extended fishing stay with return scheduled speedboat transfers.",
    inclusions: ["13 nights' accommodation at Bon Abri Maldives", "Full Board meals", "11 private fishing trips", "Experienced local captains and fishing equipment", "Return scheduled speedboat transfer between Malé and N. Magoodhoo"],
    note: "Fishing trips and speedboat services depend on weather, sea conditions and availability.",
  },
];

export const BON_ABRI_ROOM_RATES = [
  { season: "Shoulder", room: "Twin Room", single: 82.50, double: 104.50, triple: 121 },
  { season: "Shoulder", room: "Double Room", single: 88, double: 110, triple: 126.50 },
  { season: "Shoulder", room: "Double Room with Veranda Garden View", single: 99, double: 121, triple: 137.50 },
  { season: "Peak", room: "Twin Room", single: 94.60, double: 121, triple: 137.50 },
  { season: "Peak", room: "Double Room", single: 101.20, double: 126.50, triple: 145.20 },
  { season: "Peak", room: "Double Room with Veranda Garden View", single: 115.50, double: 137.50, triple: 158.40 },
] as const;

export const BON_ABRI_GROUP_RATES = [
  { season: "Shoulder", room: "Twin Room", single: 62.70, double: 80.30, triple: 92.40 },
  { season: "Shoulder", room: "Double Room", single: 68.20, double: 84.70, triple: 96.80 },
  { season: "Shoulder", room: "Double Room with Veranda Garden View", single: 75.90, double: 92.40, triple: 105.60 },
  { season: "Peak", room: "Twin Room", single: 72.60, double: 92.40, triple: 105.60 },
  { season: "Peak", room: "Double Room", single: 77, double: 96.80, triple: 111.10 },
  { season: "Peak", room: "Double Room with Veranda Garden View", single: 88, double: 105.60, triple: 121 },
] as const;

export const BON_ABRI_EXCURSIONS = [
  { name: "Sunset Fishing", price: 49.50, unit: "person" },
  { name: "Local Island Hopping", price: 55, unit: "person" },
  { name: "Turtle Snorkeling", price: 60.50, unit: "person" },
  { name: "Lucky Manta Snorkeling", price: 88, unit: "person" },
  { name: "Night Snorkeling", price: 88, unit: "person" },
  { name: "Big Game Fishing", price: 104.50, unit: "hour" },
] as const;

export const BON_ABRI_TRANSFERS = [
  { name: "Shared speedboat, Malé ↔ N. Magoodhoo", price: 77, detail: "Per person, each way · approximately 3 hours" },
  { name: "Domestic flight + speedboat via Maafaru", price: 165, detail: "Per person, each way · approximately 30–40 minutes flight plus 15 minutes by boat" },
] as const;

export const bonAbriCartId = (pkg: BonAbriPackage) => `stay:bon-abri-${pkg.slug}:${pkg.nights}`;
export const bonAbriMoney = (amount: number) => amount.toLocaleString("en-US", { minimumFractionDigits: amount % 1 ? 2 : 0, maximumFractionDigits: 2 });
