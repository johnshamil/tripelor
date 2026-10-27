const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(require.resolve('../lib/booking-draft.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module', 'exports', code)(mod, mod.exports);
const { encodeBookingDraft, decodeBookingDraft } = mod.exports;
const draft = { propertyName: 'Test Stay', roomType: 'Double', mealPlan: 'Full Board', checkIn: '2026-12-10', checkOut: '2026-12-17', adults: '2', children: '1', fullName: 'Guest', email: 'guest@preview.invalid', phone: '+960 0000000', specialRequests: 'Dietary request' };
test('account-scoped draft preserves selection and contact, never price/availability', () => {
  const raw = encodeBookingDraft({ ...draft, nightlyRate: 1, availability: true }, 'owner', 1000);
  assert.deepEqual(decodeBookingDraft(raw, 'owner', 2000), draft);
  assert.doesNotMatch(raw, /nightlyRate|availability/);
});
test('another account, corrupt storage, stale/future draft cannot restore', () => {
  const raw = encodeBookingDraft(draft, 'owner', 1000);
  for (const [value, owner, now] of [[raw, 'other', 2000], [raw, 'owner', 7201001], [raw, 'owner', 999], ['not-json', 'owner', 2000], [null, 'owner', 2000]]) assert.equal(decodeBookingDraft(value, owner, now), null);
});
test('invalid date/party data is rejected and oversized contact is bounded', () => {
  assert.equal(decodeBookingDraft(encodeBookingDraft({ ...draft, checkIn: '2027-02-29' }, 'owner', 1000), 'owner', 2000), null);
  assert.equal(decodeBookingDraft(encodeBookingDraft({ ...draft, adults: '0' }, 'owner', 1000), 'owner', 2000), null);
  assert.equal(decodeBookingDraft(encodeBookingDraft({ ...draft, specialRequests: 'a'.repeat(3000) }, 'owner', 1000), 'owner', 2000).specialRequests.length, 2000);
});