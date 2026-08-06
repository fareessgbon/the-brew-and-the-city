import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { foundingPartnerStatusLine } from '@/lib/partners';

function formatPrice(cents: number | null): string {
  return cents == null ? '—' : `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminPartnersPage() {
  const supabase = createAdminClient();
  const { data: cafes, error } = await supabase
    .from('cafes')
    .select(
      'id, name, slug, partner_status, partner_lifecycle_status, founding_partner_started_at, contract_start_date, contract_end_date, monthly_price_cents, monthly_redemption_cap, primary_contact_name, stamps_enabled, rewards_enabled',
    )
    .neq('partner_status', 'listed')
    .order('name');

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Partner administration</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Contract terms and lifecycle status for every partnered, featured, or Founding Partner café. Tier itself (and stamp/reward
          participation) is edited on the café&apos;s own page — this is the business side.
        </p>

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load partners: {error.message}</p>
        ) : (cafes ?? []).length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>No partnered cafés yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Café', 'Tier', 'Lifecycle', 'Founding period', 'Monthly price', 'Redemption cap', 'Contact', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cafes ?? []).map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.partner_status}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', textTransform: 'capitalize' }}>{c.partner_lifecycle_status}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontSize: 12.5, color: 'var(--whisk)', maxWidth: 220 }}>
                      {c.partner_status === 'founding_partner' && c.founding_partner_started_at ? foundingPartnerStatusLine(c.founding_partner_started_at) : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{formatPrice(c.monthly_price_cents)}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.monthly_redemption_cap}/mo</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.primary_contact_name ?? '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                      <Link href={`/admin/partners/${c.id}`}>Edit →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
