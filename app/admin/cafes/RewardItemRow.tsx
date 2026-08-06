'use client';

import { updateRewardItem, deleteRewardItem } from '@/app/admin/actions';
import type { RewardItemCategory } from '@/lib/supabase/types';

const CATEGORIES: RewardItemCategory[] = ['drink', 'pastry', 'food', 'other'];

export interface RewardItemData {
  id: string;
  name: string;
  description: string | null;
  category: RewardItemCategory;
  price_cents: number | null;
  reimbursement_cents: number;
  monthly_cap: number | null;
  is_available: boolean;
}

// Always-editable, like CafeForm/PartnerAdminForm elsewhere in this console
// — no separate view/edit toggle. Delete is a second, small form: it's
// server-guarded (see deleteRewardItem's redemption check), so this doesn't
// need its own client-side confirm dialog, matching menu items' plain
// "Remove" button.
export function RewardItemRow({ item, cafeId }: { item: RewardItemData; cafeId: string }) {
  const updateAction = updateRewardItem.bind(null, item.id, cafeId);
  const deleteAction = deleteRewardItem.bind(null, item.id, cafeId);

  return (
    <div className="ratio-box" style={{ marginBottom: 12, opacity: item.is_available ? 1 : 0.6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, gap: 12 }}>
        <strong style={{ fontSize: 15 }}>{item.name}</strong>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--ceremony)', whiteSpace: 'nowrap' }}>
          ${(item.reimbursement_cents / 100).toFixed(2)} reimbursed
        </span>
      </div>

      <form action={updateAction}>
        <div className="field-row">
          <div>
            <label htmlFor={`ri-name-${item.id}`}>Name</label>
            <input type="text" id={`ri-name-${item.id}`} name="name" defaultValue={item.name} required />
          </div>
          <div>
            <label htmlFor={`ri-category-${item.id}`}>Category</label>
            <select id={`ri-category-${item.id}`} name="category" defaultValue={item.category}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ textTransform: 'capitalize' }}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor={`ri-desc-${item.id}`}>Description</label>
          <input type="text" id={`ri-desc-${item.id}`} name="description" defaultValue={item.description ?? ''} />
        </div>

        <div className="field-row">
          <div>
            <label htmlFor={`ri-price-${item.id}`}>Regular price ($)</label>
            <input
              type="number"
              step="0.01"
              min={0}
              id={`ri-price-${item.id}`}
              name="price_dollars"
              defaultValue={item.price_cents != null ? (item.price_cents / 100).toFixed(2) : ''}
            />
          </div>
          <div>
            <label htmlFor={`ri-reimb-${item.id}`} style={{ fontWeight: 700 }}>
              Reimbursement to café ($)
            </label>
            <input
              type="number"
              step="0.01"
              min={0}
              id={`ri-reimb-${item.id}`}
              name="reimbursement_dollars"
              defaultValue={(item.reimbursement_cents / 100).toFixed(2)}
              required
            />
          </div>
        </div>

        <div className="field-row" style={{ marginBottom: 12 }}>
          <div>
            <label htmlFor={`ri-cap-${item.id}`}>Monthly redemption cap</label>
            <input type="number" min={1} step={1} id={`ri-cap-${item.id}`} name="monthly_cap" placeholder="No cap" defaultValue={item.monthly_cap ?? ''} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
              <input type="checkbox" name="is_available" value="true" defaultChecked={item.is_available} style={{ width: 'auto' }} />
              Available for redemption
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }}>
          Save
        </button>
      </form>

      <form action={deleteAction} style={{ marginTop: 8 }}>
        <button type="submit" className="btn btn-ghost" style={{ padding: '6px 16px', fontSize: 12.5 }}>
          Delete
        </button>
      </form>
    </div>
  );
}
