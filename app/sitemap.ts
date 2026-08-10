import type { MetadataRoute } from 'next';
import { ROLES } from '@/lib/data/roles';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// The entire route set (§0.4/§12.1a) — no database query needed, since
// there's no dynamic content (no cafés, no accounts) at this stage. Role
// pages come from ROLES so a new posting doesn't need a second edit here;
// their /apply forms are deliberately left out (noindex — the posting is
// the page worth ranking, not its form).
const ROUTES = [
  '',
  '/for-cafes',
  '/make-brew-better',
  '/make-brew-better/cafe-partner-survey',
  '/make-brew-better/consumer-survey',
  '/careers',
  ...ROLES.map((role) => `/careers/${role.slug}`),
  '/privacy',
  '/terms',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
