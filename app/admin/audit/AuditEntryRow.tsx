'use client';

import { useState } from 'react';

export interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  summary: string;
  detail: Record<string, unknown> | null;
  record_type: string | null;
  record_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export function AuditEntryRow({ entry, actionLabel }: { entry: AuditEntry; actionLabel: string }) {
  const [open, setOpen] = useState(false);
  const hasStructuredData = !!(entry.record_type || entry.record_id || entry.previous_value || entry.new_value);

  return (
    <div className="ratio-row" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 4, padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12 }}>
        <span style={{ fontWeight: 600 }}>{entry.summary}</span>
        <span style={{ fontSize: 12, color: 'var(--whisk)', whiteSpace: 'nowrap' }}>{new Date(entry.created_at).toLocaleString('en-CA')}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--whisk)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          {actionLabel} · {entry.admin_email}
          {entry.record_type ? ` · ${entry.record_type}${entry.record_id ? ` (${entry.record_id.slice(0, 8)}…)` : ''}` : ''}
        </span>
        {hasStructuredData ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--ink)', background: 'none', border: '1px solid var(--whisk-10)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}
          >
            {open ? 'Hide details' : 'Details'}
          </button>
        ) : null}
      </div>
      {open ? (
        <div style={{ width: '100%', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, fontFamily: 'var(--font-mono)', background: 'var(--paper-2)', borderRadius: 8, padding: 10, marginTop: 4 }}>
          {entry.previous_value ? (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: 'var(--whisk)', marginBottom: 4 }}>Previous</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(entry.previous_value, null, 1)}</pre>
            </div>
          ) : null}
          {entry.new_value ? (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: 'var(--whisk)', marginBottom: 4 }}>New</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(entry.new_value, null, 1)}</pre>
            </div>
          ) : null}
          {!entry.previous_value && !entry.new_value && entry.detail ? (
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ color: 'var(--whisk)', marginBottom: 4 }}>Detail</div>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(entry.detail, null, 1)}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
