'use client';

// Wraps fetch() for member-authenticated API calls (/api/rewards,
// /api/rewards/activate, /api/visits, /api/saved-cafes, /api/quiz,
// /api/matches, /api/profile/*, /api/feedback/not-it, /api/account/delete).
// Every one of those returns
// `401 { error: 'Not signed in.' }` if the session expired while the tab
// was already open — a real, documented gap (BETA_TESTING_CHECKLIST.md,
// "Expired session"): the old behaviour left that bare string sitting in
// a notice box with no way back except navigating to /login by hand.
//
// This redirects to /login instead, carrying the current path as `next`
// (already handled safely server-side by app/login/page.tsx via
// lib/safeRedirect.ts) so a login sends the member right back to where
// they were.
//
// Deliberately NOT used for café portal (/api/portal/*) or admin routes —
// a portal 401 means "not this café's session," not "your account expired,"
// and bouncing a café or an admin to the member /login page would be wrong.
export async function memberFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== 'undefined') {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
  }
  return response;
}
