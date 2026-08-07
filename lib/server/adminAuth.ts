// Single shared-secret PIN, not real auth — deliberate, matching this
// build's "no accounts, ever" rule (§0.4). This just needs to keep the
// /admin page (real emails, real survey answers) off the open internet;
// it doesn't need per-user accounts to do that.
//
// The cookie never stores the PIN itself — its value is a hash, so a
// leaked cookie doesn't hand over the actual secret (which would let
// someone log in fresh from a different session).

import { createHash } from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'admin_session';

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// null, not a thrown error, when ADMIN_PIN isn't set — so a misconfigured
// deployment fails closed (nobody gets in) instead of crashing the page.
export function expectedAdminToken(): string | null {
  const pin = process.env.ADMIN_PIN;
  return pin ? hash(pin) : null;
}

export function verifyAdminPin(pin: string): boolean {
  const expected = process.env.ADMIN_PIN;
  return expected != null && pin === expected;
}

// Shared by every /api/admin/* route handler that isn't the login route
// itself — reads the same cookie app/admin/page.tsx checks, so the review
// workflow's mutating endpoints (status change, notes, CSV export) can't
// be hit directly even by someone who knows the URL shape.
export function isAdminRequest(request: Request): boolean {
  const expected = expectedAdminToken();
  if (!expected) return false;
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
  return match?.slice(ADMIN_COOKIE_NAME.length + 1) === expected;
}
