'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Dim, PrimaryDrinkCategory, TasteVector } from '@/lib/matching';
import { saveQuizProgress } from '@/lib/quizProgress';
import { track } from '@/lib/analytics';
import { friendlyAuthError } from '@/lib/authErrors';

interface SignupFormProps {
  userVector: TasteVector;
  answeredDims: readonly Dim[];
  primaryDrinkCategory: PrimaryDrinkCategory | null;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function SignupForm({ userVector, answeredDims, primaryDrinkCategory }: SignupFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    if (!email || !password) return;

    // Stash the homepage answers so the full quiz can resume from them
    // instead of starting over — read back in FullQuiz.tsx. The
    // confirmation link commonly opens in a new tab, so this has to survive
    // across tabs (localStorage, not sessionStorage) with a real expiry.
    saveQuizProgress(userVector, answeredDims, primaryDrinkCategory);

    setStatus('sending');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/quiz` },
      });
      if (error) throw error;
      track('signup_requested', { source: 'homepage_signup' });
      setStatus('sent');
      setMessage(`Check ${email} to confirm your account — we'll pick the quiz back up from where you left off.`);
    } catch (err) {
      setStatus('error');
      setMessage(friendlyAuthError(err));
    }
  }

  if (status === 'sent') {
    return <div className="form-success">{message}</div>;
  }

  return (
    <>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" required autoComplete="email" />
        <input type="password" name="password" placeholder="Password (6+ characters)" required minLength={6} autoComplete="new-password" />
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Creating account…' : 'Save my matches'}
        </button>
      </form>
      {status === 'error' ? <div className="form-success">{message}</div> : null}
      <div className="form-note">
        We&apos;ll email you a link to confirm your account, then pick the quiz up right where you left off. By
        signing up you agree to our <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms</a>.
      </div>
      <div className="form-note" style={{ marginTop: 8 }}>
        Already have an account? <a href="/login">Log in</a>
      </div>
    </>
  );
}
