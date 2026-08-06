'use client';

import { useRef } from 'react';
import { addMerchantString } from '@/app/admin/actions';

export function AddMerchantStringForm({ cafes }: { cafes: { id: string; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  async function action(formData: FormData) {
    await addMerchantString(formData);
    formRef.current?.reset();
  }

  return (
    <div className="ratio-box">
      <div className="label" style={{ marginBottom: 8 }}>
        Add merchant string
      </div>
      <form ref={formRef} action={action} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" name="raw_string" placeholder='e.g. "ANALOG COFFEE #1105"' required style={{ minWidth: 240 }} />
        <select name="cafe_id" defaultValue="">
          <option value="">Unmatched — review later</option>
          {cafes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>
    </div>
  );
}
