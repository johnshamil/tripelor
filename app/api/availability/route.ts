import { checkAvailability } from "@/lib/availability";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyName, roomType, checkIn, checkOut, rooms } = body;
    if (!propertyName || !roomType || !checkIn || !checkOut || !rooms) {
      return Response.json({ error: "Property, room type, dates and room quantity are required." }, { status: 400 });
    }
    const result = await checkAvailability({
      propertyName,
      roomType,
      checkIn,
      checkOut,
      rooms: Number(rooms),
    });
    return Response.json(result);
  } catch (error) {
    console.error("Availability check error", error);
    return Response.json({ error: error instanceof Error ? error.message : "Unable to check availability." }, { status: 500 });
  }
}
