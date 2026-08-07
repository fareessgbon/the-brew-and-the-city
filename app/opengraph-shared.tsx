import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Shared by opengraph-image.tsx and twitter-image.tsx so the two social
// preview cards never drift apart — same brand colors (see app/globals.css)
// and copy as the homepage hero, rendered once at build time since neither
// route takes params or reads request-time data.
export const OG_SIZE = { width: 1200, height: 630 };

const PAPER = '#f4efe4';
const CEREMONY = '#3a2c24';
const WHISK = '#6b6b63';
const SKY = '#c6d8e6';

export async function renderOgImage() {
  const [fraunces, martianMono] = await Promise.all([
    readFile(join(process.cwd(), 'assets/og/Fraunces-SemiBold.woff')),
    readFile(join(process.cwd(), 'assets/og/MartianMono-Medium.woff')),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: PAPER,
          padding: '72px 80px',
        }}
      >
        {/* Dashed sky stripe — the same accent used along the top of the
            homepage's quiz card and the City Card. */}
        <div
          style={{
            display: 'flex',
            width: 260,
            height: 8,
            marginBottom: 48,
            backgroundImage: `repeating-linear-gradient(90deg, ${SKY} 0 8px, ${PAPER} 8px 16px)`,
          }}
        />
        <div
          style={{
            display: 'flex',
            fontFamily: 'Martian Mono',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: WHISK,
            marginBottom: 28,
          }}
        >
          Calgary, Alberta · Free during our launch trial
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Fraunces',
            fontWeight: 600,
            fontSize: 72,
            lineHeight: 1.08,
            letterSpacing: -1,
            color: CEREMONY,
            maxWidth: 980,
          }}
        >
          <span>Every good café,</span>
          <span>matched to your taste.</span>
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 'auto',
            fontFamily: 'Fraunces',
            fontWeight: 600,
            fontSize: 30,
            color: CEREMONY,
          }}
        >
          Brew and the City
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Fraunces', data: fraunces, style: 'normal', weight: 600 },
        { name: 'Martian Mono', data: martianMono, style: 'normal', weight: 500 },
      ],
    },
  );
}
