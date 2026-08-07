import { describe, expect, it } from 'vitest';
import { isSafeInternalPath, safeInternalPath } from '../safeRedirect';

describe('isSafeInternalPath', () => {
  it('accepts a plain internal path', () => {
    expect(isSafeInternalPath('/today')).toBe(true);
    expect(isSafeInternalPath('/onboarding/quiz')).toBe(true);
    expect(isSafeInternalPath('/admin/cafes/123')).toBe(true);
  });

  it('rejects non-string input', () => {
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
    expect(isSafeInternalPath(42)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isSafeInternalPath('')).toBe(false);
  });

  it('rejects a path that does not start with /', () => {
    expect(isSafeInternalPath('today')).toBe(false);
    expect(isSafeInternalPath('https://evil.com')).toBe(false);
  });

  it('rejects a protocol-relative URL (//evil.com) — browsers treat this as an absolute redirect', () => {
    expect(isSafeInternalPath('//evil.com')).toBe(false);
    expect(isSafeInternalPath('//evil.com/phishing')).toBe(false);
  });

  it('rejects a backslash-prefixed path — browsers treat a leading backslash as a slash', () => {
    expect(isSafeInternalPath('/\\evil.com')).toBe(false);
  });

  it('rejects a full external URL with a scheme', () => {
    expect(isSafeInternalPath('http://evil.com')).toBe(false);
    expect(isSafeInternalPath('javascript:alert(1)')).toBe(false);
  });
});

describe('safeInternalPath', () => {
  it('returns the path unchanged when it is safe', () => {
    expect(safeInternalPath('/today', '/onboarding')).toBe('/today');
  });

  it('returns the fallback when the path is unsafe', () => {
    expect(safeInternalPath('//evil.com', '/onboarding')).toBe('/onboarding');
    expect(safeInternalPath(null, '/onboarding')).toBe('/onboarding');
    expect(safeInternalPath(undefined, '/onboarding')).toBe('/onboarding');
  });
});
