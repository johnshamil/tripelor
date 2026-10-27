// Isolated local preview of the EXISTING Next.js project. Never use on Vercel.
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const root = path.join(__dirname, '..');
if (process.env.VERCEL) throw new Error('The mocked preview is local-only.');
if (fs.readdirSync(root).some(file => /^\.env(?:\.|$)/.test(file))) throw new Error('Move real .env files out of this clone before running the local mock preview.');
const env = { ...process.env };
for (const name of Object.keys(env)) if (/SUPABASE|RESEND|QUOTE_SIGNING|AVIATIONSTACK|TRIPELOR_ADMIN|CRON_SECRET/.test(name)) delete env[name];
Object.assign(env, { SUPABASE_URL: 'http://127.0.0.1:4301', SUPABASE_SERVICE_ROLE_KEY: 'local-fixture-not-a-secret', TRIPELOR_ADMIN_EMAIL: 'admin@preview.invalid', NEXT_TELEMETRY_DISABLED: '1' });
const backend = spawn(process.execPath, [path.join(__dirname, 'mock-backend.cjs')], { cwd: root, env, stdio: 'inherit' });
const web = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '-p', '4300', '-H', '127.0.0.1'], { cwd: root, env, stdio: 'inherit' });
function stop() { backend.kill(); web.kill(); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
backend.on('exit', () => web.kill()); web.on('exit', () => backend.kill());
console.log('LOCAL MOCK ONLY: http://localhost:4300. Production integrations disabled. Admin: set tripelor_access=mock-admin in your local browser cookies. No passwords are needed.');