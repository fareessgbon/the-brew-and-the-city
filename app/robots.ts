import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// No /admin, no /portal at this stage — nothing to hide from crawlers.
// /api isn't linked from anywhere a crawler would find it, but excluding it
// explicitly costs nothing.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
