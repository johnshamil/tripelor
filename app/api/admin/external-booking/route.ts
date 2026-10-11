import { randomUUID } from "crypto";
import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { bookingResponse, manualBookingBody, manualBookingError, saveManualBooking } from "@/lib/manual-booking-server";

// Keep old entry points compatible while using the same atomic booking save.
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    const body = await manualBookingBody(request);
    const result = await saveManualBooking({ ...body, requestId: body.requestId || randomUUID(), adults: body.adults ?? 2,
      children: body.children ?? 0, currency: body.currency || "USD", paymentStatus: body.paymentStatus || "unpaid",
      bookingSource: body.bookingSource || "Manual", rooms: body.rooms || [{ roomType: body.roomType, quantity: body.quantity ?? 1, nightlyRate: body.nightlyRate ?? 0 }] }, user.id);
    return bookingResponse({ success: true, booking: result.reservations[0], ...result });
  } catch (error) { return manualBookingError(error); }
}
