'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function PortalLoginForm({ slug, cafeName }: { slug: string; cafeName: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pin = (e.currentTarget.elements.namedItem('pin') as HTMLInputElement).value.trim();
    if (!pin) return;

    setStatus('checking');
    setError('');
    try {
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Incorrect PIN.');
      router.push(`/portal/${slug}/dashboard`);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: 26, marginBottom: 8 }}>{cafeName}</h1>
      <p style={{ fontSize: 14, color: 'var(--whisk)', marginBottom: 24 }}>Enter your café&apos;s portal PIN.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          inputMode="numeric"
          name="pin"
          placeholder="PIN"
          autoFocus
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid var(--whisk-10)',
            fontSize: 20,
            letterSpacing: '0.3em',
            textAlign: 'center',
            marginBottom: 16,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <button type="submit" className="btn btn-primary" disabled={status === 'checking'} style={{ width: '100%' }}>
          {status === 'checking' ? 'Checking…' : 'Enter'}
        </button>
      </form>
      {error ? <div style={{ color: 'var(--error, #A8503F)', fontSize: 13, marginTop: 12 }}>{error}</div> : null}
    </div>
  );
}
