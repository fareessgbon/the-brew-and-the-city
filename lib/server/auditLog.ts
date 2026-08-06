import { createAdminClient } from '@/lib/supabase/server';

// §12 — structured actor/record/prev/new fields alongside the original
// human-readable summary/detail (migration 0015 added the columns).
export interface AuditLogRecord {
  recordType?: string;
  recordId?: string;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

// Called from admin Server Actions after a change actually succeeds — never
// from a read path, and never before the mutating query, so a log entry
// always corresponds to something that really happened.
export async function logAdminAction(adminEmail: string, action: string, summary: string, detail?: Record<string, unknown>, record?: AuditLogRecord) {
  const admin = createAdminClient();
  await admin.from('audit_log').insert({
    admin_email: adminEmail,
    action,
    summary,
    detail: detail ?? null,
    record_type: record?.recordType ?? null,
    record_id: record?.recordId ?? null,
    previous_value: record?.previousValue ?? null,
    new_value: record?.newValue ?? null,
  });
}
