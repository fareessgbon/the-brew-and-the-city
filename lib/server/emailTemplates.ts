// Plain, inline-styled HTML — no external stylesheet (email clients strip
// them unreliably) and no complex layout, since this is a one-paragraph
// transactional confirmation, not a marketing send. Keep it this simple
// until there's an actual reason not to.

const BRAND = {
  paper: '#f4efe4',
  ceremony: '#3a2c24',
  whisk: '#6b6b63',
};

function wrap(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background:${BRAND.paper}; font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper}; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%;">
            <tr>
              <td style="padding:0 24px 24px;">
                <div style="font-size:13px; font-weight:600; letter-spacing:0.04em; color:${BRAND.ceremony}; text-transform:uppercase;">
                  Brew and the City
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff; border-radius:16px; padding:32px 28px; color:${BRAND.ceremony}; font-size:15px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 0; font-size:12.5px; color:${BRAND.whisk};">
                Brew and the City — Calgary, Alberta ·
                <a href="mailto:hello@brewandthecity.com" style="color:${BRAND.whisk};">hello@brewandthecity.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function cafePartnerSurveyConfirmationEmail(cafeName: string): { subject: string; html: string } {
  const safeName = cafeName.replace(/[<>&]/g, ''); // no HTML special chars expected in a café name, but don't trust it
  return {
    subject: `We've got ${safeName} — here's what's next`,
    html: wrap(`
      <p style="margin:0 0 16px; font-size:19px; font-weight:600; font-family:Georgia,serif;">Thanks for telling us about ${safeName}.</p>
      <p style="margin:0 0 16px;">
        We're reviewing survey responses as they come in and reaching out directly to cafés we think are a strong
        fit for the first Founding Partner cohort — 15 spots, full Partner access free for six months.
      </p>
      <p style="margin:0 0 16px;">
        If that's you, expect a personal note or call, not another form. If it isn't this round, you'll still be
        first to hear when the next cohort opens.
      </p>
      <p style="margin:0;">
        Questions in the meantime? Just reply to this email.
      </p>
    `),
  };
}
