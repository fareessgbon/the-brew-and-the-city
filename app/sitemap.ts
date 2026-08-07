import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Static marketing/content pages worth listing — deliberately excludes
// transactional pages (login/signup/forgot-password/reset-password) and
// account-only pages (today/rewards/saved/profile/onboarding), which are
// crawlable (not blocked in robots.ts) but not the kind of page a sitemap
// should proactively surface.
const STATIC_ROUTES = ['', '/how-it-works', '/for-cafes', '/partners', '/discover', '/map', '/privacy', '/terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: cafes } = await supabase.from('cafes').select('slug, updated_at').order('slug');

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const cafeEntries: MetadataRoute.Sitemap = (cafes ?? []).map((cafe) => ({
    url: `${siteUrl}/cafes/${cafe.slug}`,
    lastModified: cafe.updated_at,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...cafeEntries];
}
