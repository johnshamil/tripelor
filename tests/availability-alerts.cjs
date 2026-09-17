const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const ts = require('typescript');
process.env.SUPABASE_URL = 'https://database.example.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';
process.env.RESEND_API_KEY = 'fake-mail-key';
const token = 'a'.repeat(64), owner = crypto.randomUUID(), other = crypto.randomUUID();
let user, rows, available, requests, mailStatus, verified, cancelledDuringCheck;
function reset() {
  user = { id: owner, email: 'customer@example.test', email_confirmed_at: '2026-01-01T00:00:00Z' };
  rows = []; available = false; requests = []; mailStatus = 200; verified = true; cancelledDuringCheck = false;
}
reset();
const inventory = [
  { property_name: "Uhoo's Lavish Oasis", room_type: 'Deluxe Room' },
  { property_name: 'Masfalhi View Inn', room_type: 'Standard Double Room' },
];
function matches(row, params) { return [...params].every(([key, value]) => ['select','order','limit'].includes(key) || String(row[key]) === value.slice(3)); }
async function fetchMock(url, init = {}) {
  requests.push({ url, init });
  if (url === 'https://api.resend.com/emails') return Response.json({ id: 'test-message' }, { status: mailStatus });
  const parsed = new URL(url), path = parsed.pathname, body = init.body ? JSON.parse(init.body) : null;
  assert.equal(parsed.origin, 'https://database.example.test');
  if (path.startsWith('/auth/v1/admin/users/')) return Response.json({ email: 'verified-customer@example.test', email_confirmed_at: verified ? '2026-01-01' : null });
  if (path === '/rest/v1/property_inventory') {
    return Response.json(inventory.filter(row => [...parsed.searchParams].every(([key, value]) => ['active','select','order','limit'].includes(key) || row[key] === value.slice(3))));
  }
  if (path === '/rest/v1/rpc/check_room_availability') {
    if (cancelledDuringCheck) rows.forEach(row => { row.status = 'cancelled'; row.claim_token = null; });
    return Response.json([{ available, rooms_left: available ? 1 : 0, total_rooms: 1 }]);
  }
  if (path === '/rest/v1/rpc/reserve_rooms') return Response.json('reservation-id');
  if (path === '/rest/v1/rpc/create_availability_alert') {
    let row = rows.find(row => row.status === 'active' && row.user_id === body.p_user_id && row.check_in === body.p_check_in && row.check_out === body.p_check_out);
    if (!row) {
      row = { id: crypto.randomUUID(), user_id: body.p_user_id, property_name: body.p_property_name, room_type: body.p_room_type,
        check_in: body.p_check_in, check_out: body.p_check_out, rooms: body.p_rooms, status: 'active', created_at: new Date().toISOString(), notified_at: null };
      rows.push(row);
    }
    return Response.json([row]);
  }
  if (path === '/rest/v1/rpc/claim_availability_alerts') {
    if (body.p_worker_token !== token) return Response.json({ message: 'WORKER_UNAUTHORIZED' }, { status: 403 });
    const due = rows.filter(row => row.status === 'active' && !row.claim_token);
    due.forEach(row => { row.claim_token = crypto.randomUUID(); });
    return Response.json(due);
  }
  if (path === '/rest/v1/availability_alerts') {
    const selected = rows.filter(row => matches(row, parsed.searchParams));
    if (init.method === 'PATCH') selected.forEach(row => Object.assign(row, body));
    return Response.json(selected);
  }
  throw Error('Unexpected request: ' + url);
}
function moduleFor(path, dependencies = {}) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require','module','exports','fetch',output)(name => {
    if (name in dependencies) return dependencies[name];
    throw Error('Unexpected import: ' + name);
  }, module, module.exports, fetchMock);
  return module.exports;
}
const selection = moduleFor('lib/availability-alerts.ts');
const availability = moduleFor('lib/availability.ts');
const server = moduleFor('lib/availability-alert-server.ts', { '@/lib/availability': availability, '@/lib/availability-alerts': selection });
const auth = { requireUser: async () => { if (!user) throw Error('UNAUTHORIZED'); return user; } };
const api = moduleFor('app/api/account/availability-alerts/route.ts', { '@/lib/auth-server': auth, '@/lib/availability-alert-server': server });
const worker = moduleFor('app/api/internal/availability-alerts/route.ts', { '@/lib/availability-alert-server': server });
const day = offset => new Date(Date.now() + offset * 86400000).toISOString().slice(0,10);
const input = () => ({ propertyName: "Uhoo's Lavish Oasis", roomType: 'Deluxe Room', checkIn: day(20), checkOut: day(22), rooms: 1 });
const mail = () => requests.filter(request => request.url === 'https://api.resend.com/emails');
async function request(method, body, origin = 'https://www.tripelor.com') {
  const response = await api[method](new Request('https://www.tripelor.com/api/account/availability-alerts', { method,
    headers: { origin, 'content-type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }));
  return { status: response.status, body: await response.json() };
}
async function runWorker(credential = token) {
  const response = await worker.POST(new Request('https://www.tripelor.com/api/internal/availability-alerts', { method: 'POST', headers: { authorization: 'Bearer ' + credential } }));
  return { status: response.status, body: await response.json() };
}
(async () => {
  assert.equal(selection.maldivesDate(new Date('2026-09-17T20:30:00Z')), '2026-09-18');
  for (const bad of [{ checkIn: '2027-02-30' }, { checkOut: day(19) }, { checkIn: day(-1) }, { rooms: 0 }, { rooms: 1.5 }, { propertyName: '' }]) {
    assert.throws(() => selection.validateAlertSelection({ ...input(), ...bad }));
  }
  user = null; assert.equal((await request('POST', input())).status, 401); assert.equal(rows.length, 0);
  reset(); assert.equal((await request('POST', input(), 'https://attacker.example')).status, 403);
  const forwardedRequest = origin => new Request('http://localhost:3000/api/account/availability-alerts', {
    method: 'POST', headers: { host: 'www.tripelor.com', origin, 'content-type': 'application/json' }, body: JSON.stringify(input()),
  });
  assert.deepEqual(await server.alertRequestBody(forwardedRequest('https://www.tripelor.com')), input());
  await assert.rejects(server.alertRequestBody(forwardedRequest('https://attacker.example')), error => error.status === 403);
  user.email_confirmed_at = ''; assert.equal((await request('POST', input())).status, 403);
  reset(); assert.equal((await request('POST', { ...input(), roomType: 'Invented room' })).status, 400);
  available = true; assert.equal((await request('POST', input())).body.available, true); assert.equal(rows.length, 0);
  reset();
  const added = await request('POST', { ...input(), user_id: other, email: 'attacker@example.test' });
  assert.equal(added.status, 200); assert.equal(rows[0].user_id, owner); assert.equal(rows[0].email, undefined);
  assert.equal((await request('POST', input())).body.id, added.body.id); assert.equal(rows.length, 1);
  rows.push({ ...rows[0], id: crypto.randomUUID(), user_id: other });
  assert.equal((await request('GET')).body.alerts.length, 1);
  await request('DELETE', { id: rows[1].id }); assert.equal(rows[1].status, 'active');
  await request('DELETE', { id: added.body.id }); assert.equal(rows[0].status, 'cancelled');
  assert.equal((await runWorker('bad')).status, 401);
  assert.equal((await runWorker('b'.repeat(64))).status, 401);

  reset(); await request('POST', input()); await runWorker();
  assert.equal(mail().length, 0); assert.equal(rows[0].status, 'active');
  available = true; const delivered = await runWorker();
  assert.equal(delivered.body.sent, 1); assert.equal(rows[0].status, 'notified');
  const payload = JSON.parse(mail()[0].init.body);
  assert.deepEqual(payload.to, ['verified-customer@example.test']); assert.equal(payload.bcc, undefined);
  assert.ok(payload.text.includes(day(20)) && payload.text.includes(day(22)));
  assert.ok(payload.text.includes('does not hold a room'));
  assert.doesNotMatch(mail()[0].init.body, /fake-service-key|fake-mail-key/);
  await runWorker(); assert.equal(mail().length, 1);

  reset(); await request('POST', input()); available = true; mailStatus = 503;
  await runWorker(); assert.equal(rows[0].status, 'active'); assert.ok(rows[0].last_error);
  const key = mail()[0].init.headers['Idempotency-Key'];
  mailStatus = 200; await runWorker(); assert.equal(rows[0].status, 'notified');
  assert.equal(mail()[1].init.headers['Idempotency-Key'], key);

  reset(); await request('POST', input()); available = true; verified = false;
  await runWorker(); assert.equal(mail().length, 0); assert.equal(rows[0].status, 'cancelled');
  reset(); await request('POST', input()); available = true; cancelledDuringCheck = true;
  await runWorker(); assert.equal(mail().length, 0); assert.equal(rows[0].status, 'cancelled');

  reset(); available = true;
  assert.equal((await availability.checkAvailability({ ...input(), propertyName: 'Masfalhi View Inn', roomType: 'Standard Double Room' })).available, true);
  assert.equal(requests.filter(r => r.url.includes('rpc/check_room_availability')).length, 1);
  assert.equal(JSON.parse(requests.find(r => r.url.includes('rpc/check_room_availability')).init.body).p_room_type, 'Standard Double Room');
  available = false;
  assert.equal((await availability.checkAvailability({ ...input(), propertyName: 'Masfalhi View Inn', roomType: 'Standard Double Room' })).available, false);
  await availability.reserveRooms({ ...input(), propertyName: 'Masfalhi View Inn', roomType: 'Standard Double Room', guestName: 'Test', guestEmail: 'test@example.test' });
  assert.equal(JSON.parse(requests.find(r => r.url.includes('rpc/reserve_rooms')).init.body).p_room_type, 'Standard Double Room');
  console.log('PASS: auth and consent, exact dates, recipient/owner protection, cancellation, worker authentication, availability transitions, one-time sending, retry idempotency and published category inventory. No live emails or bookings created.');
})().catch(error => { console.error(error); process.exit(1); });
