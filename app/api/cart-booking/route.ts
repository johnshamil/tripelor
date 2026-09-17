import { requireUser } from "@/lib/auth-server";
import { cartBookingBody, cartBookingDB, cartBookingError, cartBookingResponse, publicCartBooking, submitCartBooking, CartBookingProblem } from "@/lib/cart-booking-server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user.email) throw new CartBookingProblem("Please use an account with a verified email address.", 400);
    const body = await cartBookingBody(request);
    return cartBookingResponse(await submitCartBooking(user, body));
  } catch (e) { return cartBookingError(e); }
}
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const offset = Number(new URL(request.url).searchParams.get("offset") || 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 100000) throw new CartBookingProblem("Invalid page.");
    const rows = await cartBookingDB(`?user_id=eq.${encodeURIComponent(user.id)}&order=created_at.desc,id.desc&limit=21&offset=${offset}`);
    return cartBookingResponse({ requests: rows.slice(0, 20).map(publicCartBooking), hasMore: rows.length > 20 });
  } catch (e) { return cartBookingError(e); }
}
