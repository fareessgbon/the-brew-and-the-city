'use client';

import { deleteCafe } from '@/app/admin/actions';

export function DeleteCafeButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCafe.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Delete ${name}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12.5 }}>
        Delete
      </button>
    </form>
  );
}
