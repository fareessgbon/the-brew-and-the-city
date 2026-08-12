import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminRequest } from '@/lib/server/adminAuth';
import { logServerError } from '@/lib/server/logError';
import { sendEmail } from '@/lib/server/email';
import { jobApplicationRejectionEmail } from '@/lib/server/emailTemplates';

// POST /api/admin/survey-responses/[id]/reject — mails the applicant a
// rejection and closes the row out as declined.
//
// Deliberately its own endpoint rather than a side effect of PATCHing
// status to 'declined'. The badge is a two-keystroke control that also gets
// used to correct a mis-click, and wiring an irreversible email to it would
// mean a slip of the hand sends a real person a rejection. Sending is its
// own explicit, confirmed action; the status change rides along with it,
// not the other way round.
//
// The email is NOT best-effort here, unlike every other send in this
// codebase. Elsewhere the database row is the point and the mail is a
// courtesy on top; here the mail *is* the point, so a failed send leaves
// the row untouched and reports the failure — an application marked
// "rejection sent" that nobody received is the one outcome worth avoiding.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: row, error: loadError } = await admin
    .from('survey_responses')
    .select('id, answers, status, rejection_email_sent_at')
    .eq('id', id)
    // Job applications only. A café survey has no rejection email — its
    // "no" is handled by a personal note, and this template addresses an
    // applicant by name about a role.
    .eq('survey', 'job_application')
    .is('deleted_at', null)
    .maybeSingle();

  if (loadError) {
    await logServerError('api.admin.reject.load', loadError, { id });
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: 'That application no longer exists.' }, { status: 404 });
  }

  // Two clicks in the UI can't produce two emails, but a stale tab, a
  // double submit or a retry after a slow response can — and the person on
  // the other end reads a second rejection as either a mistake or a
  // twisting of the knife. The check is here, on the server, because it's
  // the only place that can actually be relied on.
  if (row.rejection_email_sent_at) {
    return NextResponse.json(
      { error: 'A rejection was already sent for this application.', sentAt: row.rejection_email_sent_at },
      { status: 409 },
    );
  }

  const answers = row.answers as Record<string, unknown>;
  const email = typeof answers.email === 'string' ? answers.email.trim() : '';
  const fullName = typeof answers.fullName === 'string' && answers.fullName.trim() ? answers.fullName.trim() : 'there';
  const roleTitle = typeof answers.roleTitle === 'string' && answers.roleTitle ? answers.roleTitle : 'the role you applied for';

  if (!email) {
    return NextResponse.json({ error: 'This application has no email address to send to.' }, { status: 422 });
  }

  try {
    const { subject, html } = jobApplicationRejectionEmail(fullName, roleTitle);
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    await logServerError('api.admin.reject.email', err, { id, email });
    return NextResponse.json({ error: 'The email didn’t send — nothing was changed. Try again.' }, { status: 502 });
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from('survey_responses')
    .update({ status: 'declined', rejection_email_sent_at: sentAt })
    .eq('id', id);

  if (updateError) {
    // The applicant has been told; only our bookkeeping failed. Say so
    // plainly rather than reporting a clean failure the admin might act on
    // by clicking again — a second click would send a second rejection.
    await logServerError('api.admin.reject.update', updateError, { id, sentAt });
    return NextResponse.json(
      { error: 'The email sent, but the application couldn’t be marked declined. Don’t send again — set the status by hand.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, sentAt });
}
