export type BookingCurrency = "USD" | "MVR";
export type ManualRoomOption = { propertyName: string; roomType: string; totalRooms: number };
export type ManualRoomSelection = { roomType: string; quantity: number; nightlyRate: number };
export type ManualBookingInput = {
  requestId: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  mealPlan: string;
  bookingSource: string;
  externalReference: string;
  notes: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  currency: BookingCurrency;
  rooms: ManualRoomSelection[];
};

export class ManualBookingError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function maldivesToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Maldives", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function stayNights(checkIn: string, checkOut: string) {
  const days = (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000;
  return Number.isInteger(days) && days > 0 ? days : 0;
}

export function manualRoomTotal(room: ManualRoomSelection, nights: number) {
  return Math.round(Number(room.nightlyRate || 0) * 100) * Number(room.quantity || 0) * nights / 100;
}

export function bookingMoney(value: number, currency: unknown = "USD") {
  return `${currency === "MVR" ? "MVR" : "USD"} ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function bookingCurrencyTotals(bookings: Array<{ currency?: string; estimated_total?: unknown; speedboat_total?: unknown }>) {
  const totals = { USD: 0, MVR: 0 };
  for (const booking of bookings) {
    const currency = booking.currency === "MVR" ? "MVR" : "USD";
    totals[currency] += Math.round((Number(booking.estimated_total || 0) + Number(booking.speedboat_total || 0)) * 100);
  }
  return { USD: totals.USD / 100, MVR: totals.MVR / 100 };
}

export function calendarRoomOccupancy(bookings: Array<{ property_name: string; room_type: string; rooms: number; status: string; check_in: string; check_out: string }>, property: string, room: string, day: string) {
  return bookings.filter(booking => booking.property_name === property && (property.toLowerCase() === "rivethi beach hotel" || booking.room_type === room)
    && ["pending", "confirmed"].includes(booking.status) && booking.check_in <= day && booking.check_out > day)
    .reduce((sum, booking) => sum + Number(booking.rooms), 0);
}

function text(value: unknown, label: string, maximum: number, required = false) {
  if (value !== undefined && value !== null && typeof value !== "string") throw new ManualBookingError(`Enter a valid ${label.toLowerCase()}.`);
  const result = String(value || "").trim();
  if ((required && !result) || result.length > maximum) throw new ManualBookingError(`${label} ${required && !result ? "is required" : `must be at most ${maximum} characters`}.`);
  return result;
}

function whole(value: unknown, label: string, minimum: number, maximum: number) {
  const result = Number(value);
  if ((typeof value !== "number" && typeof value !== "string") || value === "" || !Number.isInteger(result) || result < minimum || result > maximum) throw new ManualBookingError(`${label} must be a whole number between ${minimum} and ${maximum}.`);
  return result;
}

function validDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateManualBooking(value: unknown): ManualBookingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ManualBookingError("Enter the booking details.");
  const body = value as Record<string, any>;
  if (typeof body.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.requestId)) throw new ManualBookingError("Please reopen the booking form and try again.");
  if (!validDate(body.checkIn) || !validDate(body.checkOut) || !stayNights(body.checkIn, body.checkOut) || stayNights(body.checkIn, body.checkOut) > 365) throw new ManualBookingError("Choose valid check-in and check-out dates, up to 365 nights apart.");
  if (body.currency !== "USD" && body.currency !== "MVR") throw new ManualBookingError("Choose MVR or USD.");
  if (!["unpaid", "partial", "paid"].includes(body.paymentStatus)) throw new ManualBookingError("Choose a valid payment status.");
  if (!Array.isArray(body.rooms) || body.rooms.length < 1 || body.rooms.length > 20) throw new ManualBookingError("Add between 1 and 20 room types.");
  const seen = new Set<string>();
  const rooms = body.rooms.map((room: any) => {
    const roomType = text(room?.roomType, "Room type", 150, true);
    if (seen.has(roomType.toLowerCase())) throw new ManualBookingError("Each room type should appear once. Increase its room quantity instead.");
    seen.add(roomType.toLowerCase());
    const nightlyRate = Number(room?.nightlyRate);
    if ((typeof room?.nightlyRate !== "number" && typeof room?.nightlyRate !== "string") || String(room?.nightlyRate).trim() === "" || !Number.isFinite(nightlyRate) || nightlyRate < 0 || nightlyRate > 1000000) throw new ManualBookingError("Enter a valid price per room per night.");
    return { roomType, quantity: whole(room?.quantity, "Rooms", 1, 100), nightlyRate: Math.round(nightlyRate * 100) / 100 };
  });
  if (rooms.reduce((total, room) => total + room.quantity, 0) > 100) throw new ManualBookingError("Use up to 100 rooms in one booking.");
  const guestEmail = text(body.guestEmail, "Guest email", 250);
  if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) throw new ManualBookingError("Enter a valid guest email or leave it blank.");
  return {
    requestId: body.requestId, propertyName: text(body.propertyName, "Property", 150, true),
    guestName: text(body.guestName, "Guest name", 200, true), guestEmail, guestPhone: text(body.guestPhone, "Phone", 80),
    checkIn: body.checkIn, checkOut: body.checkOut, adults: whole(body.adults, "Adults", 1, 200), children: whole(body.children, "Children", 0, 200),
    mealPlan: text(body.mealPlan, "Meal plan", 100), bookingSource: text(body.bookingSource, "Booking source", 80, true),
    externalReference: text(body.externalReference, "External reference", 150), notes: text(body.notes, "Notes", 4000),
    paymentStatus: body.paymentStatus, currency: body.currency, rooms,
  };
}
