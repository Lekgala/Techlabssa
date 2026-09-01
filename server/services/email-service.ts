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

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

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
        html: input.html,
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
