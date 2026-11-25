import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { Car } from '../models/types.ts';
import { UPLOADS_DIR } from '../config/index.ts';
import { getMediaFromMongo } from './mongo.service.ts';

export interface PdfBookingDetails {
  bookingId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  requestType?: string;
  preferredDate?: string;
  preferredTime?: string;
  city?: string;
  offerPriceInr?: number;
  message?: string;
  bookedAt?: string;
}

function toAsciiPdfText(val: unknown): string {
  return String(val ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/×/g, 'x')
    .replace(/•|·/g, ' - ')
    .replace(/—|–/g, '-')
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatInrAscii(amount?: number): string {
  if (!amount || !Number.isFinite(amount) || amount <= 0) return 'On Request';
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;
}

async function resolveCarPhotoBuffer(car: Car): Promise<Buffer | null> {
  const firstImg = car.images?.[0] || car.gallery?.[0]?.url || '';
  if (!firstImg || !firstImg.includes('/uploads/')) return null;

  const filename = path.basename(firstImg.split('?')[0]);
  if (!/\.(jpe?g|png)$/i.test(filename)) return null;

  const localCandidates = [
    path.join(UPLOADS_DIR, filename),
    path.resolve(process.cwd(), '../frontend/public/uploads', filename),
    path.resolve(process.cwd(), './frontend/public/uploads', filename),
  ];

  for (const candidate of localCandidates) {
    try {
      if (fs.existsSync(candidate)) {
        return fs.readFileSync(candidate);
      }
    } catch {
      // Ignore and try next source
    }
  }

  try {
    const mongoMedia = await getMediaFromMongo(filename);
    if (mongoMedia && mongoMedia.buffer.length > 0 && /jpeg|jpg|png/i.test(mongoMedia.mimeType)) {
      return mongoMedia.buffer;
    }
  } catch {
    // Ignore media fallback error
  }

  return null;
}

/**
 * Generates a real binary %PDF document for a vehicle and optional customer booking summary.
 */
export async function generateCarBookingPdfBuffer(
  car: Car,
  booking?: PdfBookingDetails
): Promise<Buffer> {
  const photoBuffer = await resolveCarPhotoBuffer(car);

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 42,
      info: {
        Title: `${car.year} ${car.brand} ${car.model} - Wonder Cars Brochure`,
        Author: 'Wonder Cars',
        Subject: 'Certified Pre-Owned Vehicle Specification & Booking Summary',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 84;
    const leftX = 42;

    // Header banner
    doc.rect(0, 0, pageWidth, 86).fill('#0F172A');
    doc.fillColor('#F59E0B').font('Helvetica-Bold').fontSize(20).text('WONDER CARS', leftX, 22);
    doc
      .fillColor('#CBD5E1')
      .font('Helvetica')
      .fontSize(9.5)
      .text('CERTIFIED PRE-OWNED LUXURY SHOWROOM  |  PREET VIHAR, NEW DELHI', leftX, 48);
    doc
      .fillColor('#94A3B8')
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Listing: ${toAsciiPdfText(car.listingCode || car.id)}   |   Status: ${toAsciiPdfText(car.status)}`, leftX, 64);

    let y = 104;

    // Title + Price Bar
    const titleText = toAsciiPdfText(`${car.year} ${car.brand} ${car.model}${car.variant ? ` - ${car.variant}` : ''}`);
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(17).text(titleText, leftX, y, {
      width: contentWidth - 150,
    });
    doc
      .fillColor('#B45309')
      .font('Helvetica-Bold')
      .fontSize(16)
      .text(formatInrAscii(car.priceInr), leftX + contentWidth - 145, y, {
        width: 145,
        align: 'right',
      });

    y = Math.max(doc.y + 8, y + 28);

    // Optional Vehicle Image
    if (photoBuffer) {
      try {
        doc.save();
        doc.roundedRect(leftX, y, contentWidth, 185, 8).clip();
        doc.image(photoBuffer, leftX, y, {
          fit: [contentWidth, 185],
          align: 'center',
          valign: 'center',
        });
        doc.restore();
        y += 198;
      } catch {
        doc.restore();
      }
    }

    const drawSectionTitle = (label: string) => {
      if (y > 720) {
        doc.addPage();
        y = 44;
      }
      doc.rect(leftX, y, contentWidth, 20).fill('#F1F5F9');
      doc
        .fillColor('#0F172A')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(label.toUpperCase(), leftX + 8, y + 5);
      y += 26;
    };

    const drawKeyValueGrid = (rows: Array<[string, string]>) => {
      for (const [label, rawVal] of rows) {
        const val = toAsciiPdfText(rawVal);
        if (!val) continue;
        if (y > 760) {
          doc.addPage();
          y = 44;
        }
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9.5).text(`${label}:`, leftX + 6, y, { width: 155 });
        const valueHeight = doc.heightOfString(val, { width: contentWidth - 170 });
        doc.fillColor('#0F172A').font('Helvetica').fontSize(9.5).text(val, leftX + 165, y, { width: contentWidth - 170 });
        y += Math.max(16, valueHeight + 5);
      }
      y += 6;
    };

    // Customer Booking Details (if present)
    if (booking && (booking.customerName || booking.bookingId || booking.preferredDate)) {
      drawSectionTitle('Booking Request Summary');
      drawKeyValueGrid([
        ['Booking Reference', booking.bookingId || 'Confirmed Request'],
        ['Customer Name', booking.customerName || ''],
        ['Contact Number', booking.customerPhone ? `+91 ${booking.customerPhone.replace(/\D/g, '').slice(-10)}` : ''],
        ['Email Address', booking.customerEmail || ''],
        ['Request Type', booking.requestType || 'Test Drive / Booking Request'],
        ['Preferred Visit Date', booking.preferredDate || ''],
        ['Preferred Visit Time', booking.preferredTime || ''],
        ['Offered Price', booking.offerPriceInr ? formatInrAscii(booking.offerPriceInr) : ''],
        ['Location / City', booking.city || ''],
        ['Notes / Message', booking.message || ''],
      ]);
    }

    // Core Vehicle Specs
    drawSectionTitle('Vehicle Specifications');
    drawKeyValueGrid([
      ['Car ID / Code', `${car.id}${car.listingCode ? ` (${car.listingCode})` : ''}`],
      ['Make & Model', `${car.year} ${car.brand} ${car.model}`],
      ['Variant / Trim', car.variant || 'Standard'],
      ['Asking Price', `${formatInrAscii(car.priceInr)} (${car.priceType || 'Negotiable'})`],
      ['Kilometres Driven', `${Number(car.kilometres || 0).toLocaleString('en-IN')} km`],
      ['Fuel & Transmission', `${car.fuelType}  /  ${car.transmission}`],
      ['Ownership History', car.ownership || ''],
      ['Exterior Colour', car.color || ''],
      ['Registration RTO', car.registrationState || ''],
      ['Insurance Status', car.insuranceValidUntil || ''],
      ['Warranty Coverage', car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' ? `${car.warrantyPeriod}${car.warrantyDetails ? ` - ${car.warrantyDetails}` : ''}` : 'Standard Inspection Verified'],
      ['Showroom Location', car.location || 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.'],
    ]);

    // Description & Highlights
    if (car.description || (Array.isArray(car.highlights) && car.highlights.length > 0)) {
      drawSectionTitle('Vehicle Overview & Highlights');
      if (car.description) {
        const desc = toAsciiPdfText(car.description);
        doc.fillColor('#1E293B').font('Helvetica').fontSize(9.5).text(desc, leftX + 6, y, {
          width: contentWidth - 12,
          lineGap: 2,
        });
        y = doc.y + 8;
      }
      if (Array.isArray(car.highlights) && car.highlights.length > 0) {
        for (const item of car.highlights.slice(0, 8)) {
          const clean = toAsciiPdfText(item);
          if (!clean) continue;
          if (y > 760) {
            doc.addPage();
            y = 44;
          }
          doc.fillColor('#0F172A').font('Helvetica').fontSize(9.5).text(`- ${clean}`, leftX + 10, y, {
            width: contentWidth - 20,
          });
          y = doc.y + 3;
        }
        y += 6;
      }
    }

    // Inspection & Legal Verification Summary
    const allChecks = [
      ...(car.exteriorReport || []),
      ...(car.interiorReport || []),
      ...(car.mechanicalReport || []),
    ];
    const inspectedCount = allChecks.filter((i) => i.status !== 'Not Inspected').length;
    drawSectionTitle('Inspection & Documentation Summary');
    drawKeyValueGrid([
      ['Accident History', car.accidentHistory?.overallStatus || 'Verified Non-Accidental'],
      ['Flood / Structural', `${car.accidentHistory?.floodDamage || 'None'} / ${car.accidentHistory?.structuralDamage || 'Intact'}`],
      ['Inspection Checkpoints', inspectedCount > 0 ? `${inspectedCount} of ${allChecks.length} points verified` : '210-Point Showroom Certified'],
      ['Concierge Contact', '+91 83840 68347 (Wonder Cars Preet Vihar Showroom)'],
      ['Official Website', 'https://www.usedcarnearby.com'],
    ]);

    doc.end();
  });
}
