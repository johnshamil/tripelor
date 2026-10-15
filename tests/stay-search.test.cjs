const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const cache = new Map();
function load(name) {
  const base = path.join(__dirname, "..", name.replace(/^@\//, ""));
  const filename = fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`;
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", code)(dependency => dependency.startsWith("@/") ? load(dependency) : require(dependency), module, module.exports);
  return module.exports;
}
const { cleanStaySearch, staySearchQuery, matchesIsland, bookingWithStaySearch } = load("@/lib/stay-search");
const PropertyCards = load("@/components/room-first-booking-cards").default;

test("island search handles accents and preserves a valid leap-day stay", () => {
  assert.equal(matchesIsland("Hulhumalé, Maldives", "Hulhumale"), true);
  assert.equal(matchesIsland("Felidhoo", "Hulhumale"), false);
  assert.deepEqual(cleanStaySearch({ island: "  Hulhumalé  ", checkIn: "2028-02-29", checkOut: "2028-03-03", guests: "3" }), { island: "Hulhumalé", checkIn: "2028-02-29", checkOut: "2028-03-03", guests: "3" });
});

test("invalid, reversed, partial and excessively long dates never reach booking", () => {
  for (const [checkIn, checkOut] of [["2027-02-29", "2027-03-03"], ["2026-12-10", "2026-12-10"], ["2026-12-11", "2026-12-10"], ["2026-12-10", ""], ["2026-12-10", "2027-12-12"], ["not-a-date", "2026-12-12"]]) {
    const search = cleanStaySearch({ checkIn, checkOut, guests: "100" });
    assert.equal(search.checkIn, ""); assert.equal(search.checkOut, ""); assert.equal(search.guests, "2");
  }
});

test("room and meal selection survive the homepage to booking handoff", () => {
  const search = staySearchQuery({ island: "Felidhoo", checkIn: "2026-12-10", checkOut: "2026-12-17", guests: "4" });
  const href = bookingWithStaySearch("/booking?property=Uhoo%27s+Lavish+Oasis&roomType=Deluxe+Double&mealPlan=Full+Board", search);
  const result = new URL(href, "https://tripelor.com").searchParams;
  assert.equal(result.get("property"), "Uhoo's Lavish Oasis");
  assert.equal(result.get("roomType"), "Deluxe Double");
  assert.equal(result.get("mealPlan"), "Full Board");
  assert.equal(result.get("checkIn"), "2026-12-10");
  assert.equal(result.get("checkOut"), "2026-12-17");
  assert.equal(result.get("adults"), "4");
  assert.equal(result.has("island"), false);
});

test("partner links and seasonal dates remain intact when no valid search dates exist", () => {
  const external = "https://partner.example/booking?checkIn=2026-12-01";
  assert.equal(bookingWithStaySearch(external, "checkIn=2026-12-10&checkOut=2026-12-17"), external);
  const href = "/booking?property=Stay&checkIn=2026-12-01";
  assert.equal(bookingWithStaySearch(href, ""), href);
  assert.equal(new URL(bookingWithStaySearch(href, "checkIn=bad&checkOut=bad"), "https://tripelor.com").searchParams.get("checkIn"), "2026-12-01");
});

test("rendered stay results filter the island and retain search values in real property links", () => {
  const html = renderToStaticMarkup(React.createElement(PropertyCards, { search: { island: "Hulhumale", checkIn: "2026-12-10", checkOut: "2026-12-17", guests: "3" } }));
  assert.match(html, /Rivethi Beach Hotel/);
  assert.doesNotMatch(html, /Uhoo&#x27;s Lavish Oasis/);
  assert.match(html, /href="\/stays\/rivethi-beach-hotel\?island=Hulhumale&amp;checkIn=2026-12-10&amp;checkOut=2026-12-17&amp;guests=3"/);
  const empty = renderToStaticMarkup(React.createElement(PropertyCards, { search: { island: "Unknown island" } }));
  assert.match(empty, /No stays match this island/);
  assert.match(empty, /href="\/stays"/);
});
