import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBMISSIONS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
// Generous — this is a 5-step survey with several multi-select fields, not
// a single input. Just a sanity ceiling against an abusive payload, not a
// real constraint on a genuine submission.
const MAX_PAYLOAD_BYTES = 20_000;

// POST /api/surveys/cafe-partner — body is the raw §13.6.1 answer shape,
// stored as-is in survey_responses.answers. Only cafeName and email are
// actually validated here — everything else is read manually later (per
// §13.6's own framing: "read manually, not just tallied"), so there's
// nothing to gain from hand-validating every multi-select field against a
// fixed enum the survey copy might still change.
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: 'Submission too large.' }, { status: 413 });
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

  const cafeName = typeof body.cafeName === 'string' ? body.cafeName.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!cafeName) return NextResponse.json({ error: 'Café name is required.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });

  const tooMany = !checkRateLimit(`survey-cafe:${clientIp(request)}`, MAX_SUBMISSIONS_PER_HOUR, WINDOW_MS).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('survey_responses').insert({ survey: 'cafe_partner', answers: { ...body, email } });

  if (error) {
    await logServerError('api.surveys.cafe-partner', error, { cafeName });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
