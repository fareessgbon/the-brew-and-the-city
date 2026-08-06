// Supabase's own auth API returns unhelpful error text for a couple of real
// failure modes — most notably a gateway timeout on the confirmation/reset
// email send, whose message is the literal string "{}". Map those to
// something a user can actually act on.
export function friendlyAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (message.trim() === '{}' || lower.includes('timeout') || lower.includes('504')) {
    return 'The server is taking too long to respond — please try again in a moment.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'That email and password don’t match — check for typos, or reset your password below.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirm your email first — check your inbox for the link we sent when you signed up.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'An account with that email already exists — try signing in instead.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts — wait a minute and try again.';
  }
  return message;
}
