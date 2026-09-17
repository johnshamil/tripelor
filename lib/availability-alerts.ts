export type AlertSelection = {
  propertyName: string; roomType: string; checkIn: string; checkOut: string; rooms: number;
};
export type AvailabilityAlert = {
  id: string; property_name: string; room_type: string; check_in: string; check_out: string;
  rooms: number; status: 'active' | 'notified' | 'cancelled' | 'expired'; created_at: string; notified_at: string | null;
};
export type AlertRoom = { propertyName: string; roomType: string };
export function maldivesDate(now = new Date()) { return new Date(now.getTime() + 5 * 3600000).toISOString().slice(0, 10); }
function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
export function validateAlertSelection(value: any, today = maldivesDate()): AlertSelection {
  if (!value || typeof value.propertyName !== 'string' || typeof value.roomType !== 'string' ||
    !value.propertyName.trim() || !value.roomType.trim() || value.propertyName.length > 150 || value.roomType.length > 150) {
    throw new Error('Choose a property and room.');
  }
  const { checkIn, checkOut } = value;
  const rooms = value.rooms ?? 1;
  if (!isDate(checkIn) || !isDate(checkOut) || checkIn < today || checkOut <= checkIn) throw new Error('Choose valid future check-in and check-out dates.');
  if (Date.parse(checkOut) - Date.parse(checkIn) > 90 * 86400000 || Date.parse(checkIn) - Date.parse(today) > 730 * 86400000) throw new Error('Choose a stay of up to 90 nights within the next two years.');
  if (!Number.isInteger(rooms) || rooms < 1 || rooms > 10) throw new Error('Choose between 1 and 10 rooms.');
  return { propertyName: value.propertyName.trim(), roomType: value.roomType.trim(), checkIn, checkOut, rooms };
}
export function alertBookingHref(selection: AlertSelection) {
  return '/booking?' + new URLSearchParams({ property: selection.propertyName, roomType: selection.roomType,
    checkIn: selection.checkIn, checkOut: selection.checkOut, rooms: String(selection.rooms) }).toString();
}
export function alertSetupHref(selection: Omit<AlertSelection, 'rooms'> & { rooms?: number }) {
  return '/account/availability-alerts?' + new URLSearchParams({ property: selection.propertyName, roomType: selection.roomType,
    checkIn: selection.checkIn, checkOut: selection.checkOut, rooms: String(selection.rooms || 1) }).toString();
}
