export const BOOKING_DRAFT_KEY = "tripelor_booking_draft_v1";
const MAX_AGE = 2 * 60 * 60 * 1000;
export type BookingDraft = {
  propertyName: string; roomType: string; mealPlan: string;
  checkIn: string; checkOut: string; adults: string; children: string;
  fullName: string; email: string; phone: string; specialRequests: string;
};
const limits: Record<keyof BookingDraft, number> = {
  propertyName: 160, roomType: 160, mealPlan: 100, checkIn: 10, checkOut: 10,
  adults: 3, children: 3, fullName: 200, email: 254, phone: 50, specialRequests: 2000,
};
export function encodeBookingDraft(draft: BookingDraft, owner: string, now = Date.now()) {
  const data = Object.fromEntries(Object.entries(limits).map(([key, limit]) => [key, String(draft[key as keyof BookingDraft] || "").slice(0, limit)]));
  return JSON.stringify({ version: 1, owner, savedAt: now, data });
}
export function decodeBookingDraft(raw: string | null, owner: string, now = Date.now()): BookingDraft | null {
  try {
    const saved = JSON.parse(raw || "null");
    if (!saved || saved.version !== 1 || saved.owner !== owner || !saved.data || !Number.isFinite(saved.savedAt) || now < saved.savedAt || now - saved.savedAt > MAX_AGE) return null;
    const data = {} as BookingDraft;
    for (const [key, limit] of Object.entries(limits)) {
      const value = saved.data[key];
      if (typeof value !== "string" || value.length > limit) return null;
      data[key as keyof BookingDraft] = value;
    }
    for (const key of ["checkIn", "checkOut"] as const) {
      const value = data[key];
      if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) return null;
    }
    if (!/^[1-9]\d?$/.test(data.adults) || !/^\d{1,2}$/.test(data.children)) return null;
    return data;
  } catch { return null; }
}