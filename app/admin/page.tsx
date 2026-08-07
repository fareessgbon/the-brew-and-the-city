import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, expectedAdminToken } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';

// noindex — this route exists, its content shouldn't; nothing here links
// to it publicly either (see chat: deliberately not in SiteHeader nav).
export const metadata: Metadata = {
  title: 'Admin — Brew and the City',
  robots: { index: false, follow: false },
};

// Always fetch fresh — this is a founder checking real submissions, never
// a page worth statically caching.
export const dynamic = 'force-dynamic';

function formatAnswers(answers: Record<string, unknown>): string {
  return Object.entries(answers)
    .filter(([, v]) => v !== '' && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const expected = expectedAdminToken();
  const authed = expected != null && cookieStore.get(ADMIN_COOKIE_NAME)?.value === expected;

  if (!authed) {
    return <AdminLoginForm />;
  }

  const admin = createAdminClient();
  const [{ data: waitlist }, { data: surveys }] = await Promise.all([
    admin.from('waitlist').select('email, created_at').order('created_at', { ascending: false }),
    admin.from('survey_responses').select('id, survey, answers, created_at').order('created_at', { ascending: false }),
  ]);

  const cafeSurveys = (surveys ?? []).filter((s) => s.survey === 'cafe_partner');
  const consumerSurveys = (surveys ?? []).filter((s) => s.survey === 'consumer');

  return (
    <div className="wrap" style={{ padding: '48px 24px 96px', maxWidth: 900 }}>
      <div className="label eyebrow">Admin</div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Submissions</h1>
      <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 32 }}>
        {(waitlist ?? []).length} waitlist · {cafeSurveys.length} café survey · {consumerSurveys.length} consumer survey
      </p>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Café partner survey — {cafeSurveys.length}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {cafeSurveys.length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>None yet.</p> : null}
        {cafeSurveys.map((s) => (
          <div key={s.id} className="ratio-box" style={{ background: '#faf8f4' }}>
            <div style={{ fontSize: 12, color: 'var(--whisk)', marginBottom: 8 }}>
              {new Date(s.created_at).toLocaleString()}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, fontFamily: 'var(--font-sans)', margin: 0 }}>
              {formatAnswers(s.answers as Record<string, unknown>)}
            </pre>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Consumer survey — {consumerSurveys.length}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {consumerSurveys.length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>None yet.</p> : null}
        {consumerSurveys.map((s) => (
          <div key={s.id} className="ratio-box" style={{ background: '#faf8f4' }}>
            <div style={{ fontSize: 12, color: 'var(--whisk)', marginBottom: 8 }}>
              {new Date(s.created_at).toLocaleString()}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, fontFamily: 'var(--font-sans)', margin: 0 }}>
              {formatAnswers(s.answers as Record<string, unknown>)}
            </pre>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Waitlist — {(waitlist ?? []).length}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(waitlist ?? []).length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>None yet.</p> : null}
        {(waitlist ?? []).map((w) => (
          <div
            key={w.email}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              padding: '8px 0',
              borderBottom: '1px solid var(--whisk-10)',
            }}
          >
            <span>{w.email}</span>
            <span style={{ color: 'var(--whisk)' }}>{new Date(w.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
