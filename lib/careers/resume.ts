// Resume upload rules, shared by the form and the API route so the two
// can't drift — a client that accepts a file the server rejects wastes an
// applicant's upload and tells them nothing useful about why.
//
// These are also enforced a third time by Postgres, on the bucket itself
// (migration 0027). Three layers sounds excessive for a file input, but
// each catches a different failure: the client catches the honest mistake
// before an upload starts, the route catches a crafted request, and the
// bucket catches a bug in the route.

export const RESUME_BUCKET = 'resumes';

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// Extension → MIME. Extension is the primary check: browsers are
// inconsistent about the `type` they report for .doc/.docx (sometimes
// empty, sometimes application/octet-stream), so a MIME-only allowlist
// rejects real Word documents from real applicants.
export const ALLOWED_RESUME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// For the file input's `accept` attribute — extensions and MIME types both,
// since some platforms filter on one and some on the other.
export const RESUME_ACCEPT = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function resumeExtension(filename: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(filename.trim());
  if (!match) return null;
  const ext = match[1].toLowerCase();
  return ext in ALLOWED_RESUME_TYPES ? ext : null;
}

// One message for both sides, so the client's inline error and the API's
// 400 read identically. Returns null when the file is acceptable.
export function validateResume(file: { name: string; size: number }): string | null {
  if (!resumeExtension(file.name)) {
    return 'Resumes need to be a PDF, DOC or DOCX. Anything else — paste a link instead.';
  }
  if (file.size > MAX_RESUME_BYTES) {
    return 'That file is over 5 MB. Try exporting it as a PDF, or paste a link instead.';
  }
  if (file.size === 0) {
    return 'That file looks empty — try re-saving it, or paste a link instead.';
  }
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
