import nodemailer from 'nodemailer';

const ALLOWED_SMTP_HOSTS = new Set(['smtp.gmail.com']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const expectedSecret = (process.env.EMAIL_RELAY_SECRET || '').trim();
    if (expectedSecret && req.headers['x-relay-secret'] !== expectedSecret) {
      return res.status(401).json({ success: false, error: 'Unauthorized relay request' });
    }

    const host = String(body.host || 'smtp.gmail.com').trim().toLowerCase();
    if (!ALLOWED_SMTP_HOSTS.has(host)) {
      return res.status(400).json({ success: false, error: 'Unsupported SMTP host' });
    }

    const user = String(body.user || process.env.SMTP_USER || '').trim();
    const pass = String(body.pass || process.env.SMTP_PASS || '').trim();
    const from = String(body.from || user).trim();
    const to = String(body.to || '').trim();
    const subject = String(body.subject || '').trim();
    const text = typeof body.text === 'string' ? body.text : undefined;
    const html = typeof body.html === 'string' ? body.html : undefined;

    if (!user || !pass || !to || !subject) {
      return res.status(400).json({ success: false, error: 'Missing required email fields (user, pass, to, subject)' });
    }

    const attachments = Array.isArray(body.attachments)
      ? body.attachments
          .filter((att) => att && att.filename && att.contentBase64)
          .map((att) => ({
            filename: String(att.filename),
            content: Buffer.from(String(att.contentBase64), 'base64'),
            contentType: att.contentType ? String(att.contentType) : undefined,
          }))
      : undefined;

    const mailPayload = {
      from,
      to,
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    const attemptSend = async (port, secure) => {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        connectionTimeout: 12000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });
      return transporter.sendMail(mailPayload);
    };

    let info;
    try {
      info = await attemptSend(465, true);
    } catch (primaryErr) {
      const code = primaryErr?.code || '';
      if (code === 'EAUTH') {
        throw primaryErr;
      }
      info = await attemptSend(587, false);
    }

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      method: `vercel-relay:${host}`,
    });
  } catch (err) {
    console.error('[VercelMailRelay] Failed:', err?.message || err);
    return res.status(502).json({
      success: false,
      error: err instanceof Error ? err.message : 'Relay email send failed',
    });
  }
}
