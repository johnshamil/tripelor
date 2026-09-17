export type VaavuExcursion = {
  slug: string;
  name: string;
  category: "snorkeling" | "fishing";
  price: number;
  duration?: string;
  highlights: readonly string[];
};

export const VAAVU_EXCURSIONS: readonly VaavuExcursion[] = [
  {
    slug: "two-point-snorkeling",
    name: "Two-Point Snorkeling",
    category: "snorkeling",
    price: 30,
    highlights: ["Snorkeling at two different spots"],
  },
  {
    slug: "two-point-snorkeling-sandbank",
    name: "Two-Point Snorkeling & Sandbank",
    category: "snorkeling",
    price: 60,
    highlights: [
      "Snorkeling at two different spots",
      "Sandbank visit",
      "Chance to spot dolphins",
    ],
  },
  {
    slug: "turtle-shark-reef-snorkeling",
    name: "Turtle, Shark & Reef Snorkeling",
    category: "snorkeling",
    price: 40,
    highlights: [
      "Turtle and shark snorkeling",
      "Reef snorkeling",
      "Chance to spot dolphins",
    ],
  },
  {
    slug: "guided-house-reef-snorkeling",
    name: "Guided House Reef Snorkeling",
    category: "snorkeling",
    price: 20,
    highlights: ["House reef snorkeling", "Guide included"],
  },
  {
    slug: "night-fishing",
    name: "Night Fishing",
    category: "fishing",
    price: 15,
    duration: "2 hours",
    highlights: ["Night fishing experience"],
  },
  {
    slug: "night-fishing-live-bbq",
    name: "Night Fishing with Live BBQ",
    category: "fishing",
    price: 55,
    highlights: ["Night fishing experience", "Live BBQ"],
  },
];

export function findVaavuExcursion(slug: string | null) {
  return VAAVU_EXCURSIONS.find(excursion => excursion.slug === slug);
}

export function vaavuExcursionEnquiry(excursion: VaavuExcursion) {
  const duration = excursion.duration ? `\nDuration: ${excursion.duration}.` : "";
  return `I would like to enquire about ${excursion.name} at USD ${excursion.price} per person.${duration}\n\nExcursion details: ${excursion.highlights.join("; ")}.\n\nPlease confirm availability for my travel date and number of guests.`;
}
