type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
};

export type EmailDelivery = {
  sent: boolean;
  id?: string;
  reason?: string;
};

const RESEND_ENDPOINT = process.env.RESEND_API_URL || 'https://api.resend.com/emails';

export const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export const formatEmailHtml = (html: string): string => {
  // Admin-authored templates can already be complete HTML documents.
  if (/<!doctype\s+html|<html[\s>]/i.test(html)) return html;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    h1, h2, h3 { color: #151515; line-height: 1.25; margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; }
    h1, h2 { font-size: 26px; letter-spacing: -0.5px; } h3 { font-size: 17px; margin-top: 28px; }
    p { margin: 0 0 17px; } ol, ul { margin: 0 0 20px; padding-left: 22px; }
    li { margin-bottom: 10px; } a { color: #151515; } strong { color: #151515; }
    .email-content a[style*="display:inline-block"] { border-radius: 8px; }
    table { max-width: 100%; } td { vertical-align: top; }
    @media (max-width: 600px) { .email-content { padding: 28px 22px !important; } .email-shell { border-radius: 0 !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f4;color:#3d4349;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#f3f4f4">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" class="email-shell" style="width:100%;max-width:620px;border-collapse:separate;background:#ffffff;border:1px solid #e2e4e5;border-radius:14px;overflow:hidden">
        <tr><td style="padding:25px 32px;background:#111111;color:#ffffff;font-size:19px;font-weight:700;letter-spacing:-0.3px">techlabs<span style="color:#80cdf0">.</span> <span style="font-size:12px;font-weight:400;letter-spacing:1.7px;color:#d7d7d7">ACADEMY SA</span></td></tr>
        <tr><td style="height:4px;background:#80cdf0;font-size:1px;line-height:1px">&nbsp;</td></tr>
        <tr><td class="email-content" style="padding:36px 32px 30px">${html}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #e9eaeb;color:#697077;font-size:12px;line-height:1.6">TechLabs Academy SA<br>Practical IT training in South Africa</td></tr>
      </table>
      <p style="margin:16px 0 0;color:#858b90;font-size:11px">This email was sent by TechLabs Academy SA.</p>
    </td></tr>
  </table>
</body>
</html>`;
};

export async function sendEmail(input: SendEmailInput): Promise<EmailDelivery> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = input.replyTo || process.env.EMAIL_REPLY_TO;

  if (!apiKey || !from) {
    return { sent: false, reason: 'Resend is not configured' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: formatEmailHtml(input.html),
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(input.attachments?.length ? { attachments: input.attachments.map(attachment => ({ filename: attachment.filename, content: Buffer.isBuffer(attachment.content) ? attachment.content.toString('base64') : attachment.content })) } : {}),
      }),
    });

    const result = await response.json() as { id?: string; message?: string; name?: string };
    if (!response.ok) {
      console.error('Resend rejected an email:', result.name || result.message || response.statusText);
      return { sent: false, reason: result.message || 'Email provider rejected the message' };
    }

    return { sent: true, id: result.id };
  } catch (error) {
    console.error('Resend request failed:', error);
    return { sent: false, reason: 'Email provider could not be reached' };
  }
}
