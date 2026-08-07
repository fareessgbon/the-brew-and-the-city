import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// /admin and /portal are gated by real auth anyway (requireAdmin / the
// portal PIN session — see lib/admin.ts and lib/portalSession.ts), so this
// isn't the access-control boundary; it just keeps search engines from
// wasting crawl budget on pages that could never rank and shouldn't appear
// in search results. /api isn't linked from anywhere a crawler would find
// it, but excluding it explicitly costs nothing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/portal', '/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
