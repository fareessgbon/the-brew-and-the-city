'use client';

import { Fragment, useRef, useState, type FormEvent } from 'react';
import { importCafesCsv, previewCafesCsv } from '@/app/admin/actions';
import type { CsvImportResult, CsvRowResult } from '@/lib/admin/csvImport';

// Rendered as an array (not a hardcoded string) so each field can get a
// <wbr /> after its comma below — the string has no spaces, matching the
// real CSV format, so without a wrap opportunity the browser can't break
// it and it overflows the "Bulk import" box instead of reflowing.
const CSV_HEADER_FIELDS = [
  'name',
  'slug',
  'neighbourhood',
  'drink',
  'energy',
  'aesthetic',
  'pace',
  'adventure',
  'price',
  'food',
  'partner_status',
  'drink_categories',
  'latitude',
  'longitude',
];

export function CsvUploadForm() {
  const [preview, setPreview] = useState<CsvRowResult[] | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handlePreview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setBusy('preview');
    setResult(null);
    try {
      setPreview(await previewCafesCsv(formData));
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirm() {
    const formData = new FormData(formRef.current!);
    setBusy('import');
    try {
      setResult(await importCafesCsv(formData));
      setPreview(null);
      formRef.current?.reset();
    } finally {
      setBusy(null);
    }
  }

  function handleFileChange() {
    // A newly-chosen file (e.g. a corrected re-upload) invalidates the old preview.
    setPreview(null);
    setResult(null);
  }

  const validCount = preview?.filter((r) => r.action !== 'reject').length ?? 0;
  const rejectedCount = preview?.filter((r) => r.action === 'reject').length ?? 0;

  return (
    <div className="ratio-box" style={{ marginBottom: 24 }}>
      <div className="label" style={{ marginBottom: 8 }}>
        Bulk import
      </div>
      <form ref={formRef} onSubmit={handlePreview} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="file" name="file" accept=".csv" required onChange={handleFileChange} />
        <button type="submit" className="btn btn-ghost" disabled={busy !== null}>
          {busy === 'preview' ? 'Checking…' : 'Preview'}
        </button>
        {preview && validCount > 0 ? (
          <button type="button" className="btn btn-primary" disabled={busy !== null} onClick={handleConfirm}>
            {busy === 'import' ? 'Importing…' : `Confirm import (${validCount} row${validCount === 1 ? '' : 's'})`}
          </button>
        ) : null}
      </form>
      <div style={{ fontSize: 12.5, color: 'var(--whisk)', marginTop: 10 }}>
        Header row:{' '}
        <code>
          {CSV_HEADER_FIELDS.map((field, i) => (
            <Fragment key={field}>
              {field}
              {i < CSV_HEADER_FIELDS.length - 1 ? (
                <>
                  ,<wbr />
                </>
              ) : null}
            </Fragment>
          ))}
        </code>.
        Matches on slug — re-importing the same slug updates that café. <code>latitude</code>/<code>longitude</code> are optional —
        provide both or leave both blank; a lone coordinate is rejected, and leaving both blank keeps a café&apos;s existing
        coordinates untouched. Preview checks every row before anything is written; fix and re-upload to retry rejected rows.
      </div>

      {preview ? (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            <strong>{validCount}</strong> row{validCount === 1 ? '' : 's'} ready to import
            {rejectedCount > 0 ? (
              <>
                {' '}
                · <strong style={{ color: 'var(--error, #A8503F)' }}>{rejectedCount}</strong> rejected
              </>
            ) : null}
            .
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Row', 'Name', 'Slug', 'Action', 'Errors'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--paper-2)', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', color: 'var(--whisk)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.row}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>{r.row || '—'}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>{r.name || '—'}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)', color: 'var(--whisk)' }}>{r.slug || '—'}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)' }}>
                      {r.action === 'reject' ? <span style={{ color: 'var(--error, #A8503F)' }}>Reject</span> : r.action === 'update' ? 'Update' : 'Create'}
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--paper-2)', color: 'var(--error, #A8503F)' }}>{r.errors.join(' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result ? (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          <strong>
            {result.created} created, {result.updated} updated, {result.rejected} rejected.
          </strong>
          {result.errors.length > 0 ? (
            <ul style={{ marginTop: 6, color: 'var(--error, #A8503F)' }}>
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
