import { createAdminClient } from '@/lib/supabase/server';

// Server-side error monitoring that doesn't depend on a third-party key
// (Sentry, etc. — none configured). Every failed Supabase request in an API
// route should go through this instead of a bare console.error, so failures
// are queryable later (`select * from error_logs order by created_at desc`)
// instead of living only in whatever log stream happened to be watched at
// the time. Still console.errors too — that's free, keep it.
// Supabase errors are plain objects, not Error instances, so String(error)
// on the most common input to this function produced the literal text
// "[object Object]" — every logged database failure recorded that it had
// happened and nothing about what it was. Reproduced live: a check-
// constraint violation logged "[object Object]" instead of the constraint
// name that identified the problem outright.
function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const { message, code } = error as { message?: unknown; code?: unknown };
    if (typeof message === 'string') {
      // Postgres error codes are worth keeping — 23505 (unique violation)
      // and 23514 (check violation) each say something the message alone
      // doesn't make obvious.
      return typeof code === 'string' ? `${code}: ${message}` : message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

export async function logServerError(scope: string, error: unknown, detail?: Record<string, unknown>, userId?: string | null) {
  const message = describeError(error);
  console.error(`[${scope}]`, message, detail ?? '');

  try {
    const admin = createAdminClient();
    await admin.from('error_logs').insert({
      scope,
      message,
      detail: detail ?? null,
      user_id: userId ?? null,
    });
  } catch (loggingError) {
    // The error log itself failing to write must never throw past this —
    // that would turn a logging problem into a request-breaking one.
    console.error('[logServerError] failed to persist error log', loggingError);
  }
}
