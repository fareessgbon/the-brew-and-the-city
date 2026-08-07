import { ImageResponse } from 'next/og';

// Site-wide social share image — every page inherits this unless a route
// segment defines its own. Kept to system fonts and inline styles only
// (no font file, no external fetch) so it stays fast, static, and doesn't
// grow the build's font-loading surface for one image.
export const alt = 'Brew and the City — matched to your next favourite Calgary café';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 96px',
          background: '#f4efe4',
          color: '#3a2c24',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#6b6b63',
            marginBottom: 28,
          }}
        >
          Calgary, Alberta · coming soon
        </div>
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 600, lineHeight: 1.08, maxWidth: 920 }}>
          Every good café, matched to your taste.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#3a2c24', marginTop: 32, maxWidth: 820 }}>
          Not by review count. Join the waitlist at brewandthecity.com
        </div>
      </div>
    ),
    { ...size },
  );
}
