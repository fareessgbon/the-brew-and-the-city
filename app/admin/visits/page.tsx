import type { Metadata } from 'next';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminVisitActions } from '@/components/AdminVisitActions';
import { RECEIPT_BUCKET } from '@/lib/visits/receipt';
import { Timestamp } from '@/lib/format/relativeTime';

export const metadata: Metadata = {
  title: 'City Card receipts — Brew and the City',
  robots: { index: false, follow: false },
};

// noindex, not in SiteHeader nav — same posture as every other /admin
// page (see app/admin/cafes/page.tsx).
export const dynamic = 'force-dynamic';

// The City Card's receipt review queue. Every row here has status
// 'pending' — /api/visits (the only insert path, per migration 0020) never
// writes anything else. Approving/rejecting moves a row off this list;
// there's no "approved"/"rejected" tab because there's nothing left here
// to action once it's left pending.
export default async function AdminVisitsPage() {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const admin = createAdminClient();

  const { data: visits } = await admin
    .from('visits')
    .select('id, user_id, cafe_id, receipt_image_path, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const rows = visits ?? [];

  const [cafeIds, userIds] = [
    Array.from(new Set(rows.map((v) => v.cafe_id))),
    Array.from(new Set(rows.map((v) => v.user_id))),
  ];

  const [{ data: cafes }, { data: users }] = await Promise.all([
    cafeIds.length ? admin.from('cafes').select('id, name').in('id', cafeIds) : Promise.resolve({ data: [] }),
    userIds.length ? admin.from('users').select('id, email').in('id', userIds) : Promise.resolve({ data: [] }),
  ]);

  const cafeNames = new Map((cafes ?? []).map((c) => [c.id, c.name]));
  const userEmails = new Map((users ?? []).map((u) => [u.id, u.email]));

  // Private bucket (migration 0008) — mint a short-lived signed URL per
  // receipt at render time, same pattern as the résumé admin page.
  const receiptUrls = new Map<string, string>();
  await Promise.all(
    rows.map(async (v) => {
      if (!v.receipt_image_path) return;
      const { data } = await admin.storage.from(RECEIPT_BUCKET).createSignedUrl(v.receipt_image_path, 3600);
      if (data?.signedUrl) receiptUrls.set(v.id, data.signedUrl);
    }),
  );

  return (
    <div className="wrap admin-page">
      <div className="admin-bar" style={{ marginBottom: 28 }}>
        <div className="label eyebrow">Admin</div>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>City Card receipts</h1>
        <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
          {rows.length === 0 ? 'Nothing waiting.' : `${rows.length} ${rows.length === 1 ? 'receipt needs' : 'receipts need'} a look.`}
        </p>
      </div>

      {rows.length === 0 ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((v) => (
            <div
              key={v.id}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                background: 'var(--porcelain)',
                border: '1px solid var(--paper-2)',
                borderRadius: 12,
                padding: '14px 18px',
                flexWrap: 'wrap',
              }}
            >
              {receiptUrls.has(v.id) ? (
                <a href={receiptUrls.get(v.id)} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a short-lived signed URL, not something next/image should cache/optimize. */}
                  <img
                    src={receiptUrls.get(v.id)}
                    alt="Receipt"
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--paper-2)' }}
                  />
                </a>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--whisk)' }}>No photo</span>
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600 }}>{cafeNames.get(v.cafe_id) ?? 'Unknown café'}</div>
                <div style={{ fontSize: 13, color: 'var(--whisk)' }}>
                  {userEmails.get(v.user_id) ?? 'Unknown member'} · <Timestamp iso={v.created_at} />
                </div>
              </div>
              <AdminVisitActions id={v.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
