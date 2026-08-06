'use client';

import { track } from '@/lib/analytics';

export function TrackedDirectionsLink({
  cafeId,
  href,
  className,
  style,
}: {
  cafeId: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} onClick={() => track('directions_clicked', { cafeId })}>
      Directions
    </a>
  );
}
