import { ManualBookingError, ManualRoomOption, validateManualBooking } from "@/lib/manual-booking";

export async function bookingDB(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ManualBookingError("Booking storage is temporarily unavailable.", 503);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers },
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (result?.message?.includes("ROOM_NOT_AVAILABLE")) throw new ManualBookingError("There are not enough available rooms for these dates. Reduce the quantity or choose another room type.", 409);
    if (result?.message?.includes("Room inventory is not configured")) throw new ManualBookingError("This room type is no longer available. Refresh the form and choose another.", 409);
    if (result?.message?.includes("WORKER_UNAUTHORIZED")) throw new ManualBookingError("Unauthorized.", 401);
    if (result?.message?.startsWith("MANUAL_")) throw new ManualBookingError("Check the room quantities, prices and booking details.");
    throw new ManualBookingError("Unable to save or load bookings. Please try again.", 503);
  }
  return result;
}

export async function manualRoomOptions(): Promise<ManualRoomOption[]> {
  const rows = await bookingDB("property_inventory?active=eq.true&select=property_name,room_type,total_rooms&order=property_name,room_type");
  return rows.map((row: any) => ({ propertyName: row.property_name, roomType: row.room_type, totalRooms: Number(row.total_rooms) }));
}

export async function manualBookingBody(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host") || new URL(request.url).host;
  try {
    const source = new URL(origin || "");
    if (source.host !== host || source.origin !== origin || !["http:", "https:"].includes(source.protocol)) throw new Error();
  } catch { throw new ManualBookingError("Please use the Tripelor website.", 403); }
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ManualBookingError("Send a valid booking request.", 415);
  const body = await request.text();
  if (body.length > 16000) throw new ManualBookingError("The booking details are too long.", 413);
  try { return JSON.parse(body); } catch { throw new ManualBookingError("Check your booking details."); }
}

export async function saveManualBooking(body: unknown, adminId: string) {
  const booking = validateManualBooking(body);
  const reservations = await bookingDB("rpc/create_manual_booking", { method: "POST", body: JSON.stringify({
    p_request_id: booking.requestId, p_admin_id: adminId, p_booking: booking,
  }) });
  return { reservations, reference: reservations[0]?.booking_reference,
    rooms: reservations.reduce((total: number, row: any) => total + Number(row.rooms), 0),
    total: reservations.reduce((total: number, row: any) => total + Number(row.estimated_total || 0), 0),
    currency: reservations[0]?.currency || booking.currency };
}

export function bookingResponse(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export function manualBookingError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") return bookingResponse({ error: "Please sign in." }, 401);
  if (error instanceof ManualBookingError) return bookingResponse({ error: error.message }, error.status);
  return bookingResponse({ error: "Unable to save or load bookings. Please try again." }, 503);
}
