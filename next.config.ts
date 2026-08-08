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
  async redirects() {
    return [
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
