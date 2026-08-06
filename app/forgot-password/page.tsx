import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset your password — Brew and the City' };

export default function ForgotPasswordPage() {
  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div className="label eyebrow">Reset password</div>
          <h1 style={{ fontSize: 34, marginBottom: 12 }}>Forgot your password?</h1>
          <p style={{ fontSize: 17, color: 'var(--ink)', marginBottom: 32 }}>
            Enter your email and we&apos;ll send you a link to set a new one.
          </p>
          <ForgotPasswordForm />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
