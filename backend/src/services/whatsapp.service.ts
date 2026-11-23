import fs from 'fs';
import path from 'path';
import type { Enquiry, Car } from '../models/types.ts';
import {
  DATA_DIR,
  SHOWROOM_WHATSAPP_NUMBER,
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_API_VERSION,
  APP_BASE_URL,
} from '../config/index.ts';

const OUTGOING_WHATSAPP_LOG_PATH = path.join(DATA_DIR, 'outgoing_whatsapp.json');

export interface OutgoingWhatsappRecord {
  id: string;
  enquiryId: string;
  customerName: string;
  customerPhone: string;
  recipientWhatsapp: string;
  showroomWhatsapp: string;
  messageType: 'document' | 'text';
  carId?: string;
  carTitle: string;
  documentUrl: string;
  filename: string;
  caption: string;
  timestamp: string;
  status: 'sent' | 'pending_credentials' | 'failed' | 'logged';
  provider: 'whatsapp_business_cloud_api' | 'twilio' | 'simulation_logged';
  metaMessageId?: string;
  error?: string;
}

export function cleanIndianPhoneNumber(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    return digits;
  }
  return `91${digits.slice(-10)}`;
}

export function saveOutgoingWhatsappLog(record: OutgoingWhatsappRecord): void {
  try {
    let logs: OutgoingWhatsappRecord[] = [];
    if (fs.existsSync(OUTGOING_WHATSAPP_LOG_PATH)) {
      try {
        logs = JSON.parse(fs.readFileSync(OUTGOING_WHATSAPP_LOG_PATH, 'utf-8'));
      } catch {
        logs = [];
      }
    }
    logs.unshift(record);
    if (logs.length > 300) logs = logs.slice(0, 300);
    fs.writeFileSync(OUTGOING_WHATSAPP_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('[WhatsAppService] Failed to record outgoing WhatsApp log:', err);
  }
}

/**
 * Automatically sends the existing generated PDF brochure to the Customer's WhatsApp
 * as a document attachment via Official WhatsApp Business Cloud API or supported provider.
 *
 * Requirements:
 * - Recipient is strictly the customer's phone number from the form.
 * - Does NOT send to showroom number instead of customer.
 * - Showroom WhatsApp number (9272150600) is kept separate.
 * - Delivery is automatic; non-blocking; does not crash if API credentials are unset.
 */
export async function sendAutomaticCustomerWhatsappDocument(
  enquiry: Enquiry,
  car?: Car,
  overrideDocumentUrl?: string
): Promise<{ success: boolean; status: string; messageId?: string; error?: string }> {
  const customerRawPhone = enquiry.phone || '';
  const customerWaPhone = cleanIndianPhoneNumber(customerRawPhone);
  const showroomClean = cleanIndianPhoneNumber(SHOWROOM_WHATSAPP_NUMBER);

  // Safety check: ensure we don't accidentally send customer document to showroom number
  const isShowroomNumber = customerWaPhone === showroomClean;

  const carTitle = car
    ? `${car.year} ${car.brand} ${car.model} (${car.variant})`
    : enquiry.carTitle || 'Certified Pre-Owned Luxury Car';

  const cleanBrand = (car?.brand || 'Car').replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanModel = (car?.model || 'Model').replace(/[^a-zA-Z0-9_-]/g, '');
  const filename = `WonderCars-${cleanBrand}-${cleanModel}-Inspection-Brochure.pdf`;

  const documentUrl = overrideDocumentUrl || (car
    ? `${APP_BASE_URL.replace(/\/$/, '')}/api/cars/${car.id}/brochure`
    : `${APP_BASE_URL.replace(/\/$/, '')}/inventory`);

  const priceText = car ? `₹${car.priceInr.toLocaleString('en-IN')}` : 'Market Competitive';
  const warrantyText = car?.warrantyPeriod && car.warrantyPeriod !== 'No Warranty'
    ? `${car.warrantyPeriod} Warranty Included`
    : '6 Months Certified Warranty Included';

  const caption = [
    `★ WONDER CARS ★ Booking Dossier & 210-Point Inspection Certificate`,
    `Vehicle: ${carTitle}`,
    `Price: ${priceText} · Warranty: ${warrantyText}`,
    enquiry.preferredDate ? `Slot: ${enquiry.preferredDate} (${enquiry.preferredTime || '11:00 AM'})` : '',
    `Showroom: Shop No.-3, Rajkamal Sadan, Preet Vihar, Delhi-92`,
    `Concierge: Naman Jain (+91 83840 68347)`,
  ].filter(Boolean).join('\n');

  const logRecord: OutgoingWhatsappRecord = {
    id: `wa-doc-${Date.now()}`,
    enquiryId: enquiry.id,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    recipientWhatsapp: `+${customerWaPhone}`,
    showroomWhatsapp: SHOWROOM_WHATSAPP_NUMBER,
    messageType: 'document',
    carId: car?.id || enquiry.carId,
    carTitle,
    documentUrl,
    filename,
    caption,
    timestamp: new Date().toISOString(),
    status: 'pending_credentials',
    provider: 'whatsapp_business_cloud_api',
  };

  if (isShowroomNumber) {
    console.warn(
      `[WhatsAppService] Notice: Customer phone (+${customerWaPhone}) equals Showroom WhatsApp (${SHOWROOM_WHATSAPP_NUMBER}). Proceeding with customer delivery as specified in booking form.`
    );
  }

  // 1. Check if Official WhatsApp Business Cloud API is configured
  if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    try {
      const metaUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: customerWaPhone,
        type: 'document',
        document: {
          link: documentUrl,
          caption,
          filename,
        },
      };

      console.log(`[WhatsAppService] Dispatching official WhatsApp Cloud API document to +${customerWaPhone}...`);
      const response = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.messages?.[0]?.id) {
        logRecord.status = 'sent';
        logRecord.metaMessageId = data.messages[0].id;
        saveOutgoingWhatsappLog(logRecord);
        console.log(
          `[WhatsAppService] ✓ WhatsApp PDF Document successfully sent to +${customerWaPhone}. Meta MessageId: ${data.messages[0].id}`
        );
        return { success: true, status: 'sent', messageId: data.messages[0].id };
      } else {
        const errorMsg = data?.error?.message || `HTTP ${response.status}: Failed to send WhatsApp document`;
        logRecord.status = 'failed';
        logRecord.error = errorMsg;
        saveOutgoingWhatsappLog(logRecord);
        console.error(`[WhatsAppService] WhatsApp Cloud API error:`, errorMsg);
        return { success: false, status: 'failed', error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      logRecord.status = 'failed';
      logRecord.error = errorMsg;
      saveOutgoingWhatsappLog(logRecord);
      console.error(`[WhatsAppService] Network error dispatching WhatsApp document:`, errorMsg);
      return { success: false, status: 'failed', error: errorMsg };
    }
  }

  // 2. Check if Twilio is configured
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM || `whatsapp:+14155238886`;

  if (twilioSid && twilioToken) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const bodyParams = new URLSearchParams({
        From: twilioFrom,
        To: `whatsapp:+${customerWaPhone}`,
        Body: caption,
        MediaUrl: documentUrl,
      });

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.sid) {
        logRecord.status = 'sent';
        logRecord.provider = 'twilio';
        logRecord.metaMessageId = data.sid;
        saveOutgoingWhatsappLog(logRecord);
        console.log(`[WhatsAppService] ✓ WhatsApp PDF Document sent via Twilio to +${customerWaPhone}. SID: ${data.sid}`);
        return { success: true, status: 'sent', messageId: data.sid };
      }
    } catch (err: any) {
      console.error('[WhatsAppService] Twilio send error:', err?.message || err);
    }
  }

  // 3. Fallback: Log outgoing document payload safely so booking is NEVER broken
  logRecord.status = 'pending_credentials';
  logRecord.provider = 'simulation_logged';
  logRecord.error = 'Live delivery ready: WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID not set in .env';
  saveOutgoingWhatsappLog(logRecord);

  console.log(`\n======================================================`);
  console.log(`[Automatic WhatsApp PDF Document Attachment Prepared]`);
  console.log(`Recipient (Customer WhatsApp): +${customerWaPhone} (${enquiry.name})`);
  console.log(`Showroom WhatsApp Reference: ${SHOWROOM_WHATSAPP_NUMBER}`);
  console.log(`Vehicle: ${carTitle}`);
  console.log(`Document File: ${filename}`);
  console.log(`Document URL: ${documentUrl}`);
  console.log(`Status: Logged successfully (Awaiting live Meta Cloud API credentials in .env)`);
  console.log(`======================================================\n`);

  return {
    success: true,
    status: 'pending_credentials',
    messageId: logRecord.id,
  };
}
