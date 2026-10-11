import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { adminBookingReminders, markReminderRead } from "@/lib/booking-reminder-server";
import { bookingResponse, manualBookingBody, manualBookingError } from "@/lib/manual-booking-server";

export async function GET() {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    return bookingResponse(await adminBookingReminders());
  } catch (error) { return manualBookingError(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    const body = await manualBookingBody(request);
    await markReminderRead(body?.id);
    return bookingResponse({ success: true });
  } catch (error) { return manualBookingError(error); }
}
