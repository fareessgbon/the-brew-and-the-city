import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// /admin is PIN-gated and already carries its own page-level `noindex`
// (app/admin/page.tsx) — disallowing it here too means crawlers never even
// fetch it, belt-and-suspenders. /api isn't linked from anywhere a crawler
// would find it, but excluding it explicitly costs nothing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api', '/admin'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
