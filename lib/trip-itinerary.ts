import { addNights, findCartProduct, isDate, type CartLine, type CartProduct } from "./trip-cart";

export const PLAN_START_STORAGE_KEY = "tripelor-plan-start-v1";
export const LAST_TRIP_DATE = "9998-12-31";
const DAY_MS = 86_400_000;
export function isTripDate(value: unknown): value is string { return isDate(value) && value <= LAST_TRIP_DATE; }
export function tripDay(start: string, date: string) {
  if (!isTripDate(start) || !isTripDate(date) || date < start) return 0;
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / DAY_MS) + 1;
}
export function tripDayDate(start: string, day: number) {
  if (!isTripDate(start) || !Number.isInteger(day) || day < 1 || day > tripDay(start, LAST_TRIP_DATE)) return "";
  const date = addNights(start, day - 1);
  return isTripDate(date) ? date : "";
}
export function resolveTripStart(lines: readonly CartLine[], preferred: unknown = "") {
  const earliest = lines.map(line => line.date).filter(isTripDate).sort()[0] || "";
  return isTripDate(preferred) ? (earliest && earliest < preferred ? earliest : preferred) : earliest;
}
export function shiftTripDates(lines: readonly CartLine[], previousStart: string, nextStart: string): CartLine[] {
  if (!isTripDate(nextStart)) throw new Error("Choose a valid trip start date.");
  const start = resolveTripStart(lines, previousStart);
  return lines.map(line => {
    if (!isTripDate(line.date) || !start) return { ...line };
    const date = tripDayDate(nextStart, tripDay(start, line.date));
    if (!date) throw new Error("These dates are outside the supported calendar. Choose an earlier trip start.");
    return { ...line, date };
  });
}

export type StayEvent = { product: CartProduct; checkout: boolean };
export type ItineraryDay = { date: string; day: number; lines: CartLine[]; stays: StayEvent[] };
export function buildItinerary(lines: readonly CartLine[], preferredStart = "") {
  const start = resolveTripStart(lines, preferredStart);
  const calendar = new Map<string, ItineraryDay>();
  const unscheduled: CartLine[] = [];
  function onDate(date: string) {
    if (!calendar.has(date)) calendar.set(date, { date, day: tripDay(start, date), lines: [], stays: [] });
    return calendar.get(date)!;
  }
  if (start) onDate(start);
  for (const line of lines) {
    const product = findCartProduct(line.productId);
    if (!product) continue;
    if (!isTripDate(line.date)) { unscheduled.push(line); continue; }
    onDate(line.date).lines.push(line);
    for (let night = 1; night <= (product.nights || 0); night++) {
      const date = tripDayDate(line.date, night + 1);
      if (date) onDate(date).stays.push({ product, checkout: night === product.nights });
    }
  }
  const days = Array.from(calendar.values()).sort((a, b) => a.date.localeCompare(b.date));
  for (const day of days) day.lines.sort((a, b) => Number(findCartProduct(b.productId)?.kind === "stay") - Number(findCartProduct(a.productId)?.kind === "stay"));
  return { start, days, unscheduled };
}

export function formatTripDate(date: string) {
  return isTripDate(date) ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)) : "Choose a date";
}
