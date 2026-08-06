import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/server';

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// GET /api/admin/reimbursements/export — §10 "export". Same data as the
// admin reimbursements page, flattened to one row per redemption.
export async function GET() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [{ data: rewards }, { data: cafes }, { data: payments }] = await Promise.all([
    supabase
      .from('rewards')
      .select('id, redeemed_at, redeemed_at_cafe_id, reward_item_id, reward_items(name, reimbursement_cents, cafe_id)')
      .eq('status', 'redeemed')
      .not('reward_item_id', 'is', null)
      .order('redeemed_at', { ascending: false }),
    supabase.from('cafes').select('id, name'),
    supabase.from('reimbursement_payments').select('reward_id, paid_at'),
  ]);

  const cafeNames = new Map((cafes ?? []).map((c) => [c.id, c.name]));
  const paidByReward = new Map((payments ?? []).map((p) => [p.reward_id, p.paid_at]));

  const header = ['cafe', 'item', 'amount_cents', 'redeemed_at', 'status', 'paid_at'];
  const rows = (rewards ?? [])
    .filter((r) => r.reward_items)
    .map((r) => {
      const cafeId = r.redeemed_at_cafe_id ?? r.reward_items!.cafe_id;
      const paidAt = paidByReward.get(r.id) ?? null;
      return [
        csvField(cafeNames.get(cafeId) ?? 'Unknown café'),
        csvField(r.reward_items!.name),
        String(r.reward_items!.reimbursement_cents),
        r.redeemed_at ?? '',
        paidAt ? 'paid' : 'owed',
        paidAt ?? '',
      ].join(',');
    });

  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reimbursements-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
