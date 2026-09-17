import { alertError, alertResponse, processAvailabilityAlerts } from '@/lib/availability-alert-server';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
    return alertResponse(await processAvailabilityAlerts(token));
  } catch (error) { return alertError(error); }
}
