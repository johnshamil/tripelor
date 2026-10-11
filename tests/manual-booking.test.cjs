const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
let user = { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.test" };
function load(name) {
  if (name === "@/lib/auth-server") return { requireUser: async () => { if (!user) throw new Error("UNAUTHORIZED"); return user; }, isAdminEmail: email => email === "admin@example.test" };
  const filename = path.join(root, name.replace(/^@\//, "") + ".ts");
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("require", "module", "exports", code)(dependency => dependency.startsWith("@/") ? load(dependency) : require(dependency), module, module.exports);
  return module.exports;
}
const pure = load("@/lib/manual-booking");
const server = load("@/lib/manual-booking-server");
const reminders = load("@/lib/booking-reminder-server");
const manualRoute = load("@/app/api/admin/manual-bookings/route");
const workerRoute = load("@/app/api/internal/booking-reminders/route");
const originalFetch = global.fetch;
const originalEnv = { ...process.env };
afterEach(() => { global.fetch = originalFetch; process.env = { ...originalEnv }; user = { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.test" }; });
const requestId = "22222222-2222-4222-8222-222222222222";
const input = () => ({ requestId, propertyName: "Example Stay", guestName: "Test Guest", guestEmail: "", guestPhone: "", checkIn: "2026-12-10", checkOut: "2026-12-12", adults: 2, children: 0, mealPlan: "", bookingSource: "Manual", externalReference: "", notes: "", paymentStatus: "unpaid", currency: "MVR", rooms: [{ roomType: "Deluxe", quantity: 5, nightlyRate: 750 }] });
const response = value => Response.json(value);
function configured() { process.env.SUPABASE_URL = "https://booking-db.example.test"; process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only-key"; }
function request(body = input(), origin = "https://www.tripelor.com") { return new Request("https://www.tripelor.com/api/admin/manual-bookings", { method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body) }); }

test("2 or 5 rooms calculate in the chosen currency, with cents rounded once", () => {
  assert.equal(pure.manualRoomTotal(pure.validateManualBooking(input()).rooms[0], 2), 7500);
  assert.equal(pure.manualRoomTotal({ quantity: 2, nightlyRate: 75, roomType: "Deluxe" }, 3), 450);
  assert.equal(pure.manualRoomTotal({ quantity: 5, nightlyRate: 19.99, roomType: "Deluxe" }, 3), 299.85);
  assert.equal(pure.bookingMoney(7500, "MVR"), "MVR 7,500.00");
  assert.deepEqual(pure.bookingCurrencyTotals([{ currency: "MVR", estimated_total: 7500 }, { currency: "USD", estimated_total: 450, speedboat_total: 50 }]), { USD: 500, MVR: 7500 });
});
test("validates dates, prices, quantities, duplicate room types and supported currencies", () => {
  for (const change of [{ checkIn: "2026-02-30" }, { checkOut: "2026-12-10" }, { currency: "EUR" }, { rooms: [{ roomType: "Deluxe", quantity: 2.5, nightlyRate: 75 }] }, { rooms: [{ roomType: "Deluxe", quantity: 1, nightlyRate: "" }] }, { rooms: [{ roomType: "Deluxe", quantity: 1, nightlyRate: -1 }] }, { rooms: [{ roomType: "Deluxe", quantity: 1, nightlyRate: 5 }, { roomType: "deluxe", quantity: 1, nightlyRate: 5 }] }]) assert.throws(() => pure.validateManualBooking({ ...input(), ...change }), pure.ManualBookingError);
});
test("calendar sums room quantities and excludes checkout, completed and cancelled stays", () => {
  const row = { property_name: "Example Stay", room_type: "Deluxe", rooms: 5, status: "confirmed", check_in: "2026-12-10", check_out: "2026-12-12" };
  assert.equal(pure.calendarRoomOccupancy([row, { ...row, rooms: 2, status: "pending" }, { ...row, rooms: 9, status: "cancelled" }, { ...row, status: "completed" }], row.property_name, row.room_type, "2026-12-11"), 7);
  assert.equal(pure.calendarRoomOccupancy([row], row.property_name, row.room_type, "2026-12-12"), 0);
});
test("arrival dates use Maldives time and grouped rooms share one reminder", () => {
  assert.equal(pure.maldivesToday(new Date("2026-10-11T19:30:00Z")), "2026-10-12");
  const notification = { id: requestId, booking_key: requestId, check_in: "2026-10-14", read_at: null, email_sent_at: null };
  const row = { id: "room-a", manual_booking_id: requestId, guest_name: "Test", property_name: "Stay", room_type: "Deluxe", rooms: 2, check_in: "2026-10-14", check_out: "2026-10-16", booking_reference: "MAN-TEST", currency: "MVR", estimated_total: 3000 };
  const details = reminders.reminderDetails(notification, [row, { ...row, id: "room-b", rooms: 3, estimated_total: 4500 }], "2026-10-12");
  assert.equal(details.rooms, 5); assert.equal(details.amount, 7500); assert.equal(details.daysUntilArrival, 2);
  assert.equal(reminders.reminderDetails(notification, [row], "2026-10-15"), null);
});
test("booking API rejects anonymous, non-admin and cross-origin requests without database calls", async () => {
  global.fetch = () => { throw new Error("Must not access database"); };
  user = null; assert.equal((await manualRoute.POST(request())).status, 401);
  user = { id: "customer", email: "customer@example.test" }; assert.equal((await manualRoute.POST(request())).status, 403);
  user = { id: "admin", email: "admin@example.test" }; assert.equal((await manualRoute.POST(request(input(), "https://other.example.test"))).status, 403);
  assert.equal((await manualRoute.POST(request({ ...input(), currency: "EUR" }))).status, 400);
});
test("booking API sends one atomic RPC, preserving rooms, MVR and request identity", async () => {
  configured(); let calls = 0;
  global.fetch = async (url, init) => { calls++; assert.match(url, /rpc\/create_manual_booking$/); const body = JSON.parse(init.body); assert.equal(body.p_request_id, requestId); assert.equal(body.p_booking.rooms[0].quantity, 5); assert.equal(body.p_booking.currency, "MVR"); return response([{ rooms: 5, estimated_total: 7500, currency: "MVR", booking_reference: "MAN-TEST" }]); };
  const result = await manualRoute.POST(request()); assert.equal(result.status, 200); assert.equal(calls, 1); const saved = await result.json(); assert.equal(saved.rooms, 5); assert.equal(saved.total, 7500); assert.equal(saved.currency, "MVR");
});
test("inventory conflicts return a useful 409 and no partial save is attempted", async () => {
  configured(); global.fetch = async () => Response.json({ message: "ROOM_NOT_AVAILABLE" }, { status: 400 });
  const result = await manualRoute.POST(request()); assert.equal(result.status, 409); assert.match((await result.json()).error, /not enough available rooms/);
});
test("reminder worker rejects missing and forged credentials before email delivery", async () => {
  assert.equal((await workerRoute.POST(new Request("https://www.tripelor.com/api/internal/booking-reminders", { method: "POST" }))).status, 401);
  configured(); global.fetch = async url => { assert.match(url, /rpc\/claim_booking_reminders/); return Response.json({ message: "WORKER_UNAUTHORIZED" }, { status: 403 }); };
  const result = await workerRoute.POST(new Request("https://www.tripelor.com/api/internal/booking-reminders", { method: "POST", headers: { Authorization: `Bearer ${"0".repeat(64)}` } })); assert.equal(result.status, 401);
});
test("worker sends a single admin email with room count, currency and idempotency key", async () => {
  configured(); process.env.RESEND_API_KEY = "test-only-email-key"; process.env.TRIPELOR_ADMIN_EMAIL = "admin@example.test";
  const date = pure.maldivesToday(); const notification = { id: requestId, booking_key: requestId, check_in: date, read_at: null, email_sent_at: null, claim_token: requestId };
  let emails = 0; let saved;
  global.fetch = async (url, init) => {
    if (url.endsWith("rpc/claim_booking_reminders")) return response([notification]);
    if (url.includes("/reservations?")) return response([{ id: "a", manual_booking_id: requestId, guest_name: "Test Guest", property_name: "Stay", room_type: "Deluxe", rooms: 5, check_in: date, check_out: "2099-12-31", booking_reference: "MAN-TEST", estimated_total: 7500, currency: "MVR" }]);
    if (url === "https://api.resend.com/emails") { emails++; const email = JSON.parse(init.body); assert.deepEqual(email.to, ["admin@example.test"]); assert.match(email.text, /Rooms: 5/); assert.match(email.text, /MVR 7,500.00/); assert.equal(init.headers["Idempotency-Key"], `booking-arrival/${requestId}`); return response({ id: "test-only" }); }
    if (init?.method === "PATCH") { saved = JSON.parse(init.body); return response([]); }
    return response([{ id: requestId }]);
  };
  assert.deepEqual(await reminders.processBookingReminders("1".repeat(64)), { checked: 1, sent: 1, failed: 0 }); assert.equal(emails, 1); assert.ok(saved.email_sent_at); assert.equal(saved.claim_token, null);
});
test("cancelled or rescheduled bookings do not send arrival emails", async () => {
  configured(); process.env.RESEND_API_KEY = "test-only-email-key";
  let emails = 0;
  global.fetch = async (url, init) => { if (url.endsWith("rpc/claim_booking_reminders")) return response([{ id: requestId, booking_key: requestId, check_in: pure.maldivesToday(), claim_token: requestId }]); if (url.includes("/reservations?")) return response([]); if (url === "https://api.resend.com/emails") emails++; return response([]); };
  assert.deepEqual(await reminders.processBookingReminders("1".repeat(64)), { checked: 1, sent: 0, failed: 0 }); assert.equal(emails, 0);
});
