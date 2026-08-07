'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      // Full reload, not router.push — the page is a server component that
      // reads the auth cookie at render time, so it needs a fresh request.
      router.refresh();
    } catch (err) {
      setStatus('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 360, padding: '80px 24px' }}>
      <div className="label eyebrow">Admin</div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Enter the admin PIN</h1>
      <form onSubmit={handleSubmit} className="cafe-signup-form" style={{ background: '#faf8f4' }}>
        <label htmlFor="pin">PIN</label>
        <input
          type="password"
          id="pin"
          name="pin"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Checking…' : 'Enter'}
        </button>
        {error ? (
          <div style={{ fontSize: 13, color: '#b3402a', marginTop: 12 }} role="alert">
            {error}
          </div>
        ) : null}
      </form>
    </div>
  );
}
