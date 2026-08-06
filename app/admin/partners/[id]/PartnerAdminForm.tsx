'use client';

import { updatePartnerAdmin } from '@/app/admin/actions';
import type { Database } from '@/lib/supabase/types';

type Cafe = Database['public']['Tables']['cafes']['Row'];

const LIFECYCLE_STATUSES = ['active', 'paused', 'downgraded', 'cancelled'] as const;

export function PartnerAdminForm({ cafe }: { cafe: Cafe }) {
  const action = updatePartnerAdmin.bind(null, cafe.id);

  return (
    <form action={action} className="cafe-signup-form" style={{ maxWidth: 640 }}>
      <div className="field-row">
        <div>
          <label htmlFor="contract_start_date">Contract start</label>
          <input type="date" id="contract_start_date" name="contract_start_date" defaultValue={cafe.contract_start_date ?? ''} />
        </div>
        <div>
          <label htmlFor="contract_end_date">Contract end</label>
          <input type="date" id="contract_end_date" name="contract_end_date" defaultValue={cafe.contract_end_date ?? ''} />
        </div>
      </div>

      <div className="field-row">
        <div>
          <label htmlFor="monthly_price_dollars">Monthly price ($)</label>
          <input
            type="number"
            step="0.01"
            min={0}
            id="monthly_price_dollars"
            name="monthly_price_dollars"
            defaultValue={cafe.monthly_price_cents != null ? (cafe.monthly_price_cents / 100).toFixed(2) : ''}
          />
        </div>
        <div>
          <label htmlFor="monthly_redemption_cap">Redemption cap (per month)</label>
          <input type="number" min={1} id="monthly_redemption_cap" name="monthly_redemption_cap" defaultValue={cafe.monthly_redemption_cap} />
        </div>
      </div>

      <div>
        <label htmlFor="partner_lifecycle_status">Lifecycle status</label>
        <select id="partner_lifecycle_status" name="partner_lifecycle_status" defaultValue={cafe.partner_lifecycle_status}>
          {LIFECYCLE_STATUSES.map((s) => (
            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="label" style={{ margin: '20px 0 10px' }}>
        Primary contact
      </div>
      <div className="field-row" style={{ marginBottom: 16 }}>
        <div>
          <label htmlFor="primary_contact_name">Name</label>
          <input type="text" id="primary_contact_name" name="primary_contact_name" defaultValue={cafe.primary_contact_name ?? ''} />
        </div>
        <div>
          <label htmlFor="primary_contact_email">Email</label>
          <input type="email" id="primary_contact_email" name="primary_contact_email" defaultValue={cafe.primary_contact_email ?? ''} />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label htmlFor="marketing_deliverables_owed">Marketing deliverables owed</label>
        <textarea
          id="marketing_deliverables_owed"
          name="marketing_deliverables_owed"
          rows={3}
          placeholder="e.g. Instagram feature post, homepage rotation through March"
          defaultValue={cafe.marketing_deliverables_owed ?? ''}
          style={{ width: '100%' }}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Save
      </button>
    </form>
  );
}
