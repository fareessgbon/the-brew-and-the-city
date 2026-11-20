import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';
import { sendEmail } from '@/lib/server/email';
import { cafeTasteVectorSurveyConfirmationEmail } from '@/lib/server/emailTemplates';
import { DIMS, PRICE_BANDS, PRIMARY_DRINK_CATEGORIES } from '@/lib/data/cafeFields';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBMISSIONS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PAYLOAD_BYTES = 8_000;

// POST /api/surveys/cafe-taste-vector — a café answering the admin
// editor's own seven questions about itself. Unlike the café-partner
// survey (validated loosely, "read manually, not just tallied"), the
// seven scores here feed straight into the admin bridge that prefills
// /admin/cafes/new's sliders — a malformed or out-of-range value there
// wouldn't just look wrong on a read, it'd break the prefill or write a
// silently bogus number onto a real café's public listing. Hence real
// validation on exactly those fields, same shape as lib/server/cafePayload.
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
  const neighbourhood = typeof body.neighbourhood === 'string' ? body.neighbourhood.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!cafeName) return NextResponse.json({ error: 'Café name is required.' }, { status: 400 });
  if (!neighbourhood) return NextResponse.json({ error: 'Neighbourhood is required.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });

  const drinkCategories = body.drinkCategories;
  if (
    !Array.isArray(drinkCategories) ||
    drinkCategories.length === 0 ||
    drinkCategories.some((c) => typeof c !== 'string' || !PRIMARY_DRINK_CATEGORIES.includes(c as never))
  ) {
    return NextResponse.json({ error: 'Pick at least one drink category.' }, { status: 400 });
  }

  for (const dim of DIMS) {
    const key = `${dim}_score`;
    const value = body[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: `Please answer the ${dim} question.` }, { status: 400 });
    }
  }

  if (typeof body.price_band !== 'string' || !PRICE_BANDS.includes(body.price_band as never)) {
    return NextResponse.json({ error: 'Please answer the price question.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const tooMany = !(
    await checkRateLimitPersistent(admin, `survey-cafe-taste:${clientIp(request)}`, MAX_SUBMISSIONS_PER_HOUR, WINDOW_MS)
  ).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const { error } = await admin
    .from('survey_responses')
    .insert({ survey: 'cafe_taste_vector', answers: { ...body, cafeName, email } });

  if (error) {
    await logServerError('api.surveys.cafe-taste-vector', error, { cafeName });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  // Best-effort, same as the café-partner survey — the row is already
  // saved, so an email hiccup is never a reason to tell the café their
  // submission failed.
  try {
    const { subject, html } = cafeTasteVectorSurveyConfirmationEmail(cafeName);
    await sendEmail({ to: email, subject, html });
  } catch (err) {
    await logServerError('api.surveys.cafe-taste-vector.confirmation-email', err, { cafeName, email });
  }

  return NextResponse.json({ success: true });
}
