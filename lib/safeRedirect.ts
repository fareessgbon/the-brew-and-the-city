// Guards every place a `next`/redirect destination comes from a URL param
// (login page, magic-link callback) against open-redirect payloads like
// `//evil.com`, `https://evil.com`, or `/\evil.com` (browsers treat a
// leading backslash as a slash). Only a single leading `/` followed by a
// non-slash is accepted.
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  return true;
}

export function safeInternalPath(path: unknown, fallback: string): string {
  return isSafeInternalPath(path) ? path : fallback;
}
