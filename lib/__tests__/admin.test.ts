import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdminEmail } from '../admin';

// requireAdmin() itself isn't covered here — it's a thin wrapper that reads
// the real Supabase session and calls next/navigation's redirect(), which
// needs a request context to test meaningfully. isAdminEmail() is the actual
// authorization decision (who counts as an admin), and it's pure enough to
// test directly against ADMIN_EMAILS without any of that.
describe('isAdminEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false when ADMIN_EMAILS is unset', () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    expect(isAdminEmail('anyone@example.com')).toBe(false);
  });

  it('returns true for an exact match', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    expect(isAdminEmail('admin@example.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    vi.stubEnv('ADMIN_EMAILS', 'Admin@Example.com');
    expect(isAdminEmail('admin@example.com')).toBe(true);
    expect(isAdminEmail('ADMIN@EXAMPLE.COM')).toBe(true);
  });

  it('tolerates whitespace around entries in the allowlist', () => {
    vi.stubEnv('ADMIN_EMAILS', ' admin@example.com , owner@example.com ');
    expect(isAdminEmail('admin@example.com')).toBe(true);
    expect(isAdminEmail('owner@example.com')).toBe(true);
  });

  it('rejects an email not in the allowlist', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    expect(isAdminEmail('someone-else@example.com')).toBe(false);
  });

  it('rejects a partial/substring match — no prefix or domain-only matching', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    expect(isAdminEmail('notadmin@example.com')).toBe(false);
    expect(isAdminEmail('admin@example.com.evil.com')).toBe(false);
  });

  it('returns false for null/undefined input', () => {
    vi.stubEnv('ADMIN_EMAILS', 'admin@example.com');
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it('supports multiple comma-separated admins', () => {
    vi.stubEnv('ADMIN_EMAILS', 'first@example.com,second@example.com,third@example.com');
    expect(isAdminEmail('second@example.com')).toBe(true);
    expect(isAdminEmail('fourth@example.com')).toBe(false);
  });
});
