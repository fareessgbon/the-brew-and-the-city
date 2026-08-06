import { createHash } from 'node:crypto';

// SHA-256 of the raw file bytes — catches the simplest, most common cheat:
// re-uploading the exact same receipt photo for a second stamp. It won't
// catch a re-photographed or re-compressed copy of the same paper receipt;
// that's a real limitation, not a gap in this function.
export function hashReceipt(bytes: ArrayBuffer | Buffer): string {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(new Uint8Array(bytes));
  return createHash('sha256').update(buffer).digest('hex');
}
