import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { CafeEditorForm } from '@/components/CafeEditorForm';
import { CAFE_COLUMNS, DAYS, DIMS, PRIMARY_DRINK_CATEGORIES, type CafeEditorValues, type City, type Day, type Dim, type OpeningHours } from '@/lib/data/cafeFields';

export const metadata: Metadata = {
  title: 'Edit café — Brew and the City',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Numbers and jsonb come back from Postgres in their own shapes; the form
// is a form, so every field it holds is a string. Converting here rather
// than inside the client component keeps the editor's state one flat type.
function toFormString(value: unknown): string {
  return value == null ? '' : String(value);
}

// jsonb will hand back whatever was written to it, including by the full
// product's own tooling — so each day is checked, not trusted, and a day
// in an unreadable shape is dropped rather than crashing the editor.
function toOpeningHours(value: unknown): OpeningHours {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const hours: OpeningHours = {};
  for (const day of DAYS) {
    const pair = raw[day];
    if (Array.isArray(pair) && pair.length === 2 && pair.every((t) => typeof t === 'string')) {
      hours[day as Day] = [pair[0] as string, pair[1] as string];
    }
  }
  return hours;
}

export default async function EditCafePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const { id } = await params;
  const admin = createAdminClient();
  const [{ data: cafe }, { data: existing }] = await Promise.all([
    admin.from('cafes').select(CAFE_COLUMNS).eq('id', id).maybeSingle(),
    admin.from('cafes').select('id, name, slug').eq('is_active', true),
  ]);

  if (!cafe) notFound();

  const initial: CafeEditorValues = {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    // The check constraint guarantees this is 'calgary' | 'toronto' — the
    // hand-maintained Supabase Row type only knows it's a string (see
    // lib/supabase/types.ts), same as partner_status/price_band elsewhere
    // on this table.
    city: cafe.city as City,
    neighbourhood: toFormString(cafe.neighbourhood),
    address: toFormString(cafe.address),
    latitude: toFormString(cafe.latitude),
    longitude: toFormString(cafe.longitude),
    website_url: toFormString(cafe.website_url),
    instagram_handle: toFormString(cafe.instagram_handle),
    contact_email: toFormString(cafe.contact_email),
    contact_phone: toFormString(cafe.contact_phone),
    price_band: toFormString(cafe.price_band),
    drink_categories: Array.isArray(cafe.drink_categories)
      ? PRIMARY_DRINK_CATEGORIES.filter((c) => (cafe.drink_categories as string[]).includes(c))
      : [...PRIMARY_DRINK_CATEGORIES],
    opening_hours: toOpeningHours(cafe.opening_hours),
    partner_status: cafe.partner_status,
    verified: cafe.verified_at !== null,
    scores: DIMS.reduce(
      (acc, d) => ({ ...acc, [d]: (cafe as unknown as Record<string, number>)[`${d}_score`] ?? 50 }),
      {} as Record<Dim, number>,
    ),
  };

  return (
    <div className="wrap admin-page">
      <div style={{ marginBottom: 24 }}>
        <div className="label eyebrow">
          <Link href="/admin/cafes" className="admin-card-link">
            Cafés
          </Link>{' '}
          / {cafe.name}
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>{cafe.name}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
          {cafe.verified_at
            ? `Verified in person on ${new Date(cafe.verified_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.`
            : 'Not yet verified in person — the homepage still calls this sample data.'}
        </p>
      </div>
      <CafeEditorForm initial={initial} cafeId={cafe.id} existingCafes={existing ?? []} />
    </div>
  );
}
