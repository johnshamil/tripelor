import type { ManagedProperty, Room } from "@/lib/property-model";

type LegacyPropertyData = Omit<ManagedProperty, "id" | "slug" | "status" | "updated_at">;

const roomRows = (
  name: string,
  capacity: number,
  totalRooms: number,
  rates: Record<string, number>,
  amenities: string,
): Room[] =>
  Object.entries(rates).map(([mealPlan, sellingRate]) => ({
    name,
    capacity,
    totalRooms,
    amenities,
    mealPlan,
    sellingRate,
    contractedRate: 0,
  }));

export const legacyPropertySeeds: Array<{ slug: string; data: LegacyPropertyData }> = [
  {
    slug: "uhoos-lavish-oasis",
    data: {
      name: "Uhoo's Lavish Oasis",
      island: "V. Felidhoo, Maldives",
      description: "A cozy local-island stay in Felidhoo with two dedicated rooms, flexible meal plans and Tripelor support.",
      photos: [
        "/properties/uhoos-lavish-oasis/20250517_193323.jpg",
        "/properties/uhoos-lavish-oasis/20250518_001256.jpg",
        "/properties/uhoos-lavish-oasis/20250518_001936.jpg",
        "/properties/uhoos-lavish-oasis/20250822_104240.jpg",
        "/properties/uhoos-lavish-oasis/20250822_104258(1).jpg",
      ],
      amenities: "Private bathroom, air conditioning, Wi-Fi, local-island support",
      rooms: [
        ...roomRows("Deluxe Room", 2, 1, { "Bed & Breakfast": 75, "Half Board": 95, "Full Board": 115 }, "Comfortable room with private bathroom and local-island support."),
        ...roomRows("Double Deluxe Room", 2, 1, { "Bed & Breakfast": 75, "Half Board": 95, "Full Board": 115 }, "Relaxed double room with private bathroom and flexible dining."),
      ],
      seasonalRates: [],
      inventoryRules: [],
      taxes: "Taxes and service charges are confirmed with the booking.",
      transfers: "Speedboat transfer support between Malé and Felidhoo is available on request at least 24 hours before arrival.",
      cancellation: "Cancellation terms are confirmed with your booking request before payment.",
      payment: "No automatic payment is taken online. Tripelor sends payment instructions after availability is confirmed.",
      partnerName: "",
      partnerEmail: "",
      partnerPhone: "",
    },
  },
  {
    slug: "masfalhi-view-inn",
    data: {
      name: "Masfalhi View Inn",
      island: "V. Felidhoo, Maldives",
      description: "A comfortable local-island guesthouse with six rooms and flexible meal plans.",
      photos: [
        "/images%20(3).jpeg",
        "/images.jpeg",
        "/images%20(1).jpeg",
        "/images%20(2).jpeg",
        "/8afbb6cc.jpeg",
        "/images%20(4).jpeg",
        "/images%20(5).jpeg",
        "/images%20(6).jpeg",
        "/images%20(7).jpeg",
        "/images%20(8).jpeg",
      ],
      amenities: "Air conditioning, private bathroom, free Wi-Fi, sea-view room options",
      rooms: [
        ...roomRows("Standard Double Room", 2, 5, { "Bed & Breakfast": 97, "Half Board": 110, "Full Board": 130 }, "Air-conditioned room with twin and full-bed configuration."),
        ...roomRows("Family Room with Sea View", 5, 1, { "Bed & Breakfast": 97, "Half Board": 110, "Full Board": 130 }, "Sea-view family room with flexible bedding for groups."),
      ],
      seasonalRates: [],
      inventoryRules: [],
      taxes: "Taxes and service charges are confirmed with the booking.",
      transfers: "Tripelor can help arrange the best available transfer to Felidhoo after your booking request.",
      cancellation: "Cancellation terms are confirmed with your booking request before payment.",
      payment: "Tripelor confirms availability first, then sends payment instructions.",
      partnerName: "",
      partnerEmail: "",
      partnerPhone: "",
    },
  },
  {
    slug: "rivethi-beach-hotel",
    data: {
      name: "Rivethi Beach Hotel",
      island: "Hulhumalé, Maldives",
      description: "A beachfront Hulhumalé hotel close to Velana International Airport, ideal for stopovers, arrivals and departures.",
      photos: [
        "/properties/rivethi-beach-hotel/1719713475.jpeg",
        "/properties/rivethi-beach-hotel/0584s12000ssx9b685F06_W_1280_853_R5.webp",
        "/properties/rivethi-beach-hotel/604895445.jpg",
        "/properties/rivethi-beach-hotel/816271360.jpg",
        "/properties/rivethi-beach-hotel/7143733a-088c-4eea-b23a-117a50d93240.webp",
      ],
      amenities: "Beachfront location, air conditioning, Wi-Fi, airport access",
      rooms: [
        ...roomRows("Deluxe Double", 2, 1, { "Room Only": 80, "Bed & Breakfast": 90, "Half Board": 130, "Full Board": 170 }, "Comfortable double room for arrivals, departures and short stays."),
        ...roomRows("Deluxe Twin", 2, 1, { "Room Only": 80, "Bed & Breakfast": 90, "Half Board": 130, "Full Board": 170 }, "Twin accommodation near the airport and Hulhumalé beach."),
        ...roomRows("Deluxe Double Sea View", 2, 1, { "Room Only": 110, "Bed & Breakfast": 120, "Half Board": 160, "Full Board": 190 }, "Sea-view room with flexible dining choices."),
      ],
      seasonalRates: [],
      inventoryRules: [],
      taxes: "Taxes and service charges are confirmed with the booking.",
      transfers: "The hotel is approximately 5–10 minutes from Velana International Airport. Airport transfer support is available on request.",
      cancellation: "Free cancellation is available 7 or more days before arrival; charges vary by notice period.",
      payment: "A 50% advance payment is required after Tripelor confirms availability.",
      partnerName: "",
      partnerEmail: "",
      partnerPhone: "",
    },
  },
];
