type AvailabilityResult = { available: boolean; rooms_left: number; total_rooms: number };

const MASFALHI_STANDARD_ROOMS = ["ROOM 101", "ROOM 102", "ROOM 103", "ROOM 104", "ROOM 105"];
const MASFALHI_FAMILY_ROOMS = ["ROOM 106"];

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Availability database is not configured.");
  return { url: url.replace(/\/$/, ""), key };
}

async function rpc<T>(name: string, payload: Record<string, unknown>): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.error || String(data || "Database request failed");
    throw new Error(message);
  }
  return data as T;
}

async function checkOneRoom(input: {
  propertyName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
}): Promise<AvailabilityResult> {
  const rows = await rpc<AvailabilityResult[]>("check_room_availability", {
    p_property_name: input.propertyName,
    p_room_type: input.roomType,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_rooms: input.rooms,
  });
  return rows?.[0] || { available: false, rooms_left: 0, total_rooms: 0 };
}

function masfalhiInternalRooms(roomType: string) {
  const normalized = roomType.trim().toLowerCase();
  if (normalized === "standard double room") return MASFALHI_STANDARD_ROOMS;
  if (normalized === "family room with sea view") return MASFALHI_FAMILY_ROOMS;
  return null;
}

export async function checkAvailability(input: {
  propertyName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
}): Promise<AvailabilityResult> {
  if (input.propertyName.toLowerCase() === "masfalhi view inn") {
    const internalRooms = masfalhiInternalRooms(input.roomType);
    if (internalRooms) {
      const results = await Promise.all(
        internalRooms.map(roomType => checkOneRoom({ ...input, roomType, rooms: 1 })),
      );
      const roomsLeft = results.reduce((total, result) => total + result.rooms_left, 0);
      const totalRooms = results.reduce((total, result) => total + result.total_rooms, 0);
      return {
        available: roomsLeft >= input.rooms,
        rooms_left: roomsLeft,
        total_rooms: totalRooms,
      };
    }
  }

  const selected = await checkOneRoom(input);

  // Uhoo's Lavish Oasis has two separately bookable rooms. Return the total
  // number of rooms still available for the selected stay so the booking UI
  // can truthfully show “1 left” only when one of the two rooms remains.
  if (input.propertyName.toLowerCase() === "uhoo's lavish oasis" && ["ROOM 101", "ROOM 102"].includes(input.roomType.toUpperCase())) {
    const roomTypes = ["ROOM 101", "ROOM 102"];
    const results = await Promise.all(roomTypes.map(roomType => checkOneRoom({ ...input, roomType, rooms: 1 })));
    const propertyRoomsLeft = results.filter(result => result.available).length;
    return { ...selected, rooms_left: propertyRoomsLeft, total_rooms: 2 };
  }

  return selected;
}

async function reserveOneRoom(input: {
  propertyName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}): Promise<string> {
  return await rpc<string>("reserve_rooms", {
    p_property_name: input.propertyName,
    p_room_type: input.roomType,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_rooms: input.rooms,
    p_guest_name: input.guestName,
    p_guest_email: input.guestEmail,
    p_guest_phone: input.guestPhone || null,
  });
}

export async function reserveRooms(input: {
  propertyName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
}): Promise<string> {
  if (input.propertyName.toLowerCase() === "masfalhi view inn") {
    const internalRooms = masfalhiInternalRooms(input.roomType);
    if (internalRooms) {
      if (input.rooms !== 1) throw new Error("ROOM_NOT_AVAILABLE");

      for (const roomType of internalRooms) {
        const available = await checkOneRoom({ ...input, roomType, rooms: 1 });
        if (!available.available) continue;
        try {
          return await reserveOneRoom({ ...input, roomType, rooms: 1 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!message.includes("ROOM_NOT_AVAILABLE")) throw error;
        }
      }
      throw new Error("ROOM_NOT_AVAILABLE");
    }
  }

  return await reserveOneRoom(input);
}

export async function cancelReservation(id: string) {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/reservations?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ status: "cancelled" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Could not release reservation hold.");
}
