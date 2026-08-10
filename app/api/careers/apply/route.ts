import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';
import { sendEmail } from '@/lib/server/email';
import { jobApplicationConfirmationEmail } from '@/lib/server/emailTemplates';
import { getRole } from '@/lib/data/roles';
import { ALLOWED_RESUME_TYPES, RESUME_BUCKET, resumeExtension, validateResume } from '@/lib/careers/resume';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Same 5/hour as the surveys. This was 3 on the reasoning that nobody
// applies to one role twice in an hour on purpose — which ignored that the
// check runs *before* the insert, so every failed attempt spends a slot
// too. Someone who hits a transient error twice would have been locked out
// of a job application for an hour, which is a far worse outcome than the
// two extra submissions this allows.
const MAX_SUBMISSIONS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
// Roomier than the café survey's 20k: this form has four free-text boxes,
// one of which invites a list of links. Still just an abuse ceiling.
const MAX_PAYLOAD_BYTES = 30_000;

// Per-field caps, applied server-side rather than trusting the form's own
// rows/maxLength. Generous — a long pitch is a good sign, not something to
// truncate someone for.
const LIMITS: Record<string, number> = {
  fullName: 120,
  phone: 40,
  basedIn: 120,
  canTravel: 120,
  resumeLink: 500,
  portfolio: 2000,
  brandContent: 120,
  onCamera: 120,
  availability: 500,
  pitch: 2000,
  whyYou: 2000,
};

function text(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

// A pasted resume link arrives as often without a scheme as with one, and a
// stored "drive.google.com/…" becomes a *relative* href the moment admin
// renders it — so the scheme is settled here, once, rather than by whoever
// displays it. Prefixing also defuses a `javascript:` paste, which comes
// out the far side as an inert https URL.
function url(value: unknown, max: number): string {
  const raw = text(value, max);
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

// Multi-selects arrive as string arrays; anything else becomes an empty
// list rather than being stored raw, so the admin view can always join()
// what it finds without type-checking each row.
function stringList(value: unknown, maxItems = 30, maxLength = 200): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string').slice(0, maxItems).map((v) => v.trim().slice(0, maxLength));
}

// POST /api/careers/apply — a job application, stored as a
// survey_responses row with survey='job_application' (migration 0026) so
// it inherits the café queue's status workflow, notes, soft delete and CSV
// export instead of needing its own table and its own admin surface.
//
// roleSlug is validated against ROLES, not just stored: an application to
// a role that doesn't exist is either a stale bookmark or someone poking
// at the endpoint, and neither should land in the queue as a row nobody
// can act on.
export async function POST(request: Request) {
  // multipart/form-data, not JSON — the resume file rides along with the
  // answers in one request, so an applicant can't end up with a file
  // uploaded and no application attached to it (or the reverse). The text
  // answers are still one JSON string in the `payload` field, which keeps
  // every validation rule below unchanged from when this was a JSON route.
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  }

  const raw = form.get('payload');
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  }
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Application too long — try trimming the written answers.' }, { status: 413 });
  }

  const body = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  }

  // Validated here, before the rate limit is spent and long before the
  // upload — a rejected file should cost the applicant nothing.
  const resume = form.get('resume');
  const resumeFile = resume instanceof File && resume.size > 0 ? resume : null;
  if (resumeFile) {
    const problem = validateResume(resumeFile);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  }
  // A resume is required; *uploading* one is not. Neither the file nor the
  // link is checked on its own — the pair is — since plenty of people keep
  // theirs on Drive or LinkedIn and shouldn't have to export a copy to
  // apply. The check sits here with the format check so everything about
  // the resume is decided in one place.
  const resumeLink = url(body.resumeLink, LIMITS.resumeLink);
  if (!resumeFile && !resumeLink) {
    return NextResponse.json({ error: 'Please attach your resume or paste a link to it.' }, { status: 400 });
  }

  const role = typeof body.roleSlug === 'string' ? getRole(body.roleSlug) : undefined;
  if (!role) {
    return NextResponse.json({ error: 'That role is no longer open.' }, { status: 400 });
  }

  const fullName = text(body.fullName, LIMITS.fullName);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const portfolio = text(body.portfolio, LIMITS.portfolio);

  if (!fullName) return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  if (!portfolio) {
    return NextResponse.json({ error: 'Please share at least one link to work you’ve made.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const tooMany = !(
    await checkRateLimitPersistent(admin, `careers-apply:${clientIp(request)}`, MAX_SUBMISSIONS_PER_HOUR, WINDOW_MS)
  ).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  // Upload before the row is inserted, so an application never claims a
  // resume that isn't actually in the bucket. The reverse (a stored file
  // with no application) is possible if the insert then fails, and is
  // cleaned up below.
  let resumeRecord: { path: string; name: string; size: number } | null = null;
  if (resumeFile) {
    const ext = resumeExtension(resumeFile.name);
    // validateResume already rejected anything else; this is the type
    // narrowing, not a second check.
    if (!ext) return NextResponse.json({ error: 'Unsupported resume format.' }, { status: 400 });

    // The applicant's filename is never used as the storage path — it's
    // attacker-controlled text that could contain slashes, traversal
    // sequences or 300 characters of unicode. A UUID is the object name;
    // the original filename is kept in the row, as data, for the admin to
    // see when they download it.
    const path = `${role.slug}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage
      .from(RESUME_BUCKET)
      .upload(path, resumeFile, { contentType: ALLOWED_RESUME_TYPES[ext], upsert: false });

    if (uploadError) {
      await logServerError('api.careers.apply.resume-upload', uploadError, { roleSlug: role.slug, size: resumeFile.size });
      return NextResponse.json({ error: 'We couldn’t save that file. Try again, or paste a link instead.' }, { status: 500 });
    }
    resumeRecord = { path, name: resumeFile.name.slice(0, 200), size: resumeFile.size };
  }

  const answers = {
    roleSlug: role.slug,
    // Denormalised on purpose: a posting's title can be reworded, and an
    // application should keep the title it was actually written against.
    roleTitle: role.title,
    fullName,
    email,
    phone: text(body.phone, LIMITS.phone),
    basedIn: text(body.basedIn, LIMITS.basedIn),
    canTravel: text(body.canTravel, LIMITS.canTravel),
    portfolio,
    // One of these two is always populated — the request is rejected above
    // with neither. The bucket is private, so an uploaded file's path is
    // only ever resolvable through a signed URL minted by the admin page.
    resumeFile: resumeRecord,
    resumeLink,
    // Not capped at the form's three: the cap is a prompt to prioritise, not
    // a rule worth rejecting an application over if the client sends more.
    interests: stringList(body.interests),
    brandContent: text(body.brandContent, LIMITS.brandContent),
    tools: stringList(body.tools),
    onCamera: text(body.onCamera, LIMITS.onCamera),
    availability: text(body.availability, LIMITS.availability),
    pitch: text(body.pitch, LIMITS.pitch),
    whyYou: text(body.whyYou, LIMITS.whyYou),
    acknowledgedUnpaid: body.acknowledgedUnpaid === true,
  };

  const { error } = await admin.from('survey_responses').insert({ survey: 'job_application', answers });

  if (error) {
    await logServerError('api.careers.apply', error, { roleSlug: role.slug });
    // No row means nothing will ever reference this object, and it holds
    // someone's personal data — don't leave it sitting in the bucket. A
    // failed cleanup is logged, not surfaced: the applicant's problem is
    // the failed submission, not our orphaned file.
    if (resumeRecord) {
      const { error: removeError } = await admin.storage.from(RESUME_BUCKET).remove([resumeRecord.path]);
      if (removeError) {
        await logServerError('api.careers.apply.orphan-cleanup', removeError, { path: resumeRecord.path });
      }
    }
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  // Best-effort, same as the survey routes: the application is already
  // saved, so a mail failure is never a reason to tell an applicant their
  // submission failed.
  try {
    const { subject, html } = jobApplicationConfirmationEmail(
      fullName,
      role.title,
      // A file beats a link when both arrived — it's the copy we hold
      // ourselves, so it's the one the receipt should speak about.
      resumeRecord ? 'file' : 'link',
    );
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    await logServerError('api.careers.apply.confirmation-email', err, { roleSlug: role.slug, email });
  }

  return NextResponse.json({ success: true });
}
