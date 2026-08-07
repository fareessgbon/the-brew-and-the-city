import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createPortalToken, PORTAL_COOKIE_PREFIX } from '@/lib/portalSession';
import { trackServerEvent } from '@/lib/server/trackEvent';
import { logServerError } from '@/lib/server/logError';
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit';
import { nextOnboardingStatusAfterLogin } from '@/lib/admin/partnerOnboarding';

// Two limits, because they defend against different things:
//   • per-IP (in-memory, no DB round-trip) stops one attacker hammering.
//   • per-slug (database-backed, survives a cold start) is the real
//     brute-force ceiling on a single café's PIN.
// The per-slug ceiling is deliberately the looser of the two. It used to be
// 10, which meant an attacker could lock a real café out of its own portal
// for 15 minutes with ten wrong guesses — a trivial denial-of-service
// against a paying partner, and cheaper to run than the brute force it was
// meant to prevent. 25/15min is still only ~100 guesses an hour.
const MAX_ATTEMPTS_PER_IP = 10;
const MAX_ATTEMPTS_PER_SLUG = 25;
const WINDOW_MS = 15 * 60 * 1000;

// Constant-time comparison so response latency can't be used to learn the
// PIN character by character. Length is compared non-secretly first, since
// timingSafeEqual throws on a length mismatch.
function pinMatches(submitted: string, expected: string): boolean {
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

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

  const tooManyFromThisIp = !checkRateLimit(`portal-login:${clientIp(request)}`, MAX_ATTEMPTS_PER_IP, WINDOW_MS).allowed;
  if (tooManyFromThisIp) {
    return NextResponse.json({ error: 'Too many attempts — please wait 15 minutes and try again.' }, { status: 429 });
  }

  const admin = createAdminClient();

  // Counts only failures written by this route via trackServerEvent().
  // `portal_login_failed` is no longer accepted from browsers by
  // /api/analytics/track (see lib/analyticsEvents.ts) — before that change,
  // anyone could forge these rows and lock any café out at will.
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count: recentFailures } = await admin
    .from('analytics_events')
    .select('id', { count: 'exact', head: true })
    .eq('event', 'portal_login_failed')
    .eq('properties->>slug', slug)
    .gte('created_at', windowStart);

  if ((recentFailures ?? 0) >= MAX_ATTEMPTS_PER_SLUG) {
    return NextResponse.json({ error: 'Too many attempts — please wait 15 minutes and try again.' }, { status: 429 });
  }

  const { data: cafe, error } = await admin.from('cafes').select('id, name, portal_pin, onboarding_status').eq('slug', slug).maybeSingle();
  if (error) {
    await logServerError('api.portal.login', error, { slug });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  if (!cafe || !cafe.portal_pin || !pinMatches(pin, cafe.portal_pin)) {
    await trackServerEvent('portal_login_failed', null, { slug });
    return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
  }

  await trackServerEvent('portal_login_succeeded', null, { slug, cafeId: cafe.id });

  // A café's very first successful portal login is the practical signal
  // that onboarding actually happened (the credential was received and
  // used) — flips 'pending_portal_setup' to 'active' once; a no-op update
  // on every login after that.
  const nextOnboardingStatus = nextOnboardingStatusAfterLogin(cafe.onboarding_status);
  if (nextOnboardingStatus !== cafe.onboarding_status) {
    await admin.from('cafes').update({ onboarding_status: nextOnboardingStatus }).eq('id', cafe.id);
  }

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
