import fs from 'fs';
import path from 'path';
import type { Enquiry, Car } from '../models/types.ts';
import { DATA_DIR } from '../config/index.ts';

const OUTGOING_WHATSAPP_LOG_PATH = path.join(DATA_DIR, 'outgoing_whatsapp.json');

export interface OutgoingWhatsappRecord {
  id: string;
  enquiryId: string;
  customerName: string;
  customerPhone: string;
  recipientWhatsapp: string;
  carId?: string;
  carTitle: string;
  brochureUrl: string;
  messageText: string;
  waDirectUrl: string;
  timestamp: string;
  status: 'prepared' | 'logged';
}

export function buildCustomerWhatsappMessage(enquiry: Enquiry, car?: Car, baseUrl = 'http://localhost:5000'): string {
  const cleanPhone = enquiry.phone.replace(/\D/g, '');
  const carTitle = car
    ? `${car.year} ${car.brand} ${car.model} (${car.variant})`
    : enquiry.carTitle || 'Certified Pre-Owned Luxury Car';

  const brochureUrl = car
    ? `${baseUrl}/api/cars/${car.id}/brochure`
    : `${baseUrl}/inventory`;

  const priceText = car ? `₹${car.priceInr.toLocaleString('en-IN')}` : 'Market Competitive';
  const warrantyText = car?.warrantyPeriod && car.warrantyPeriod !== 'No Warranty'
    ? `${car.warrantyPeriod} Warranty Included`
    : '6 Months Certified Warranty Included';

  const lines = [
    `★ *WONDER CARS — Certified Luxury Pre-Owned* ★`,
    `Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92`,
    ``,
    `Namaste *${enquiry.name}* ji,`,
    ``,
    `Thank you for reaching out for a test drive / viewing at Wonder Cars. Here are the official details of the car you selected:`,
    ``,
    `🚗 *Vehicle:* ${carTitle}`,
    `💰 *Asking Price:* ${priceText}`,
    car ? `⚡ *Fuel / Transmission:* ${car.fuelType} · ${car.transmission}` : '',
    car ? `🛣️ *Odometer:* ${car.kilometres.toLocaleString('en-IN')} km` : '',
    `🛡️ *Certification:* ${warrantyText} (210-Point Inspected)`,
    enquiry.preferredDate ? `📅 *Scheduled Slot:* ${enquiry.preferredDate} (${enquiry.preferredTime || '11:00 AM'})` : '',
    `📍 *Location:* Preet Vihar, East Delhi 110092`,
    ``,
    `📄 *Official Car Spec & Inspection PDF Brochure:*`,
    brochureUrl,
    ``,
    `Our Showroom Concierge (*Naman Jain: +91 83840 68347*) is preparing this vehicle for you. Feel free to reply here if you have any questions!`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function recordCustomerWhatsappMessage(enquiry: Enquiry, car?: Car, baseUrl = 'http://localhost:5000'): OutgoingWhatsappRecord {
  const cleanPhone = enquiry.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('91') && cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const messageText = buildCustomerWhatsappMessage(enquiry, car, baseUrl);
  const waDirectUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`;
  const brochureUrl = car ? `${baseUrl}/api/cars/${car.id}/brochure` : `${baseUrl}/inventory`;

  const record: OutgoingWhatsappRecord = {
    id: `wa-${Date.now()}`,
    enquiryId: enquiry.id,
    customerName: enquiry.name,
    customerPhone: enquiry.phone,
    recipientWhatsapp: `+${waPhone}`,
    carId: car?.id || enquiry.carId,
    carTitle: car ? `${car.year} ${car.brand} ${car.model}` : (enquiry.carTitle || 'Certified Car'),
    brochureUrl,
    messageText,
    waDirectUrl,
    timestamp: new Date().toISOString(),
    status: 'prepared',
  };

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
    if (logs.length > 200) logs = logs.slice(0, 200);
    fs.writeFileSync(OUTGOING_WHATSAPP_LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
    console.log(`[WhatsAppService] ✓ WhatsApp message prepared & logged for +${waPhone} (${enquiry.name})`);
  } catch (err) {
    console.error('[WhatsAppService] Failed to record outgoing WhatsApp log:', err);
  }

  return record;
}
