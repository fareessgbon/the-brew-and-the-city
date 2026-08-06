import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { createClient } from '@/lib/supabase/server';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = { title: 'Set a new password — Brew and the City' };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader />
      <section style={{ padding: '72px 0' }}>
        <div className="wrap" style={{ maxWidth: 480 }}>
          <div className="label eyebrow">Reset password</div>
          <h1 style={{ fontSize: 34, marginBottom: 12 }}>Set a new password.</h1>
          {user ? (
            <ResetPasswordForm />
          ) : (
            <p style={{ fontSize: 17, color: 'var(--ink)' }}>
              That link expired or was already used — <Link href="/forgot-password">request a new one</Link>.
            </p>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
