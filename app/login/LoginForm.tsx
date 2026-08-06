'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics';
import { friendlyAuthError } from '@/lib/authErrors';

type Status = 'idle' | 'checking' | 'error';

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!email || !password) return;

    setStatus('checking');
    setMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      track('login_submitted', { source: 'login' });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
    }
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit} style={{ maxWidth: 400, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <input type="password" name="password" placeholder="Password" required autoComplete="current-password" />
        <button type="submit" className="btn btn-primary" disabled={status === 'checking'}>
          {status === 'checking' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
      <div className="form-note">
        <Link href="/forgot-password">Forgot password?</Link> · New here?{' '}
        <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>Create an account</Link>
      </div>
    </>
  );
}
