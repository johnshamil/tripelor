import { processBookingReminders } from "@/lib/booking-reminder-server";
import { bookingResponse, manualBookingError } from "@/lib/manual-booking-server";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  const header = request.headers.get("authorization") || "";
  if (!/^Bearer [0-9a-f]{64}$/i.test(header)) return bookingResponse({ error: "Unauthorized." }, 401);
  try { return bookingResponse(await processBookingReminders(header.slice(7))); }
  catch (error) { return manualBookingError(error); }
}
