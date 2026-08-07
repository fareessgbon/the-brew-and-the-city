import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimitPersistent, clientIp } from '@/lib/server/rateLimit';
import { verifyAdminPin, expectedAdminToken, ADMIN_COOKIE_NAME } from '@/lib/server/adminAuth';

const MAX_ATTEMPTS_PER_WINDOW = 8;
const WINDOW_MS = 15 * 60 * 1000;

// POST /api/admin/login — body: { pin }. Persistent (DB-backed) rate limit,
// not the in-memory one — this is the one endpoint on the whole site worth
// protecting against a serverless-instance-spread brute force, since it
// guards real user data.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const pin = typeof body?.pin === 'string' ? body.pin : '';

  const admin = createAdminClient();
  const tooMany = !(
    await checkRateLimitPersistent(admin, `admin-login:${clientIp(request)}`, MAX_ATTEMPTS_PER_WINDOW, WINDOW_MS)
  ).allowed;
  if (tooMany) {
    return NextResponse.json({ error: 'Too many attempts — please try again later.' }, { status: 429 });
  }

  if (!verifyAdminPin(pin)) {
    return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
  }

  const token = expectedAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token as string, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
