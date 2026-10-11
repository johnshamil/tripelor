import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { bookingResponse, manualBookingBody, manualBookingError, manualRoomAvailability, manualRoomOptions, saveManualBooking } from "@/lib/manual-booking-server";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    const query = new URL(request.url).searchParams;
    if (["propertyName", "checkIn", "checkOut"].some(name => query.has(name))) {
      const propertyName = query.get("propertyName") || "";
      const checkIn = query.get("checkIn") || "";
      const checkOut = query.get("checkOut") || "";
      return bookingResponse({ propertyName, checkIn, checkOut, rooms: await manualRoomAvailability(propertyName, checkIn, checkOut) });
    }
    return bookingResponse({ rooms: await manualRoomOptions() });
  } catch (error) { return manualBookingError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    const result = await saveManualBooking(await manualBookingBody(request), user.id);
    return bookingResponse({ success: true, ...result });
  } catch (error) { return manualBookingError(error); }
}
