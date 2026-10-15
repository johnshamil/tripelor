export type StaySearch = { island?: string; checkIn?: string; checkOut?: string; guests?: string };

function date(value = "") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : "";
}

export function cleanStaySearch(input: StaySearch): StaySearch {
  const checkIn = date(input.checkIn), checkOut = date(input.checkOut);
  const paired = checkIn && checkOut && checkOut > checkIn && (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 <= 365;
  const guests = Number(input.guests);
  return { island: String(input.island || "").trim().slice(0, 100), checkIn: paired ? checkIn : "", checkOut: paired ? checkOut : "", guests: Number.isInteger(guests) && guests >= 1 && guests <= 4 ? String(guests) : "2" };
}

export function staySearchQuery(input: StaySearch) {
  const cleaned = cleanStaySearch(input);
  return new URLSearchParams(Object.entries(cleaned).filter(([, value]) => Boolean(value)) as [string, string][]).toString();
}

export function matchesIsland(location: string, island = "") {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(new RegExp("[^\\p{L}\\p{N}]+", "gu"), " ").trim();
  return !island || normalize(location).includes(normalize(island));
}

export function bookingWithStaySearch(href: string, search: string) {
  if (!href.startsWith("/booking?") || !search) return href;
  const query = new URLSearchParams(search);
  const input = cleanStaySearch({ checkIn: query.get("checkIn") || "", checkOut: query.get("checkOut") || "", guests: query.get("guests") || "" });
  const target = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  if (input.checkIn && input.checkOut) { target.set("checkIn", input.checkIn); target.set("checkOut", input.checkOut); }
  if (query.has("guests")) target.set("adults", input.guests || "2");
  return `/booking?${target}`;
}
