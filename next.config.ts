import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /help-shape-the-app became /make-brew-better. Permanent redirects, not a
  // clean break: the old path has been live and linked (Instagram bio, and
  // anything already shared), and a rename that 404s those is worse than the
  // rename is worth. 308 also tells search engines the move is permanent, so
  // whatever ranking the old URL had transfers instead of being dropped.
  //
  // Both survey sub-routes are listed explicitly rather than using a wildcard
  // — there are exactly two and they are unlikely to grow, and an explicit
  // list can't silently redirect a path that doesn't exist on the new side.
  // Baseline security headers on every route. Deliberately no
  // Content-Security-Policy: it needs a per-script audit and a wrong one
  // breaks the site, which is worse than leaving it out for now.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // www is the same site as the bare domain; send it there so there's
      // one address (and one set of search rankings), not two.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.brewandthecity.com' }],
        destination: 'https://brewandthecity.com/:path*',
        permanent: true,
      },
      {
        source: '/help-shape-the-app',
        destination: '/make-brew-better',
        permanent: true,
      },
      {
        source: '/help-shape-the-app/cafe-partner-survey',
        destination: '/make-brew-better/cafe-partner-survey',
        permanent: true,
      },
      {
        source: '/help-shape-the-app/consumer-survey',
        destination: '/make-brew-better/consumer-survey',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
