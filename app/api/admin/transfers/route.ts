import { propertyAdmin, propertyDB, propertyError, sameOrigin } from "@/lib/property-store";

const REQUEST_STATUSES = ["pending", "confirmed", "declined", "completed", "cancelled"];

function shortText(value: unknown, max: number, fallback = "") {
  if (typeof value !== "string" || value.length > max) throw new Error("Please shorten the transfer details and try again.");
  return value.trim() || fallback;
}

export async function GET() {
  try {
    await propertyAdmin();
    const [schedules, requests] = await Promise.all([
      propertyDB("speedboat_schedule?select=*&order=route.asc,day_of_week.asc,departure_time.asc"),
      propertyDB("transfer_requests?select=*&order=arrival_date.asc,arrival_time.asc,created_at.desc&limit=300"),
    ]);
    return Response.json({ schedules, requests }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return propertyError(error);
  }
}

export async function POST(request: Request) {
  try {
    await propertyAdmin();
    sameOrigin(request);
    const body = await request.text();
    if (body.length > 12000) throw new Error("Transfer details are too large.");
    const input = JSON.parse(body);
    const operation = String(input?.operation || "");
    if (operation === "updateRequest") {
      if (typeof input.id !== "string" || !/^[0-9a-f-]{36}$/.test(input.id)) throw new Error("Choose a valid transfer request.");
      const status = String(input.status || "");
      if (!REQUEST_STATUSES.includes(status)) throw new Error("Choose a valid transfer status.");
      const adminNote = shortText(input.adminNote || "", 2000);
      const rows = await propertyDB(`transfer_requests?id=eq.${input.id}`, { method: "PATCH", body: JSON.stringify({ status, admin_note: adminNote, updated_at: new Date().toISOString() }) });
      if (!rows.length) return Response.json({ error: "Transfer request not found." }, { status: 404 });
      return Response.json({ request: rows[0] });
    }

    if (operation === "deleteSchedule") {
      const id = Number(input.id);
      if (!Number.isInteger(id) || id < 1) throw new Error("Choose a valid departure.");
      const rows = await propertyDB(`speedboat_schedule?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
      if (!rows.length) return Response.json({ error: "Departure not found." }, { status: 404 });
      return Response.json({ schedule: rows[0] });
    }

    if (operation !== "saveSchedule") throw new Error("Choose a transfer action.");
    const dayOfWeek = Number(input.dayOfWeek);
    const departureTime = shortText(input.departureTime, 8);
    const operator = shortText(input.operator, 100, "Dream Speed");
    const route = shortText(input.route, 120, "Male to Felidhoo");
    const notes = shortText(input.notes || "", 500);
    const capacity = Number(input.capacity);
    const pricePerPerson = Number(input.pricePerPerson);
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) throw new Error("Choose a valid day of the week.");
    if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(departureTime)) throw new Error("Choose a valid departure time.");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) throw new Error("Capacity must be between 1 and 100 seats.");
    if (!Number.isFinite(pricePerPerson) || pricePerPerson < 0 || pricePerPerson > 100000) throw new Error("Enter a valid fare per person.");
    const payload = { operator, route, day_of_week: dayOfWeek, departure_time: departureTime, active: Boolean(input.active), capacity, price_per_person: pricePerPerson, notes };
    const id = Number(input.id);
    const rows = Number.isInteger(id) && id > 0
      ? await propertyDB(`speedboat_schedule?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) })
      : await propertyDB("speedboat_schedule", { method: "POST", body: JSON.stringify(payload) });
    if (!rows.length) return Response.json({ error: "Departure not found." }, { status: 404 });
    return Response.json({ schedule: rows[0] });
  } catch (error) {
    return propertyError(error);
  }
}
