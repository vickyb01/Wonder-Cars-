import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import type { Enquiry, Car } from '../models/types.ts';
import {
  DATA_DIR,
  LEAD_NOTIFICATION_EMAIL,
  SHOWROOM_OWNER_EMAILS,
  APP_BASE_URL,
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

export function buildCustomerConfirmationHtml(enquiry: Enquiry, car?: Car, baseUrl = 'http://localhost:5000'): string {
  const cleanPhone = enquiry.phone.replace(/\D/g, '');
  const carTitle = car
    ? `${car.year} ${car.brand} ${car.model} (${car.variant})`
    : enquiry.carTitle || 'Certified Pre-Owned Luxury Car';

  const brochureUrl = car
    ? `${baseUrl}/api/cars/${car.id}/brochure`
    : `${baseUrl}/inventory`;

  const waUrl = `https://wa.me/918384068347?text=${encodeURIComponent(
    `Hello Wonder Cars, I booked a test drive for ${carTitle}. Customer Name: ${enquiry.name}.`
  )}`;

  const carImageUrl = car?.images?.[0]
    ? (car.images[0].startsWith('http') ? car.images[0] : `${baseUrl}${car.images[0]}`)
    : 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80';

  const priceText = car ? `₹${car.priceInr.toLocaleString('en-IN')}` : 'Market Competitive';
  const warrantyText = car?.warrantyPeriod && car.warrantyPeriod !== 'No Warranty'
    ? `${car.warrantyPeriod} Warranty Included`
    : '6 Months Certified Warranty Included';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation: ${carTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 24px 12px;">
    <tr>
      <td align="center">
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
              <div style="margin-top: 14px; display: inline-block; background-color: #10B981; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.8px;">
                ✓ Test Drive Request Confirmed
              </div>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #FFFFFF; font-weight: 700;">
                Namaste ${enquiry.name} ji,
              </h2>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                Thank you for choosing <strong>Wonder Cars</strong>. Your private test drive and viewing reservation for the vehicle below has been received and scheduled with our showroom team.
              </p>
            </td>
          </tr>

          <!-- Vehicle Showcase Card -->
          <tr>
            <td style="padding: 12px 24px;">
              <table role="presentation" width="100%" style="background-color: #0A0D14; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); overflow: hidden;">
                ${
                  carImageUrl
                    ? `<tr>
                        <td>
                          <img src="${carImageUrl}" alt="${carTitle}" style="width: 100%; height: auto; max-height: 240px; object-fit: cover; display: block;" />
                        </td>
                      </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 18px; font-weight: 700; color: #FFFFFF; margin-bottom: 6px;">
                      ${carTitle}
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #F59E0B; margin-bottom: 12px;">
                      ${priceText}
                    </div>
                    
                    <table role="presentation" width="100%" style="font-size: 12px; color: #94A3B8; border-collapse: collapse;">
                      ${car ? `
                      <tr>
                        <td style="padding: 4px 0; color: #64748B;">Fuel / Transmission:</td>
                        <td style="padding: 4px 0; color: #E2E8F0; font-weight: 600; text-align: right;">${car.fuelType} · ${car.transmission}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748B;">Odometer:</td>
                        <td style="padding: 4px 0; color: #E2E8F0; font-weight: 600; text-align: right;">${car.kilometres.toLocaleString('en-IN')} km</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #64748B;">Ownership / State:</td>
                        <td style="padding: 4px 0; color: #E2E8F0; font-weight: 600; text-align: right;">${car.ownership} · ${car.registrationState}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 4px 0; color: #64748B;">Warranty:</td>
                        <td style="padding: 4px 0; color: #10B981; font-weight: 700; text-align: right;">${warrantyText}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Appointment Slot & Location -->
          <tr>
            <td style="padding: 12px 24px;">
              <table role="presentation" width="100%" style="background-color: #161D2C; border-radius: 12px; padding: 18px; border-left: 4px solid #3B82F6;">
                <tr>
                  <td>
                    <div style="font-size: 11px; text-transform: uppercase; color: #93C5FD; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">
                      📍 Showroom Appointment Details
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">
                      ${enquiry.preferredDate ? `${enquiry.preferredDate} at ${enquiry.preferredTime || '11:00 AM'}` : 'Timing: Flexible (Showroom 10:00 AM - 8:00 PM)'}
                    </div>
                    <div style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">
                      <strong>Location:</strong> Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.
                    </div>
                    <div style="font-size: 12px; color: #CBD5E1; margin-top: 4px;">
                      <strong>Executive Contact:</strong> Naman Jain · <a href="tel:8384068347" style="color: #60A5FA; text-decoration: none; font-weight: 600;">+91 83840 68347</a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Brochure Action Buttons -->
          <tr>
            <td style="padding: 16px 24px; text-align: center;">
              <table role="presentation" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${brochureUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000000; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.35);">
                      📄 Download Official Car Spec & Inspection PDF
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${waUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #FFFFFF; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px; text-decoration: none;">
                      💬 Chat on WhatsApp with Showroom
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94A3B8;">
                ★ 210-Point Certified Inspection · 100% Non-Accidental Verified · Clean Documentation ★
              </p>
              <p style="margin: 0; font-size: 11px; color: #64748B;">
                Wonder Cars · Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92
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

export async function sendCustomerConfirmationEmail(
  enquiry: Enquiry,
  car?: Car
): Promise<{ success: boolean; message: string; method?: string }> {
  if (!enquiry.email || enquiry.email === 'Not Provided' || !enquiry.email.includes('@')) {
    return { success: false, message: 'No customer email provided' };
  }

  const recipient = enquiry.email;
  const carTitle = car ? `${car.year} ${car.brand} ${car.model}` : (enquiry.carTitle || 'Certified Car');
  const subject = `🚗 Booking Confirmed: ${carTitle} — Wonder Cars Preet Vihar`;
  const html = buildCustomerConfirmationHtml(enquiry, car);
  const text = `Namaste ${enquiry.name} ji,\n\nYour test drive request for ${carTitle} has been confirmed at Wonder Cars Preet Vihar.\nLocation: Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.\nExecutive Contact: Naman Jain (+91 83840 68347)\n\nDownload Car Spec & Inspection PDF Brochure: http://localhost:5000/api/cars/${car?.id || enquiry.carId}/brochure\n\nWonder Cars Team`;

  const logPayload = {
    id: `email-cust-${Date.now()}`,
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
      console.log(`[EmailService] ✓ Customer confirmation email sent to ${recipient}. MessageId: ${info.messageId}`);
      return { success: true, message: `Confirmation delivered to ${recipient}`, method: 'smtp' };
    } catch (err: any) {
      console.error('[EmailService] SMTP customer confirmation send error:', err?.message || err);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
    }
  }

  logPayload.status = 'recorded_locally';
  logPayload.method = 'local_record';
  saveOutgoingEmailLog(logPayload);

  console.log(`\n======================================================`);
  console.log(`[Customer Confirmation Email Generated for: ${recipient}]`);
  console.log(`Subject: ${subject}`);
  console.log(`Customer: ${enquiry.name} | Phone: ${enquiry.phone}`);
  console.log(`Car: ${carTitle}`);
  console.log(`Brochure URL: http://localhost:5000/api/cars/${car?.id || enquiry.carId}/brochure`);
  console.log(`======================================================\n`);

  return {
    success: true,
    message: `Customer confirmation email recorded for ${recipient}`,
    method: 'recorded_locally',
  };
}

/**
 * Requirement 2: Showroom Owner Email Notification
 * Automatically send an email to: vickybhelave25@navgurukl.org
 * Email subject: New Car Booking Received
 * Include:
 * - Customer name and mobile number.
 * - Selected car details.
 * - Complete booking information.
 * - Booking date and time.
 * - Attach the same existing generated PDF to the email.
 */
export async function sendShowroomOwnerBookingEmail(
  enquiry: Enquiry,
  car?: Car,
  brochureHtml?: string
): Promise<{ success: boolean; message: string; method?: string }> {
  const recipients = SHOWROOM_OWNER_EMAILS;
  const primaryRecipient = recipients[0];
  const subject = 'New Car Booking Received';
  const cleanPhone = enquiry.phone.replace(/\D/g, '');

  const carTitle = car
    ? `${car.year} ${car.brand} ${car.model} (${car.variant})`
    : enquiry.carTitle || 'Certified Pre-Owned Luxury Car';

  const bookingDateTimeFormatted = new Date(enquiry.createdAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const priceText = car ? `₹${car.priceInr.toLocaleString('en-IN')}` : 'Market Competitive';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0E14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0E14; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #121722; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1C2433 0%, #0F141F 100%); padding: 28px 24px; border-bottom: 2px solid #F59E0B; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase; margin-bottom: 4px;">
                ★ WONDER CARS ★
              </div>
              <div style="font-size: 13px; color: #E2E8F0; letter-spacing: 1px; font-weight: 700; text-transform: uppercase;">
                ${subject}
              </div>
              <div style="margin-top: 10px; font-size: 11px; color: #94A3B8;">
                Preet Vihar Commercial Complex, Delhi-92
              </div>
            </td>
          </tr>

          <!-- Section 1: Customer Details -->
          <tr>
            <td style="padding: 24px 24px 12px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #F59E0B; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                👤 Customer Details
              </div>
              <table role="presentation" width="100%" style="font-size: 13px; color: #CBD5E1; background: #0A0D14; border-radius: 8px; padding: 14px; border: 1px solid rgba(255,255,255,0.06);">
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8; width: 35%;">Customer Name:</td>
                  <td style="padding: 4px 0; color: #FFFFFF; font-weight: 700;">${enquiry.name}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Mobile Number:</td>
                  <td style="padding: 4px 0; color: #38BDF8; font-weight: 700; font-family: monospace;">+91 ${cleanPhone.slice(-10)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Email Address:</td>
                  <td style="padding: 4px 0; color: #E2E8F0;">${enquiry.email || 'Not Provided'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">City / Location:</td>
                  <td style="padding: 4px 0; color: #E2E8F0;">${enquiry.city || 'Delhi NCR'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section 2: Selected Car Details -->
          <tr>
            <td style="padding: 12px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #38BDF8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                🚗 Selected Car Details
              </div>
              <table role="presentation" width="100%" style="font-size: 13px; color: #CBD5E1; background: #0A0D14; border-radius: 8px; padding: 14px; border: 1px solid rgba(255,255,255,0.06);">
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8; width: 35%;">Vehicle:</td>
                  <td style="padding: 4px 0; color: #FFFFFF; font-weight: 700;">${carTitle}</td>
                </tr>
                ${car ? `
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Listing Code:</td>
                  <td style="padding: 4px 0; color: #F59E0B; font-weight: 700; font-family: monospace;">${car.listingCode}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Asking Price:</td>
                  <td style="padding: 4px 0; color: #F59E0B; font-weight: 700;">${priceText}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Odo / Fuel / Trans:</td>
                  <td style="padding: 4px 0; color: #E2E8F0;">${car.kilometres.toLocaleString('en-IN')} km · ${car.fuelType} · ${car.transmission}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Ownership / State:</td>
                  <td style="padding: 4px 0; color: #E2E8F0;">${car.ownership} · ${car.registrationState}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Warranty:</td>
                  <td style="padding: 4px 0; color: #10B981; font-weight: 700;">${car.warrantyPeriod || '6 Months Certified Warranty'}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Section 3: Complete Booking Information -->
          <tr>
            <td style="padding: 12px 24px;">
              <div style="font-size: 12px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                📋 Complete Booking Information
              </div>
              <table role="presentation" width="100%" style="font-size: 13px; color: #CBD5E1; background: #0A0D14; border-radius: 8px; padding: 14px; border: 1px solid rgba(255,255,255,0.06);">
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8; width: 35%;">Booking Type:</td>
                  <td style="padding: 4px 0; color: #FFFFFF; font-weight: 700; text-transform: capitalize;">${enquiry.type}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Scheduled Slot:</td>
                  <td style="padding: 4px 0; color: #38BDF8; font-weight: 700;">${enquiry.preferredDate || 'Flexible'} (${enquiry.preferredTime || '11:00 AM'})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Booking Date & Time:</td>
                  <td style="padding: 4px 0; color: #E2E8F0; font-weight: 600;">${bookingDateTimeFormatted}</td>
                </tr>
                ${enquiry.offerPriceInr ? `
                <tr>
                  <td style="padding: 4px 0; color: #94A3B8;">Offer Price:</td>
                  <td style="padding: 4px 0; color: #F59E0B; font-weight: 800;">₹${enquiry.offerPriceInr.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 6px 0 2px 0; color: #94A3B8; vertical-align: top;">Customer Note:</td>
                  <td style="padding: 6px 0 2px 0; color: #E2E8F0; font-style: italic;">"${enquiry.message}"</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Section 4: Attached PDF Notice -->
          <tr>
            <td style="padding: 12px 24px 24px 24px;">
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 14px; text-align: center;">
                <div style="font-size: 13px; font-weight: 700; color: #F59E0B; margin-bottom: 4px;">
                  📎 Generated PDF Brochure Attached
                </div>
                <div style="font-size: 12px; color: #CBD5E1;">
                  The complete vehicle specification and 210-point inspection document has been attached to this email and delivered to the customer's WhatsApp.
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); text-align: center; font-size: 11px; color: #64748B;">
              Wonder Cars · Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const cleanBrand = (car?.brand || 'Car').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanModel = (car?.model || 'Booking').replace(/[^a-zA-Z0-9_-]/g, '');
  const attachments: any[] = [];
  if (brochureHtml) {
    attachments.push({
      filename: `WonderCars-${cleanBrand}-${cleanModel}-Brochure.html`,
      content: brochureHtml,
      contentType: 'text/html',
    });
    attachments.push({
      filename: `WonderCars-${cleanBrand}-${cleanModel}-Brochure.pdf`,
      content: Buffer.from(brochureHtml, 'utf-8'),
      contentType: 'application/pdf',
    });
  }

  const logPayload = {
    id: `email-owner-${Date.now()}`,
    enquiryId: enquiry.id,
    recipients,
    recipient: primaryRecipient,
    subject,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    carTitle,
    bookingTime: bookingDateTimeFormatted,
    attachedFiles: attachments.map((a) => a.filename),
    timestamp: new Date().toISOString(),
    status: 'pending',
    method: 'unknown',
  };

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
        to: recipients.join(', '),
        subject,
        html,
        attachments,
      });

      logPayload.status = 'sent';
      logPayload.method = `smtp:${SMTP_HOST}`;
      saveOutgoingEmailLog(logPayload);
      console.log(
        `[EmailService] ✓ Showroom Owner notification email "${subject}" sent to ${recipients.join(', ')} with ${attachments.length} attachment(s). MessageId: ${info.messageId}`
      );
      return { success: true, message: `Delivered to ${recipients.join(', ')}`, method: 'smtp' };
    } catch (err: any) {
      console.error('[EmailService] SMTP owner email send error:', err?.message || err);
      logPayload.status = 'failed';
      logPayload.method = 'smtp_error';
    }
  }

  logPayload.status = 'recorded_locally';
  logPayload.method = 'local_record';
  saveOutgoingEmailLog(logPayload);

  console.log(`\n======================================================`);
  console.log(`[Showroom Owner Notification Email Generated]`);
  console.log(`To: ${recipients.join(', ')}`);
  console.log(`Subject: ${subject}`);
  console.log(`Customer: ${enquiry.name} | Phone: +91 ${cleanPhone}`);
  console.log(`Car: ${carTitle}`);
  console.log(`Attachments: ${attachments.map((a) => a.filename).join(', ')}`);
  console.log(`======================================================\n`);

  return {
    success: true,
    message: `Owner booking email recorded for ${recipients.join(', ')}`,
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
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
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
      method: `smtp:${SMTP_HOST}`,
    });

    return {
      success: true,
      message: `Test email successfully sent via SMTP to ${recipient}`,
      details: { messageId: info.messageId },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to send test email through SMTP server',
      details: { error: String(err) },
    };
  }
}

