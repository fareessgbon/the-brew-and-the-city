import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, expectedAdminToken } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminSurveyStatus } from '@/components/AdminSurveyStatus';
import { AdminDeleteButton } from '@/components/AdminDeleteButton';
import type { SurveyStatus } from '@/lib/supabase/types';

// noindex — this route exists, its content shouldn't; nothing here links
// to it publicly either (see chat: deliberately not in SiteHeader nav).
export const metadata: Metadata = {
  title: 'Admin — Brew and the City',
  robots: { index: false, follow: false },
};

// Always fetch fresh — this is a founder checking real submissions, never
// a page worth statically caching.
export const dynamic = 'force-dynamic';

// Open items float to the top of the café-partner queue — that's the one
// list this page is meant to be worked, not just read.
const STATUS_ORDER: Record<SurveyStatus, number> = { new: 0, contacted: 1, selected: 2, declined: 3 };

// §3.0: "the first 15 approved cafés" — 'selected' status is the proxy for
// a filled Founding Partner slot, so the overview can show real progress
// against the actual number that matters, not just a raw submission count.
const FOUNDING_PARTNER_TARGET = 15;

function formatAnswers(answers: Record<string, unknown>): string {
  return Object.entries(answers)
    .filter(([, v]) => v !== '' && v !== null && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
    .join('\n');
}

function ExportLink({ table }: { table: string }) {
  return (
    <a href={`/api/admin/export?table=${table}`} className="btn btn-ghost" style={{ fontSize: 12.5, padding: '4px 0' }}>
      Export CSV
    </a>
  );
}

function countSince(items: { created_at: string }[], daysAgo: number): number {
  const cutoff = Date.now() - daysAgo * 86_400_000;
  return items.filter((i) => new Date(i.created_at).getTime() >= cutoff).length;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="ratio-box" style={{ background: '#faf8f4' }}>
      <div className="label" style={{ color: 'var(--whisk)', marginBottom: 6, fontSize: 11 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>{value}</div>
      {sub ? <div style={{ fontSize: 12, color: 'var(--whisk)', marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
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
    admin
      .from('survey_responses')
      .select('id, survey, answers, created_at, status, admin_notes')
      // Soft-deleted rows (migration 0024) never show here — deleted, not
      // just hidden, from the admin's point of view.
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const cafeSurveysRaw = (surveys ?? []).filter((s) => s.survey === 'cafe_partner');
  const cafeSurveys = [...cafeSurveysRaw].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const consumerSurveys = (surveys ?? []).filter((s) => s.survey === 'consumer');

  const statusCounts = cafeSurveysRaw.reduce(
    (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
    { new: 0, contacted: 0, selected: 0, declined: 0 } as Record<SurveyStatus, number>,
  );
  const waitlistThisWeek = countSince(waitlist ?? [], 7);
  const waitlistLastWeek = countSince(waitlist ?? [], 14) - waitlistThisWeek;
  const cafeSurveysThisWeek = countSince(cafeSurveysRaw, 7);

  return (
    <div className="wrap" style={{ padding: '48px 24px 96px', maxWidth: 900 }}>
      <div className="label eyebrow">Admin</div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Submissions</h1>
      <p style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 24 }}>
        {(waitlist ?? []).length} waitlist · {cafeSurveys.length} café survey · {consumerSurveys.length} consumer survey
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div className="ratio-box" style={{ background: '#faf8f4' }}>
          <div className="label" style={{ color: 'var(--whisk)', marginBottom: 6, fontSize: 11 }}>
            Founding Partner slots
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600 }}>
            {statusCounts.selected} / {FOUNDING_PARTNER_TARGET}
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: 'var(--whisk-10)',
              marginTop: 8,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, (statusCounts.selected / FOUNDING_PARTNER_TARGET) * 100)}%`,
                background: 'var(--ceremony)',
              }}
            />
          </div>
        </div>
        <StatCard
          label="Café queue"
          value={String(statusCounts.new)}
          sub={`new · ${statusCounts.contacted} contacted · ${statusCounts.declined} declined`}
        />
        <StatCard
          label="Waitlist this week"
          value={String(waitlistThisWeek)}
          sub={waitlistLastWeek > 0 ? `${waitlistLastWeek} the week before` : 'no signups the week before'}
        />
        <StatCard
          label="Café surveys this week"
          value={String(cafeSurveysThisWeek)}
          sub={`${cafeSurveysRaw.length} total`}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20 }}>Café partner survey — {cafeSurveys.length}</h2>
        <ExportLink table="cafe_partner" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {cafeSurveys.length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>None yet.</p> : null}
        {cafeSurveys.map((s) => (
          <div key={s.id} className="ratio-box" style={{ background: '#faf8f4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--whisk)' }}>{new Date(s.created_at).toLocaleString()}</span>
              <AdminDeleteButton id={s.id} label="café survey" />
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, fontFamily: 'var(--font-sans)', margin: 0 }}>
              {formatAnswers(s.answers as Record<string, unknown>)}
            </pre>
            <AdminSurveyStatus id={s.id} initialStatus={s.status} initialNotes={s.admin_notes} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20 }}>Consumer survey — {consumerSurveys.length}</h2>
        <ExportLink table="consumer" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
        {consumerSurveys.length === 0 ? <p style={{ color: 'var(--whisk)', fontSize: 14 }}>None yet.</p> : null}
        {consumerSurveys.map((s) => (
          <div key={s.id} className="ratio-box" style={{ background: '#faf8f4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--whisk)' }}>{new Date(s.created_at).toLocaleString()}</span>
              <AdminDeleteButton id={s.id} label="consumer survey" />
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, fontFamily: 'var(--font-sans)', margin: 0 }}>
              {formatAnswers(s.answers as Record<string, unknown>)}
            </pre>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 style={{ fontSize: 20 }}>Waitlist — {(waitlist ?? []).length}</h2>
        <ExportLink table="waitlist" />
      </div>
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
