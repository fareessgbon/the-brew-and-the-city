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

// Neither of these values is ever HTML, but both come straight from a form
// field and land inside a template string — escape rather than reason about
// it at each call site.
function escapeHtml(value: string): string {
  return value.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] as string);
}

export function jobApplicationConfirmationEmail(
  applicantName: string,
  roleTitle: string,
  // The form takes a resume as a file or as a link, and the receipt has to
  // say which one arrived. Told flatly that they can reply and attach one,
  // someone who just uploaded a PDF reads it as "you didn't get it".
  resumeSent: 'file' | 'link',
): { subject: string; html: string } {
  const name = escapeHtml(applicantName);
  const role = escapeHtml(roleTitle);
  // First name only in the greeting — "Thanks, Jordan Alvarez-Smith" reads
  // like a form letter, which is the one thing this shouldn't.
  const firstName = name.split(/\s+/)[0];
  const resumeLine =
    resumeSent === 'file'
      ? 'Your resume came through with it. If you&rsquo;d rather we read a different version, reply to this email and attach it — it&rsquo;ll get matched to your application.'
      : 'We have the resume link you gave us. If it stops working, or you&rsquo;d rather send the file itself, reply to this email and attach it — it&rsquo;ll get matched to your application.';
  return {
    subject: `We got your application — ${role}`,
    html: wrap(`
      <p style="margin:0 0 16px; font-size:19px; font-weight:600; font-family:Georgia,serif;">Thanks, ${firstName} — your application is in.</p>
      <p style="margin:0 0 16px;">
        You applied for <strong>${role}</strong>. Every application is read by the founder directly, not filtered
        by anything, so give us a little time — we&rsquo;ll reply either way, including if it&rsquo;s a no.
      </p>
      <p style="margin:0 0 16px;">
        ${resumeLine}
      </p>
      <p style="margin:0;">
        Anything you want to add in the meantime? Just reply here.
      </p>
    `),
  };
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
