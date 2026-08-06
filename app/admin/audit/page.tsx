import { createAdminClient } from '@/lib/supabase/server';
import { AuditEntryRow } from './AuditEntryRow';

const ACTION_LABELS: Record<string, string> = {
  'cafe.create': 'Café created',
  'cafe.update': 'Café updated',
  'cafe.delete': 'Café deleted',
  'cafe.csv_import': 'CSV import',
  'menu_item.create': 'Menu item added',
  'menu_item.delete': 'Menu item deleted',
  'application.approve': 'Application approved',
  'application.reject': 'Application rejected',
  'visit.review': 'Visit reviewed (backup)',
  'visit.force_add_stamp': 'Stamp force-added',
  'receipts.purge': 'Receipts purged',
  'merchant_string.add': 'Merchant string added',
  'merchant_string.map': 'Merchant string mapped',
  'merchant_string.delete': 'Merchant string deleted',
  'partner.update': 'Partner administration updated',
  'reimbursement.mark_paid': 'Reimbursement marked paid',
  'feature_flag.toggle': 'Feature flag changed',
};

export default async function AdminAuditPage() {
  const supabase = createAdminClient();
  const { data: entries, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <section style={{ padding: '48px 0' }}>
      <div className="wrap">
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Audit log</h1>
        <p style={{ color: 'var(--whisk)', fontSize: 14, marginBottom: 24 }}>
          Every admin action across cafés, CSV import, menu items, partner applications, receipt review, merchant
          strings, partner administration, reimbursements, and feature flags — most recent first, last 200. Actions
          on a specific record show its type and id, with a Details toggle for the previous/new value.
        </p>

        {error ? (
          <p style={{ color: 'var(--error, #A8503F)' }}>Failed to load audit log: {error.message}</p>
        ) : !entries || entries.length === 0 ? (
          <p style={{ color: 'var(--whisk)' }}>No administrative changes recorded yet.</p>
        ) : (
          <div className="ratio-box">
            {entries.map((entry) => (
              <AuditEntryRow key={entry.id} entry={entry} actionLabel={ACTION_LABELS[entry.action] ?? entry.action} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
