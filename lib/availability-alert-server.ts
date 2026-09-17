import { checkAvailability } from '@/lib/availability';
import { AlertRoom, AlertSelection, AvailabilityAlert, alertBookingHref, validateAlertSelection } from '@/lib/availability-alerts';

export class AlertError extends Error { constructor(message: string, public status = 400) { super(message); } }
const publicColumns = 'id,property_name,room_type,check_in,check_out,rooms,status,created_at,notified_at';
type ClaimedAlert = AvailabilityAlert & { user_id: string; claim_token: string };
async function db(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new AlertError('Availability alerts are temporarily unavailable.', 503);
  const response = await fetch(`${url}/rest/v1/${path}`, { ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...init.headers },
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (result?.message === 'ALERT_LIMIT_REACHED') throw new AlertError('You can watch up to 10 stays. Cancel an alert before adding another.', 409);
    if (result?.message === 'WORKER_UNAUTHORIZED') throw new AlertError('Unauthorized.', 401);
    throw new AlertError('Unable to save or load availability alerts. Please try again.', 503);
  }
  return result;
}
export async function alertRequestBody(request: Request) {
  // Next can use an internal hostname in request.url; Host retains the browser-facing host.
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || new URL(request.url).host;
  let sameOrigin = false;
  try {
    const source = new URL(origin || '');
    sameOrigin = source.host === host && source.origin === origin && ['http:', 'https:'].includes(source.protocol);
  } catch { /* A missing or invalid origin must be rejected. */ }
  if (!sameOrigin) throw new AlertError('Please use the Tripelor website.', 403);
  if (!request.headers.get('content-type')?.includes('application/json')) throw new AlertError('Send a valid alert request.', 415);
  const body = await request.text();
  if (body.length > 4000) throw new AlertError('Alert request is too large.', 413);
  try { return JSON.parse(body); } catch { throw new AlertError('Send a valid alert request.'); }
}
export async function alertRooms(): Promise<AlertRoom[]> {
  const rows = await db('property_inventory?active=eq.true&select=property_name,room_type&order=property_name,room_type');
  return rows.flatMap((row: any) => row.property_name === 'Rivethi Beach Hotel' && row.room_type === 'ALL ROOMS'
    ? ['Deluxe Double', 'Deluxe Twin', 'Deluxe Double Sea View'].map(roomType => ({ propertyName: row.property_name, roomType }))
    : [{ propertyName: row.property_name, roomType: row.room_type }]);
}
export async function listAvailabilityAlerts(userId: string) {
  return db(`availability_alerts?user_id=eq.${encodeURIComponent(userId)}&select=${publicColumns}&order=created_at.desc&limit=50`);
}
export async function subscribeAvailabilityAlert(user: { id: string; email?: string; email_confirmed_at?: string }, body: unknown) {
  if (!user.email || !user.email_confirmed_at) throw new AlertError('Confirm your account email before setting up an alert.', 403);
  let selection: AlertSelection;
  try { selection = validateAlertSelection(body); } catch (e) { throw new AlertError(e instanceof Error ? e.message : 'Check your dates.'); }
  const supported = await alertRooms();
  if (!supported.some(room => room.propertyName === selection.propertyName && room.roomType === selection.roomType)) throw new AlertError('This room is not currently offered. Choose another room.', 400);
  if ((await checkAvailability(selection)).available) return { available: true, bookingHref: alertBookingHref(selection) };
  const rows = await db('rpc/create_availability_alert', { method: 'POST', body: JSON.stringify({ p_user_id: user.id,
    p_property_name: selection.propertyName, p_room_type: selection.roomType, p_check_in: selection.checkIn,
    p_check_out: selection.checkOut, p_rooms: selection.rooms }) });
  return { available: false, id: rows[0].id, email: user.email };
}
export async function cancelAvailabilityAlert(userId: string, id: unknown) {
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new AlertError('Choose a valid alert.');
  await db(`availability_alerts?id=eq.${id}&user_id=eq.${encodeURIComponent(userId)}&status=eq.active`, {
    method: 'PATCH', body: JSON.stringify({ status: 'cancelled', claim_token: null, claim_until: null }),
  });
}
export function alertResponse(value: unknown, status = 200) { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
export function alertError(error: unknown) {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return alertResponse({ error: 'Please sign in to manage availability alerts.' }, 401);
  if (error instanceof AlertError) return alertResponse({ error: error.message }, error.status);
  return alertResponse({ error: 'Availability alerts are temporarily unavailable. Please try again.' }, 503);
}
function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
async function customerEmail(id: string): Promise<string | null> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const response = await fetch(`${process.env.SUPABASE_URL?.replace(/\/$/, '')}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(5000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('User lookup failed.');
  const user = await response.json();
  return user.email_confirmed_at && typeof user.email === 'string' ? user.email : null;
}
export async function processAvailabilityAlerts(token: string) {
  if (!/^[0-9a-f]{64}$/i.test(token)) throw new AlertError('Unauthorized.', 401);
  const alerts: ClaimedAlert[] = await db('rpc/claim_availability_alerts', { method: 'POST', body: JSON.stringify({ p_worker_token: token, p_limit: 20 }) });
  if (!process.env.RESEND_API_KEY) throw new AlertError('Availability alert email delivery is not configured.', 503);
  const summary = { checked: 0, sent: 0, failed: 0 };
  // Leave time for an in-flight check/delivery and its final write within the 60s route limit.
  const deadline = Date.now() + 15000;
  let index = 0;
  async function worker() {
    while (index < alerts.length && Date.now() < deadline) {
      const alert = alerts[index++];
      const filter = `availability_alerts?id=eq.${alert.id}&status=eq.active&claim_token=eq.${alert.claim_token}`;
      const patch: Record<string, unknown> = { claim_token: null, claim_until: null, last_checked_at: new Date().toISOString(),
        next_check_at: new Date(Date.now() + 300000).toISOString(), last_error: null };
      try {
        const selection = { propertyName: alert.property_name, roomType: alert.room_type, checkIn: alert.check_in, checkOut: alert.check_out, rooms: alert.rooms };
        const supported = await alertRooms();
        if (supported.some(room => room.propertyName === selection.propertyName && room.roomType === selection.roomType) && (await checkAvailability(selection)).available) {
          const email = await customerEmail(alert.user_id);
          if (!email) patch.status = 'cancelled';
          else {
            const stillActive = await db(filter + '&select=id');
            if (!stillActive.length) continue;
            if (!process.env.RESEND_API_KEY) throw new Error('Email not configured.');
            const url = 'https://www.tripelor.com' + alertBookingHref(selection);
            const details = `${alert.room_type} at ${alert.property_name}\nCheck-in: ${alert.check_in}\nCheck-out: ${alert.check_out}\nRooms: ${alert.rooms}`;
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `availability-alert/${alert.id}` },
              body: JSON.stringify({ from: 'Tripelor <bookings@tripelor.com>', to: [email], reply_to: 'bookings@tripelor.com',
                subject: 'Your preferred Tripelor room is available again',
                text: `Good news! Your selected stay is available again.\n\n${details}\n\nView your dates: ${url}\n\nAvailability can change. This alert does not hold a room or guarantee a rate. Your booking still needs confirmation.\n\nThis is the one-time email you requested. Manage alerts: https://www.tripelor.com/account/availability-alerts`,
                html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#222"><h1 style="color:#907038">Your room is available again</h1><p>Good news! We found availability for your selected stay.</p><p>${escapeHtml(details).replace(/\n/g, '<br>')}</p><p><a href="${escapeHtml(url)}">View your dates and request to book</a></p><p>Availability can change. This alert does not hold a room or guarantee a rate. Your booking still needs confirmation.</p><p style="font-size:12px">This is the one-time email you requested. <a href="https://www.tripelor.com/account/availability-alerts">Manage your alerts</a>.</p></div>` }),
              cache: 'no-store', signal: AbortSignal.timeout(5000),
            });
            if (!response.ok) throw new Error('Email provider rejected request.');
            patch.status = 'notified'; patch.notified_at = new Date().toISOString(); summary.sent++;
          }
        }
        summary.checked++;
      } catch {
        summary.failed++; patch.last_error = 'Check or delivery failed; scheduled for retry.';
        patch.next_check_at = new Date(Date.now() + 600000).toISOString();
      }
      try { await db(filter, { method: 'PATCH', body: JSON.stringify(patch) }); }
      catch { summary.failed++; } // The claim expires; a retry uses the same email idempotency key.
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()]);
  return summary;
}
