import { notFound } from 'next/navigation';
import { after } from 'next/server';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SaveCafeButton } from '@/components/SaveCafeButton';
import { NotItButton } from '@/components/NotItButton';
import { TrackedDirectionsLink } from '@/components/TrackedDirectionsLink';
import { ReceiptUploadForm } from '@/components/ReceiptUploadForm';
import { createClient } from '@/lib/supabase/server';
import { scoreCafeForProfile } from '@/lib/server/getMatchesForUser';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { DIMS } from '@/lib/matching';
import { isOpenNow, type OpeningHours } from '@/lib/cafeHours';

export default async function CafeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: cafe } = await supabase.from('cafes').select('*').eq('slug', slug).maybeSingle();
  if (!cafe) notFound();

  const [{ data: menuItems }, { data: rewardItems }] = await Promise.all([
    supabase.from('menu_items').select('*').eq('cafe_id', cafe.id).order('created_at'),
    supabase.from('reward_items').select('*').eq('cafe_id', cafe.id).eq('is_available', true).order('created_at'),
  ]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let pct: number | null = null;
  let reason: string | null = null;
  let saved = false;

  if (user) {
    const [{ data: savedRow }, { data: profile }] = await Promise.all([
      supabase.from('saved_cafes').select('id').eq('user_id', user.id).eq('cafe_id', cafe.id).maybeSingle(),
      supabase.from('taste_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    saved = !!savedRow;
    if (profile) {
      const { match } = scoreCafeForProfile(profile, cafe);
      pct = match.totalScore;
      reason = match.reasons[0] ?? null;
    }
  }

  const open = isOpenNow(cafe.opening_hours as OpeningHours | null);
  const directionsQuery = encodeURIComponent(cafe.address || `${cafe.name}, Calgary, AB`);

  // Fires after the response is sent — analytics shouldn't add latency to
  // the page the visitor is actually waiting on.
  after(() => trackServerEvent('cafe_profile_opened', user?.id ?? null, { cafeId: cafe.id, slug }));

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '56px 0' }}>
        <div className="wrap" style={{ maxWidth: 640 }}>
          <div className="label eyebrow">{cafe.neighbourhood ?? 'Calgary'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <h1 style={{ fontSize: 34 }}>{cafe.name}</h1>
            {pct !== null ? <span className="pct" style={{ fontSize: 16, padding: '4px 14px' }}>{pct}% match</span> : null}
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 14, color: 'var(--whisk)', marginBottom: 16 }}>
            {open !== null ? <span>{open ? 'Open now' : 'Closed'}</span> : <span>Hours not listed yet</span>}
            {cafe.address ? <span>{cafe.address}</span> : null}
            <span style={{ textTransform: 'capitalize' }}>{cafe.partner_status.replace('_', ' ')}</span>
          </div>

          {reason ? <p style={{ fontSize: 16, marginBottom: 20 }}>{reason}</p> : null}

          <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
            <SaveCafeButton cafeId={cafe.id} initiallySaved={saved} signedIn={!!user} />
            <TrackedDirectionsLink
              cafeId={cafe.id}
              href={`https://www.google.com/maps/dir/?api=1&destination=${directionsQuery}`}
              className="btn btn-primary"
            />
            <NotItButton cafeId={cafe.id} signedIn={!!user} />
          </div>

          {cafe.partner_status !== 'listed' && rewardItems && rewardItems.length > 0 ? (
            <div style={{ marginBottom: 32 }}>
              <div className="label" style={{ marginBottom: 10 }}>
                This month&apos;s City Card rewards
              </div>
              <div className="ratio-box">
                <p style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 10 }}>
                  Five visits unlocks one of these, free, on your City Card.
                </p>
                {rewardItems.map((item) => (
                  <div key={item.id} className="ratio-row">
                    <span>{item.name}</span>
                    {item.price_cents != null ? <span style={{ color: 'var(--whisk)' }}>Regularly ${(item.price_cents / 100).toFixed(2)}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {user && cafe.partner_status !== 'listed' ? (
            <div style={{ marginBottom: 32 }}>
              <ReceiptUploadForm cafeId={cafe.id} cafeName={cafe.name} />
            </div>
          ) : null}

          <div className="label" style={{ marginBottom: 10 }}>
            Taste vector
          </div>
          <div className="ratio-box" style={{ marginBottom: 32 }}>
            {DIMS.map((dim) => (
              <div className="ratio-row" key={dim}>
                <span style={{ textTransform: 'capitalize' }}>{dim}</span>
                <span>{cafe[`${dim}_score` as `${typeof dim}_score`]}</span>
              </div>
            ))}
          </div>

          {menuItems && menuItems.length > 0 ? (
            <>
              <div className="label" style={{ marginBottom: 10 }}>
                Menu
              </div>
              {menuItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--paper-2)' }}>
                  <div>
                    <strong>{item.name}</strong>
                    {item.description ? <div style={{ fontSize: 13, color: 'var(--ink)' }}>{item.description}</div> : null}
                  </div>
                  {item.price_cents != null ? <span style={{ color: 'var(--whisk)' }}>${(item.price_cents / 100).toFixed(2)}</span> : null}
                </div>
              ))}
            </>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
