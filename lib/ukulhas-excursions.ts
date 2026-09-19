export type UkulhasExcursion = {
  slug: string;
  name: string;
  price: number;
  duration?: string;
  category: "snorkeling" | "combo" | "full-day" | "fishing";
  description: string;
  inclusions: readonly string[];
};

export const UKULHAS_EXCURSIONS: readonly UkulhasExcursion[] = [
  {
    slug: "single-snorkeling",
    name: "Single Snorkeling",
    price: 65,
    category: "snorkeling",
    description: "Choose any single activity from the Paguro excursion list.",
    inclusions: ["Manta", "Turtle", "Live Coral", "Nurse Shark", "Fish Feeding", "Sandbank", "Desert Island", "Sunset Fishing"],
  },
  {
    slug: "double-adventure",
    name: "Double Adventure",
    price: 75,
    category: "combo",
    description: "Choose any two activities from the Single Snorkeling list.",
    inclusions: ["Manta + Turtle", "Manta + Live Coral", "Manta + Nurse Shark", "Turtle + Live Coral", "Nurse Shark + Fish Feeding", "Turtle + Fish Feeding"],
  },
  {
    slug: "triple-combo",
    name: "Triple Combo",
    price: 85,
    category: "combo",
    description: "Choose any three activities from the Single Snorkeling list.",
    inclusions: ["Manta + Turtle + Live Coral", "Manta + Turtle + Nurse Shark", "Manta + Live Coral + Fish Feeding", "Nurse Shark + Turtle + Fish Feeding", "Manta + Turtle + Sandbank"],
  },
  {
    slug: "four-combo-trips",
    name: "Four Combo Trips",
    price: 100,
    category: "combo",
    description: "Create your own custom four-activity combo from the Single Snorkeling list.",
    inclusions: ["Manta + Turtle + Live Coral + Nurse Shark", "Manta + Turtle + Fish Feeding + Sandbank", "Nurse Shark + Turtle + Fish Feeding + Desert Island", "Manta + Live Coral + Fish Feeding + Sandbank"],
  },
  {
    slug: "desert-island-picnic",
    name: "Full Day Picnic on Desert Island",
    price: 90,
    duration: "6 hours",
    category: "full-day",
    description: "A full day at Mathiveri Finolhu.",
    inclusions: ["Six hours of island time", "Pack lunch included", "Mathiveri Finolhu"],
  },
  {
    slug: "thoddoo-island-trip",
    name: "Full Day Thoddoo Island Trip",
    price: 100,
    duration: "Full day",
    category: "full-day",
    description: "Visit the Fruit Island and experience local island life.",
    inclusions: ["Agricultural farms", "Beach exploration", "Local lifestyle experience", "Lunch included"],
  },
  {
    slug: "fish-feeding-full-day",
    name: "Full Day Fish Feeding Excursion",
    price: 120,
    duration: "Full day",
    category: "full-day",
    description: "A full-day ocean excursion around Rasdhoo and Madivaru Finolhu.",
    inclusions: ["Rasdhoo reef snorkeling", "Sandbank visit", "Fish feeding at Madivaru Finolhu", "Lunch included"],
  },
  {
    slug: "whale-shark-adventure",
    name: "Full Day Whale Shark Adventure",
    price: 150,
    duration: "Full day",
    category: "full-day",
    description: "A full-day whale shark snorkeling adventure.",
    inclusions: ["Whale shark snorkeling", "Lunch included"],
  },
];

export function ukulhasExcursionEnquiry(excursion: UkulhasExcursion) {
  const duration = excursion.duration ? `\nDuration: ${excursion.duration}.` : "";
  return `I would like to enquire about ${excursion.name} in Ukulhas at USD ${excursion.price} per person.${duration}\n\nPlease confirm availability for my date and number of guests.`;
}
