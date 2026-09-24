import { propertyRateForDate, type PublicProperty } from "@/lib/property-model";

export type MatchStyle = "romance" | "family" | "ocean" | "adventure" | "relax";
export type MatchDestination = "flexible" | "vaavu" | "ukulhas" | "maafushi" | "airport";
export type MatchMeal = "flexible" | "Bed & Breakfast" | "Half Board" | "Full Board";

export type MatchInput = {
  adults: number;
  children: number;
  nights: number;
  arrival: string;
  budget: number;
  style: MatchStyle;
  destination: MatchDestination;
  meal: MatchMeal;
};

export type MatchRecommendation = {
  property: PublicProperty;
  room: PublicProperty["rooms"][number];
  total: number;
  nightly: number;
  reasons: string[];
  overBudget: boolean;
  score: number;
};

const styleKeywords: Record<MatchStyle, string[]> = {
  romance: ["romantic", "honeymoon", "couple", "sunset", "oceanview", "sea view", "balcony", "private"],
  family: ["family", "children", "child", "bunk", "extra bed", "cot", "spacious"],
  ocean: ["ocean", "sea", "reef", "snorkel", "manta", "turtle", "shark", "beach", "sandbank"],
  adventure: ["adventure", "excursion", "snorkel", "whale shark", "fishing", "sandbank", "island hopping", "dolphin"],
  relax: ["quiet", "peaceful", "relax", "cozy", "comfortable", "beach", "slow", "serene"],
};

const styleLabels: Record<MatchStyle, string> = {
  romance: "romantic escape",
  family: "family trip",
  ocean: "ocean-first holiday",
  adventure: "adventure-focused holiday",
  relax: "slow and relaxing escape",
};

const destinationLabels: Record<MatchDestination, string> = {
  flexible: "best-fit island",
  vaavu: "Vaavu Atoll",
  ukulhas: "Ukulhas",
  maafushi: "Maafushi",
  airport: "Hulhumalé / airport area",
};

function datesForStay(arrival: string, nights: number) {
  if (!arrival) return [];
  const dates: string[] = [];
  for (let index = 0; index < nights; index += 1) {
    const date = new Date(`${arrival}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

function destinationMatches(property: PublicProperty, destination: MatchDestination) {
  if (destination === "flexible") return true;
  const haystack = `${property.island} ${property.name}`.toLowerCase();
  if (destination === "vaavu") return /vaavu|felidhoo|thinadhoo|keyodhoo/.test(haystack);
  if (destination === "ukulhas") return /ukulhas|north ari|aa\./.test(haystack);
  if (destination === "maafushi") return /maafushi/.test(haystack);
  return /hulhumal[eé]|male|mal[eé]|airport/.test(haystack);
}

function styleScore(property: PublicProperty, room: PublicProperty["rooms"][number], style: MatchStyle) {
  const experienceText = (property.experiences || []).map(item => `${item.name} ${item.description} ${item.inclusions}`).join(" ");
  const text = [
    property.name,
    property.island,
    property.description,
    property.amenities,
    room.name,
    room.amenities,
    ...(property.wishlistTags || []),
    experienceText,
  ].join(" ").toLowerCase();
  const hits = styleKeywords[style].filter(keyword => text.includes(keyword)).length;
  return Math.min(28, hits * 5);
}

function inventoryBlocked(property: PublicProperty, room: PublicProperty["rooms"][number], dates: string[]) {
  if (!dates.length) return false;
  return dates.some(date =>
    (property.inventoryRules || []).some(rule =>
      rule.roomName.toLowerCase() === room.name.toLowerCase() &&
      date >= rule.startDate &&
      date <= rule.endDate &&
      (rule.stopSale || rule.roomsAvailable < 1),
    ),
  );
}

function roomStayTotal(property: PublicProperty, room: PublicProperty["rooms"][number], arrival: string, nights: number) {
  const dates = datesForStay(arrival, nights);
  if (inventoryBlocked(property, room, dates)) return null;
  const rates = dates.length
    ? dates.map(date => propertyRateForDate(property, room.name, room.mealPlan, date))
    : Array.from({ length: nights }, () => room.sellingRate);
  if (rates.some(rate => !Number.isFinite(rate) || rate <= 0)) return null;
  return rates.reduce((sum, rate) => sum + rate, 0);
}

function budgetScore(total: number, budget: number) {
  if (!budget) return 12;
  if (total <= budget) {
    const remainingRatio = (budget - total) / budget;
    return 32 - Math.min(10, remainingRatio * 10);
  }
  const overRatio = (total - budget) / budget;
  return Math.max(-35, 12 - overRatio * 80);
}

export function matchMaldives(properties: PublicProperty[], input: MatchInput): MatchRecommendation[] {
  const guests = Math.max(1, input.adults + input.children);
  const candidates: MatchRecommendation[] = [];

  for (const property of properties.filter(item => item.status === "published")) {
    for (const room of property.rooms) {
      if (room.totalRooms < 1 || room.capacity < guests || room.sellingRate <= 0) continue;
      if (input.meal !== "flexible" && room.mealPlan.toLowerCase() !== input.meal.toLowerCase()) continue;

      const total = roomStayTotal(property, room, input.arrival, input.nights);
      if (total == null) continue;
      const destinationFit = destinationMatches(property, input.destination);
      const styleFit = styleScore(property, room, input.style);
      const mealFit = input.meal === "flexible" ? 6 : 12;
      const capacityFit = room.capacity === guests ? 8 : Math.max(2, 7 - (room.capacity - guests));
      const destinationPoints = input.destination === "flexible" ? 10 : destinationFit ? 28 : -18;
      const score = 35 + styleFit + mealFit + capacityFit + destinationPoints + budgetScore(total, input.budget);
      const reasons = [
        destinationFit
          ? input.destination === "flexible"
            ? `A strong island fit for your ${styleLabels[input.style]}`
            : `Located in or around ${destinationLabels[input.destination]}`
          : "",
        styleFit >= 10 ? `Matches your ${styleLabels[input.style]}` : "",
        input.budget && total <= input.budget ? "Fits within your accommodation budget" : "",
        input.meal !== "flexible" ? `${input.meal} is available` : `${room.mealPlan} option available`,
        room.capacity >= guests ? `Fits ${guests} guest${guests === 1 ? "" : "s"}` : "",
      ].filter(Boolean).slice(0, 4);

      candidates.push({
        property,
        room,
        total,
        nightly: total / input.nights,
        reasons,
        overBudget: Boolean(input.budget && total > input.budget),
        score,
      });
    }
  }

  const bestPerProperty = new Map<string, MatchRecommendation>();
  for (const candidate of candidates.sort((a, b) => b.score - a.score || a.total - b.total)) {
    const current = bestPerProperty.get(candidate.property.slug);
    if (!current || candidate.score > current.score || (candidate.score === current.score && candidate.total < current.total)) {
      bestPerProperty.set(candidate.property.slug, candidate);
    }
  }

  return [...bestPerProperty.values()]
    .sort((a, b) => b.score - a.score || a.total - b.total)
    .slice(0, 3);
}

export function destinationLabel(destination: MatchDestination) {
  return destinationLabels[destination];
}

export function styleLabel(style: MatchStyle) {
  return styleLabels[style];
}
