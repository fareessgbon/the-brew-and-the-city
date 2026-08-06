import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { safeInternalPath } from '@/lib/safeRedirect';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Log in — Brew and the City' };

const ERROR_MESSAGES: Record<string, string> = {
  auth: 'That link has expired or was already used — request a new one below.',
  expired: 'That link expired — request a new one below.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const nextPath = safeInternalPath(next, '/onboarding');
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.auth) : null;

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div className="label eyebrow">Sign in</div>
          <h1 style={{ fontSize: 34, marginBottom: 12 }}>Welcome back.</h1>
          <p style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 32 }}>Sign in with your email and password.</p>
          {errorMessage ? (
            <div className="notice-box" style={{ marginBottom: 20, color: 'var(--error, #A8503F)' }}>
              {errorMessage}
            </div>
          ) : null}
          <LoginForm nextPath={nextPath} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
