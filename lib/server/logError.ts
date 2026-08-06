import { createAdminClient } from '@/lib/supabase/server';

// Server-side error monitoring that doesn't depend on a third-party key
// (Sentry, etc. — none configured). Every failed Supabase request in an API
// route should go through this instead of a bare console.error, so failures
// are queryable later (`select * from error_logs order by created_at desc`)
// instead of living only in whatever log stream happened to be watched at
// the time. Still console.errors too — that's free, keep it.
export async function logServerError(scope: string, error: unknown, detail?: Record<string, unknown>, userId?: string | null) {
  const message = error instanceof Error ? error.message : String(error);
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
