import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit';

const MAX_SUBMISSIONS_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PAYLOAD_BYTES = 20_000;

// POST /api/surveys/consumer — body is the raw §13.6.2 answer shape,
// stored as-is. Deliberately anonymous — the consumer survey (unlike the
// café one) collects no email or identifying field per §13.6.2, so there's
// nothing here to validate beyond "is this a real, reasonably-sized
// submission."
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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid submission.' }, { status: 400 });
  }

  const tooMany = !checkRateLimit(`survey-consumer:${clientIp(request)}`, MAX_SUBMISSIONS_PER_HOUR, WINDOW_MS).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('survey_responses').insert({ survey: 'consumer', answers: body });

  if (error) {
    await logServerError('api.surveys.consumer', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
