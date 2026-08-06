'use client';

import { useRef } from 'react';
import { addRewardItem } from '@/app/admin/actions';
import type { RewardItemCategory } from '@/lib/supabase/types';

const CATEGORIES: RewardItemCategory[] = ['drink', 'pastry', 'food', 'other'];

export function AddRewardItemForm({ cafeId }: { cafeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = addRewardItem.bind(null, cafeId);

  async function action(formData: FormData) {
    await boundAction(formData);
    formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={action} className="cafe-signup-form" style={{ maxWidth: 480 }}>
      <div className="field-row">
        <div>
          <label htmlFor="new-ri-name">Item name</label>
          <input type="text" id="new-ri-name" name="name" required />
        </div>
        <div>
          <label htmlFor="new-ri-category">Category</label>
          <select id="new-ri-category" name="category" defaultValue="drink">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ textTransform: 'capitalize' }}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label htmlFor="new-ri-desc">Description</label>
        <input type="text" id="new-ri-desc" name="description" placeholder="e.g. 12oz, oat milk included" />
      </div>

      <div className="field-row">
        <div>
          <label htmlFor="new-ri-price">Regular price ($)</label>
          <input type="number" step="0.01" min={0} id="new-ri-price" name="price_dollars" />
        </div>
        <div>
          <label htmlFor="new-ri-reimb" style={{ fontWeight: 700 }}>
            Reimbursement to café ($)
          </label>
          <input type="number" step="0.01" min={0} id="new-ri-reimb" name="reimbursement_dollars" defaultValue="4.00" required />
        </div>
      </div>

      <div className="field-row" style={{ marginBottom: 12 }}>
        <div>
          <label htmlFor="new-ri-cap">Monthly redemption cap</label>
          <input type="number" min={1} step={1} id="new-ri-cap" name="monthly_cap" placeholder="No cap" />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'none' }}>
            <input type="checkbox" name="is_available" value="true" defaultChecked style={{ width: 'auto' }} />
            Available for redemption
          </label>
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        Add reward item
      </button>
    </form>
  );
}
