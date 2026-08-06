import { createAdminClient } from '@/lib/supabase/server';
import { AddMerchantStringForm } from './AddMerchantStringForm';
import { MerchantStringRow } from './MerchantStringRow';

const APPROVAL_FLAG_THRESHOLD = 0.8;

export default async function MerchantStringsPage() {
  // merchant_strings has RLS enabled with no policies (admin-only data, see
  // migration 0015) — reading it needs the service-role client, same as the
  // audit log.
  const supabase = createAdminClient();

  const [{ data: merchantStrings, error }, { data: cafes }, { data: visits }] = await Promise.all([
    supabase.from('merchant_strings').select('id, raw_string, cafe_id, created_at, cafes(name)').order('created_at', { ascending: false }),
    supabase.from('cafes').select('id, name').order('name'),
    supabase.from('visits').select('cafe_id, status').in('status', ['approved', 'rejected']),
  ]);

  const cafeOptions = (cafes ?? []).map((c) => ({ id: c.id, name: c.name }));

  const unmatched = (merchantStrings ?? []).filter((m) => !m.cafe_id);
  const mapped = (merchantStrings ?? []).filter((m) => m.cafe_id);

  // §7 "per-café auto-approval rate" — there's no OCR pipeline auto-approving
  // anything yet (see the migration 0015 comment on merchant_strings), so
  // this is each café's real receipt-approval rate: approved ÷ (approved +
  // rejected), the honest number available today, computed straight from
  // visits rather than a fabricated OCR-confidence figure.
  const approvalByCafe = new Map<string, { approved: number; rejected: number }>();
  for (const v of visits ?? []) {
    const entry = approvalByCafe.get(v.cafe_id) ?? { approved: 0, rejected: 0 };
    if (v.status === 'approved') entry.approved++;
    else entry.rejected++;
    approvalByCafe.set(v.cafe_id, entry);
  }
  const approvalRows = cafeOptions
    .map((cafe) => {
      const counts = approvalByCafe.get(cafe.id);
      const total = counts ? counts.approved + counts.rejected : 0;
      const rate = total > 0 ? counts!.approved / total : null;
      return { cafe, approved: counts?.approved ?? 0, rejected: counts?.rejected ?? 0, total, rate };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => (a.rate ?? 1) - (b.rate ?? 1));

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Merchant strings</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Maps the merchant names that show up on receipts to the café they belong to — the lookup a future OCR step would read
          from. No OCR pipeline writes here yet, so entries are added by hand as they're spotted.
        </p>

        <AddMerchantStringForm cafes={cafeOptions} />

        {error ? <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load merchant strings: {error.message}</p> : null}

        <div className="label" style={{ margin: '28px 0 10px' }}>
          Unmatched — needs review ({unmatched.length})
        </div>
        {unmatched.length === 0 ? (
          <p style={{ color: 'var(--whisk)', fontSize: 14 }}>Nothing unmatched.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Raw string', 'Added', 'Map to café', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unmatched.map((m) => (
                  <MerchantStringRow key={m.id} id={m.id} rawString={m.raw_string} cafeId={m.cafe_id} createdAt={m.created_at} cafes={cafeOptions} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="label" style={{ margin: '28px 0 10px' }}>
          Mapped ({mapped.length})
        </div>
        {mapped.length === 0 ? (
          <p style={{ color: 'var(--whisk)', fontSize: 14 }}>No merchant strings mapped yet.</p>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Raw string', 'Café', 'Added', 'Reassign', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mapped.map((m) => (
                  <MerchantStringRow key={m.id} id={m.id} rawString={m.raw_string} cafeId={m.cafe_id} cafeName={m.cafes?.name} createdAt={m.created_at} cafes={cafeOptions} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="label" style={{ margin: '28px 0 10px' }}>
          Per-café approval rate
        </div>
        <p style={{ color: 'var(--whisk)', fontSize: 13, marginBottom: 10 }}>
          Approved ÷ (approved + rejected) receipts, café-side and admin backup review combined. Flagged below {Math.round(APPROVAL_FLAG_THRESHOLD * 100)}%. Cafés
          with no reviewed receipts yet aren&apos;t shown.
        </p>
        {approvalRows.length === 0 ? (
          <p style={{ color: 'var(--whisk)', fontSize: 14 }}>No reviewed receipts yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Café', 'Approved', 'Rejected', 'Rate', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvalRows.map((r) => {
                  const flagged = r.rate !== null && r.rate < APPROVAL_FLAG_THRESHOLD;
                  return (
                    <tr key={r.cafe.id}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontWeight: 600 }}>{r.cafe.name}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{r.approved}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{r.rejected}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontWeight: 600, color: flagged ? 'var(--error, #A8503F)' : 'var(--ink)' }}>
                        {Math.round((r.rate ?? 0) * 100)}%
                      </td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                        {flagged ? <span style={{ color: 'var(--error, #A8503F)', fontSize: 12.5 }}>⚠ Below {Math.round(APPROVAL_FLAG_THRESHOLD * 100)}%</span> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
