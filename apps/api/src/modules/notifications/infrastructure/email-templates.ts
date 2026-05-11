/**
 * Email-safe HTML templates with inline styles. Keep in sync with the
 * web app's brand tokens in `apps/web/app/globals.css`.
 *
 * Layout uses tables because Outlook still doesn't render flex/grid.
 * No web fonts — fall through to system fonts so text always renders.
 */

const COLOR = {
  background: '#fffaf6',
  surface: '#ffffff',
  surfaceMuted: '#f8f1ea',
  foreground: '#2a1a20',
  foregroundMuted: '#6b5258',
  primary: '#b86a82',
  primaryHover: '#a4566f',
  border: '#ebd9d9',
} as const;

const FONT_BODY = '"Helvetica Neue", Helvetica, Arial, "Segoe UI", Roboto, sans-serif';
const FONT_DISPLAY = 'Georgia, "Times New Roman", "Playfair Display", serif';

interface ActionEmailInput {
  preheader: string;
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  fallbackNote: string;
  footerNote: string;
}

export function renderActionEmail(input: ActionEmailInput): string {
  const { preheader, heading, intro, ctaLabel, ctaUrl, fallbackNote, footerNote } = input;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLOR.background};font-family:${FONT_BODY};color:${COLOR.foreground};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 16px 40px;text-align:left;">
                <div style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:600;color:${COLOR.primary};letter-spacing:0.2px;">Beauty Diary</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0 40px;">
                <h1 style="margin:0 0 12px 0;font-family:${FONT_DISPLAY};font-size:28px;line-height:1.25;font-weight:600;color:${COLOR.foreground};">
                  ${escapeHtml(heading)}
                </h1>
                <p style="margin:0 0 28px 0;font-size:16px;line-height:1.55;color:${COLOR.foregroundMuted};">
                  ${escapeHtml(intro)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                  <tr>
                    <td align="center" bgcolor="${COLOR.primary}" style="border-radius:12px;mso-padding-alt:0;">
                      <a href="${escapeAttr(ctaUrl)}"
                         target="_blank"
                         style="display:inline-block;padding:18px 36px;font-family:${FONT_BODY};font-size:16px;font-weight:600;line-height:1;color:${COLOR.surface} !important;text-decoration:none !important;border-radius:12px;background:${COLOR.primary};border:1px solid ${COLOR.primary};">
                        <span style="color:${COLOR.surface};text-decoration:none;">${escapeHtml(ctaLabel)}</span>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <p style="margin:0 0 8px 0;font-size:13px;color:${COLOR.foregroundMuted};">
                  ${escapeHtml(fallbackNote)}
                </p>
                <p style="margin:0;font-size:13px;line-height:1.5;word-break:break-all;">
                  <a href="${escapeAttr(ctaUrl)}" style="color:${COLOR.primary};text-decoration:underline;">${escapeHtml(ctaUrl)}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px 40px;border-top:1px solid ${COLOR.border};margin-top:32px;">
                <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:${COLOR.foregroundMuted};">
                  ${escapeHtml(footerNote)}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:${COLOR.foregroundMuted};">
            © Beauty Diary
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderActionEmailText(input: {
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}): string {
  return [
    input.heading,
    '',
    input.intro,
    '',
    `${input.ctaLabel}: ${input.ctaUrl}`,
    '',
    input.footerNote,
  ].join('\n');
}

interface OtpEmailInput {
  preheader: string;
  heading: string;
  intro: string;
  otp: string;
  footerNote: string;
}

export function renderOtpEmail(input: OtpEmailInput): string {
  const { preheader, heading, intro, otp, footerNote } = input;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background:${COLOR.background};font-family:${FONT_BODY};color:${COLOR.foreground};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.background};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:${COLOR.surface};border:1px solid ${COLOR.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 16px 40px;">
                <div style="font-family:${FONT_DISPLAY};font-size:22px;font-weight:600;color:${COLOR.primary};letter-spacing:0.2px;">Beauty Diary</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0 40px;">
                <h1 style="margin:0 0 12px 0;font-family:${FONT_DISPLAY};font-size:28px;line-height:1.25;font-weight:600;color:${COLOR.foreground};">
                  ${escapeHtml(heading)}
                </h1>
                <p style="margin:0 0 28px 0;font-size:16px;line-height:1.55;color:${COLOR.foregroundMuted};">
                  ${escapeHtml(intro)}
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 40px 8px 40px;">
                <div style="display:inline-block;background:${COLOR.surfaceMuted};border:1px solid ${COLOR.border};border-radius:14px;padding:20px 28px;font-family:'SFMono-Regular','Menlo',Consolas,monospace;font-size:34px;font-weight:600;letter-spacing:8px;color:${COLOR.foreground};">
                  ${escapeHtml(otp)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 32px 40px;border-top:1px solid ${COLOR.border};">
                <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:${COLOR.foregroundMuted};">
                  ${escapeHtml(footerNote)}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:${COLOR.foregroundMuted};">
            © Beauty Diary
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
