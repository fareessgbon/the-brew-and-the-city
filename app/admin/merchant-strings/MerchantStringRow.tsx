'use client';

import { setMerchantStringCafe, deleteMerchantString } from '@/app/admin/actions';

export function MerchantStringRow({
  id,
  rawString,
  cafeId,
  cafeName,
  createdAt,
  cafes,
}: {
  id: string;
  rawString: string;
  cafeId: string | null;
  cafeName?: string | null;
  createdAt: string;
  cafes: { id: string; name: string }[];
}) {
  const mapAction = setMerchantStringCafe.bind(null, id);
  const deleteAction = deleteMerchantString.bind(null, id);

  return (
    <tr>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{rawString}</td>
      {cafeId ? <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>{cafeName ?? '—'}</td> : null}
      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)', color: 'var(--whisk)', fontSize: 12.5 }}>{new Date(createdAt).toLocaleDateString('en-CA')}</td>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
        <form action={mapAction} style={{ display: 'flex', gap: 8 }}>
          <select name="cafe_id" defaultValue={cafeId ?? ''}>
            <option value="">Unmatched</option>
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12.5 }}>
            {cafeId ? 'Reassign' : 'Map'}
          </button>
        </form>
      </td>
      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--paper-2)' }}>
        <form action={deleteAction}>
          <button type="submit" className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12.5 }}>
            Delete
          </button>
        </form>
      </td>
    </tr>
  );
}
