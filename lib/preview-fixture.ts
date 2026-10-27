// Hosted DEMO ONLY. No database, email, storage, or payment connections.
import { legacyPropertySeeds } from "./legacy-property-import";

const rows: any[] = legacyPropertySeeds.map((seed, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  slug: seed.slug, status: "published", updated_at: "2026-10-27T12:00:00.000Z",
  data: { ...seed.data, rooms: seed.data.rooms.map(room => ({ ...room,
    photos: ["/properties/dhoani-maldives-boutique/bedroom.webp"],
    bathroomPhotos: ["/properties/dhoani-maldives-boutique/bathroom-shower.webp"],
  })) },
}));

export function demoUser(token: string | null) {
  if (token !== "mock-admin" && token !== "mock-member") return null;
  return { id: token, email: token === "mock-admin" ? "admin@preview.invalid" : "guest@preview.invalid",
    user_metadata: { full_name: token === "mock-admin" ? "Preview Admin" : "Preview Guest" } };
}

const json = (data: unknown, status = 200) => Response.json(data, { status });

async function fixture(request: Request) {
  const url = new URL(request.url);
  let body: any = {};
  if (!["GET", "HEAD"].includes(request.method)) {
    try { body = await request.json(); } catch { return json({ error: "Invalid sample request" }, 400); }
  }
  if (url.pathname === "/auth/v1/user") {
    const user = demoUser(request.headers.get("authorization")?.replace(/^Bearer /, "") || null);
    return user ? json(user) : json({ error: "Demo session required" }, 401);
  }
  if (url.pathname === "/rest/v1/managed_properties") {
    let selected = rows.filter(row => ["id", "slug", "status", "updated_at"].every(key =>
      !url.searchParams.has(key) || row[key] === url.searchParams.get(key)!.replace(/^eq\./, "")));
    if (request.method === "PATCH") selected.forEach(row => Object.assign(row, body));
    if (request.method === "POST") {
      const row = { ...body, id: `00000000-0000-4000-8000-${String(rows.length + 1).padStart(12, "0")}`, updated_at: new Date().toISOString() };
      rows.push(row); selected = [row];
    }
    return json(selected);
  }
  if (url.pathname === "/rest/v1/rpc/check_room_availability") return json([{ available: true, rooms_left: 2, total_rooms: 2 }]);
  if (url.pathname === "/rest/v1/rpc/get_room_calendar") {
    const days = []; let date = body.p_from || body.p_start_date;
    const end = body.p_to || body.p_end_date;
    while (date && date <= end && days.length < 370) {
      days.push({ day: date, available: true, rooms_left: 2 });
      date = new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10);
    }
    return json(days);
  }
  if (url.pathname === "/rest/v1/property_inventory") return json([{ room_type: "Standard Double Room", total_rooms: 2, active: true }]);
  // No reservation mutation, auth signup, photo upload, or outbound email is implemented.
  if (url.pathname.startsWith("/rest/v1/rpc/")) return json({ error: "Reservation mutations disabled in demo" }, 403);
  if (request.method === "GET" && url.pathname.startsWith("/rest/v1/")) return json([]);
  return json({ error: "Service disabled in sample-data preview" }, 403);
}

export function installPreviewFetch() {
  if (process.env.TRIPELOR_MOCK_PREVIEW !== "1") return;
  // Fail closed rather than forwarding to any actual service.
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.origin !== "https://fixture.preview.invalid") {
      throw new Error(`External server request disabled in demo: ${url.hostname}`);
    }
    return fixture(request);
  };
}