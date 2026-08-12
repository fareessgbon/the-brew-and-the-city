import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, expectedAdminToken } from '@/lib/server/adminAuth';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminLoginForm } from '@/components/AdminLoginForm';
import { AdminStatusBadge, AdminNotesField } from '@/components/AdminSurveyStatus';
import { AdminDeleteButton } from '@/components/AdminDeleteButton';
import { AdminRejectButton } from '@/components/AdminRejectButton';
import type { SurveyStatus } from '@/lib/supabase/types';
import { RESUME_BUCKET, formatBytes } from '@/lib/careers/resume';

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

// Human labels for the fields each survey actually collects (see
// CafePartnerSurveyForm.tsx / ConsumerSurveyForm.tsx for the source
// field names) — falls back to a de-camel-cased version of the key for
// anything not listed, so a new question added to a form still renders
// as something readable instead of disappearing.
const CAFE_FIELD_LABELS: Record<string, string> = {
  cafeName: 'Café name',
  contactName: 'Contact name',
  email: 'Email',
  cityArea: 'City / area',
  instagramOrWebsite: 'Instagram / website',
  locationCount: 'Locations',
  slowerDays: 'Slower days',
  slowerParts: 'Slower parts of day',
  offerTypes: 'Offer types interested in',
  concerns: 'Concerns',
  resultsThatMatter: 'Results that matter most',
  willingness: 'Willingness to partner',
  priceExpectation: 'Price expectation (monthly)',
  freeText: 'What would make them interested',
};

const CONSUMER_FIELD_LABELS: Record<string, string> = {
  howTheyFindCafes: 'How they find cafés',
  whatMakesThemReturn: 'What makes them return',
  friendsInfluence: "Friends' influence",
  tryNewFor: 'Tries new cafés for',
  pricing: 'Monthly price expectation',
  freeText: 'Open response',
};

// jsonb doesn't preserve submission order, so Object.entries() on the
// stored answers comes back in whatever order Postgres feels like —
// these mirror each form's actual step sequence (see
// CafePartnerSurveyForm.tsx / ConsumerSurveyForm.tsx) so the collapsed
// detail reads in the order the café/consumer actually answered it.
const CAFE_FIELD_ORDER = [
  'instagramOrWebsite',
  'locationCount',
  'slowerDays',
  'slowerParts',
  'offerTypes',
  'concerns',
  'resultsThatMatter',
  'willingness',
  'freeText',
  'priceExpectation',
];

const CONSUMER_FIELD_ORDER = ['howTheyFindCafes', 'whatMakesThemReturn', 'friendsInfluence', 'tryNewFor', 'pricing', 'freeText'];

function humanizeKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

// Booleans exist in the answer blobs now (the careers form's unpaid
// acknowledgement) — String(false) would print "false" in a column of
// prose answers.
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

// Same filtering formatAnswers used to do (drop empty/null/empty-array
// values), but returns {label, value} rows in `order` using the label
// maps above instead of dumping raw camelCase keys in jsonb's arbitrary
// order. Anything in `answers` but not in `order` (a field added to a
// form after this list was written) is appended at the end rather than
// silently dropped. `exclude` keeps fields already shown in the card
// header (café name, contact, email...) out of the detail list.
function formatAnswerRows(
  answers: Record<string, unknown>,
  labels: Record<string, string>,
  order: string[],
  exclude: string[] = [],
): { key: string; label: string; value: string }[] {
  const keys = [...order, ...Object.keys(answers).filter((k) => !order.includes(k))];
  return keys
    .filter((k) => k in answers)
    .filter((k) => !exclude.includes(k) && answers[k] !== '' && answers[k] !== null && !(Array.isArray(answers[k]) && answers[k].length === 0))
    .map((k) => ({ key: k, label: labels[k] ?? humanizeKey(k), value: formatValue(answers[k]) }));
}

function ExportLink({ table }: { table: string }) {
  return (
    <a href={`/api/admin/export?table=${table}`} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 14px', flex: 'none' }}>
      Export CSV
    </a>
  );
}

function countSince(items: { created_at: string }[], daysAgo: number): number {
  const cutoff = Date.now() - daysAgo * 86_400_000;
  return items.filter((i) => new Date(i.created_at).getTime() >= cutoff).length;
}

// "3h ago" scans in a way "8/7/2026, 9:15:57 PM" doesn't — on a queue the
// only thing the timestamp answers is "how stale is this?". The exact
// value stays in the title attribute for when the actual date matters.
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Timestamp({ iso }: { iso: string }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--whisk)' }} title={new Date(iso).toLocaleString()}>
      {relativeTime(iso)}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="admin-card">
      <div className="admin-metric-label">{label}</div>
      {/* data-zero mutes the figure rather than hiding it — see the rule in
          globals.css. A zero still has to be readable; it just shouldn't
          compete with a real count. */}
      <div className="admin-metric-value" data-zero={value === '0'}>
        {value}
      </div>
      {sub ? <div className="admin-metric-sub">{sub}</div> : null}
    </div>
  );
}

function SectionHead({ title, count, table }: { title: string; count: number; table: string }) {
  return (
    <div className="admin-section-head">
      <div className="admin-section-title">
        <h2 style={{ fontSize: 19 }}>{title}</h2>
        <span className="admin-count">{count}</span>
      </div>
      <ExportLink table={table} />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="admin-empty">{children}</div>;
}

function AnswerList({
  rows,
  summary = 'View full survey answers',
}: {
  rows: { key: string; label: string; value: string }[];
  summary?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <details className="admin-details" style={{ marginTop: 10 }}>
      <summary>{summary}</summary>
      <dl className="admin-answers">
        {rows.map((row) => (
          <Fragment key={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </Fragment>
        ))}
      </dl>
    </details>
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
    admin.from('waitlist').select('email, name, go_to_cafes, created_at').order('created_at', { ascending: false }),
    admin
      .from('survey_responses')
      .select('id, survey, answers, created_at, status, admin_notes, rejection_email_sent_at')
      // Soft-deleted rows (migration 0024) never show here — deleted, not
      // just hidden, from the admin's point of view.
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const cafeSurveysRaw = (surveys ?? []).filter((s) => s.survey === 'cafe_partner');
  const cafeSurveys = [...cafeSurveysRaw].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const consumerSurveys = (surveys ?? []).filter((s) => s.survey === 'consumer');
  // Same triage sort as the café queue — these are applications to work
  // through, not a feed to read (migration 0026).
  const jobApplicationsRaw = (surveys ?? []).filter((s) => s.survey === 'job_application');
  const jobApplications = [...jobApplicationsRaw].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const newApplications = jobApplicationsRaw.filter((s) => s.status === 'new').length;

  // The resumes bucket is private (migration 0027), so a stored path isn't
  // a URL anyone — including a logged-in admin's browser — can fetch. Mint
  // a short-lived signed URL per resume at render time. One hour: long
  // enough to work through the queue in a sitting, short enough that a URL
  // copied out of the page stops working the same day.
  const resumeUrls = new Map<string, string>();
  await Promise.all(
    jobApplications.map(async (s) => {
      const file = (s.answers as Record<string, unknown>).resumeFile as { path?: unknown } | null;
      if (!file || typeof file.path !== 'string') return;
      const { data } = await admin.storage.from(RESUME_BUCKET).createSignedUrl(file.path, 3600);
      if (data?.signedUrl) resumeUrls.set(s.id, data.signedUrl);
    }),
  );

  const statusCounts = cafeSurveysRaw.reduce(
    (acc, s) => ({ ...acc, [s.status]: acc[s.status] + 1 }),
    { new: 0, contacted: 0, selected: 0, declined: 0 } as Record<SurveyStatus, number>,
  );
  const waitlistThisWeek = countSince(waitlist ?? [], 7);
  const waitlistLastWeek = countSince(waitlist ?? [], 14) - waitlistThisWeek;
  const cafeSurveysThisWeek = countSince(cafeSurveysRaw, 7);

  const slotsLeft = Math.max(0, FOUNDING_PARTNER_TARGET - statusCounts.selected);
  const waitlistDelta = waitlistThisWeek - waitlistLastWeek;

  return (
    <div className="wrap admin-page">
      <div className="admin-bar" style={{ marginBottom: 28 }}>
        <div>
          <div className="label eyebrow">Admin</div>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Submissions</h1>
          <p style={{ fontSize: 13.5, color: 'var(--whisk)' }}>
            {/* Both queues in one line — an unread job application is just
                as much "waiting on you" as an unread café survey, and the
                old copy would have said "nothing waiting" with five
                applications sitting untouched below. */}
            {[
              statusCounts.new > 0
                ? `${statusCounts.new} café ${statusCounts.new === 1 ? 'survey needs' : 'surveys need'} a first look`
                : null,
              newApplications > 0
                ? `${newApplications} job ${newApplications === 1 ? 'application needs' : 'applications need'} a first look`
                : null,
            ]
              .filter(Boolean)
              .map((line) => `${line}.`)
              .join(' ') || 'Nothing waiting on you — both queues are triaged.'}
          </p>
        </div>
      </div>

      {/* The goal the whole queue serves, given its own row above the
          supporting counts — everything below is in service of filling
          these 15 slots (§3.0). */}
      <div className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-bar">
          <div>
            <div className="admin-metric-label">Founding Partner slots</div>
            <div className="admin-metric-value" data-zero={statusCounts.selected === 0}>
              {statusCounts.selected}{' '}
              <span style={{ fontSize: 20, color: 'var(--whisk)', fontWeight: 500 }}>/ {FOUNDING_PARTNER_TARGET}</span>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--whisk)' }}>
            {slotsLeft === 0 ? 'All slots filled' : `${slotsLeft} left to fill`}
          </div>
        </div>
        <div className="admin-track" aria-hidden="true">
          {Array.from({ length: FOUNDING_PARTNER_TARGET }, (_, i) => (
            <span key={i} data-filled={i < statusCounts.selected} />
          ))}
        </div>
      </div>

      <div className="admin-metrics">
        <StatCard
          label="Café queue"
          value={String(statusCounts.new)}
          sub={`awaiting review · ${statusCounts.contacted} contacted · ${statusCounts.declined} declined`}
        />
        <StatCard
          label="Waitlist this week"
          value={String(waitlistThisWeek)}
          sub={
            waitlistLastWeek === 0
              ? 'no signups the week before'
              : `${waitlistDelta >= 0 ? '+' : ''}${waitlistDelta} vs ${waitlistLastWeek} the week before`
          }
        />
        <StatCard
          label="Café surveys this week"
          value={String(cafeSurveysThisWeek)}
          sub={`${cafeSurveysRaw.length} total all time`}
        />
        <StatCard
          label="Job applications"
          value={String(newApplications)}
          sub={`awaiting review · ${jobApplicationsRaw.length} total all time`}
        />
      </div>

      <section className="admin-section">
        <SectionHead title="Café partner survey" count={cafeSurveys.length} table="cafe_partner" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cafeSurveys.length === 0 ? (
            <EmptyState>No café has filled out the partner survey yet.</EmptyState>
          ) : null}
          {cafeSurveys.map((s) => {
          const answers = s.answers as Record<string, unknown>;
          const cafeName = typeof answers.cafeName === 'string' && answers.cafeName ? answers.cafeName : 'Unnamed café';
          const metaBits = [answers.contactName, answers.email, answers.cityArea]
            .filter((v): v is string => typeof v === 'string' && v.length > 0)
            .join(' · ');
          const detailRows = formatAnswerRows(answers, CAFE_FIELD_LABELS, CAFE_FIELD_ORDER, ['cafeName', 'contactName', 'email', 'cityArea']);
            return (
              <div key={s.id} className="admin-card">
                <div className="admin-bar" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 16.5, margin: 0 }}>{cafeName}</h3>
                    {metaBits ? (
                      <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 3 }}>{metaBits}</div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                    <Timestamp iso={s.created_at} />
                    <AdminStatusBadge id={s.id} initialStatus={s.status} />
                  </div>
                </div>
                <AnswerList rows={detailRows} />
                <div className="admin-card-foot">
                  <AdminNotesField id={s.id} initialNotes={s.admin_notes} />
                  <AdminDeleteButton id={s.id} label="café survey" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <SectionHead title="Job applications" count={jobApplications.length} table="job_application" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {jobApplications.length === 0 ? <EmptyState>No one has applied for an open role yet.</EmptyState> : null}
          {jobApplications.map((s) => {
            const answers = s.answers as Record<string, unknown>;
            const name = typeof answers.fullName === 'string' && answers.fullName ? answers.fullName : 'Unnamed applicant';
            const metaBits = [answers.roleTitle, answers.email, answers.basedIn]
              .filter((v): v is string => typeof v === 'string' && v.length > 0)
              .join(' · ');
            // No inline answer list on these cards any more — the full
            // application has its own page (/admin/applications/[id]), and
            // a disclosure that duplicates it just makes the queue longer.
            const resumeFile = answers.resumeFile as { name?: unknown; size?: unknown } | null;
            const resumeHref = resumeUrls.get(s.id);
            // An applicant may have linked their resume instead of
            // uploading one; the card would otherwise read as "sent no
            // resume", which is the opposite of true.
            const resumeLink = typeof answers.resumeLink === 'string' ? answers.resumeLink : '';
            return (
              <div key={s.id} className="admin-card">
                <div className="admin-bar" style={{ alignItems: 'flex-start' }}>
                  <div>
                    {/* The name is the link to the full application — a
                        whole-card link would swallow the meta line, the
                        status control and the resume button into one
                        accessible name. */}
                    <h3 style={{ fontSize: 16.5, margin: 0 }}>
                      <Link href={`/admin/applications/${s.id}`} className="admin-card-link">
                        {name}
                      </Link>
                    </h3>
                    {metaBits ? <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 3 }}>{metaBits}</div> : null}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
                    <Timestamp iso={s.created_at} />
                    <AdminStatusBadge id={s.id} initialStatus={s.status} />
                  </div>
                </div>
                {/* Above the collapsed answers, not inside them — the
                    resume is the thing you open first on a hiring queue,
                    and it shouldn't need a disclosure click to reach. */}
                {(resumeFile && typeof resumeFile.name === 'string') || resumeLink ? (
                  <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {resumeFile && typeof resumeFile.name === 'string' ? (
                      resumeHref ? (
                        <a
                          href={resumeHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '6px 14px', width: 'auto', display: 'inline-block' }}
                        >
                          Resume · {resumeFile.name}
                          {typeof resumeFile.size === 'number' ? ` (${formatBytes(resumeFile.size)})` : ''}
                        </a>
                      ) : (
                        // The row says there's a file but no signed URL came
                        // back — say so rather than rendering nothing, which
                        // would read as "this applicant sent no resume".
                        <span style={{ fontSize: 12.5, color: '#b3402a' }}>
                          Resume on file ({resumeFile.name}) but the download link couldn&apos;t be generated.
                        </span>
                      )
                    ) : null}
                    {resumeLink ? (
                      <a
                        href={resumeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: '6px 14px', width: 'auto', display: 'inline-block' }}
                      >
                        Resume · link
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <Link href={`/admin/applications/${s.id}`} className="admin-open-link">
                  View the full application →
                </Link>
                <div className="admin-card-foot">
                  <AdminNotesField id={s.id} initialNotes={s.admin_notes} />
                  {/* Reject is on the card as well as the full application
                      page: a queue is worked in a pass, and most nos are
                      decided from what the card already shows. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 'none' }}>
                    <AdminRejectButton
                      id={s.id}
                      applicantName={name}
                      sentAt={s.rejection_email_sent_at}
                      hasEmail={typeof answers.email === 'string' && answers.email.trim().length > 0}
                    />
                    <AdminDeleteButton id={s.id} label="application" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <SectionHead title="Consumer survey" count={consumerSurveys.length} table="consumer" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {consumerSurveys.length === 0 ? (
            <EmptyState>No consumer survey responses yet.</EmptyState>
          ) : null}
          {consumerSurveys.map((s) => {
            const answers = s.answers as Record<string, unknown>;
            const pricing = typeof answers.pricing === 'string' && answers.pricing ? answers.pricing : null;
            const detailRows = formatAnswerRows(answers, CONSUMER_FIELD_LABELS, CONSUMER_FIELD_ORDER);
            return (
              <div key={s.id} className="admin-card">
                <div className="admin-bar">
                  {/* Price expectation leads — it's the one answer with a
                      number attached, and the reason this survey exists. */}
                  {pricing ? (
                    <div>
                      <div className="admin-metric-label" style={{ marginBottom: 3 }}>
                        Would pay
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ceremony)' }}>{pricing}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13.5, color: 'var(--whisk)' }}>No price given</div>
                  )}
                  <Timestamp iso={s.created_at} />
                </div>
                <AnswerList rows={detailRows} />
                {/* No notes control on consumer rows — they're anonymous
                    aggregate signal, not a queue item to work. */}
                <div className="admin-card-foot" style={{ justifyContent: 'flex-end' }}>
                  <AdminDeleteButton id={s.id} label="consumer survey" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="admin-section">
        <SectionHead title="Waitlist" count={(waitlist ?? []).length} table="waitlist" />
        <div>
          {(waitlist ?? []).length === 0 ? (
            <EmptyState>No one has joined the waitlist yet.</EmptyState>
          ) : null}
          {(waitlist ?? []).map((w) => (
            <div key={w.email} className="admin-row">
              <div style={{ minWidth: 0 }}>
                <span style={{ overflowWrap: 'anywhere' }}>
                  {w.name ? `${w.name} · ` : ''}
                  {w.email}
                </span>
                {/* The reason the field exists — which cafés people name
                    unprompted is the most actionable thing on this list. */}
                {w.go_to_cafes ? (
                  <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 2 }}>{w.go_to_cafes}</div>
                ) : null}
              </div>
              <Timestamp iso={w.created_at} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
