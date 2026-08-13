import type { Metadata } from 'next';

// Per-page social cards.
//
// Every page used to share the homepage's Open Graph title and description,
// because a page that sets only `title`/`description` leaves the layout's
// `openGraph` block untouched — so a /for-cafes link sent to a café owner
// previewed as the consumer pitch, and a role link sent to an applicant did
// the same. On a pre-launch site whose entire distribution is DMs and
// pasted links, the preview *is* the first impression.
//
// The catch this helper exists for: Next replaces `openGraph` wholesale
// when a page defines one — it is not deep-merged. Writing `openGraph:
// { title, description }` inline on a page silently drops og:site_name,
// og:locale, og:type AND the og:image that app/opengraph-image.tsx would
// otherwise contribute, leaving a shared link with no picture at all
// (verified in the rendered HTML, not assumed). So the whole block is
// rebuilt here, once, and pages call this instead.
export function pageMetadata({
  title,
  description,
  canonical,
  robots,
}: {
  title: string;
  description: string;
  canonical: string;
  robots?: Metadata['robots'];
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical },
    ...(robots ? { robots } : {}),
    openGraph: {
      title,
      description,
      siteName: 'Brew and the City',
      locale: 'en_CA',
      type: 'website',
      url: canonical,
      // Absolute-ised against metadataBase (app/layout.tsx) by Next. The
      // route is the same generated 1200×630 card the homepage uses.
      images: ['/opengraph-image'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
