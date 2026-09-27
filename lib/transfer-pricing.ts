export const DEFAULT_SPEEDBOAT_SEAT_PRICE_USD = 65;

export function speedboatTransferTotal(seats: number) {
  return seats * DEFAULT_SPEEDBOAT_SEAT_PRICE_USD;
}
