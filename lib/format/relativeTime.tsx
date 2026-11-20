// "3h ago" scans in a way "8/7/2026, 9:15:57 PM" doesn't — on a queue or
// list the only thing a timestamp answers is "how stale is this?". Shared
// by every admin surface that shows one (app/admin/page.tsx, the café
// list) rather than duplicated per page — unlike a page module, a pure
// function has no data-fetching baggage to drag in by importing it.
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function Timestamp({ iso }: { iso: string }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--whisk)' }} title={new Date(iso).toLocaleString()}>
      {relativeTime(iso)}
    </span>
  );
}
