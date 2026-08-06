import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { hasPortalSession } from '@/lib/portalSession';
import { getWeeklyCafeStats } from '@/lib/server/portalStats';
import { PortalDashboard, type PendingVisit } from '@/components/portal/PortalDashboard';

export default async function PortalDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: cafe } = await admin.from('cafes').select('id, name').eq('slug', slug).maybeSingle();
  if (!cafe) notFound();

  if (!(await hasPortalSession(cafe.id))) {
    redirect(`/portal/${slug}`);
  }

  const [{ data: visits }, { data: rewardItems }, { data: recentVisits }, weeklyStats] = await Promise.all([
    admin
      .from('visits')
      .select('id, created_at, receipt_image_path, users(name, email)')
      .eq('cafe_id', cafe.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin.from('reward_items').select('*').eq('cafe_id', cafe.id).order('created_at', { ascending: true }),
    admin
      .from('visits')
      .select('id, status, reviewed_at, users(name, email)')
      .eq('cafe_id', cafe.id)
      .in('status', ['approved', 'rejected'])
      .order('reviewed_at', { ascending: false })
      .limit(20),
    getWeeklyCafeStats(cafe.id),
  ]);

  const pendingVisits: PendingVisit[] = await Promise.all(
    (visits ?? []).map(async (v) => {
      let receiptUrl: string | null = null;
      if (v.receipt_image_path) {
        const { data: signed } = await admin.storage.from('receipts').createSignedUrl(v.receipt_image_path, 600);
        receiptUrl = signed?.signedUrl ?? null;
      }
      return {
        id: v.id,
        createdAt: v.created_at,
        memberName: v.users?.name ?? null,
        memberEmail: v.users?.email ?? 'unknown',
        receiptUrl,
      };
    }),
  );

  const visitHistory = (recentVisits ?? []).map((v) => ({
    id: v.id,
    status: v.status as 'approved' | 'rejected',
    reviewedAt: v.reviewed_at,
    memberName: v.users?.name ?? null,
    memberEmail: v.users?.email ?? 'unknown',
  }));

  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      <PortalDashboard
        slug={slug}
        cafeId={cafe.id}
        cafeName={cafe.name}
        initialVisits={pendingVisits}
        initialRewardItems={rewardItems ?? []}
        weeklyStats={weeklyStats}
        visitHistory={visitHistory}
      />
    </div>
  );
}
