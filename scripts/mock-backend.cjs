// LOCAL TEST FIXTURE ONLY. No external services or emails; data lives in memory.
const http = require('node:http');
const fs = require('node:fs');
const ts = require('typescript');
const seedModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(require.resolve('../lib/legacy-property-import.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module', 'exports', code)(seedModule, seedModule.exports);
let rows = seedModule.exports.legacyPropertySeeds.map((seed, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  slug: seed.slug, status: 'published', updated_at: '2026-10-27T12:00:00.000Z',
  data: { ...seed.data, rooms: seed.data.rooms.map(room => ({ ...room, photos: ['/properties/dhoani-maldives-boutique/bedroom.webp'], bathroomPhotos: ['/properties/dhoani-maldives-boutique/bathroom-shower.webp'] })) },
}));
const calls = [];
function reply(res, data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); }
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4301');
  let text = ''; for await (const chunk of req) text += chunk;
  let body = {}; try { body = JSON.parse(text || '{}'); } catch { return reply(res, { error: 'Invalid JSON' }, 400); }
  calls.push({ method: req.method, path: url.pathname });
  if (url.pathname === '/__calls') return reply(res, calls);
  if (url.pathname === '/auth/v1/user') {
    const admin = req.headers.authorization === 'Bearer mock-admin';
    if (!admin && req.headers.authorization !== 'Bearer mock-member') return reply(res, { error: 'Local mock session required' }, 401);
    return reply(res, { id: admin ? 'mock-admin' : 'mock-member', email: admin ? 'admin@preview.invalid' : 'guest@preview.invalid', user_metadata: { full_name: admin ? 'Preview Admin' : 'Preview Guest' } });
  }
  if (url.pathname === '/rest/v1/managed_properties') {
    let selected = rows.filter(row => ['id', 'slug', 'status', 'updated_at'].every(key => !url.searchParams.has(key) || row[key] === url.searchParams.get(key).replace(/^eq\./, '')));
    if (req.method === 'PATCH') { selected.forEach(row => Object.assign(row, body)); }
    if (req.method === 'POST') {
      const row = { ...body, id: '00000000-0000-4000-8000-' + String(rows.length + 1).padStart(12, '0'), updated_at: new Date().toISOString() };
      rows.push(row); selected = [row];
    }
    return reply(res, selected);
  }
  if (url.pathname === '/rest/v1/rpc/check_room_availability') return reply(res, [{ available: true, rooms_left: 2, total_rooms: 2 }]);
  if (url.pathname === '/rest/v1/rpc/get_room_calendar') {
    const from = body.p_from || body.p_start_date;
    const to = body.p_to || body.p_end_date;
    const days = []; let date = from;
    while (date && date <= to && days.length < 370) { days.push({ day: date, available: true, rooms_left: 2 }); date = new Date(Date.parse(date) + 86400000).toISOString().slice(0, 10); }
    return reply(res, days);
  }
  if (url.pathname === '/rest/v1/property_inventory') return reply(res, [{ room_type: 'Standard Double Room', total_rooms: 2, active: true }]);
  if (url.pathname.startsWith('/rest/v1/rpc/')) return reply(res, { error: 'Mutation RPC disabled in local fixture' }, 403);
  if (url.pathname.startsWith('/rest/v1/')) return reply(res, []);
  return reply(res, { error: 'Unsupported fixture operation' }, 404);
}).listen(4301, '127.0.0.1', () => console.log('Synthetic in-memory backend on http://127.0.0.1:4301; accepts mock-member/mock-admin cookies only.'));