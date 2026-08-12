// Thin wrapper around Resend, mirroring lib/supabase/server.ts's
// createAdminClient() pattern — a factory that throws clearly if the env
// var is missing, rather than a client constructed at module load time
// (which would crash the whole route file on import if the key isn't set
// yet, instead of failing only the one request that needed it).

import { Resend } from 'resend';

export function createEmailClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend is not configured yet. Set RESEND_API_KEY — see .env.local.example.');
  }
  return new Resend(apiKey);
}

// The verified sending domain in Resend is the root, brewandthecity.com.
//
// This used to read hello@send.brewandthecity.com, on the assumption that
// the `send.` subdomain was the sending identity — every send failed with
// "This API key is not authorized to send emails from
// send.brewandthecity.com" and, because every caller treats mail as
// best-effort, failed silently: three real applicants were told their
// application was in and heard nothing.
//
// send. is Resend's bounce/return-path subdomain, not an identity. It's
// where their setup puts the MX and SPF records for a root-domain
// verification, precisely so neither one collides with the Google
// Workspace MX on @ — the concern that put this address on the subdomain
// in the first place is handled by that split, not by the From header.
// Only the DKIM TXT lands on the root, which Workspace doesn't care about.
const FROM_ADDRESS = 'Brew and the City <hello@brewandthecity.com>';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

// Best-effort by design: callers should treat a failed send as a logged
// error, never as a reason to fail the user-facing request. The database
// row (survey response, waitlist entry) is the source of truth; the email
// is a courtesy on top of it.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ id: string } | null> {
  const resend = createEmailClient();
  const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  if (error) {
    throw new Error(typeof error === 'object' && 'message' in error ? error.message : 'Resend send failed.');
  }
  return data;
}
