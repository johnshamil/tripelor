import { requireUser } from "@/lib/auth-server";
import { cancelPriceAlert, listPriceAlerts, priceAlertError, priceAlertResponse, subscribePriceAlert } from "@/lib/price-alert-server";

export async function GET() {
  try {
    const user = await requireUser();
    return priceAlertResponse({ alerts: await listPriceAlerts(user.id), email: user.email });
  } catch (error) {
    return priceAlertError(error);
  }
}

export async function POST(request: Request) {
  try {
    return priceAlertResponse(await subscribePriceAlert(await request.json()));
  } catch (error) {
    return priceAlertError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    await cancelPriceAlert(body?.id);
    return priceAlertResponse({ success: true });
  } catch (error) {
    return priceAlertError(error);
  }
}
