import { createAdminClient } from '@/lib/supabase/server';
import { MarkPaidButton } from './MarkPaidButton';

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function ReimbursementsPage() {
  const supabase = createAdminClient();

  const [{ data: rewards, error }, { data: cafes }, { data: payments }] = await Promise.all([
    supabase
      .from('rewards')
      .select('id, redeemed_at, redeemed_at_cafe_id, reward_item_id, reward_items(name, reimbursement_cents, cafe_id)')
      .eq('status', 'redeemed')
      .not('reward_item_id', 'is', null)
      .order('redeemed_at', { ascending: false }),
    supabase.from('cafes').select('id, name'),
    supabase.from('reimbursement_payments').select('reward_id, paid_at'),
  ]);

  const cafeNames = new Map((cafes ?? []).map((c) => [c.id, c.name]));
  const paidByReward = new Map((payments ?? []).map((p) => [p.reward_id, p.paid_at]));

  const records = (rewards ?? [])
    .filter((r) => r.reward_items)
    .map((r) => {
      const cafeId = r.redeemed_at_cafe_id ?? r.reward_items!.cafe_id;
      return {
        rewardId: r.id,
        redeemedAt: r.redeemed_at,
        cafeId,
        cafeName: cafeNames.get(cafeId) ?? 'Unknown café',
        itemName: r.reward_items!.name,
        amountCents: r.reward_items!.reimbursement_cents,
        paidAt: paidByReward.get(r.id) ?? null,
      };
    });

  const byCafe = new Map<string, typeof records>();
  for (const rec of records) {
    const list = byCafe.get(rec.cafeId) ?? [];
    list.push(rec);
    byCafe.set(rec.cafeId, list);
  }
  const cafeGroups = Array.from(byCafe.entries())
    .map(([cafeId, list]) => ({
      cafeId,
      cafeName: list[0].cafeName,
      records: list,
      totalOwedCents: list.filter((r) => !r.paidAt).reduce((sum, r) => sum + r.amountCents, 0),
    }))
    .sort((a, b) => b.totalOwedCents - a.totalOwedCents);

  const grandTotalOwedCents = cafeGroups.reduce((sum, g) => sum + g.totalOwedCents, 0);

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 30 }}>Reimbursements</h1>
          <a href="/api/admin/reimbursements/export" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>
            Export CSV
          </a>
        </div>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 8 }}>
          Every redeemed reward, grouped by café — what each café is owed for items members redeemed with their City Card.
        </p>
        <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 24 }}>Total outstanding: {formatCents(grandTotalOwedCents)}</p>

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load reimbursements: {error.message}</p>
        ) : cafeGroups.length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>No redemptions yet.</p>
        ) : (
          cafeGroups.map((group) => (
            <div key={group.cafeId} className="ratio-box" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{group.cafeName}</div>
                <div style={{ fontSize: 14 }}>
                  Owed: <strong>{formatCents(group.totalOwedCents)}</strong>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                  <thead>
                    <tr>
                      {['Item', 'Amount', 'Redeemed', 'Status', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.records.map((r) => (
                      <tr key={r.rewardId}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>{r.itemName}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>{formatCents(r.amountCents)}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)', color: 'var(--whisk)' }}>
                          {r.redeemedAt ? new Date(r.redeemedAt).toLocaleDateString('en-CA') : '—'}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>
                          {r.paidAt ? `Paid ${new Date(r.paidAt).toLocaleDateString('en-CA')}` : <span style={{ color: 'var(--error, #A8503F)' }}>Owed</span>}
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>{!r.paidAt ? <MarkPaidButton rewardId={r.rewardId} /> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
