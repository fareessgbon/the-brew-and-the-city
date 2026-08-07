import { describe, expect, it } from 'vitest';
import { friendlyAuthError } from '../authErrors';

describe('friendlyAuthError', () => {
  it('maps the literal "{}" gateway-timeout body to an actionable message', () => {
    expect(friendlyAuthError(new Error('{}'))).toBe('The server is taking too long to respond — please try again in a moment.');
  });

  it('maps a timeout/504 message the same way, case-insensitively', () => {
    expect(friendlyAuthError(new Error('Request Timeout'))).toMatch(/taking too long/);
    expect(friendlyAuthError(new Error('504 Gateway Timeout'))).toMatch(/taking too long/);
  });

  it('gives a generic mismatch message for bad credentials — never singles out which of email/password was wrong', () => {
    const message = friendlyAuthError(new Error('Invalid login credentials'));
    expect(message).toMatch(/email and password don.t match/i);
    // Must not narrow it down to one field or the other — that's the enumeration leak this guards against.
    expect(message.toLowerCase()).not.toContain('no account');
    expect(message.toLowerCase()).not.toContain('password is incorrect');
    expect(message.toLowerCase()).not.toContain('password incorrect');
  });

  it('tells the user to confirm their email for an unconfirmed account', () => {
    expect(friendlyAuthError(new Error('Email not confirmed'))).toMatch(/confirm your email/i);
  });

  it('tells the user to sign in instead when the email is already registered', () => {
    expect(friendlyAuthError(new Error('User already registered'))).toMatch(/already exists/i);
    expect(friendlyAuthError(new Error('This email has already been registered'))).toMatch(/already exists/i);
  });

  it('gives a rate-limit message without exposing the underlying limiter', () => {
    expect(friendlyAuthError(new Error('rate limit exceeded'))).toMatch(/too many attempts/i);
    expect(friendlyAuthError(new Error('Too Many Requests'))).toMatch(/too many attempts/i);
  });

  it('passes through an unrecognized message verbatim rather than hiding it', () => {
    expect(friendlyAuthError(new Error('Some other Supabase error'))).toBe('Some other Supabase error');
  });

  it('handles a non-Error thrown value', () => {
    expect(friendlyAuthError('a plain string error')).toBe('a plain string error');
  });
});
