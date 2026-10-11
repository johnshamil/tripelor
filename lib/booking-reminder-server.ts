import { bookingMoney, maldivesToday, ManualBookingError, stayNights } from "@/lib/manual-booking";
import { bookingDB } from "@/lib/manual-booking-server";

type Reminder = { id: string; booking_key: string; check_in: string; read_at: string | null; email_sent_at: string | null; claim_token?: string };
type Reservation = { id: string; manual_booking_id?: string; guest_name: string; property_name: string; room_type: string; rooms: number; check_in: string; check_out: string; booking_reference: string; currency?: string; estimated_total?: number; speedboat_total?: number };
const selection = "id,manual_booking_id,guest_name,property_name,room_type,rooms,check_in,check_out,booking_reference,currency,estimated_total,speedboat_total";

export function reminderDetails(notification: Reminder, bookings: Reservation[], today = maldivesToday()) {
  const reservations = bookings.filter(row => (row.manual_booking_id || row.id) === notification.booking_key && row.check_in === notification.check_in);
  if (!reservations.length || notification.check_in < today) return null;
  const first = reservations[0];
  return { id: notification.id, readAt: notification.read_at, emailSentAt: notification.email_sent_at,
    reference: first.booking_reference || first.id.slice(0, 8), guestName: first.guest_name,
    propertyName: first.property_name, checkIn: first.check_in, checkOut: first.check_out,
    daysUntilArrival: first.check_in === today ? 0 : stayNights(today, first.check_in),
    rooms: reservations.reduce((sum, row) => sum + Number(row.rooms), 0),
    roomTypes: reservations.map(row => `${row.rooms} × ${row.room_type}`).join(" · "),
    amount: reservations.reduce((sum, row) => sum + Math.round((Number(row.estimated_total || 0) + Number(row.speedboat_total || 0)) * 100), 0) / 100,
    currency: first.currency || "USD" };
}

export async function adminBookingReminders() {
  await bookingDB("rpc/refresh_admin_booking_notifications", { method: "POST", body: "{}" });
  const today = maldivesToday();
  const until = new Date(`${today}T00:00:00Z`); until.setUTCDate(until.getUTCDate() + 2);
  const dates = `check_in=gte.${today}&check_in=lte.${until.toISOString().slice(0, 10)}`;
  const [notifications, reservations] = await Promise.all([
    bookingDB(`admin_booking_notifications?${dates}&select=id,booking_key,check_in,read_at,email_sent_at&order=check_in,created_at`),
    bookingDB(`reservations?${dates}&status=in.(pending,confirmed)&select=${selection}&order=room_type`),
  ]);
  const reminders = (notifications as Reminder[]).map(notification => reminderDetails(notification, reservations, today)).filter(Boolean);
  return { reminders, unread: reminders.filter(item => !item!.readAt).length, emailEnabled: !!process.env.RESEND_API_KEY };
}

export async function markReminderRead(id: unknown) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ManualBookingError("Choose a valid notification.");
  await bookingDB(`admin_booking_notifications?id=eq.${id}&read_at=is.null`, { method: "PATCH", body: JSON.stringify({ read_at: new Date().toISOString() }) });
}

export function arrivalLabel(days: number) {
  return days === 0 ? "Arrival today" : days === 1 ? "Arrival tomorrow" : "Arrival in 2 days";
}

export async function processBookingReminders(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) throw new ManualBookingError("Unauthorized.", 401);
  const reminders: Reminder[] = await bookingDB("rpc/claim_booking_reminders", { method: "POST", body: JSON.stringify({ p_worker_token: token, p_limit: 20 }) });
  if (!process.env.RESEND_API_KEY) throw new ManualBookingError("Admin email delivery is not configured.", 503);
  const summary = { checked: 0, sent: 0, failed: 0 };
  const deadline = Date.now() + 15000;
  let index = 0;
  async function worker() {
    while (index < reminders.length && Date.now() < deadline) {
      const notification = reminders[index++];
      const filter = `admin_booking_notifications?id=eq.${notification.id}&claim_token=eq.${notification.claim_token}&email_sent_at=is.null`;
      const patch: Record<string, unknown> = { claim_token: null, claim_until: null, last_error: null, next_attempt_at: new Date(Date.now() + 300000).toISOString() };
      try {
        // Recheck the booking after claiming, so cancelled or moved arrivals are skipped.
        const reservations = await bookingDB(`reservations?or=(manual_booking_id.eq.${notification.booking_key},id.eq.${notification.booking_key})&check_in=eq.${notification.check_in}&status=in.(pending,confirmed)&select=${selection}&order=room_type`);
        const details = reminderDetails(notification, reservations);
        if (details) {
          const activeClaim = await bookingDB(`${filter}&select=id`);
          if (!activeClaim.length) continue;
          const label = arrivalLabel(details.daysUntilArrival);
          const text = `${label}\n\nGuest: ${details.guestName}\nReference: ${details.reference}\nProperty: ${details.propertyName}\nCheck-in: ${details.checkIn}\nCheck-out: ${details.checkOut}\nRooms: ${details.rooms}\n${details.roomTypes}\nBooking total: ${bookingMoney(details.amount, details.currency)}\n\nReview the booking: https://www.tripelor.com/admin#bookings\n\nThis is the admin arrival reminder scheduled two days before check-in (Maldives time).`;
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `booking-arrival/${notification.id}` },
            body: JSON.stringify({ from: "Tripelor <bookings@tripelor.com>", to: [process.env.TRIPELOR_ADMIN_EMAIL || "bookings@tripelor.com"], subject: `${label} · ${details.guestName} · Tripelor`, text }),
            cache: "no-store", signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) throw new Error("Email delivery failed.");
          patch.email_sent_at = new Date().toISOString(); summary.sent++;
        }
        summary.checked++;
      } catch {
        summary.failed++; patch.last_error = "Delivery failed; scheduled for retry.";
        patch.next_attempt_at = new Date(Date.now() + 600000).toISOString();
      }
      try { await bookingDB(filter, { method: "PATCH", body: JSON.stringify(patch) }); }
      catch { summary.failed++; } // An expired claim retries with the same email idempotency key.
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return summary;
}
