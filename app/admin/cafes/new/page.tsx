import type { Metadata } from 'next';
import Link from 'next/link';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { CafeEditorForm } from '@/components/CafeEditorForm';
// From lib/, not '@/components/CafeEditorForm' — that file is 'use client',
// and spreading a value import from a client module in server code (as
// prefillFrom below does) silently drops every key but the ones named
// explicitly. See the comment on EMPTY_CAFE's real definition.
import { DIMS, EMPTY_CAFE, PRICE_BANDS, PRIMARY_DRINK_CATEGORIES, type CafeEditorValues, type Dim } from '@/lib/data/cafeFields';

export const metadata: Metadata = {
  title: 'Add a café — Brew and the City',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Reads the query params either survey bridge sets — cafeCreateHref()
// (name/area/contact only, from the café-partner survey) or
// cafeTasteVectorCreateHref() (the same, plus the actual seven scores,
// price band, and drink categories, from the taste-vector survey) — and
// layers them over the blank form. Nothing here is written until the
// founder actually saves — a survey answer becoming a catalogue fact
// without a human looking at it first is exactly the kind of "presenting
// unverified specifics as real" this build has otherwise been careful to
// avoid.
function prefillFrom(sp: Record<string, string | string[] | undefined>): { values: CafeEditorValues; fromSurvey: boolean } {
  const get = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const name = get('name');
  const neighbourhood = get('neighbourhood');
  const email = get('email');
  const instagram = get('instagram');
  const website = get('website');

  const scores: Partial<Record<Dim, number>> = {};
  for (const dim of DIMS) {
    const raw = get(dim);
    const n = raw ? Number(raw) : NaN;
    if (Number.isInteger(n) && n >= 0 && n <= 100) scores[dim] = n;
  }
  const priceBandParam = get('priceBand');
  const priceBand = PRICE_BANDS.includes(priceBandParam as never) ? priceBandParam : '';
  const drinksParam = get('drinks');
  const drinkCategories = drinksParam
    ? PRIMARY_DRINK_CATEGORIES.filter((c) => drinksParam.split(',').includes(c))
    : null;

  const fromSurvey = Boolean(name || neighbourhood || email || instagram || website || Object.keys(scores).length > 0);
  if (!fromSurvey) return { values: EMPTY_CAFE, fromSurvey: false };
  return {
    values: {
      ...EMPTY_CAFE,
      name,
      neighbourhood,
      contact_email: email,
      instagram_handle: instagram,
      website_url: website,
      price_band: priceBand || EMPTY_CAFE.price_band,
      drink_categories: drinkCategories ?? EMPTY_CAFE.drink_categories,
      scores: { ...EMPTY_CAFE.scores, ...scores },
    },
    fromSurvey: true,
  };
}

export default async function NewCafePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const sp = await searchParams;
  const { values: initial, fromSurvey } = prefillFrom(sp);

  const admin = createAdminClient();
  const { data: existing } = await admin.from('cafes').select('id, name, slug').eq('is_active', true);

  return (
    <div className="wrap admin-page">
      <div style={{ marginBottom: 24 }}>
        <div className="label eyebrow">
          <Link href="/admin/cafes" className="admin-card-link">
            Cafés
          </Link>{' '}
          / New
        </div>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Add a café</h1>
        <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
          Only the name is required. Everything else can be filled in later — a half-entered café is
          more useful than one you didn&apos;t start.
        </p>
        {fromSurvey ? (
          <p className="cafe-editor-warning" style={{ marginTop: 12 }}>
            Prefilled from a survey response — check every field (especially the sliders, if they came
            filled in) before saving. This isn&apos;t verified until you tick that box yourself.
          </p>
        ) : null}
      </div>
      <CafeEditorForm initial={initial} existingCafes={existing ?? []} />
    </div>
  );
}
