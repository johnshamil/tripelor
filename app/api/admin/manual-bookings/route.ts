import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { bookingResponse, manualBookingBody, manualBookingError, manualRoomOptions, saveManualBooking } from "@/lib/manual-booking-server";

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
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
