import type { Metadata } from 'next';
import { Fraunces, Zen_Kaku_Gothic_New, Martian_Mono } from 'next/font/google';
import './globals.css';

// Italic is loaded, not synthesised. The careers postings set their group
// headings in italic display type, and with only the roman loaded the
// browser fakes it by slanting the upright — which in Fraunces is
// especially obvious, since its real italic is a differently drawn face,
// not a sheared version of the same letters.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  variable: '--font-zen-kaku',
  subsets: ['latin'],
  weight: ['500'],
});

const martianMono = Martian_Mono({
  variable: '--font-martian-mono',
  subsets: ['latin'],
  weight: ['500'],
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
    card: 'summary',
    title,
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${zenKakuGothicNew.variable} ${martianMono.variable} h-full`}
    >
      <head>
        {/* General Sans is a Fontshare-exclusive typeface, not on Google Fonts */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans relative">{children}</body>
    </html>
  );
}
