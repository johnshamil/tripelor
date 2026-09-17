const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function moduleFor(path, deps = {}) {
  const js = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', js)(name => {
    if (name in deps) return deps[name];
    throw Error(`Unexpected dependency: ${name}`);
  }, module, module.exports);
  return module.exports;
}
const cart = moduleFor('lib/trip-cart.ts', {
  './island-packages': moduleFor('lib/island-packages.ts'),
  './vaavu-blue-escape': moduleFor('lib/vaavu-blue-escape.ts'),
  './vaavu-excursions': moduleFor('lib/vaavu-excursions.ts'),
});
const plan = moduleFor('lib/trip-itinerary.ts', { './trip-cart': cart });
const inclusions = moduleFor('lib/trip-inclusions.ts', { './trip-cart': cart });
const line = (productId, date = '', quantity = 1) => ({ productId, date, quantity });
const reef = 'stay:reef-relax-escape:3';
const ocean = 'stay:ocean-discovery-escape:5';
const fishing = 'excursion:night-fishing';
const blue = 'package:vaavu-blue-escape';
const snorkel = 'excursion:two-point-snorkeling';

// Keep a chosen Day 1 stable even when the earliest activity moves to a later day.
assert.equal(plan.resolveTripStart([line(fishing, '2092-03-02')], '2092-02-27'), '2092-02-27');
assert.equal(plan.tripDay('2092-02-27', '2092-03-02'), 5);
assert.equal(plan.tripDayDate('2092-02-27', 3), '2092-02-29');
assert.equal(plan.tripDayDate('2091-12-31', 2), '2092-01-01');
assert.equal(plan.tripDayDate('2092-02-27', 0), '');
assert.equal(plan.tripDayDate('2092-02-27', 2.5), '');
assert.equal(plan.tripDayDate('9998-12-31', 2), '');
assert.equal(plan.resolveTripStart([line(reef, '2092-03-01')], 'corrupt'), '2092-03-01');
assert.equal(plan.resolveTripStart([line(reef, '2092-03-01')], '2092-03-05'), '2092-03-01');

// Moving the start preserves day offsets, quantities and unscheduled choices.
const original = [line(fishing, '2092-03-01', 2), line(reef, '2092-02-27'), line(blue)];
const saved = JSON.stringify(original);
const shifted = plan.shiftTripDates(original, '2092-02-27', '2092-12-30');
assert.deepEqual(shifted.map(item => item.date), ['2093-01-02', '2092-12-30', '']);
assert.equal(shifted[0].quantity, 2);
assert.equal(JSON.stringify(original), saved);
assert.throws(() => plan.shiftTripDates(original, '2092-02-27', '9998-12-31'));
assert.throws(() => plan.shiftTripDates(original, '2092-02-27', '2092-02-30'));
const allDated = [line(blue, '2092-03-01', 2), line(fishing, '2092-03-02', 2), line(reef, '2092-03-01')];
assert.equal(cart.quoteCart(allDated).total, 780);
assert.equal(cart.quoteCart(plan.shiftTripDates(allDated, '2092-03-01', '2092-04-05')).total, 780);

// Three nights means check-in, two continuation days, then check-out on Day 4.
const calendar = plan.buildItinerary(original, '2092-02-27');
assert.deepEqual(calendar.days.map(day => [day.day, day.date]), [[1, '2092-02-27'], [2, '2092-02-28'], [3, '2092-02-29'], [4, '2092-03-01']]);
assert.equal(calendar.days[0].lines[0].productId, reef);
assert.equal(calendar.days[1].stays[0].checkout, false);
assert.equal(calendar.days[3].stays[0].checkout, true);
assert.equal(calendar.days[3].lines[0].productId, fishing);
assert.equal(calendar.unscheduled[0].productId, blue);
assert.equal(calendar.days.flatMap(day => day.lines).length, 2); // Continuations never create extra priced lines.
assert.equal(plan.buildItinerary([line(fishing, '9998-12-31')], '2092-02-27').days.length, 2); // Sparse dates cannot allocate millions of day cards.
assert.equal(plan.buildItinerary([line(fishing)]).days.length, 0);

// Reminders name overlapping activity categories, never mark the whole excursion as free.
assert.deepEqual(inclusions.findInclusionOverlaps(snorkel, [line(reef)])[0].activities, ['snorkeling']);
assert.equal(inclusions.findInclusionOverlaps(fishing, [line(reef)]).length, 0);
assert.deepEqual(inclusions.findInclusionOverlaps(fishing, [line(ocean)])[0].activities, ['night fishing']);
assert.equal(inclusions.findInclusionOverlaps(fishing, [line(fishing)]).length, 0);
assert.equal(inclusions.findInclusionOverlaps('unknown', [line(reef)]).length, 0);
assert.equal(inclusions.findInclusionOverlaps(reef, [line(reef)]).length, 0);
assert.equal(inclusions.findInclusionOverlaps(snorkel, [line(reef, '2092-03-01'), line(snorkel, '2092-03-05')]).length, 0);
assert.equal(inclusions.findInclusionOverlaps(snorkel, [line(reef, '2092-03-01'), line(snorkel, '2092-03-04')]).length, 1);
assert.equal(inclusions.findInclusionOverlaps(snorkel, [line(blue, '2092-03-01'), line(snorkel, '2092-03-02')]).length, 0);
assert.equal(inclusions.findInclusionOverlaps(snorkel, [line(reef, '', 0)]).length, 0);
assert.equal(cart.quoteCart(allDated).total, 780);
console.log('PASS: trip day numbering, leap/year changes, stable Day 1, date shifting, undated selections, stay continuation/check-out, bounded calendars, unchanged pricing, and inclusion reminders with self/date/category exclusions.');
