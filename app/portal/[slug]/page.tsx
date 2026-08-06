import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { PortalLoginForm } from '@/components/portal/PortalLoginForm';

export default async function PortalLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: cafe } = await admin.from('cafes').select('id, name, portal_pin').eq('slug', slug).maybeSingle();
  if (!cafe) notFound();

  if (await hasPortalSession(cafe.id)) {
    redirect(`/portal/${slug}/dashboard`);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {cafe.portal_pin ? (
        <PortalLoginForm slug={slug} cafeName={cafe.name} />
      ) : (
        <div style={{ maxWidth: 360, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>{cafe.name}</h1>
          <p style={{ fontSize: 14, color: 'var(--whisk)' }}>
            No portal PIN has been set up for this café yet. Ask Brew and the City to set one from the admin dashboard.
          </p>
        </div>
      )}
      <Link href="/" style={{ fontSize: 13, color: 'var(--whisk)', marginTop: 28 }}>
        ← Back to Brew and the City
      </Link>
    </div>
  );
}
