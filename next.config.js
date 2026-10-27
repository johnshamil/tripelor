
/** @type {import('next').NextConfig} */
const demo = process.env.TRIPELOR_MOCK_PREVIEW === '1';
if (process.env.VERCEL_PROJECT_ID === 'prj_ke59tHOwEsnoUWmwiQ8AoMxKWov4' && process.env.VERCEL_GIT_COMMIT_REF === 'improve/mobile-booking-20261027') {
  throw new Error('This preview branch must not build in the production-connected Tripelor project');
}
if (demo) {
  const forbidden = Object.keys(process.env).filter(key => /SUPABASE|RESEND|QUOTE_SIGNING|AVIATIONSTACK|CRON_SECRET/.test(key) && process.env[key] && process.env[key] !== 'demo-not-a-secret' && process.env[key] !== 'https://fixture.preview.invalid');
  if (forbidden.length) throw new Error('Demo refuses connected service credentials: ' + forbidden.join(', '));
  if (process.env.VERCEL_PROJECT_ID === 'prj_ke59tHOwEsnoUWmwiQ8AoMxKWov4') throw new Error('Demo cannot run in the production Tripelor project');
  process.env.SUPABASE_URL = 'https://fixture.preview.invalid';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'demo-not-a-secret';
  process.env.TRIPELOR_ADMIN_EMAIL = 'admin@preview.invalid';
}
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }], unoptimized: demo },
  env: demo ? { TRIPELOR_MOCK_PREVIEW: '1', SUPABASE_URL: 'https://fixture.preview.invalid', SUPABASE_SERVICE_ROLE_KEY: 'demo-not-a-secret', TRIPELOR_ADMIN_EMAIL: 'admin@preview.invalid' } : {},
  async headers() { return demo ? [{ source: '/:path*', headers: [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    { key: 'Content-Security-Policy', value: "connect-src 'self'; form-action 'self'; frame-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'" },
  ] }] : []; },
};
module.exports = nextConfig;
