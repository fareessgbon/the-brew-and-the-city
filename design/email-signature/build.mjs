// Builds the email signature: rasterises logo-source.html with Chrome, then
// writes two ready-to-use HTML files from the SIGNER details below.
//
//   node design/email-signature/build.mjs
//
// Edit SIGNER (or copy the block per teammate) and re-run — nothing here is
// hand-maintained HTML, so a second signature costs a config change, not a
// careful find-and-replace through table markup.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');

const SIGNER = {
  firstName: 'Fareess',
  lastName: 'Gbonjubola',
  title: 'Founder',
  // Left blank, the phone row is dropped rather than left as an empty label.
  phone: '',
  email: 'hello@brewandthecity.com',
  website: 'brewandthecity.com',
  instagram: '@brewandthecity',
};

// The site's tokens (app/globals.css). Named the same on purpose — if one
// moves there, it should move here.
const BRAND = {
  ceremony: '#3a2c24',
  whisk: '#5f5f57',
  blush: '#e8c4c0',
  rule: '#d8d0c1',
};

// Fraunces and General Sans are self-hosted on the site, but no mail client
// will load a webfont — the logo is baked into the PNG, and everything set
// as live text falls back to a face that's actually on the machine.
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

// Where the PNG will live once the site is deployed, for the hosted variant.
const HOSTED_LOGO_URL = 'https://brewandthecity.com/brand/email-signature-logo.png';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOGO_W = 200;
const LOGO_H = 150;
// The PNG is rendered at 2x this and placed at these dimensions, so it stays
// sharp on retina without the logo out-shouting the name beside it.
const SHOWN_W = 120;
const SHOWN_H = 90;

function renderLogo(outPath) {
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      // Transparent, so the signature sits on whatever background the
      // recipient's client uses — several of them are not white.
      '--default-background-color=00000000',
      `--window-size=${LOGO_W},${LOGO_H}`,
      // 2x: the image is placed at half its pixel width so it stays sharp on
      // the retina screens most mail gets read on.
      '--force-device-scale-factor=2',
      '--allow-file-access-from-files',
      `--screenshot=${outPath}`,
      `file://${join(here, 'logo-source.html')}`,
    ],
    { stdio: 'inherit' },
  );
}

function escapeHtml(value) {
  return value.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]);
}

// One contact row: a muted label, then the value as a link. Labels sit in
// their own cell so the values line up in a column the way they do on a
// business card.
function contactRow(label, href, text) {
  return `                    <tr>
                      <td style="padding:0 8px 2px 0; font-family:${SANS}; font-size:13px; line-height:1.55; color:${BRAND.whisk}; white-space:nowrap; vertical-align:top;">${label}</td>
                      <td style="padding:0 0 2px; font-family:${SANS}; font-size:13px; line-height:1.55; vertical-align:top;"><a href="${href}" style="color:${BRAND.ceremony}; text-decoration:underline;">${escapeHtml(text)}</a></td>
                    </tr>`;
}

function signatureHtml(logoSrc) {
  const rows = [];
  if (SIGNER.phone) {
    rows.push(contactRow('phone:', `tel:${SIGNER.phone.replace(/[^\d+]/g, '')}`, SIGNER.phone));
  }
  rows.push(contactRow('website:', `https://${SIGNER.website}`, SIGNER.website));
  rows.push(contactRow('email:', `mailto:${SIGNER.email}`, SIGNER.email));
  rows.push(
    contactRow('instagram:', `https://instagram.com/${SIGNER.instagram.replace('@', '')}`, SIGNER.instagram),
  );

  // Tables, inline styles, no shorthand background: — Outlook renders this
  // through Word, which ignores most of what a browser would honour.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding:0 22px 0 0; vertical-align:middle;">
      <img src="${logoSrc}" width="${SHOWN_W}" height="${SHOWN_H}" alt="Brew and the City" style="display:block; width:${SHOWN_W}px; height:${SHOWN_H}px; border:0;" />
    </td>
    <td style="padding:2px 0 2px 22px; vertical-align:middle; border-left:1px solid ${BRAND.rule};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 6px;">
            <span style="font-family:${SERIF}; font-size:19px; font-weight:bold; color:${BRAND.ceremony}; background-color:${BRAND.blush};">&nbsp;${escapeHtml(SIGNER.firstName)}&nbsp;</span>
            <span style="font-family:${SERIF}; font-size:19px; font-weight:bold; color:${BRAND.ceremony};">${escapeHtml(SIGNER.lastName)}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 12px; font-family:${SANS}; font-size:14px; line-height:1.4; color:${BRAND.ceremony};">
            ${escapeHtml(SIGNER.title)} <span style="color:${BRAND.whisk};">|</span> Brew and the City
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
${rows.join('\n')}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

// The file you actually open: the signature itself, plus how to install it.
// The instructions are outside the copy box so they can't be pasted along
// with it.
function pastePage(signature) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Brew and the City — email signature</title>
    <style>
      body { margin:0; padding:40px 24px; background:#f4efe4; font-family:${SANS}; color:${BRAND.ceremony}; }
      .sheet { max-width:720px; margin:0 auto; }
      h1 { font-family:${SERIF}; font-size:22px; font-weight:600; margin:0 0 6px; }
      .sub { font-size:14px; color:${BRAND.whisk}; margin:0 0 28px; }
      .box { background:#ffffff; border-radius:14px; padding:28px; }
      .hint { font-size:12px; color:${BRAND.whisk}; margin:10px 2px 28px; }
      ol { font-size:14px; line-height:1.7; padding-left:20px; margin:0 0 24px; }
      code { background:#ebe4d5; padding:1px 5px; border-radius:4px; font-size:13px; }
      h2 { font-size:13px; text-transform:uppercase; letter-spacing:0.08em; margin:0 0 10px; }
    </style>
  </head>
  <body>
    <div class="sheet">
      <h1>Email signature</h1>
      <p class="sub">Select everything inside the white box, copy, and paste into your mail client's signature editor.</p>

      <div class="box">
${signature
  .split('\n')
  .map((line) => `        ${line}`)
  .join('\n')}
      </div>
      <p class="hint">The logo travels with the copy — pasting from this page carries the image itself, not a link to one.</p>

      <h2>Gmail</h2>
      <ol>
        <li>Settings (gear) → <em>See all settings</em> → <em>General</em> → <em>Signature</em>.</li>
        <li>Create a signature, click into the editor, and paste. Do not retype anything inside it — Gmail keeps the pasted formatting only.</li>
        <li>Set it for <em>New emails</em> and <em>On reply/forward</em>, then <em>Save changes</em> at the bottom.</li>
      </ol>

      <h2>Apple Mail</h2>
      <ol>
        <li>Mail → Settings → <em>Signatures</em>, pick the account, and hit <em>+</em>.</li>
        <li>Untick <em>Always match my default message font</em>, then paste.</li>
      </ol>

      <h2>Outlook</h2>
      <ol>
        <li>Outlook on the web handles a paste the same way Gmail does.</li>
        <li>Desktop Outlook drops pasted images now and then. If the logo goes missing, use <code>signature-hosted.html</code> instead — it points at the logo on the site rather than carrying it — after the PNG at <code>public/brand/</code> ships to production.</li>
      </ol>
    </div>
  </body>
</html>
`;
}

const logoPng = join(here, 'email-signature-logo.png');
renderLogo(logoPng);

// Also drop a copy where Next serves it, so the hosted variant has a real
// URL the moment the site deploys.
const publicDir = join(repoRoot, 'public', 'brand');
mkdirSync(publicDir, { recursive: true });
const png = readFileSync(logoPng);
writeFileSync(join(publicDir, 'email-signature-logo.png'), png);

const dataUri = `data:image/png;base64,${png.toString('base64')}`;
writeFileSync(join(here, 'signature.html'), pastePage(signatureHtml(dataUri)));
writeFileSync(join(here, 'signature-hosted.html'), pastePage(signatureHtml(HOSTED_LOGO_URL)));

console.log(`logo: ${(png.length / 1024).toFixed(1)} KB → design/email-signature/email-signature-logo.png + public/brand/`);
console.log('wrote design/email-signature/signature.html and signature-hosted.html');
