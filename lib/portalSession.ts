import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

// Café portal access is a PIN, not a Supabase Auth account (§21 — "no POS
// integration, no new hardware, a web page and a PIN"), so there's no JWT
// for RLS to check. A correct PIN gets a short-lived signed cookie instead;
// every portal route verifies that signature server-side before using the
// service-role client to actually read/write data for that café.
//
// Reuses SUPABASE_SERVICE_ROLE_KEY as the HMAC secret rather than requiring
// a new env var — it's already a strong, server-only secret. A dedicated
// PORTAL_SESSION_SECRET would be cleaner in a real production deploy.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const PORTAL_COOKIE_PREFIX = 'mm_portal_';

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — cannot sign portal sessions.');
  return key;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createPortalToken(cafeId: string): string {
  const payload = `${cafeId}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyPortalToken(token: string | undefined | null, expectedCafeId: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [cafeId, expiresAtStr, signature] = parts;
  const payload = `${cafeId}.${expiresAtStr}`;
  const expectedSignature = sign(payload);

  if (signature.length !== expectedSignature.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return cafeId === expectedCafeId;
}

// Convenience for Server Components / Route Handlers — reads the request's
// cookie jar directly rather than making every caller thread a token through.
export async function hasPortalSession(cafeId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(`${PORTAL_COOKIE_PREFIX}${cafeId}`)?.value;
  return verifyPortalToken(token, cafeId);
}
