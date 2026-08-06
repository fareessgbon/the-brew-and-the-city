import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// The entire route set (§0.4/§12.1a) — no database query needed, since
// there's no dynamic content (no cafés, no accounts) at this stage.
const ROUTES = ['', '/for-cafes', '/help-shape-the-app', '/help-shape-the-app/cafe-partner-survey', '/help-shape-the-app/consumer-survey', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
