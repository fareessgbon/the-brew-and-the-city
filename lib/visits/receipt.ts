// Receipt upload rules for the City Card, shared by the upload form and
// POST /api/visits so the two can't drift. Mirrors lib/careers/resume.ts —
// same reasoning: a client-side check that's looser than the server's
// wastes an upload and explains nothing.
//
// Also enforced on the bucket itself (migration 0008: 8 MB, these four
// image types) — the route is the second layer, the bucket the third.

export const RECEIPT_BUCKET = 'receipts';

export const MAX_RECEIPT_BYTES = 8 * 1024 * 1024;

export const ALLOWED_RECEIPT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';

export function receiptExtension(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return ext in ALLOWED_RECEIPT_TYPES ? ext : null;
}

// One message for both sides, same pattern as validateResume. Returns
// null when the file is acceptable.
export function validateReceipt(file: { name: string; size: number; type?: string }): string | null {
  const ext = receiptExtension(file.name);
  const mimeOk = !file.type || Object.values(ALLOWED_RECEIPT_TYPES).includes(file.type);
  if (!ext || !mimeOk) {
    return 'Receipts need to be a photo — JPG, PNG, WEBP or HEIC.';
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return 'That photo is over 8 MB. Try a smaller photo or a screenshot instead.';
  }
  if (file.size === 0) {
    return 'That file looks empty — try taking the photo again.';
  }
  return null;
}
