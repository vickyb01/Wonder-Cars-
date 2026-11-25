import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Enquiry, Car } from '../models/types.ts';
import { generateCarBookingPdfBuffer } from './pdf.service.ts';
import {
  DATA_DIR,
  LEAD_NOTIFICATION_EMAIL,
  OWNER_NOTIFICATION_EMAIL,
  SHOWROOM_OWNER_EMAILS,
  APP_BASE_URL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} from '../config/index.ts';

function escapeHtml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatIstDateTime(isoOrDate?: string | number | Date): string {
  return new Date(isoOrDate || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });
}

function formatIstDate(isoOrDate?: string | number | Date): string {
  return new Date(isoOrDate || Date.now()).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function resolveCarImageUrl(car?: Car, baseUrl = APP_BASE_URL): string {
  const firstImg = car?.images?.[0] || car?.gallery?.[0]?.url || '';
  if (!firstImg) return '';
  if (/^https?:\/\//i.test(firstImg)) return firstImg;
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}${firstImg.startsWith('/') ? '' : '/'}${firstImg}`;
}

function renderEmailRow(label: string, valueHtml: string, accentColor = '#E2E8F0'): string {
  return `<tr>
    <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: #94A3B8; font-size: 13px; width: 38%; vertical-align: top;">${escapeHtml(label)}</td>
    <td style="padding: 8px 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); color: ${accentColor}; font-size: 13px; font-weight: 600; vertical-align: top;">${valueHtml}</td>
  </tr>`;
}

const OUTGOING_LOG_PATH = path.join(DATA_DIR, 'outgoing_emails.json');

function saveOutgoingEmailLog(logItem: Record<string, any>) {
  try {
    let logs: any[] = [];
    if (fs.existsSync(OUTGOING_LOG_PATH)) {
      try {
        logs = JSON.parse(fs.readFileSync(OUTGOING_LOG_PATH, 'utf-8'));
      } catch {
        logs = [];
      }
    }
    logs.unshift(logItem);
    if (logs.length > 200) logs = logs.slice(0, 200);
    fs.writeFileSync(OUTGOING_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[EmailService] Failed to record outgoing email log:', err);
  }
}

interface MailDispatchPayload {
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}

function getMailRelayUrls(): string[] {
  const candidates: string[] = [];
  if (process.env.EMAIL_RELAY_URL) {
    candidates.push(process.env.EMAIL_RELAY_URL.trim());
  }
  if (APP_BASE_URL && /^https:\/\//i.test(APP_BASE_URL)) {
    candidates.push(`${APP_BASE_URL.replace(/\/$/, '')}/api/mail-relay`);
  }
  candidates.push('https://www.usedcarnearby.com/api/mail-relay');
  return Array.from(new Set(candidates.filter(Boolean)));
}

async function sendViaHttpsRelay(payload: MailDispatchPayload): Promise<{ messageId?: string; method: string }> {
  const relayUrls = getMailRelayUrls();
  const serializedAttachments = (payload.attachments || []).map((att) => ({
    filename: att.filename,
    contentBase64: Buffer.isBuffer(att.content)
      ? att.content.toString('base64')
      : Buffer.from(String(att.content || ''), 'utf-8').toString('base64'),
    contentType: att.contentType,
  }));

  let lastError = 'No HTTPS mail relay URL responded.';
  for (const url of relayUrls) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (process.env.EMAIL_RELAY_SECRET) {
        headers['x-relay-secret'] = process.env.EMAIL_RELAY_SECRET.trim();
      }
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_SECURE,
          user: SMTP_USER,
          pass: SMTP_PASS,
          from: SMTP_FROM || SMTP_USER,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
          attachments: serializedAttachments,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        messageId?: string;
        method?: string;
        error?: string;
      };
      if (res.ok && data.success) {
        return { messageId: data.messageId, method: data.method || `relay:${new URL(url).hostname}` };
      }
      lastError = data.error || `HTTP ${res.status} from ${url}`;
    } catch (err: any) {
      lastError = err?.message || String(err);
    }
  }
  throw new Error(lastError);
}

async function sendViaDirectSmtp(payload: MailDispatchPayload): Promise<{ messageId?: string; method: string }> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });
  const info = await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: payload.to,
    subject: payload.subject,
    ...(payload.text ? { text: payload.text } : {}),
    html: payload.html,
    ...(payload.attachments ? { attachments: payload.attachments } : {}),
  });
  return { messageId: info.messageId, method: `smtp:${SMTP_HOST}` };
}

/**
 * Dispatches mail over HTTPS relay first on Render (where outbound SMTP ports 465/587 are blocked),
 * or via direct SMTP locally with HTTPS relay fallback.
 */
async function dispatchMailWithFallback(payload: MailDispatchPayload): Promise<{ messageId?: string; method: string }> {
  const runningOnRender = process.env.RENDER === 'true' || Boolean(process.env.RENDER_EXTERNAL_URL);
  if (runningOnRender) {
    try {
      return await sendViaHttpsRelay(payload);
    } catch (relayErr: any) {
      console.warn('[EmailService] HTTPS relay failed on Render, attempting direct SMTP:', relayErr?.message || relayErr);
      return await sendViaDirectSmtp(payload);
    }
  }

  try {
    return await sendViaDirectSmtp(payload);
  } catch (smtpErr: any) {
    console.warn('[EmailService] Direct SMTP failed, attempting HTTPS relay:', smtpErr?.message || smtpErr);
    return await sendViaHttpsRelay(payload);
  }
}

function getEnquiryTypeBadge(type: string): { label: string; color: string } {
  switch (type) {
    case 'test-drive':
      return { label: 'Test Drive Request', color: '#3B82F6' };
    case 'offer':
      return { label: 'Confidential Price Offer', color: '#F59E0B' };
    case 'inspection':
      return { label: 'Physical Inspection Request', color: '#10B981' };
    case 'car-enquiry':
      return { label: 'Vehicle Availability Lead', color: '#8B5CF6' };
    case 'general':
    default:
      return { label: 'General Showroom Enquiry', color: '#F59E0B' };
  }
}

export function buildEnquiryHtml(enquiry: Enquiry): string {
  const typeBadge = getEnquiryTypeBadge(enquiry.type);
  const cleanPhone = enquiry.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${enquiry.name}, thank you for contacting Wonder Cars regarding ${
      enquiry.carTitle || 'pre-owned certified vehicles'
    }. How can we assist you today?`
  )}`;
  const telUrl = `tel:${cleanPhone.slice(-10)}`;
  const mailUrl = enquiry.email && enquiry.email !== 'Not Provided' ? `mailto:${enquiry.email}` : '';
  const formattedDate = new Date(enquiry.createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead: ${enquiry.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #121722; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1C2433 0%, #0F141F 100%); padding: 28px 24px; border-bottom: 2px solid #F59E0B; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase; margin-bottom: 4px;">
                ★ WONDER CARS ★
              </div>
              <div style="font-size: 12px; color: #94A3B8; letter-spacing: 1px; text-transform: uppercase;">
                Certified Pre-Owned Luxury · Preet Vihar, Delhi
              </div>
              <div style="margin-top: 14px; display: inline-block; background-color: ${typeBadge.color}; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
                ⚡ ${typeBadge.label}
              </div>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                New Website Lead Received
              </h2>
              <p style="margin: 0 0 22px 0; font-size: 14px; color: #94A3B8; line-height: 1.5;">
                A customer has just submitted an enquiry through the website. Here are the complete details:
              </p>

              <!-- Quick Action Call/WhatsApp/Email Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="${telUrl}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px;">
                            📞 Call Customer
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px;">
                            💬 WhatsApp Chat
                          </a>
                        </td>
                        ${
                          mailUrl
                            ? `<td style="padding: 0 6px;">
                          <a href="${mailUrl}" style="display: inline-block; background-color: #334155; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 8px;">
                            ✉️ Reply Email
                          </a>
                        </td>`
                            : ''
                        }
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Customer Information Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1A2232; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden; margin-bottom: 22px;">
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8; width: 35%;">
                    CUSTOMER NAME
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 14px; font-weight: 700; color: #FFFFFF;">
                    ${enquiry.name}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    MOBILE NUMBER
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 14px; font-weight: 700; color: #F59E0B; font-family: monospace;">
                    +91 ${cleanPhone.slice(-10)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    EMAIL ADDRESS
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; color: #CBD5E1;">
                    ${enquiry.email || 'Not Provided'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    CITY / LOCATION
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; color: #CBD5E1;">
                    ${enquiry.city || 'Delhi-NCR'}
                  </td>
                </tr>
                ${
                  enquiry.carTitle
                    ? `<tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    TARGET VEHICLE
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 14px; font-weight: 700; color: #60A5FA;">
                    ${enquiry.carTitle}
                  </td>
                </tr>`
                    : ''
                }
                ${
                  enquiry.offerPriceInr
                    ? `<tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    OFFERED PRICE
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 15px; font-weight: 800; color: #10B981; font-family: monospace;">
                    ₹${enquiry.offerPriceInr.toLocaleString('en-IN')}
                  </td>
                </tr>`
                    : ''
                }
                ${
                  enquiry.preferredDate
                    ? `<tr>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; font-weight: 600; color: #94A3B8;">
                    PREFERRED SCHEDULE
                  </td>
                  <td style="padding: 14px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; color: #CBD5E1;">
                    📅 ${enquiry.preferredDate} ${enquiry.preferredTime ? `at ${enquiry.preferredTime}` : ''}
                  </td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 14px 16px; font-size: 12px; font-weight: 600; color: #94A3B8;">
                    RECEIVED TIME
                  </td>
                  <td style="padding: 14px 16px; font-size: 12px; color: #94A3B8;">
                    ${formattedDate} (IST)
                  </td>
                </tr>
              </table>

              <!-- Customer Message Box -->
              <div style="margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #F59E0B; margin-bottom: 8px;">
                  CUSTOMER MESSAGE / REQUIREMENTS:
                </div>
                <div style="background-color: #182030; border-left: 4px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 16px; font-size: 14px; color: #E2E8F0; line-height: 1.6; font-style: italic;">
                  "${enquiry.message}"
                </div>
              </div>

              <!-- Direct Admin Portal Button -->
              <div style="text-align: center; padding-top: 10px;">
                <a href="http://localhost:3000/admin?tab=enquiries" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000000; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 26px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.8px;">
                  View in Wonder Cars Admin Panel →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0D14; padding: 20px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B;">
                Wonder Cars Lead Concierge System · Automated Instant Notification
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                📍 Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildEnquiryPlainText(enquiry: Enquiry): string {
  const typeBadge = getEnquiryTypeBadge(enquiry.type);
  const cleanPhone = enquiry.phone.replace(/\D/g, '');
  const lines = [
    `==============================================`,
    `★ WONDER CARS - NEW LEAD NOTIFICATION ★`,
    `==============================================`,
    `Lead Type: ${typeBadge.label}`,
    `Customer Name: ${enquiry.name}`,
    `Mobile Phone: +91 ${cleanPhone.slice(-10)}`,
    `Email Address: ${enquiry.email}`,
    `City: ${enquiry.city || 'Delhi NCR'}`,
  ];

  if (enquiry.carTitle) {
    lines.push(`Target Vehicle: ${enquiry.carTitle}`);
  }
  if (enquiry.offerPriceInr) {
    lines.push(`Offer Price: ₹${enquiry.offerPriceInr.toLocaleString('en-IN')}`);
  }
  if (enquiry.preferredDate) {
    lines.push(`Schedule: ${enquiry.preferredDate} ${enquiry.preferredTime || ''}`);
  }

  lines.push(
    `----------------------------------------------`,
    `Customer Message:`,
    `"${enquiry.message}"`,
    `----------------------------------------------`,
    `Submitted: ${new Date(enquiry.createdAt).toISOString()}`,
    `Admin Panel: http://localhost:3000/admin?tab=enquiries`,
    `==============================================`
  );

  return lines.join('\n');
}

export async function sendEnquiryNotificationEmail(enquiry: Enquiry): Promise<{
  success: boolean;
  message: string;
  method?: string;
}> {
  const recipient = LEAD_NOTIFICATION_EMAIL;
  const subject = `🚗 New Lead: ${enquiry.name} (+91 ${enquiry.phone.replace(/\D/g, '').slice(-10)}) — Wonder Cars`;
  const html = buildEnquiryHtml(enquiry);
  const text = buildEnquiryPlainText(enquiry);

  const logPayload: Record<string, any> = {
    id: `email-${Date.now()}`,
    enquiryId: enquiry.id,
    recipient,
    subject,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    timestamp: new Date().toISOString(),
    status: 'pending',
    method: 'unknown',
  };

  if (SMTP_USER && SMTP_PASS) {
    try {
      const result = await dispatchMailWithFallback({
        to: recipient,
        subject,
        text,
        html,
      });

      logPayload.status = 'sent';
      logPayload.method = result.method;
      saveOutgoingEmailLog(logPayload);
      console.log(`[EmailService] ✓ Email sent successfully (${result.method}) to ${recipient}. MessageId: ${result.messageId}`);
      return { success: true, message: `Email delivered to ${recipient}`, method: result.method };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('[EmailService] Lead email send error:', errMsg);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
      logPayload.error = errMsg;
      saveOutgoingEmailLog(logPayload);
      return { success: false, message: errMsg, method: 'smtp_error' };
    }
  }

  // If SMTP is not yet configured or failed:
  // Record outgoing lead email into log file so lead is completely preserved and visible
  logPayload.status = 'recorded_locally';
  logPayload.method = 'local_record';
  saveOutgoingEmailLog(logPayload);

  console.log(`\n======================================================`);
  console.log(`[Email Notification Generated for: ${recipient}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Customer: ${enquiry.name} | Phone: ${enquiry.phone} | Email: ${enquiry.email}`);
  console.log(`Message: ${enquiry.message}`);
  if (!SMTP_USER || !SMTP_PASS) {
    console.log(`[Notice] To send real emails directly to Gmail/inbox, add SMTP_USER and SMTP_PASS (Gmail App Password) in .env`);
  }
  console.log(`======================================================\n`);

  return {
    success: true,
    message: `Lead email recorded for ${recipient}`,
    method: 'recorded_locally',
  };
}

export function buildCustomerConfirmationHtml(enquiry: Enquiry, car?: Car, baseUrl = APP_BASE_URL): string {
  const cleanPhone = enquiry.phone.replace(/\D/g, '').slice(-10);
  const selectedCarName = car
    ? `${car.year} ${car.brand} ${car.model}${car.variant ? ` (${car.variant})` : ''}`
    : enquiry.carTitle || '';
  const carModelLabel = car ? `${car.model}${car.variant ? ` (${car.variant})` : ''}` : '';
  const bookingDateFormatted = formatIstDate(enquiry.createdAt);
  const requestTypeLabel = getEnquiryTypeBadge(enquiry.type).label;
  const carImageUrl = resolveCarImageUrl(car, baseUrl);
  const cleanBase = baseUrl.replace(/\/$/, '');
  const viewCarUrl = car ? `${cleanBase}/cars/${encodeURIComponent(car.id)}` : '';

  const rows: string[] = [
    renderEmailRow('Customer Name', escapeHtml(enquiry.name), '#FFFFFF'),
  ];
  if (selectedCarName) {
    rows.push(renderEmailRow('Selected Car Name', escapeHtml(selectedCarName), '#F59E0B'));
  }
  if (car?.brand) {
    rows.push(renderEmailRow('Car Brand', escapeHtml(car.brand)));
  }
  if (carModelLabel) {
    rows.push(renderEmailRow('Car Model', escapeHtml(carModelLabel)));
  }
  rows.push(renderEmailRow('Booking Date', escapeHtml(bookingDateFormatted)));
  if (enquiry.preferredDate) {
    rows.push(renderEmailRow('Preferred Visit Date', escapeHtml(enquiry.preferredDate), '#38BDF8'));
  }
  if (enquiry.preferredTime) {
    rows.push(renderEmailRow('Preferred Visit Time', escapeHtml(enquiry.preferredTime), '#38BDF8'));
  }
  rows.push(renderEmailRow('Contact Number', escapeHtml(cleanPhone ? `+91 ${cleanPhone}` : enquiry.phone)));
  rows.push(renderEmailRow('Email Address', escapeHtml(enquiry.email)));
  rows.push(renderEmailRow('Request Type', escapeHtml(requestTypeLabel)));
  if (enquiry.offerPriceInr && enquiry.offerPriceInr > 0) {
    rows.push(renderEmailRow('Submitted Offer Price', `₹${enquiry.offerPriceInr.toLocaleString('en-IN')}`, '#10B981'));
  }
  if (enquiry.city) {
    rows.push(renderEmailRow('Preferred Location / City', escapeHtml(enquiry.city)));
  }
  if (enquiry.message) {
    rows.push(renderEmailRow('Additional Information / Message', escapeHtml(enquiry.message)));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! Your Car Booking Request Has Been Received – Wonder Cars</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #121722; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1C2433 0%, #0F141F 100%); padding: 28px 24px; border-bottom: 2px solid #F59E0B; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase; margin-bottom: 6px;">
                WONDER CARS
              </div>
              <div style="font-size: 12px; color: #94A3B8; letter-spacing: 0.8px; text-transform: uppercase;">
                Showroom Booking Confirmation
              </div>
              <div style="margin-top: 14px; display: inline-block; background-color: #10B981; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase;">
                Request Successfully Submitted
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 16px; color: #FFFFFF; font-weight: 700;">
                Dear ${escapeHtml(enquiry.name)},
              </p>
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Congratulations! Your car booking request has been successfully submitted.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Thank you for choosing <strong>Wonder Cars</strong> and showing interest in our services.
              </p>
              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.6px;">
                Here are your booking details:
              </p>
            </td>
          </tr>

          ${
            carImageUrl
              ? `<tr>
            <td style="padding: 4px 24px 12px 24px;">
              <img src="${escapeHtml(carImageUrl)}" alt="${escapeHtml(selectedCarName || 'Selected Car')}" style="width: 100%; height: auto; max-height: 240px; object-fit: cover; border-radius: 12px; display: block; border: 1px solid rgba(255, 255, 255, 0.08);" />
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td style="padding: 0 24px 16px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0A0D14; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden;">
                ${rows.join('\n')}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Our team will contact you soon to confirm your request.
              </p>
              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Please be available at your selected time. Our team will share the car details and further information with you.
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #FFFFFF; font-weight: 600;">
                Thank you for choosing Wonder Cars!
              </p>
              ${
                viewCarUrl
                  ? `<div style="margin: 0 0 18px 0;">
                <a href="${escapeHtml(viewCarUrl)}" target="_blank" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; font-weight: 700; font-size: 13px; padding: 11px 22px; border-radius: 8px; text-decoration: none;">
                  View Selected Car Details
                </a>
              </div>`
                  : ''
              }
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                Best Regards,<br/>
                <strong style="color: #F59E0B;">Wonder Cars Team</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 16px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-size: 11px; color: #64748B;">
              Wonder Cars · Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendCustomerConfirmationEmail(
  enquiry: Enquiry,
  car?: Car
): Promise<{ success: boolean; message: string; method?: string }> {
  if (!enquiry.email || enquiry.email === 'Not Provided' || !enquiry.email.includes('@')) {
    return { success: false, message: 'No customer email provided' };
  }

  const recipient = enquiry.email.trim();
  const cleanPhone = enquiry.phone.replace(/\D/g, '').slice(-10);
  const selectedCarName = car
    ? `${car.year} ${car.brand} ${car.model}${car.variant ? ` (${car.variant})` : ''}`
    : enquiry.carTitle || '';
  const subject = 'Congratulations! Your Car Booking Request Has Been Received – Wonder Cars';
  const html = buildCustomerConfirmationHtml(enquiry, car, APP_BASE_URL);

  const textLines = [
    `Dear ${enquiry.name},`,
    '',
    'Congratulations! Your car booking request has been successfully submitted.',
    'Thank you for choosing Wonder Cars and showing interest in our services.',
    '',
    'Here are your booking details:',
    `- Customer Name: ${enquiry.name}`,
    ...(selectedCarName ? [`- Selected Car Name: ${selectedCarName}`] : []),
    ...(car?.brand ? [`- Car Brand: ${car.brand}`] : []),
    ...(car?.model ? [`- Car Model: ${car.model}${car.variant ? ` (${car.variant})` : ''}`] : []),
    `- Booking Date: ${formatIstDate(enquiry.createdAt)}`,
    ...(enquiry.preferredDate ? [`- Preferred Visit Date: ${enquiry.preferredDate}`] : []),
    ...(enquiry.preferredTime ? [`- Preferred Visit Time: ${enquiry.preferredTime}`] : []),
    `- Contact Number: ${cleanPhone ? `+91 ${cleanPhone}` : enquiry.phone}`,
    `- Email Address: ${recipient}`,
    `- Request Type: ${getEnquiryTypeBadge(enquiry.type).label}`,
    ...(enquiry.offerPriceInr ? [`- Submitted Offer Price: ₹${enquiry.offerPriceInr.toLocaleString('en-IN')}`] : []),
    ...(enquiry.city ? [`- Location / City: ${enquiry.city}`] : []),
    ...(enquiry.message ? [`- Additional Information: ${enquiry.message}`] : []),
    '',
    'Our team will contact you soon to confirm your request.',
    'Please be available at your selected time. Our team will share the car details and further information with you.',
    '',
    'Thank you for choosing Wonder Cars!',
    '',
    'Best Regards,',
    'Wonder Cars Team',
  ];
  const text = textLines.join('\n');

  const logPayload: Record<string, any> = {
    id: `email-cust-${Date.now()}`,
    type: 'customer_confirmation',
    enquiryId: enquiry.id,
    recipient,
    subject,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    timestamp: new Date().toISOString(),
    status: 'pending',
    method: 'unknown',
  };

  if (SMTP_USER && SMTP_PASS) {
    try {
      const result = await dispatchMailWithFallback({
        to: recipient,
        subject,
        text,
        html,
      });

      logPayload.status = 'sent';
      logPayload.method = result.method;
      saveOutgoingEmailLog(logPayload);
      console.log(`[EmailService] ✓ Customer confirmation email sent (${result.method}) to ${recipient}. MessageId: ${result.messageId}`);
      return { success: true, message: `Confirmation delivered to ${recipient}`, method: result.method };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('[EmailService] Customer confirmation send error:', errMsg);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
      logPayload.error = errMsg;
      saveOutgoingEmailLog(logPayload);
      return { success: false, message: errMsg, method: 'smtp_error' };
    }
  }

  logPayload.status = 'recorded_locally';
  logPayload.method = 'local_record';
  saveOutgoingEmailLog(logPayload);

  return {
    success: true,
    message: `Customer confirmation email recorded for ${recipient}`,
    method: 'recorded_locally',
  };
}

/**
 * Requirement 2: Internal Owner Notification Email
 * Sent ONLY to website owner's email: vickybhelave25@navgurukul.org
 * Subject: New Car Booking Request Received – Wonder Cars
 */
export function buildOwnerNotificationHtml(
  enquiry: Enquiry,
  car?: Car,
  baseUrl = APP_BASE_URL,
  hasBrochureAttachment = false
): string {
  const cleanPhone = enquiry.phone.replace(/\D/g, '').slice(-10);
  const waPhone = `91${cleanPhone}`;
  const selectedCarName = car
    ? `${car.year} ${car.brand} ${car.model}${car.variant ? ` (${car.variant})` : ''}`
    : enquiry.carTitle || '';
  const telUrl = `tel:+91${cleanPhone}`;
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${enquiry.name}, thank you for contacting Wonder Cars regarding ${selectedCarName || 'your booking request'}.`
  )}`;
  const hasCustomerEmail = Boolean(enquiry.email && enquiry.email !== 'Not Provided' && enquiry.email.includes('@'));
  const mailUrl = hasCustomerEmail ? `mailto:${enquiry.email}` : '';
  const submissionDateTime = formatIstDateTime(enquiry.createdAt);
  const requestTypeLabel = getEnquiryTypeBadge(enquiry.type).label;
  const carImageUrl = resolveCarImageUrl(car, baseUrl);
  const cleanBase = baseUrl.replace(/\/$/, '');

  const customerRows: string[] = [
    renderEmailRow('Customer Full Name', escapeHtml(enquiry.name), '#FFFFFF'),
    renderEmailRow(
      'Customer Email Address',
      hasCustomerEmail
        ? `<a href="${escapeHtml(mailUrl)}" style="color: #60A5FA; text-decoration: none;">${escapeHtml(enquiry.email)}</a>`
        : 'Not Provided'
    ),
    renderEmailRow(
      'Customer Contact Number',
      `<a href="${escapeHtml(telUrl)}" style="color: #38BDF8; text-decoration: none; font-family: monospace;">+91 ${escapeHtml(cleanPhone)}</a>`
    ),
    renderEmailRow('Request Type', escapeHtml(requestTypeLabel)),
    renderEmailRow('Booking Reference ID', `<span style="font-family: monospace;">${escapeHtml(enquiry.id)}</span>`),
  ];

  if (selectedCarName) {
    customerRows.push(renderEmailRow('Selected Car Name', escapeHtml(selectedCarName), '#F59E0B'));
  }
  if (car?.brand) {
    customerRows.push(renderEmailRow('Car Brand', escapeHtml(car.brand)));
  }
  if (car?.model) {
    customerRows.push(renderEmailRow('Car Model', escapeHtml(`${car.model}${car.variant ? ` (${car.variant})` : ''}`)));
  }
  if (car?.id || enquiry.carId) {
    const idDisplay = `${car?.id || enquiry.carId}${car?.listingCode ? ` (Listing: ${car.listingCode})` : ''}`;
    customerRows.push(renderEmailRow('Car ID', `<span style="font-family: monospace;">${escapeHtml(idDisplay)}</span>`));
  }
  if (car && car.priceInr > 0) {
    customerRows.push(renderEmailRow('Car Price', `₹${car.priceInr.toLocaleString('en-IN')}`, '#F59E0B'));
  }
  if (enquiry.offerPriceInr && enquiry.offerPriceInr > 0) {
    customerRows.push(renderEmailRow('Customer Offer Price', `₹${enquiry.offerPriceInr.toLocaleString('en-IN')}`, '#10B981'));
  }
  if (enquiry.preferredDate) {
    customerRows.push(renderEmailRow('Preferred Booking / Visit Date', escapeHtml(enquiry.preferredDate), '#38BDF8'));
  }
  if (enquiry.preferredTime) {
    customerRows.push(renderEmailRow('Preferred Booking / Visit Time', escapeHtml(enquiry.preferredTime), '#38BDF8'));
  }
  if (enquiry.city) {
    customerRows.push(renderEmailRow('City / Preferred Location', escapeHtml(enquiry.city)));
  }
  if (enquiry.source) {
    customerRows.push(renderEmailRow('Form Source', escapeHtml(enquiry.source)));
  }
  customerRows.push(renderEmailRow('Submission Date & Time', escapeHtml(submissionDateTime)));
  customerRows.push(renderEmailRow('Message / Additional Notes', `<em>${escapeHtml(enquiry.message)}</em>`));

  const carDetailRows: string[] = [];
  if (car) {
    carDetailRows.push(renderEmailRow('Car ID', `<span style="font-family: monospace;">${escapeHtml(car.id)}</span>`));
    if (car.listingCode) carDetailRows.push(renderEmailRow('Listing Code', escapeHtml(car.listingCode), '#F59E0B'));
    carDetailRows.push(renderEmailRow('Year / Brand / Model', escapeHtml(`${car.year} ${car.brand} ${car.model}`), '#FFFFFF'));
    if (car.variant) carDetailRows.push(renderEmailRow('Variant', escapeHtml(car.variant)));
    if (car.priceInr > 0) carDetailRows.push(renderEmailRow('Price', `₹${car.priceInr.toLocaleString('en-IN')}`, '#F59E0B'));
    if (car.kilometres !== undefined) carDetailRows.push(renderEmailRow('Odometer', `${Number(car.kilometres).toLocaleString('en-IN')} km`));
    if (car.fuelType || car.transmission) carDetailRows.push(renderEmailRow('Fuel / Transmission', escapeHtml(`${car.fuelType} · ${car.transmission}`)));
    if (car.ownership || car.registrationState) carDetailRows.push(renderEmailRow('Ownership / RTO', escapeHtml(`${car.ownership}${car.registrationState ? ` · ${car.registrationState}` : ''}`)));
    if (car.color) carDetailRows.push(renderEmailRow('Colour', escapeHtml(car.color)));
    if (car.status) carDetailRows.push(renderEmailRow('Status', escapeHtml(car.status)));
    if (car.warrantyPeriod) carDetailRows.push(renderEmailRow('Warranty', escapeHtml(car.warrantyPeriod), '#10B981'));
    if (car.location) carDetailRows.push(renderEmailRow('Showroom Location', escapeHtml(car.location)));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Car Booking Request Received – Wonder Cars</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 640px; background-color: #121722; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%); padding: 24px; border-bottom: 2px solid #F59E0B; text-align: center;">
              <div style="font-size: 11px; font-weight: 800; color: #FBBF24; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                Internal Owner Notification · Not a Customer Confirmation
              </div>
              <div style="font-size: 22px; font-weight: 800; color: #FFFFFF;">
                New Car Booking Request Received – Wonder Cars
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 22px 24px 10px 24px;">
              <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #FFFFFF;">
                Hello Vicky,
              </p>
              <p style="margin: 0 0 6px 0; font-size: 14px; color: #CBD5E1; line-height: 1.6;">
                A new car booking/request has been submitted on your Wonder Cars website.
              </p>
              <p style="margin: 0; font-size: 14px; color: #CBD5E1; line-height: 1.6;">
                A customer is interested in booking or viewing a car.
              </p>
            </td>
          </tr>

          <!-- Quick Clickable Contact Actions -->
          <tr>
            <td style="padding: 14px 24px 6px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.9px; margin-bottom: 10px;">
                Customer Contact Information (Quick Actions)
              </div>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding-right: 8px; padding-bottom: 8px;">
                    <a href="${escapeHtml(telUrl)}" style="display: inline-block; background-color: #2563EB; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 16px; border-radius: 8px;">
                      Call: +91 ${escapeHtml(cleanPhone)}
                    </a>
                  </td>
                  <td style="padding-right: 8px; padding-bottom: 8px;">
                    <a href="${escapeHtml(waUrl)}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 16px; border-radius: 8px;">
                      WhatsApp Customer
                    </a>
                  </td>
                  ${
                    hasCustomerEmail
                      ? `<td style="padding-bottom: 8px;">
                    <a href="${escapeHtml(mailUrl)}" style="display: inline-block; background-color: #334155; color: #FFFFFF; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 16px; border-radius: 8px;">
                      Email: ${escapeHtml(enquiry.email)}
                    </a>
                  </td>`
                      : ''
                  }
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section 1: Complete Customer Information -->
          <tr>
            <td style="padding: 14px 24px 10px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 0.9px; margin-bottom: 8px;">
                Complete Customer Information &amp; Form Submission
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #0A0D14; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
                ${customerRows.join('\n')}
              </table>
            </td>
          </tr>

          <!-- Section 2: Selected Car Details -->
          <tr>
            <td style="padding: 14px 24px 10px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.9px; margin-bottom: 8px;">
                Selected Car Details
              </div>
              ${
                car
                  ? `${
                      carImageUrl
                        ? `<img src="${escapeHtml(carImageUrl)}" alt="${escapeHtml(selectedCarName)}" style="width: 100%; height: auto; max-height: 250px; object-fit: cover; border-radius: 10px; margin-bottom: 10px; display: block; border: 1px solid rgba(255,255,255,0.08);" />`
                        : ''
                    }
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #0A0D14; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); overflow: hidden;">
                      ${carDetailRows.join('\n')}
                    </table>
                    <div style="margin-top: 10px;">
                      <a href="${escapeHtml(`${cleanBase}/cars/${encodeURIComponent(car.id)}`)}" target="_blank" style="color: #60A5FA; font-size: 12px; font-weight: 600; text-decoration: none;">
                        Open Car Listing Page &rarr;
                      </a>
                    </div>`
                  : `<div style="background: #0A0D14; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); padding: 14px; font-size: 13px; color: #94A3B8;">
                      ${selectedCarName ? escapeHtml(selectedCarName) : 'No specific vehicle ID was attached to this request.'}
                    </div>`
              }
            </td>
          </tr>

          ${
            hasBrochureAttachment
              ? `<tr>
            <td style="padding: 10px 24px;">
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; font-size: 12px; color: #FDE68A;">
                Vehicle specification brochure files are attached for internal showroom reference.
              </div>
            </td>
          </tr>`
              : ''
          }

          <tr>
            <td style="padding: 16px 24px 24px 24px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #FBBF24; font-weight: 600;">
                This email is an internal owner notification, not a customer confirmation.
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94A3B8;">
                Regards,<br/>
                <strong style="color: #FFFFFF;">Wonder Cars Website System</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendShowroomOwnerBookingEmail(
  enquiry: Enquiry,
  car?: Car,
  brochurePdfBuffer?: Buffer
): Promise<{ success: boolean; message: string; method?: string }> {
  const ownerEmail = OWNER_NOTIFICATION_EMAIL;
  const subject = 'New Car Booking Request Received – Wonder Cars';
  const cleanPhone = enquiry.phone.replace(/\D/g, '').slice(-10);

  const selectedCarName = car
    ? `${car.year} ${car.brand} ${car.model}${car.variant ? ` (${car.variant})` : ''}`
    : enquiry.carTitle || '';

  const bookingDateTimeFormatted = formatIstDateTime(enquiry.createdAt);

  const cleanBrand = (car?.brand || 'Car').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanModel = (car?.model || 'Booking').replace(/[^a-zA-Z0-9_-]/g, '');
  const attachments: any[] = [];

  let resolvedPdfBuffer = brochurePdfBuffer;
  if (!resolvedPdfBuffer && car) {
    try {
      resolvedPdfBuffer = await generateCarBookingPdfBuffer(car, {
        bookingId: enquiry.id,
        customerName: enquiry.name,
        customerPhone: enquiry.phone,
        customerEmail: enquiry.email !== 'Not Provided' ? enquiry.email : undefined,
        requestType: enquiry.type,
        preferredDate: enquiry.preferredDate,
        preferredTime: enquiry.preferredTime,
        city: enquiry.city,
        offerPriceInr: enquiry.offerPriceInr,
        message: enquiry.message,
      });
    } catch (pdfErr) {
      console.error('[EmailService] Failed to build owner email PDF attachment:', pdfErr);
    }
  }

  if (resolvedPdfBuffer && resolvedPdfBuffer.length > 0) {
    attachments.push({
      filename: `WonderCars-${cleanBrand}-${cleanModel}-Brochure.pdf`,
      content: resolvedPdfBuffer,
      contentType: 'application/pdf',
    });
  }

  const html = buildOwnerNotificationHtml(enquiry, car, APP_BASE_URL, attachments.length > 0);
  const textLines = [
    'Hello Vicky,',
    '',
    'A new car booking/request has been submitted on your Wonder Cars website.',
    'A customer is interested in booking or viewing a car.',
    '',
    'Complete Customer Information:',
    `- Customer Full Name: ${enquiry.name}`,
    `- Customer Email Address: ${enquiry.email || 'Not Provided'}`,
    `- Customer Contact Number: +91 ${cleanPhone} (tel:+91${cleanPhone})`,
    `- WhatsApp Link: https://wa.me/91${cleanPhone}`,
    `- Request Type: ${getEnquiryTypeBadge(enquiry.type).label}`,
    ...(selectedCarName ? [`- Selected Car Name: ${selectedCarName}`] : []),
    ...(car?.brand ? [`- Car Brand: ${car.brand}`] : []),
    ...(car?.model ? [`- Car Model: ${car.model}${car.variant ? ` (${car.variant})` : ''}`] : []),
    ...(car?.id || enquiry.carId ? [`- Car ID: ${car?.id || enquiry.carId}`] : []),
    ...(car && car.priceInr > 0 ? [`- Car Price: ₹${car.priceInr.toLocaleString('en-IN')}`] : []),
    ...(enquiry.offerPriceInr ? [`- Offer Price: ₹${enquiry.offerPriceInr.toLocaleString('en-IN')}`] : []),
    ...(enquiry.preferredDate ? [`- Preferred Visit Date: ${enquiry.preferredDate}`] : []),
    ...(enquiry.preferredTime ? [`- Preferred Visit Time: ${enquiry.preferredTime}`] : []),
    ...(enquiry.city ? [`- City / Location: ${enquiry.city}`] : []),
    ...(enquiry.source ? [`- Form Source: ${enquiry.source}`] : []),
    `- Submission Date & Time: ${bookingDateTimeFormatted}`,
    `- Message / Additional Notes: ${enquiry.message}`,
    '',
    'This email is an internal owner notification, not a customer confirmation.',
    '',
    'Regards,',
    'Wonder Cars Website System',
  ];
  const text = textLines.join('\n');

  const logPayload: Record<string, any> = {
    id: `email-owner-${Date.now()}`,
    type: 'owner_notification',
    enquiryId: enquiry.id,
    recipients: [ownerEmail],
    recipient: ownerEmail,
    subject,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    carTitle: selectedCarName || 'General Enquiry',
    bookingTime: bookingDateTimeFormatted,
    attachedFiles: attachments.map((a) => a.filename),
    timestamp: new Date().toISOString(),
    status: 'pending',
    method: 'unknown',
  };

  if (SMTP_USER && SMTP_PASS) {
    try {
      const result = await dispatchMailWithFallback({
        to: ownerEmail,
        subject,
        text,
        html,
        attachments,
      });

      logPayload.status = 'sent';
      logPayload.method = result.method;
      saveOutgoingEmailLog(logPayload);
      console.log(
        `[EmailService] ✓ Showroom Owner notification email "${subject}" sent (${result.method}) to ${ownerEmail}. MessageId: ${result.messageId}`
      );
      return { success: true, message: `Delivered to ${ownerEmail}`, method: result.method };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('[EmailService] Owner email send error:', errMsg);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
      logPayload.error = errMsg;
      saveOutgoingEmailLog(logPayload);
      return { success: false, message: errMsg, method: 'smtp_error' };
    }
  }

  logPayload.status = 'recorded_locally';
  logPayload.method = 'local_record';
  saveOutgoingEmailLog(logPayload);

  return {
    success: true,
    message: `Owner booking email recorded for ${ownerEmail}`,
    method: 'recorded_locally',
  };
}

export function getOutgoingEmailLogs(): any[] {
  try {
    if (fs.existsSync(OUTGOING_LOG_PATH)) {
      return JSON.parse(fs.readFileSync(OUTGOING_LOG_PATH, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return [];
}

export function getSmtpConfigStatus(): {
  configured: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  ownerEmails: string[];
} {
  return {
    configured: Boolean(SMTP_USER && SMTP_PASS),
    smtpHost: SMTP_HOST,
    smtpPort: SMTP_PORT,
    smtpUser: SMTP_USER ? `${SMTP_USER.slice(0, 3)}***@${SMTP_USER.split('@')[1] || ''}` : '',
    ownerEmails: SHOWROOM_OWNER_EMAILS,
  };
}

export async function testSmtpConnection(targetEmail?: string): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const recipient = targetEmail || SHOWROOM_OWNER_EMAILS[0] || 'vickybhelave25@navgurukul.org';
  if (!SMTP_USER || !SMTP_PASS) {
    return {
      success: false,
      message: 'SMTP credentials are not yet configured in .env. To receive real emails in your inbox, set SMTP_USER (your Gmail) and SMTP_PASS (16-digit Google App Password).',
      details: {
        configured: false,
        recipient,
        smtpHost: SMTP_HOST,
        smtpPort: SMTP_PORT,
      },
    };
  }

  try {
    const result = await dispatchMailWithFallback({
      to: recipient,
      subject: '🚗 Wonder Cars - Test Email Delivery',
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #0b0e14; color: #fff; border-radius: 12px; border: 1px solid #f59e0b;">
          <h2 style="color: #f59e0b; margin-top: 0;">★ WONDER CARS SMTP EMAIL TEST ★</h2>
          <p style="font-size: 14px; color: #e2e8f0;">Your SMTP email configuration is active and working properly!</p>
          <p style="font-size: 13px; color: #cbd5e1;">All customer test drives, price offers, and car bookings will now be delivered live to this inbox with customer information and attached inspection PDFs.</p>
          <div style="margin-top: 16px; padding: 12px; background: #1a2232; border-radius: 8px; font-size: 12px; color: #94a3b8;">
            <div>Target Inbox: <strong>${recipient}</strong></div>
            <div>Timestamp: <strong>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong></div>
            <div>Server: <strong>${SMTP_HOST}:${SMTP_PORT}</strong></div>
          </div>
        </div>
      `,
    });

    saveOutgoingEmailLog({
      id: `email-test-${Date.now()}`,
      recipient,
      subject: '🚗 Wonder Cars - Test Email Delivery',
      timestamp: new Date().toISOString(),
      status: 'sent',
      method: result.method,
    });

    return {
      success: true,
      message: `Test email successfully sent (${result.method}) to ${recipient}`,
      details: { messageId: result.messageId, method: result.method },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to send test email through SMTP server',
      details: { error: String(err) },
    };
  }
}

