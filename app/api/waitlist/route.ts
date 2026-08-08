import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SIGNUPS_PER_HOUR = 5;
const WINDOW_MS = 60 * 60 * 1000;

// Length caps so a pasted essay (or a bot) can't write unbounded text into
// the table. Generous enough that nobody legitimate hits them: a name and a
// handful of café names.
const MAX_NAME = 80;
const MAX_CAFES = 400;

// Trims, drops empties to null so "" never lands in the column, and caps
// length. Anything that isn't a string becomes null rather than throwing —
// the email is the only field worth rejecting a request over.
function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

// POST /api/waitlist — body: { email, name?, goToCafes? }. Still no account
// in the §0.4 sense: no auth, no magic link, no user row — just a richer
// waitlist row. Name and cafés are optional; email alone remains a valid
// signup.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }
  const name = optionalText(body?.name, MAX_NAME);
  const goToCafes = optionalText(body?.goToCafes, MAX_CAFES);

  const admin = createAdminClient();
  const tooMany = !(await checkRateLimitPersistent(admin, `waitlist:${clientIp(request)}`, MAX_SIGNUPS_PER_HOUR, WINDOW_MS))
    .allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  const { error } = await admin.from('waitlist').insert({ email, name, go_to_cafes: goToCafes });

  if (error) {
    // 23505 = already on the list (unique index on lower(email)) — not a
    // failure from the visitor's side, just a no-op.
    if (error.code === '23505') {
      // ...except it isn't quite a no-op any more. Someone who signed up
      // when this was email-only, and has now come back and filled in a
      // name and their cafés, would otherwise have those details dropped on
      // the floor. Fill blanks on the existing row; never overwrite an
      // answer they already gave with a later empty one.
      const patch: { name?: string; go_to_cafes?: string } = {};
      if (name) patch.name = name;
      if (goToCafes) patch.go_to_cafes = goToCafes;
      if (Object.keys(patch).length > 0) {
        const { error: updateError } = await admin
          .from('waitlist')
          .update(patch)
          .eq('email', email)
          .or('name.is.null,go_to_cafes.is.null');
        // A failed top-up isn't worth failing the request over — they're
        // still on the list, which is what they came to do.
        if (updateError) await logServerError('api.waitlist.enrich', updateError, { email });
      }
      return NextResponse.json({ success: true, alreadyJoined: true });
    }
    await logServerError('api.waitlist', error, { email });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
