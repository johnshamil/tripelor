import { alertError, alertResponse, processAvailabilityAlerts } from '@/lib/availability-alert-server';
import { processPriceAlerts } from '@/lib/price-alert-server';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
    const availability = await processAvailabilityAlerts(token);
    const prices = await processPriceAlerts();
    return alertResponse({ availability, prices });
  } catch (error) { return alertError(error); }
}
