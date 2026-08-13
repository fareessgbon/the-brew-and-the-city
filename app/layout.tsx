import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Self-hosted rather than next/font/google. That helper fetches Google's
// CSS at build time and downloads whatever file URLs it names — so a build
// can only succeed while fonts.gstatic.com is up and serving the exact URLs
// the cache remembers. Google rotated Fraunces' hashes under a restored
// Vercel build cache and every deploy 404'd on a font. These are the same
// files (latin subset, downloaded from Google, open-licensed); they just
// live in the repo now, where nothing can rotate them out from under a
// build.
//
// Italic is a real file, not synthesised. The careers postings set their
// group headings in italic display type, and with only the roman loaded the
// browser fakes it by slanting the upright — especially obvious in
// Fraunces, whose true italic is a differently drawn face rather than a
// sheared version of the same letters.
const fraunces = localFont({
  variable: '--font-fraunces',
  display: 'swap',
  src: [
    // One variable file per style covers 400–600; the weights the CSS asks
    // for are instances of it, not separate downloads.
    { path: './fonts/Fraunces-Variable-latin.woff2', weight: '400 600', style: 'normal' },
    { path: './fonts/Fraunces-Italic-Variable-latin.woff2', weight: '400 600', style: 'italic' },
  ],
});

const martianMono = localFont({
  variable: '--font-martian-mono',
  display: 'swap',
  src: [{ path: './fonts/MartianMono-Medium-latin.woff2', weight: '500', style: 'normal' }],
});

// Was two <link> tags to the Fontshare CDN. Those couldn't break a build the
// way Fraunces did — a stylesheet link is fetched by the browser, not by the
// bundler — but they put the body text of every page behind a third party
// being up and quick. Self-hosted, the whole typographic system now ships
// from one origin and there is no render-blocking request to anyone else.
//
// General Sans is Fontshare-exclusive and not on Google Fonts. It's licensed
// under the ITF Free Font License, which permits self-hosting.
//
// Three static weights rather than the variable file: the CSS asks for 400,
// 500 and 600 only, and three subset instances are smaller than the variable
// font that would interpolate between them.
const generalSans = localFont({
  variable: '--font-general-sans',
  display: 'swap',
  src: [
    { path: './fonts/GeneralSans-Regular-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/GeneralSans-Medium-latin.woff2', weight: '500', style: 'normal' },
    { path: './fonts/GeneralSans-Semibold-latin.woff2', weight: '600', style: 'normal' },
  ],
});

// NEXT_PUBLIC_SITE_URL — set this to the real production domain once one
// exists (see PRODUCTION_CHECKLIST.md). Falls back to localhost so
// metadata/OG tags still resolve to *some* absolute URL in dev rather than
// warning on every build; every page's own metadata inherits this via
// Next's metadataBase resolution instead of each one hardcoding a host.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const title = 'Brew and the City — Matched to your next favourite Calgary café';
const description = "Calgary has 60+ independent cafés. We're building a way to match you to yours — by taste, not by review count. Join the list.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: 'Brew and the City',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    // summary_large_image, not summary: app/opengraph-image.tsx generates a
    // 1200×630 card and 'summary' crops it to a small square thumbnail,
    // throwing away the headline it was drawn to carry.
    card: 'summary_large_image',
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${martianMono.variable} ${generalSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans relative">{children}</body>
    </html>
  );
}
