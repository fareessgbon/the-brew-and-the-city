'use client';

import { useState, type FormEvent } from 'react';

type Status = 'idle' | 'uploading' | 'success' | 'error';

export function ReceiptUploadForm({ cafeId, cafeName }: { cafeId: string; cafeName: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem('receipt') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setMessage('');
    try {
      const formData = new FormData();
      formData.set('receipt', file);
      formData.set('cafeId', cafeId);
      const res = await fetch('/api/visits', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit the receipt.');
      setStatus('success');
      setMessage("Sent — the café will confirm your visit, usually within a day.");
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost" onClick={() => setOpen(true)} style={{ padding: '6px 14px', fontSize: 12.5 }}>
        Got a visit here? Upload your receipt
      </button>
    );
  }

  if (status === 'success') {
    return <div style={{ fontSize: 13.5, color: 'var(--ceremony)' }}>{message}</div>;
  }

  return (
    <div className="ratio-box" style={{ marginTop: 12, maxWidth: 420 }}>
      <div className="label" style={{ marginBottom: 8 }}>
        Upload your receipt from {cafeName}
      </div>
      <form onSubmit={handleSubmit}>
        <input type="file" name="receipt" accept="image/jpeg,image/png,image/webp,image/heic" required style={{ marginBottom: 10, fontSize: 13 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn btn-primary" disabled={status === 'uploading'} style={{ padding: '8px 16px', fontSize: 13 }}>
            {status === 'uploading' ? 'Uploading…' : 'Submit'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} style={{ padding: '8px 16px', fontSize: 13 }}>
            Cancel
          </button>
        </div>
      </form>
      {status === 'error' ? <div style={{ fontSize: 12.5, color: 'var(--error, #A8503F)', marginTop: 10 }}>{message}</div> : null}
      <div style={{ fontSize: 12, color: 'var(--whisk)', marginTop: 10 }}>
        One receipt per café per day. The photo is only visible to you, {cafeName}, and admin — deleted 30 days after review.
      </div>
    </div>
  );
}
