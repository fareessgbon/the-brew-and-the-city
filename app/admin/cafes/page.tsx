import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isCafeMatchReady } from '@/lib/cafeReadiness';
import { CsvUploadForm } from './CsvUploadForm';

export default async function AdminCafesPage() {
  const supabase = await createClient();
  const { data: cafes, error } = await supabase.from('cafes').select('*').order('name');

  const foundingCount = (cafes ?? []).filter((c) => c.partner_status === 'founding_partner').length;
  const featuredCount = (cafes ?? []).filter((c) => c.partner_status === 'featured').length;

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 30 }}>Cafés</h1>
          <Link href="/admin/cafes/new" className="btn btn-primary">
            + New café
          </Link>
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: 'var(--whisk)' }}>
          <span>
            Founding Partner: <strong style={{ color: 'var(--ink)' }}>{foundingCount}/15</strong>
          </span>
          <span>
            Featured: <strong style={{ color: 'var(--ink)' }}>{featuredCount}/8</strong>
          </span>
        </div>

        <CsvUploadForm />

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load cafés: {error.message}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="legal" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  {['Name', 'Slug', 'Neighbourhood', 'Status', 'Ready', 'Drink', 'Energy', 'Aesthetic', 'Pace', 'Adventure', 'Price', 'Food'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(cafes ?? []).map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                      <Link href={`/admin/cafes/${c.id}`}>{c.name}</Link>
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', color: 'var(--whisk)' }}>{c.slug}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.neighbourhood ?? '—'}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.partner_status}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
                      {isCafeMatchReady(c) ? <span style={{ color: 'var(--ceremony)' }}>✓</span> : <span style={{ color: 'var(--whisk)' }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.drink_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.energy_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.aesthetic_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.pace_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.adventure_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.price_score}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{c.food_score}</td>
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
