import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Enquiry } from '../models/types.ts';
import {
  DATA_DIR,
  LEAD_NOTIFICATION_EMAIL,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
} from '../config/index.ts';

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

  const logPayload = {
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

  // Check if SMTP is configured
  if (SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to: recipient,
        subject,
        text,
        html,
      });

      logPayload.status = 'sent';
      logPayload.method = `smtp:${SMTP_HOST}`;
      saveOutgoingEmailLog(logPayload);
      console.log(`[EmailService] ✓ Email sent successfully via SMTP to ${recipient}. MessageId: ${info.messageId}`);
      return { success: true, message: `Email delivered to ${recipient}`, method: 'smtp' };
    } catch (err: any) {
      console.error('[EmailService] SMTP send error:', err?.message || err);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
      // Fall through to record log
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
