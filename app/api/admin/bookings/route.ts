import { isAdminEmail, requireUser } from "@/lib/auth-server";
import { stayNights } from "@/lib/manual-booking";
import { bookingDB, bookingResponse, manualBookingError } from "@/lib/manual-booking-server";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) return bookingResponse({ error: "Admin access required." }, 403);
    const params = new URL(request.url).searchParams;
    const from = params.get("from"), to = params.get("to");
    let path = "reservations?select=*&order=created_at.desc&limit=200";
    if (from || to) {
      const valid = (value: string | null) => {
        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(`${value}T00:00:00Z`);
        return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
      };
      if (!valid(from) || !valid(to) || !stayNights(from!, to!) || stayNights(from!, to!) > 62) return bookingResponse({ error: "Choose a valid calendar range of up to 62 days." }, 400);
      path = `reservations?select=*&check_in=lt.${to}&check_out=gt.${from}&order=created_at.desc&limit=1000`;
    }
    return bookingResponse({ bookings: await bookingDB(path) });
  } catch (error) { return manualBookingError(error); }
}
