/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }] },
  async headers() {
    const privacyHeaders = [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'private, no-store' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    ];
    return [
      { source: '/partner-quote/:path*', headers: privacyHeaders },
      { source: '/api/partner-quote/:path*', headers: privacyHeaders },
    ];
  },
};
module.exports = nextConfig;
