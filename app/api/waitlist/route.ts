import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SIGNUPS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

// POST /api/waitlist — body: { email }. The entire pre-launch site's
// account surface: an email address, nothing else (§0.4 — "no account, no
// email + magic link, no Supabase Auth call, no user row beyond a waitlist
// email address").
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const tooMany = !(await checkRateLimitPersistent(admin, `waitlist:${clientIp(request)}`, MAX_SIGNUPS_PER_HOUR, WINDOW_MS))
    .allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const { error } = await admin.from('waitlist').insert({ email });

  if (error) {
    // 23505 = already on the list (unique index on lower(email)) — not a
    // failure from the visitor's side, just a no-op.
    if (error.code === '23505') {
      return NextResponse.json({ success: true, alreadyJoined: true });
    }
    await logServerError('api.waitlist', error, { email });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
