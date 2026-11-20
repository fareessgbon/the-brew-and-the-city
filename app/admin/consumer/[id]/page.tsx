import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminDeleteButton } from '@/components/AdminDeleteButton';

export const metadata: Metadata = {
  title: 'Consumer response — Brew and the City',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Same field vocabulary as the queue card, minus the two the header shows.
// Duplicated rather than imported from app/admin/page.tsx for the reason
// given on the application page: that module is a page, and importing it
// would drag its whole data fetch along.
const FIELD_LABELS: Record<string, string> = {
  howTheyFindCafes: 'How they find cafés',
  whatMakesThemReturn: 'What makes them return',
  friendsInfluence: "Friends' influence",
  tryNewFor: 'Tries new cafés for',
  pricing: 'Monthly price expectation',
  freeText: 'Open response',
};

const FIELD_ORDER = ['howTheyFindCafes', 'whatMakesThemReturn', 'friendsInfluence', 'tryNewFor', 'pricing', 'freeText'];

// Shown in the header above, so they don't repeat in the answers list.
const HEADER_FIELDS = ['name', 'email'];

function humanizeKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export default async function ConsumerResponsePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: row } = await admin
    .from('survey_responses')
    .select('id, survey, answers, created_at')
    .eq('id', id)
    // Pinned to 'consumer' so an application id can't be opened through
    // this route and render without its resume, status or reject control.
    .eq('survey', 'consumer')
    // A soft-deleted response is gone as far as the admin is concerned
    // (migration 0024) — a stale link to one 404s rather than resurrecting it.
    .is('deleted_at', null)
    .maybeSingle();

  if (!row) notFound();

  const answers = row.answers as Record<string, unknown>;
  const name = text(answers.name) ?? 'Unnamed respondent';
  const email = text(answers.email);

  // Anything not already in the header, in form order, with unknown keys
  // appended rather than dropped — same rule as the queue's detail list, so
  // a question added to the survey still shows up here.
  const keys = [...FIELD_ORDER, ...Object.keys(answers).filter((k) => !FIELD_ORDER.includes(k))];
  const rows = keys
    .filter((k) => k in answers && !HEADER_FIELDS.includes(k))
    .filter((k) => answers[k] !== '' && answers[k] !== null && !(Array.isArray(answers[k]) && answers[k].length === 0))
    .map((k) => ({ key: k, label: FIELD_LABELS[k] ?? humanizeKey(k), value: formatValue(answers[k]) }));

  return (
    <div className="wrap admin-page" style={{ maxWidth: 820 }}>
      <Link href="/admin" style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
        ← Back to the queue
      </Link>

      <div className="admin-bar" style={{ margin: '18px 0 6px', alignItems: 'flex-start' }}>
        <div>
          <div className="label eyebrow" style={{ color: 'var(--whisk)' }}>
            Consumer survey
          </div>
          <h1 style={{ fontSize: 32, marginTop: 6 }}>{name}</h1>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 24 }}>
        Submitted {new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </div>

      {/* Only rendered when they left an address — the email is optional on
          this survey, and an empty "Contact" card would read as a missing
          value rather than a choice they made. */}
      {email ? (
        <div className="admin-card" style={{ marginBottom: 12 }}>
          <div className="admin-metric-label" style={{ marginBottom: 10 }}>
            Contact
          </div>
          <dl className="admin-answers">
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${email}`}>{email}</a>
            </dd>
          </dl>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: 'var(--whisk)', marginBottom: 12 }}>
          They didn&apos;t leave an email — there&apos;s no way to reply to this one.
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-metric-label" style={{ marginBottom: 10 }}>
          Their answers
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--whisk)' }}>They left every question blank.</div>
        ) : (
          <dl className="admin-answers">
            {rows.map((r) => (
              <Fragment key={r.key}>
                <dt>{r.label}</dt>
                {/* pre-wrap: the last question is a free-text box, so the
                    newlines they typed are meaningful. */}
                <dd style={{ whiteSpace: 'pre-wrap' }}>{r.value}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>

      {/* No status badge or notes field, unlike the application page — a
          consumer response is signal to read, not a queue item to work
          (see lib/supabase/types.ts). Delete is the only action it has. */}
      <div className="admin-card" style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <AdminDeleteButton id={row.id} label="consumer survey" />
      </div>
    </div>
  );
}
