const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const cache = new Map();
function load(name) {
  const base = path.join(__dirname, '..', name.replace(/^@\//, ''));
  const file = fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx';
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', code)(dep => dep.startsWith('@/') ? load(dep) : require(dep), mod, mod.exports);
  return mod.exports;
}
test('results search renders editable dates, island and party from the query', () => {
  const HomeSearch = load('@/components/home-search').default;
  const html = renderToStaticMarkup(React.createElement(HomeSearch, { islands: ['Felidhoo'], locale: 'en', today: '2026-10-27', staysOnly: true, initialSearch: { island: 'Felidhoo', checkIn: '2026-12-10', checkOut: '2026-12-17', guests: '3' } }));
  assert.match(html, /action="\/stays"/); assert.match(html, /value="2026-12-10"/); assert.match(html, /value="2026-12-17"/);
  assert.match(html, /value="3" selected=""/); assert.doesNotMatch(html, /aria-labelledby="search-tab-stays"/);
});
test('card reference rate includes seasonal prices like the property page', () => {
  const Cards = load('@/components/room-first-booking-cards').default;
  const html = renderToStaticMarkup(React.createElement(Cards, { managedProperties: [{ slug: 'fixture-stay', name: 'Fixture Stay', island: 'Test Island', description: 'Synthetic', photos: [], rooms: [{ sellingRate: 120 }], seasonalRates: [{ sellingRate: 80 }] }], search: { island: 'Test Island' } }));
  assert.match(html, /USD 80/); assert.doesNotMatch(html, /USD 120/); assert.match(html, /Reference rate/);
});
test('homepage promotion never automatically opens and only explicit details opens it', () => {
  const code = fs.readFileSync(path.join(__dirname, '../components/home-referral-rewards.tsx'), 'utf8');
  assert.doesNotMatch(code, /setTimeout/); assert.match(code, /onClick=\{\(\) => setOpen\(true\)\}/);
});