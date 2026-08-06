import { createAdminClient } from '@/lib/supabase/server';
import { ReviewVisitButtons } from './ReviewVisitButtons';
import { PurgeReceiptsButton } from './PurgeReceiptsButton';
import { ForceAddStampButton } from './ForceAddStampButton';

const REVIEW_WINDOW_HOURS = 72;

function reviewWindowLabel(createdAt: string): { label: string; overdue: boolean } {
  const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const hoursLeft = REVIEW_WINDOW_HOURS - hoursElapsed;
  if (hoursLeft <= 0) return { label: `Overdue by ${Math.round(-hoursLeft)}h`, overdue: true };
  return { label: `${Math.round(hoursLeft)}h left in ${REVIEW_WINDOW_HOURS}h window`, overdue: false };
}

export default async function AdminVisitsPage() {
  // visits' RLS policy is "auth.uid() = user_id" — a regular authenticated
  // client only ever sees the signed-in admin's own visits, never other
  // members'. This queue needs every café's pending receipts, so it reads
  // through the service-role client throughout, same as the audit log.
  const admin = createAdminClient();
  const { data: visits, error } = await admin
    .from('visits')
    .select('id, created_at, receipt_image_path, receipt_hash, auto_check_reason, cafes(name), users(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const { data: recentlyRejected } = await admin
    .from('visits')
    .select('id, created_at, reviewed_at, reviewed_by, receipt_image_path, cafes(name), users(name, email)')
    .eq('status', 'rejected')
    .order('reviewed_at', { ascending: false })
    .limit(20);

  async function withReceiptUrl<T extends { receipt_image_path: string | null }>(rows: T[]): Promise<(T & { receiptUrl: string | null })[]> {
    return Promise.all(
      rows.map(async (v) => {
        let receiptUrl: string | null = null;
        if (v.receipt_image_path) {
          const { data: signed } = await admin.storage.from('receipts').createSignedUrl(v.receipt_image_path, 600);
          receiptUrl = signed?.signedUrl ?? null;
        }
        return { ...v, receiptUrl };
      }),
    );
  }

  const visitsWithUrls = await withReceiptUrl(visits ?? []);
  const rejectedWithUrls = await withReceiptUrl(recentlyRejected ?? []);

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Receipts</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Backup review, every café — cafés with a portal PIN set up should mostly clear their own queue at /portal/[slug].
        </p>

        <PurgeReceiptsButton />

        <div className="label" style={{ margin: '20px 0 10px' }}>
          Pending ({visitsWithUrls.length})
        </div>
        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load visits: {error.message}</p>
        ) : visitsWithUrls.length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>Nothing pending.</p>
        ) : (
          visitsWithUrls.map((v) => {
            const window = reviewWindowLabel(v.created_at);
            return (
              <div key={v.id} className="match-result" style={{ marginBottom: 12 }}>
                <div className="body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{v.cafes?.name ?? 'Unknown café'}</div>
                      <div style={{ fontSize: 13 }}>{v.users?.name || v.users?.email || 'Unknown member'}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>{new Date(v.created_at).toLocaleString('en-CA')}</div>
                      <div style={{ fontSize: 12.5, marginTop: 4, color: window.overdue ? 'var(--error, #A8503F)' : 'var(--whisk)' }}>{window.label}</div>
                    </div>
                    {v.receiptUrl ? (
                      <a href={v.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>
                        View receipt →
                      </a>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
                    Automatic check: {v.auto_check_reason ?? 'passed — no OCR pipeline configured, review the image directly'}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <ReviewVisitButtons visitId={v.id} />
                    <ForceAddStampButton visitId={v.id} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="label" style={{ margin: '32px 0 10px' }}>
          Recently rejected — force-add available ({rejectedWithUrls.length})
        </div>
        {rejectedWithUrls.length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>Nothing recently rejected.</p>
        ) : (
          rejectedWithUrls.map((v) => (
            <div key={v.id} className="match-result" style={{ marginBottom: 12 }}>
              <div className="body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{v.cafes?.name ?? 'Unknown café'}</div>
                    <div style={{ fontSize: 13 }}>{v.users?.name || v.users?.email || 'Unknown member'}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>
                      Rejected {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString('en-CA') : '—'} by {v.reviewed_by ?? 'unknown'}
                    </div>
                  </div>
                  {v.receiptUrl ? (
                    <a href={v.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5 }}>
                      View receipt →
                    </a>
                  ) : null}
                </div>
                <div style={{ marginTop: 12 }}>
                  <ForceAddStampButton visitId={v.id} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
