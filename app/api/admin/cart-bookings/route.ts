import { requireUser, isAdminEmail } from "@/lib/auth-server";
import { cartBookingDB, cartBookingError, cartBookingResponse, publicCartBooking, CartBookingProblem } from "@/lib/cart-booking-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdminEmail(user.email)) throw new CartBookingProblem("Admin access required.", 403);
    const offset = Number(new URL(request.url).searchParams.get("offset") || 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000) throw new CartBookingProblem("Invalid page.");
    const rows = await cartBookingDB(`?order=created_at.desc,id.desc&limit=21&offset=${offset}`);
    return cartBookingResponse({ requests: rows.slice(0, 20).map(row => ({ ...publicCartBooking(row), notification_sent_at: row.notification_sent_at })), hasMore: rows.length > 20 });
  } catch (e) { return cartBookingError(e); }
}
