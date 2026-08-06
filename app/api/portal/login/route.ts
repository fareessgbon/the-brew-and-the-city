import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createPortalToken, PORTAL_COOKIE_PREFIX } from '@/lib/portalSession';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { logServerError } from '@/lib/server/logError';

const MAX_ATTEMPTS_PER_WINDOW = 10;
const WINDOW_MS = 15 * 60 * 1000;

// POST /api/portal/login — body: { slug: string, pin: string }. A café's
// PIN is a low-security-tier secret by design (§21 — no accounts, no
// hardware), so the meaningful protection here is rate-limiting attempts,
// not password-grade hashing. Reuses analytics_events as a lightweight
// attempt log rather than standing up separate rate-limit infrastructure.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === 'string' ? body.slug : '';
  const pin = typeof body?.pin === 'string' ? body.pin : '';
  if (!slug || !pin) {
    return NextResponse.json({ error: 'Café and PIN are required.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count: recentFailures } = await admin
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event', 'portal_login_failed')
    .eq('properties->>slug', slug)
    .gte('created_at', windowStart);

  if ((recentFailures ?? 0) >= MAX_ATTEMPTS_PER_WINDOW) {
    return NextResponse.json({ error: 'Too many attempts — please wait 15 minutes and try again.' }, { status: 429 });
  }

  const { data: cafe, error } = await admin.from('cafes').select('id, name, portal_pin').eq('slug', slug).maybeSingle();
  if (error) {
    await logServerError('api.portal.login', error, { slug });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  if (!cafe || !cafe.portal_pin || cafe.portal_pin !== pin) {
    await trackServerEvent('portal_login_failed', null, { slug });
    return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
  }

  await trackServerEvent('portal_login_succeeded', null, { slug, cafeId: cafe.id });

  const token = createPortalToken(cafe.id);
  const response = NextResponse.json({ success: true, cafeId: cafe.id, cafeName: cafe.name });
  response.cookies.set(`${PORTAL_COOKIE_PREFIX}${cafe.id}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return response;
}
