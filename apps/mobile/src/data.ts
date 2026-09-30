import type { Property, TravelPackage } from "./types";

export const properties: Property[] = [
  {
    id: "uhoos",
    name: "Uhoo's Lavish Oasis",
    location: "V. Felidhoo, Maldives",
    description:
      "Comfortable rooms, warm island hospitality and flexible meal plans for a relaxed Felidhoo getaway.",
    image: require("../assets/images/uhoos-cover.jpeg"),
    gallery: [
      require("../assets/images/uhoos-cover.jpeg"),
      require("../assets/images/uhoos-room.jpeg"),
    ],
    rates: { "Bed & Breakfast": 85, "Half Board": 95, "Full Board": 115 },
    roomTypes: ["ROOM 101", "ROOM 102"],
    maxRooms: 1,
    features: [
      "Two comfortable deluxe rooms",
      "Breakfast, Half Board and Full Board options",
      "Speedboat transfer assistance",
      "Snorkeling and island experiences",
      "Personal Tripelor booking support",
    ],
  },
  {
    id: "masfalhi",
    name: "Masfalhi View Inn",
    location: "Maldives",
    description:
      "A comfortable local-island guesthouse with flexible meal plans and friendly Maldivian hospitality.",
    image: require("../assets/images/masfalhi-cover.jpeg"),
    gallery: [
      require("../assets/images/masfalhi-cover.jpeg"),
      require("../assets/images/masfalhi-room.jpeg"),
    ],
    rates: { "Bed & Breakfast": 80, "Half Board": 90, "Full Board": 100 },
    roomTypes: ["Deluxe Room"],
    maxRooms: 6,
    features: [
      "Comfortable deluxe accommodation",
      "Flexible meal-plan choices",
      "Local-island hospitality",
      "Excursions available on request",
      "Tripelor booking support",
    ],
  },
];

const fiveNightPackages: TravelPackage[] = [
  {
    id: "reef-relax-5",
    name: "Maldives Reef & Relax Escape",
    label: "Relax & Snorkel",
    price: 750,
    nights: 5,
    mealPlan: "Half Board",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1400&auto=format&fit=crop",
    description: "A relaxing couple escape with Half Board meals and snorkeling in warm, crystal-clear tropical water.",
    included: ["5 nights for 2 adults", "1 room", "Half Board meal plan", "Snorkeling experience"],
  },
  {
    id: "island-adventure-5",
    name: "5-Night Island Adventure",
    label: "Full Adventure",
    price: 950,
    nights: 5,
    mealPlan: "Half Board",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
    description: "A five-night couple adventure with snorkeling, sandbank, dolphins, fishing and island hopping.",
    included: ["5 nights for 2 adults", "1 room", "Half Board meal plan", "Snorkeling + sandbank", "Dolphin cruise + fishing", "Island hopping"],
  },
  {
    id: "ocean-discovery-5",
    name: "Maldives Ocean Discovery Escape",
    label: "Full Board Adventure",
    price: 1150,
    nights: 5,
    mealPlan: "Full Board",
    image: "https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1400&auto=format&fit=crop",
    description: "A richer couple escape with Full Board dining, snorkeling, night fishing and island hopping.",
    included: ["5 nights for 2 adults", "1 room", "Full Board meal plan", "Snorkeling", "Night fishing + island hopping"],
  },
  {
    id: "beach-bbq-5",
    name: "Beach BBQ Dinner Escape",
    label: "Beach BBQ",
    price: 990,
    nights: 5,
    mealPlan: "Half Board",
    image: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1400&auto=format&fit=crop",
    description: "A romantic couple getaway with a special beach BBQ dinner, sunset time and snorkeling.",
    included: ["5 nights for 2 adults", "1 room", "Half Board meal plan", "Beach BBQ dinner", "Sunset + snorkeling"],
  },
  {
    id: "honeymoon-5",
    name: "Honeymoon Island Escape",
    label: "Honeymoon",
    price: 1350,
    nights: 5,
    mealPlan: "Full Board",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
    description: "A romantic honeymoon package with Full Board dining, beach dinner, sandbank time and ocean experiences.",
    included: ["5 nights for 2 adults", "1 room", "Full Board meal plan", "Romantic beach dinner", "Sandbank + dolphin cruise"],
  },
  {
    id: "manta-dolphin-5",
    name: "Manta & Dolphin Adventure",
    label: "Marine Adventure",
    price: 1050,
    nights: 5,
    mealPlan: "Half Board",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1400&auto=format&fit=crop",
    description: "A couple ocean adventure with a manta excursion when conditions allow, dolphin cruise and snorkeling.",
    included: ["5 nights for 2 adults", "1 room", "Half Board meal plan", "Manta excursion", "Dolphin cruise + snorkeling"],
  },
  {
    id: "sunset-sandbank-5",
    name: "Sunset & Sandbank Escape",
    label: "Island Romance",
    price: 820,
    nights: 5,
    mealPlan: "Half Board",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
    description: "A romantic five-night getaway with Half Board dining, sandbank time and a sunset cruise.",
    included: ["5 nights for 2 adults", "1 room", "Half Board meal plan", "Sandbank trip", "Sunset cruise + snorkeling"],
  },
];

const threeNightPrices: Record<string, number> = {
  "reef-relax-5": 500,
  "island-adventure-5": 650,
  "ocean-discovery-5": 750,
  "beach-bbq-5": 650,
  "honeymoon-5": 900,
  "manta-dolphin-5": 700,
  "sunset-sandbank-5": 550,
};

const threeNightPackages: TravelPackage[] = fiveNightPackages.map((item) => ({
  ...item,
  id: item.id.replace("-5", "-3"),
  name: item.name.replace("5-Night ", ""),
  nights: 3,
  price: threeNightPrices[item.id] ?? 550,
  description: item.description.replace("five-night", "three-night"),
  included: item.included.map((value) =>
    value.startsWith("5 nights") ? "3 nights for 2 adults" : value,
  ),
}));

export const packages = [...threeNightPackages, ...fiveNightPackages];

export const faqs = [
  {
    question: "How do I request a booking?",
    answer: "Choose a stay or package, enter your dates and send the booking form. Your request becomes final only after Tripelor confirms availability and payment terms.",
  },
  {
    question: "Are package prices final?",
    answer: "Displayed prices cover the listed inclusions. Transfers, optional activities, extra nights and special arrangements are quoted separately.",
  },
  {
    question: "Can Tripelor arrange my Felidhoo transfer?",
    answer: "Yes. Send your flight details and Tripelor will help coordinate a suitable scheduled speedboat or advise you about the public ferry.",
  },
  {
    question: "What if weather affects an activity?",
    answer: "Sea travel and excursions depend on weather, sea conditions and safety guidance. Services may be delayed, rescheduled or changed when necessary.",
  },
];

export function getProperty(id?: string) {
  return properties.find((property) => property.id === id) ?? properties[0]!;
}

export function getPackage(id?: string) {
  return packages.find((item) => item.id === id);
}
