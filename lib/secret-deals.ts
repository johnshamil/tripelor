import { propertyRateForDate, type PublicProperty } from "@/lib/property-model";

export type SecretDealType = "honeymoon" | "budget" | "family" | "ocean" | "luxury" | "last-minute";
export type SecretDealDestination = "flexible" | "vaavu" | "ukulhas" | "maafushi" | "airport";

export type SecretDealInput = {
  adults: number;
  children: number;
  nights: number;
  budget: number;
  dealType: SecretDealType;
  destination: SecretDealDestination;
  travelMonth: string;
};

export type SecretDealMatch = {
  property: PublicProperty;
  room: PublicProperty["rooms"][number];
  nightlyFrom: number;
  estimatedTotal: number;
  reasons: string[];
  score: number;
  withinBudget: boolean;
};

const typeKeywords: Record<SecretDealType, string[]> = {
  honeymoon: ["honeymoon", "romantic", "couple", "sunset", "oceanview", "sea view", "balcony"],
  budget: ["guesthouse", "local island", "standard", "studio", "comfortable", "budget"],
  family: ["family", "child", "children", "bunk", "extra bed", "cot", "suite"],
  ocean: ["ocean", "sea", "reef", "snorkel", "manta", "turtle", "shark", "beach", "sandbank"],
  luxury: ["premium", "premier", "penthouse", "suite", "panoramic", "oceanview", "seaview", "luxury"],
  "last-minute": ["airport", "hulhumale", "hulhumalé", "maafushi", "local island", "guesthouse"],
};

const dealLabels: Record<SecretDealType, string> = {
  honeymoon: "Honeymoon Escape",
  budget: "Smart Value Escape",
  family: "Family Island Escape",
  ocean: "Ocean Adventure",
  luxury: "Signature Maldives",
  "last-minute": "Last-Minute Escape",
};

const destinationLabels: Record<SecretDealDestination, string> = {
  flexible: "Best available island",
  vaavu: "Vaavu Atoll",
  ukulhas: "Ukulhas",
  maafushi: "Maafushi",
  airport: "Hulhumalé / airport area",
};

function destinationMatches(property: PublicProperty, destination: SecretDealDestination) {
  if (destination === "flexible") return true;
  const value = `${property.island} ${property.name}`.toLowerCase();
  if (destination === "vaavu") return /vaavu|felidhoo|thinadhoo|keyodhoo/.test(value);
  if (destination === "ukulhas") return /ukulhas|north ari|aa\./.test(value);
  if (destination === "maafushi") return /maafushi/.test(value);
  return /hulhumal[eé]|airport|mal[eé]|male/.test(value);
}

function validMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 2026 && year <= 2100 && month >= 1 && month <= 12;
}

function datesInMonth(value: string) {
  if (!validMonth(value)) return [];
  const [year, month] = value.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: lastDay }, (_, index) =>
    `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
  );
}

function lowestPublishedNightly(property: PublicProperty, room: PublicProperty["rooms"][number], travelMonth: string) {
  const dates = datesInMonth(travelMonth);
  if (!dates.length) return room.sellingRate;

  const rates = dates
    .filter(date => !(property.inventoryRules || []).some(rule =>
      rule.roomName.toLowerCase() === room.name.toLowerCase() &&
      date >= rule.startDate &&
      date <= rule.endDate &&
      (rule.stopSale || rule.roomsAvailable < 1),
    ))
    .map(date => propertyRateForDate(property, room.name, room.mealPlan, date))
    .filter(rate => Number.isFinite(rate) && rate > 0);

  return rates.length ? Math.min(...rates) : room.sellingRate;
}

function textScore(property: PublicProperty, room: PublicProperty["rooms"][number], dealType: SecretDealType) {
  const experiences = (property.experiences || [])
    .map(item => `${item.name} ${item.description} ${item.inclusions}`)
    .join(" ");
  const text = [
    property.name,
    property.island,
    property.description,
    property.amenities,
    room.name,
    room.amenities,
    ...(property.wishlistTags || []),
    experiences,
  ].join(" ").toLowerCase();

  return Math.min(36, typeKeywords[dealType].filter(keyword => text.includes(keyword)).length * 6);
}

function budgetPoints(total: number, budget: number, dealType: SecretDealType) {
  if (!budget) {
    if (dealType === "budget") return total <= 600 ? 30 : Math.max(0, 30 - (total - 600) / 25);
    if (dealType === "luxury") return Math.min(30, total / 50);
    return 12;
  }

  if (total <= budget) {
    const remaining = budget - total;
    return 32 - Math.min(12, remaining / Math.max(50, budget / 10));
  }
  return Math.max(-40, 8 - ((total - budget) / budget) * 90);
}

function lastMinutePoints(travelMonth: string, dealType: SecretDealType) {
  if (dealType !== "last-minute" || !validMonth(travelMonth)) return 0;
  const now = new Date();
  const maldives = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const current = `${maldives.getUTCFullYear()}-${String(maldives.getUTCMonth() + 1).padStart(2, "0")}`;
  const next = new Date(Date.UTC(maldives.getUTCFullYear(), maldives.getUTCMonth() + 1, 1));
  const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
  return travelMonth === current ? 24 : travelMonth === nextMonth ? 12 : -6;
}

export function findSecretDeals(properties: PublicProperty[], input: SecretDealInput): SecretDealMatch[] {
  const guests = Math.max(1, input.adults + input.children);
  const candidates: SecretDealMatch[] = [];

  for (const property of properties.filter(item => item.status === "published")) {
    for (const room of property.rooms) {
      if (room.totalRooms < 1 || room.capacity < guests || room.sellingRate <= 0) continue;

      const nightlyFrom = lowestPublishedNightly(property, room, input.travelMonth);
      if (!Number.isFinite(nightlyFrom) || nightlyFrom <= 0) continue;

      const estimatedTotal = nightlyFrom * input.nights;
      const destinationFit = destinationMatches(property, input.destination);
      const typeFit = textScore(property, room, input.dealType);
      const exactCapacity = room.capacity === guests ? 8 : Math.max(2, 7 - (room.capacity - guests));
      const destinationScore = input.destination === "flexible" ? 10 : destinationFit ? 30 : -22;
      const priceScore = budgetPoints(estimatedTotal, input.budget, input.dealType);
      const urgencyScore = lastMinutePoints(input.travelMonth, input.dealType);
      const score = 35 + typeFit + exactCapacity + destinationScore + priceScore + urgencyScore;

      const reasons = [
        destinationFit
          ? input.destination === "flexible"
            ? `Strong fit for a ${dealLabels[input.dealType].toLowerCase()}`
            : `Matches your ${destinationLabels[input.destination]} preference`
          : "",
        typeFit >= 12 ? `Matches the ${dealLabels[input.dealType]} style` : "",
        input.budget && estimatedTotal <= input.budget ? "Starting estimate fits your accommodation budget" : "",
        `${room.mealPlan} available`,
        `Fits ${guests} guest${guests === 1 ? "" : "s"}`,
      ].filter(Boolean).slice(0, 4);

      candidates.push({
        property,
        room,
        nightlyFrom,
        estimatedTotal,
        reasons,
        score,
        withinBudget: !input.budget || estimatedTotal <= input.budget,
      });
    }
  }

  const bestPerProperty = new Map<string, SecretDealMatch>();
  for (const candidate of candidates.sort((a, b) => b.score - a.score || a.estimatedTotal - b.estimatedTotal)) {
    const current = bestPerProperty.get(candidate.property.slug);
    if (!current || candidate.score > current.score || (candidate.score === current.score && candidate.estimatedTotal < current.estimatedTotal)) {
      bestPerProperty.set(candidate.property.slug, candidate);
    }
  }

  return Array.from(bestPerProperty.values())
    .sort((a, b) => b.score - a.score || a.estimatedTotal - b.estimatedTotal)
    .slice(0, 3);
}

export function secretDealLabel(type: SecretDealType) {
  return dealLabels[type];
}

export function secretDealDestinationLabel(destination: SecretDealDestination) {
  return destinationLabels[destination];
}
