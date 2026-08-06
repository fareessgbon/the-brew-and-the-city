import type { Metadata } from 'next';
import { Fraunces, Zen_Kaku_Gothic_New, Martian_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/nav/SessionProvider';
import { MobileBottomNav } from '@/components/nav/MobileBottomNav';

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal'],
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

export const metadata: Metadata = {
  title: 'Brew and the City — Every good café in Calgary, matched to your taste',
  description: "Three questions and we'll tell you which of Calgary's independent cafés is yours.",
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
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans relative">
        <SessionProvider>
          {children}
          <MobileBottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
