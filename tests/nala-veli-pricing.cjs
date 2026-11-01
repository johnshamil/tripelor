const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, dependencies, fetchMock) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', 'fetch', code)(
    name => name in dependencies ? dependencies[name] : require(name), module, module.exports, fetchMock,
  );
  return module.exports;
}

const rates = load('lib/nala-veli.ts', {});
const { nalaProperties, nalaStay, nalaPrice, nalaToday, nalaStartingPrice } = rates;
const villaDouble = nalaProperties[0].rooms.find(room => room.name === 'Comfort Double');
const familyQuad = nalaProperties[1].rooms.find(room => room.name === 'Family Quad');
assert.equal(nalaStartingPrice(villaDouble, '2026-11-01'), 106.8, 'exclude past low-season rates from advertised starting prices');
assert.equal(nalaStartingPrice(villaDouble, '2027-05-01'), null, 'do not advertise expired starting prices');
assert.equal(nalaPrice(villaDouble, nalaStay('2026-11-02', '2026-11-04')).total, 213.6);
assert.equal(nalaPrice(familyQuad, nalaStay('2026-11-02', '2026-11-04')).total, 441.6);
assert.equal(nalaPrice(villaDouble, nalaStay('2027-03-31', '2027-04-02')).total, 231.6, 'price each occupied night in its own season');
assert.equal(nalaPrice(villaDouble, nalaStay('2026-12-14', '2026-12-15')).total, 124.8, 'checkout day is not charged');
assert.equal(nalaStay('2026-12-14', '2026-12-16').status, 'quote');
assert.equal(nalaStay('2027-01-10', '2027-01-11').status, 'quote');
assert.equal(nalaStay('2027-01-11', '2027-01-12').status, 'priced');
assert.equal(nalaPrice(villaDouble, nalaStay('2027-04-30', '2027-05-01')).total, 106.8);
assert.equal(nalaPrice(villaDouble, nalaStay('2027-04-30', '2027-05-02')), null, 'do not invent rates beyond contract validity');
assert.equal(nalaStay('', '').status, 'unselected');
for (const [start, end] of [
  ['2027-02-29', '2027-03-02'], ['2027-02-30', '2027-03-02'],
  ['2027-03-02', '2027-03-02'], ['2027-03-03', '2027-03-02'],
  ['2027-03-02', ''], ['2027-03-01', '2027-04-15'],
]) assert.equal(nalaStay(start, end).status, 'invalid', `${start} to ${end} must be rejected`);
assert.equal(nalaStay('2027-03-01', '2027-04-14').dates.length, 44);
assert.equal(nalaToday(new Date('2026-11-01T19:30:00Z')), '2026-11-02', 'use Maldives business dates');

// Test the real request handler with a fixed business date and mocked email.
// These tests never send email or create supplier bookings.
let emails = [], deliveryStatus = 200;
process.env.RESEND_API_KEY = 'test-only-mail-key';
const route = load('app/api/nala-veli-request/route.ts', {
  '@/lib/nala-veli': { ...rates, nalaToday: () => '2026-11-01' },
}, async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  emails.push(JSON.parse(options.body));
  return Response.json({ id: 'mock-email' }, { status: deliveryStatus });
});

async function request(overrides = {}) {
  emails = [];
  const response = await route.POST(new Request('https://www.tripelor.com/api/nala-veli-request', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property: 'Nala Veli Villa', room: 'Comfort Double', start: '2026-11-02', end: '2026-11-04',
      name: 'Test Guest', email: 'guest@example.test', phone: '+9600000000', ...overrides,
    }),
  }));
  return { status: response.status, body: await response.json() };
}

(async () => {
  let result = await request({ total: 1, nightly: 1, to: 'untrusted@example.test' });
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'pending_supplier_confirmation');
  assert.equal(emails.length, 2);
  assert.deepEqual(emails[0].to, ['bookings@tripelor.com']);
  assert.deepEqual(emails[1].to, ['guest@example.test']);
  assert.match(emails[0].text, /USD 213\.60/);
  assert.match(emails[1].text, /NOT a confirmed booking/);
  assert.doesNotMatch(JSON.stringify(emails), /markup|wholesale|test-only-mail-key|untrusted@example/);

  result = await request({ start: '2026-12-14', end: '2026-12-16' });
  assert.equal(result.status, 200);
  assert.match(emails[0].text, /Quote on request/);
  for (const input of [
    { room: 'Family Quad' }, { property: 'Unknown property' },
    { start: '2020-11-01', end: '2020-11-03' },
    { start: '2027-02-30', end: '2027-03-02' },
  ]) {
    assert.equal((await request(input)).status, 400);
    assert.equal(emails.length, 0);
  }
  deliveryStatus = 500;
  assert.equal((await request()).status, 502);
  assert.equal(emails.length, 1, 'only acknowledge the customer after the admin request succeeds');
  console.log('Nala Veli seasonal pricing and booking-request tests passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
