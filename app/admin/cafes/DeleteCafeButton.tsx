'use client';

import { useState } from 'react';
import { deleteCafe } from '@/app/admin/actions';

// Not exposed anywhere but this one confirmation flow — deleteCafe itself
// is the real guard (assertCafeHasNoHistory in actions.ts refuses anything
// with real visits, redemptions, menu items, reward items, or member
// bookmarks on record; its error surfaces via the root error boundary,
// app/error.tsx). Deleting a café is still irreversible for the rare case
// it *is* allowed, so this adds the same type-the-name confirmation
// DeleteAccountForm.tsx uses before a member deletes their own account.
export function DeleteCafeButton({ cafeId, cafeName }: { cafeId: string; cafeName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const deleteAction = deleteCafe.bind(null, cafeId);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-ghost"
        style={{ padding: '6px 16px', fontSize: 12.5, color: 'var(--error, #A8503F)' }}
      >
        Delete café
      </button>
    );
  }

  return (
    <div className="notice-box" style={{ maxWidth: 420 }}>
      <div style={{ fontSize: 13.5, marginBottom: 10 }}>
        This permanently deletes <strong>{cafeName}</strong> — its profile, menu, and reward items. It can&apos;t be
        undone, and it&apos;s refused if the café has any real visits, redemptions, or member bookmarks on record.
        Type <strong>{cafeName}</strong> to confirm.
      </div>
      <form action={deleteAction} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={cafeName}
          aria-label={`Type "${cafeName}" to confirm café deletion`}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--whisk-10)' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={confirmText !== cafeName}
          style={{ padding: '8px 16px', fontSize: 13, background: 'var(--error, #A8503F)' }}
        >
          Permanently delete
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setConfirmText('');
        }}
        style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, fontSize: 12.5, color: 'var(--whisk)', textDecoration: 'underline', cursor: 'pointer' }}
      >
        Cancel
      </button>
    </div>
  );
}
