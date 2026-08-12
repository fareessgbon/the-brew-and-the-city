import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdminSession } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminStatusBadge, AdminNotesField } from '@/components/AdminSurveyStatus';
import { AdminDeleteButton } from '@/components/AdminDeleteButton';
import { AdminRejectButton } from '@/components/AdminRejectButton';
import { RESUME_BUCKET, formatBytes } from '@/lib/careers/resume';
import type { SurveyStatus } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Application — Brew and the City',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

// Same field vocabulary as the queue card, minus the ones this page shows
// in its own header/contact block. Kept here rather than imported from
// app/admin/page.tsx because that module is a page, not a module meant to
// be imported — sharing would drag its whole data fetch along with it.
const FIELD_LABELS: Record<string, string> = {
  portfolio: 'Portfolio and work',
  interests: 'What draws them to the role',
  brandContent: 'Made content for a brand before',
  tools: 'Tools they’re comfortable with',
  onCamera: 'Comfortable on camera',
  pitch: 'Their post pitch',
  availability: 'Availability',
  whyYou: 'Anything else',
  // Historical only — the role is paid now and the form no longer asks.
  // Kept so applications sent under the old terms still read correctly
  // instead of showing a bare camelCase key.
  acknowledgedUnpaid: 'Confirmed the role was unpaid (applied under the old terms)',
};

const FIELD_ORDER = [
  'portfolio',
  'interests',
  'brandContent',
  'tools',
  'onCamera',
  'pitch',
  'availability',
  'whyYou',
  'acknowledgedUnpaid',
];

// Header/contact fields, plus roleSlug, which roleTitle already says in
// words — none of these belong in the answers list below.
const HEADER_FIELDS = [
  'roleSlug',
  'roleTitle',
  'fullName',
  'email',
  'phone',
  'basedIn',
  'canTravel',
  'resumeFile',
  'resumeLink',
];

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

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) {
    return <AdminLoginForm />;
  }

  const { id } = await params;
  const admin = createAdminClient();
  const { data: row } = await admin
    .from('survey_responses')
    .select('id, survey, answers, created_at, status, admin_notes, rejection_email_sent_at')
    .eq('id', id)
    .eq('survey', 'job_application')
    // A soft-deleted application is gone as far as the admin is concerned
    // (migration 0024) — a stale link to one 404s rather than resurrecting it.
    .is('deleted_at', null)
    .maybeSingle();

  if (!row) notFound();

  const answers = row.answers as Record<string, unknown>;
  const name = text(answers.fullName) ?? 'Unnamed applicant';
  const email = text(answers.email);
  const phone = text(answers.phone);
  const basedIn = text(answers.basedIn);
  const canTravel = text(answers.canTravel);
  const roleTitle = text(answers.roleTitle);
  const resume = answers.resumeFile as { path?: unknown; name?: unknown; size?: unknown } | null;
  const resumeLink = text(answers.resumeLink);

  let resumeHref: string | null = null;
  if (resume && typeof resume.path === 'string') {
    const { data } = await admin.storage.from(RESUME_BUCKET).createSignedUrl(resume.path, 3600);
    resumeHref = data?.signedUrl ?? null;
  }

  // Anything not already in the header, in form order, with unknown keys
  // appended rather than dropped — same rule as the queue's detail list, so
  // a question added to the form still shows up here.
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
            {roleTitle ?? 'Application'}
          </div>
          <h1 style={{ fontSize: 32, marginTop: 6 }}>{name}</h1>
        </div>
        <div style={{ flex: 'none' }}>
          <AdminStatusBadge id={row.id} initialStatus={row.status as SurveyStatus} />
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--whisk)', marginBottom: 24 }}>
        Applied {new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
      </div>

      {/* Contact first, and as real links — the point of opening an
          application in full is usually to act on it, and mailto/tel save
          a copy-paste every time. */}
      <div className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-metric-label" style={{ marginBottom: 10 }}>
          Contact
        </div>
        <dl className="admin-answers">
          {email ? (
            <>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${email}`}>{email}</a>
              </dd>
            </>
          ) : null}
          {phone ? (
            <>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
              </dd>
            </>
          ) : null}
          {basedIn ? (
            <>
              <dt>Based in</dt>
              <dd>{basedIn}</dd>
            </>
          ) : null}
          {canTravel ? (
            <>
              <dt>Can travel for shoots</dt>
              <dd>{canTravel}</dd>
            </>
          ) : null}
        </dl>
      </div>

      {/* An application has a file, a link, or both — whichever arrived goes
          in this one card, so "where's their resume" is always the same
          place to look. */}
      {(resume && typeof resume.name === 'string') || resumeLink ? (
        <div className="admin-card" style={{ marginBottom: 12 }}>
          <div className="admin-metric-label" style={{ marginBottom: 10 }}>
            Resume
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {resume && typeof resume.name === 'string' ? (
              resumeHref ? (
                <a
                  href={resumeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ width: 'auto', display: 'inline-block', fontSize: 13 }}
                >
                  Open {resume.name}
                  {typeof resume.size === 'number' ? ` (${formatBytes(resume.size)})` : ''}
                </a>
              ) : (
                <span style={{ fontSize: 13, color: '#b3402a' }}>
                  {resume.name} is on file, but the download link couldn&apos;t be generated.
                </span>
              )
            ) : null}
            {resumeLink ? (
              <a
                href={resumeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ width: 'auto', display: 'inline-block', fontSize: 13 }}
              >
                Open their resume link
              </a>
            ) : null}
          </div>
          {resumeLink ? (
            <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 8, wordBreak: 'break-all' }}>{resumeLink}</div>
          ) : null}
        </div>
      ) : null}

      <div className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-metric-label" style={{ marginBottom: 10 }}>
          Their answers
        </div>
        {rows.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--whisk)' }}>They left every optional question blank.</div>
        ) : (
          <dl className="admin-answers">
            {rows.map((r) => (
              <Fragment key={r.key}>
                <dt>{r.label}</dt>
                {/* pre-wrap: the portfolio box asks for one link per line,
                    so the newlines they typed are meaningful. */}
                <dd style={{ whiteSpace: 'pre-wrap' }}>{r.value}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-metric-label" style={{ marginBottom: 10 }}>
          Your notes
        </div>
        {/* Always open here, unlike the queue card. On a page you opened
            deliberately to work one application, the note field is the
            point, not clutter. */}
        <AdminNotesField id={row.id} initialNotes={row.admin_notes} alwaysOpen />
        {/* Reject sits left, delete right — they are not the same kind of
            act. Rejecting is the normal end of an application and speaks
            to the applicant; deleting removes it from the queue and says
            nothing to anyone. Putting them shoulder to shoulder as a pair
            of red links would invite reaching for the wrong one. */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginTop: 14 }}>
          <AdminRejectButton
            id={row.id}
            applicantName={name}
            sentAt={row.rejection_email_sent_at}
            hasEmail={Boolean(email)}
          />
          <AdminDeleteButton id={row.id} label="application" />
        </div>
      </div>
    </div>
  );
}
