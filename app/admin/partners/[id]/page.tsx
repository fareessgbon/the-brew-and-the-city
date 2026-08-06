import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PartnerAdminForm } from './PartnerAdminForm';

export default async function EditPartnerAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: cafe } = await supabase.from('cafes').select('*').eq('id', id).maybeSingle();
  if (!cafe) notFound();

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Partner administration — {cafe.name}</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Tier ({cafe.partner_status}) and stamp/reward participation live on the{' '}
          <a href={`/admin/cafes/${cafe.id}`}>café&apos;s own page</a>.
        </p>
        <PartnerAdminForm cafe={cafe} />
      </div>
    </section>
  );
}
