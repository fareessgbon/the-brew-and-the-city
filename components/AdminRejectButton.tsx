'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Sends the applicant a rejection email and closes the row out as declined
// (POST /api/admin/survey-responses/[id]/reject).
//
// Same two-click pattern as AdminDeleteButton, for a stronger reason: a
// delete is soft and recoverable, an email is neither. The confirm step
// names the person and says the word "email" out loud, so the second click
// is made knowing exactly who is about to hear no — and once it's sent the
// control stops being a button at all, since there is nothing left to do
// here and a live button invites a second send.
export function AdminRejectButton({
  id,
  applicantName,
  sentAt,
  // An application with no email address can't be rejected by mail. The
  // control still renders, greyed, rather than vanishing — a missing button
  // reads as a bug, and this way the reason is on screen.
  hasEmail,
}: {
  id: string;
  applicantName: string;
  sentAt: string | null;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch(`/api/admin/survey-responses/${id}/reject`, { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        // The route's messages are written for this spot — a 409 says a
        // rejection already went out, a 502 says nothing was changed and a
        // retry is safe. Passing them straight through beats "Failed".
        throw new Error(body?.error ?? 'The rejection didn’t send.');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The rejection didn’t send.');
    } finally {
      setStatus('idle');
      setConfirming(false);
    }
  }

  if (sentAt) {
    return (
      <span style={{ fontSize: 12, color: 'var(--whisk)' }}>
        Rejection sent {new Date(sentAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
      </span>
    );
  }

  if (!hasEmail) {
    return (
      <span style={{ fontSize: 12, color: 'var(--whisk)' }} title="No email address on this application">
        No email to reject to
      </span>
    );
  }

  if (status === 'sending') {
    return <span style={{ fontSize: 12, color: 'var(--whisk)' }}>Sending…</span>;
  }

  if (confirming) {
    // First name only, same as the email itself — and it's the applicant's
    // own text, rendered as text by React, never as markup.
    const firstName = applicantName.split(/\s+/)[0];
    return (
      <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#b3402a' }}>Email {firstName} a rejection?</span>
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            background: '#b3402a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 12,
            padding: '3px 10px',
            cursor: 'pointer',
          }}
        >
          Send it
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          style={{ background: 'none', border: 'none', color: 'var(--whisk)', fontSize: 12, cursor: 'pointer', padding: 0 }}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--whisk)',
          fontSize: 12,
          cursor: 'pointer',
          padding: 0,
          textDecoration: 'underline',
        }}
      >
        Send rejection
      </button>
      {/* Kept next to the button rather than replacing its label: some of
          these messages are two sentences, and one of them ("the email
          sent, but…") must not be mistaken for a prompt to click again. */}
      {error ? <span style={{ fontSize: 12, color: '#b3402a' }}>{error}</span> : null}
    </span>
  );
}
