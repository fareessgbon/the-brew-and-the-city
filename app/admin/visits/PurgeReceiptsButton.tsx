'use client';

import { useState, useTransition } from 'react';
import { purgeOldReceipts } from '@/app/admin/actions';

export function PurgeReceiptsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleClick() {
    startTransition(async () => {
      const { purged } = await purgeOldReceipts();
      setResult(purged === 0 ? 'Nothing to purge — nothing reviewed over 30 days ago with a photo still attached.' : `Purged ${purged} receipt photo${purged === 1 ? '' : 's'}.`);
    });
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <button type="button" className="btn btn-ghost" disabled={isPending} onClick={handleClick} style={{ padding: '8px 16px', fontSize: 13 }}>
        {isPending ? 'Purging…' : 'Purge receipts reviewed 30+ days ago'}
      </button>
      {result ? <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 8 }}>{result}</div> : null}
    </div>
  );
}
