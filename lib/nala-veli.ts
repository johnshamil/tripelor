export type NalaRoom = { name: string; type: string; guests: number; rates: readonly [number, number, number] };
export type NalaProperty = { id: string; name: string; photos: readonly string[]; rooms: readonly NalaRoom[] };

// Customer selling prices in USD, with breakfast and accommodation taxes.
// Each tuple is ordered low, shoulder, high season.
export const nalaProperties: readonly NalaProperty[] = [
  { id: "villa", name: "Nala Veli Villa",
    photos: ["1BrzgnQ_5WEUwj5oqueAfDkv9wDTFGqMd", "18IMmFE8WvsapK1jDQXUhwpDHblL9XVQn", "1dxy-rLvtTyB3zrcna6Jtl9_pQDf7nA93"],
    rooms: [
      { name: "Comfort Single", type: "Comfort", guests: 1, rates: [67.2, 76.8, 94.8] },
      { name: "Comfort Double", type: "Comfort", guests: 2, rates: [97.2, 106.8, 124.8] },
      { name: "Deluxe Single", type: "Deluxe", guests: 1, rates: [79.2, 88.8, 106.8] },
      { name: "Deluxe Double", type: "Deluxe", guests: 2, rates: [109.2, 118.8, 136.8] },
    ],
  },
  { id: "beach-spa", name: "Nala Veli Beach & Spa",
    photos: ["1oVSytLgucV7eQDQHomw_Lv_scJVo7Wad", "1DQBJdJhmMRThL3LFBJG5yc4WSCDA86Aw", "1K-01WviXicU1VBLJ5eAU0xgYYwKjtkOT"],
    rooms: [
      { name: "Comfort Single", type: "Comfort", guests: 1, rates: [97.2, 106.8, 124.8] },
      { name: "Comfort Double", type: "Comfort", guests: 2, rates: [127.2, 136.8, 154.8] },
      { name: "Deluxe Single", type: "Deluxe", guests: 1, rates: [109.2, 118.8, 136.8] },
      { name: "Deluxe Double", type: "Deluxe", guests: 2, rates: [139.2, 148.8, 166.8] },
      { name: "Deluxe Triple", type: "Deluxe", guests: 3, rates: [169.2, 178.8, 196.8] },
      { name: "Family Single", type: "Family", guests: 1, rates: [121.2, 130.8, 148.8] },
      { name: "Family Double", type: "Family", guests: 2, rates: [151.2, 160.8, 178.8] },
      { name: "Family Triple", type: "Family", guests: 3, rates: [181.2, 190.8, 208.8] },
      { name: "Family Quad", type: "Family", guests: 4, rates: [211.2, 220.8, 238.8] },
    ],
  },
];

export const nalaPhoto = (id: string) => `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
export const nalaToday = (now = new Date()) => new Date(now.getTime() + 5 * 3600000).toISOString().slice(0, 10);
export const nalaMoney = (value: number) => `USD ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const nalaDefaultRoom = (property: NalaProperty) => property.rooms.find(room => room.name === "Comfort Double") || property.rooms[0];

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function season(value: string) {
  const month = Number(value.slice(5, 7)), day = Number(value.slice(8, 10));
  if ((month === 12 && day >= 15) || (month === 1 && day <= 10)) return -1;
  if (month === 12 || month <= 3) return 2;
  return [4, 8, 10, 11].includes(month) ? 1 : 0;
}

export function nalaStartingPrice(room: NalaRoom, today: string) {
  if (!validDate(today)) return null;
  let lowest: number | null = null;
  for (let time = Date.parse(today); time <= Date.parse("2027-04-30"); time += 86400000) {
    const index = season(new Date(time).toISOString().slice(0, 10));
    if (index === -1) continue;
    lowest = lowest === null ? room.rates[index] : Math.min(lowest, room.rates[index]);
  }
  return lowest;
}

export type NalaStay = { status: "unselected" | "invalid" | "quote" | "priced"; dates: string[] };

export function nalaStay(start: string, end: string): NalaStay {
  if (!start && !end) return { status: "unselected", dates: [] };
  if (!validDate(start) || !validDate(end) || end <= start) return { status: "invalid", dates: [] };
  const nights = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (nights < 1 || nights > 44) return { status: "invalid", dates: [] };
  const dates = Array.from({ length: nights }, (_, index) => new Date(Date.parse(start) + index * 86400000).toISOString().slice(0, 10));
  return { status: dates.some(date => date > "2027-04-30" || season(date) < 0) ? "quote" : "priced", dates };
}

export function nalaPrice(room: NalaRoom, stay: NalaStay) {
  if (stay.status !== "priced" || !stay.dates.length) return null;
  let cents = 0;
  for (const date of stay.dates) {
    const index = season(date);
    if (index === -1) return null;
    cents += Math.round(room.rates[index] * 100);
  }
  return { total: cents / 100, nightly: cents / stay.dates.length / 100 };
}
