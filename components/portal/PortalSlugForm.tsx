'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function PortalSlugForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = slug.trim().toLowerCase();
    if (!clean) return;
    router.push(`/portal/${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="your-cafe-slug"
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--whisk-10)',
          fontFamily: 'var(--font-mono)',
        }}
      />
      <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
        Go
      </button>
    </form>
  );
}
