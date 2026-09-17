import { requireUser } from '@/lib/auth-server';
import { alertError, alertRequestBody, alertResponse, alertRooms, cancelAvailabilityAlert, listAvailabilityAlerts, subscribeAvailabilityAlert } from '@/lib/availability-alert-server';

export async function GET() {
  try {
    const user = await requireUser();
    const [alerts, rooms] = await Promise.all([listAvailabilityAlerts(user.id), alertRooms()]);
    return alertResponse({ alerts, rooms, email: user.email });
  } catch (error) { return alertError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    return alertResponse(await subscribeAvailabilityAlert(user, await alertRequestBody(request)));
  } catch (error) { return alertError(error); }
}
export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = await alertRequestBody(request);
    await cancelAvailabilityAlert(user.id, body.id);
    return alertResponse({ success: true });
  } catch (error) { return alertError(error); }
}
