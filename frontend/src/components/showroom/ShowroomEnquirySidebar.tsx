import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeIndianRupee,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { Car, EnquiryType, WhatsappDeliveryResult } from '../../types/car';
import { submitEnquiry } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import {
  buildWhatsAppUrl,
  estimateMonthlyEmi,
  formatINR,
  formatINRCompact,
  formatReadableDate,
} from '../../utils/format';

interface ShowroomEnquirySidebarProps {
  car: Car;
  sellerOtherCars: Car[];
  activeFormMode: 'test-drive' | 'inspection' | 'offer';
  onChangeFormMode: (mode: 'test-drive' | 'inspection' | 'offer') => void;
  formContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function ShowroomEnquirySidebar({
  car,
  sellerOtherCars,
  activeFormMode,
  onChangeFormMode,
  formContainerRef,
}: ShowroomEnquirySidebarProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [locationChoice, setLocationChoice] = useState(car.location);
  const [offerPriceInr, setOfferPriceInr] = useState('');
  const [message, setMessage] = useState('');
  const { addToCart, openCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [submittedMode, setSubmittedMode] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    phone: string;
    email: string;
    mode: 'test-drive' | 'inspection' | 'offer';
    preferredDate?: string;
    preferredTime?: string;
    whatsappDelivery?: WhatsappDeliveryResult;
  } | null>(null);

  const whatsappHref = buildWhatsAppUrl(
    car.sellerWhatsapp || '919820451090',
    `Hello ${car.sellerName}, I am interested in the ${car.year} ${car.brand} ${car.model} (${car.variant}, Listing ${car.listingCode}) priced at ${formatINR(car.priceInr)}.`
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (name.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (activeFormMode === 'offer' && (!offerPriceInr || Number(offerPriceInr) <= 0)) {
      setFormError('Please enter your offer price in INR.');
      return;
    }

    const enquiryType: EnquiryType = activeFormMode;
    const defaultMessage =
      activeFormMode === 'offer'
        ? `Offer of ${formatINR(Number(offerPriceInr))} submitted for ${car.year} ${car.brand} ${car.model}.`
        : activeFormMode === 'inspection'
        ? `Physical inspection requested for ${car.year} ${car.brand} ${car.model}.`
        : `Test drive requested for ${car.year} ${car.brand} ${car.model}.`;

    setSubmitting(true);
    try {
      const createdEnquiry = await submitEnquiry({
        type: enquiryType,
        carId: car.id,
        carTitle: `${car.year} ${car.brand} ${car.model} (${car.listingCode})`,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        preferredDate: activeFormMode !== 'offer' ? preferredDate || undefined : undefined,
        preferredTime: activeFormMode !== 'offer' ? preferredTime || undefined : undefined,
        city: locationChoice.trim() || car.location,
        offerPriceInr: activeFormMode === 'offer' ? Number(offerPriceInr) : undefined,
        message: message.trim() || defaultMessage,
      });

      // Record in Enquiry Cart state
      addToCart({
        carId: car.id,
        carTitle: `${car.year} ${car.brand} ${car.model}`,
        carImage: car.images?.[0],
        listingCode: car.listingCode,
        priceInr: car.priceInr,
        formType: enquiryType,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        preferredDate: activeFormMode !== 'offer' ? preferredDate || undefined : undefined,
        preferredTime: activeFormMode !== 'offer' ? preferredTime || undefined : undefined,
        offerPriceInr: activeFormMode === 'offer' ? Number(offerPriceInr) : undefined,
        notes: message.trim() || defaultMessage,
      });

      setSubmittedData({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        mode: activeFormMode,
        preferredDate: activeFormMode !== 'offer' ? preferredDate || undefined : undefined,
        preferredTime: activeFormMode !== 'offer' ? preferredTime || undefined : undefined,
        whatsappDelivery: createdEnquiry.whatsappDelivery,
      });
      setSubmittedMode(activeFormMode);
      setName('');
      setPhone('');
      setEmail('');
      setPreferredDate('');
      setOfferPriceInr('');
      setMessage('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1.5 sidebar-scroll overscroll-contain">
      {/* 13. Price & Negotiation Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Asking Price (Ex-Gallery)</p>
            <p className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">
              {formatINR(car.priceInr)}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 font-mono tabular-nums mt-0.5">
              {formatINRCompact(car.priceInr)} · Est. EMI {formatINR(estimateMonthlyEmi(car.priceInr))}/mo
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
            {car.priceType === 'Fixed' ? 'Fixed Price' : 'Negotiable'}
          </span>
        </div>

        {car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                {car.warrantyPeriod} Guarantee Included
              </p>
              {car.warrantyDetails && (
                <p className="text-emerald-700/90 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                  {car.warrantyDetails}
                </p>
              )}
            </div>
          </div>
        )}

        {(car.priceLastUpdated || car.priceExplanation || car.marketComparisonNote || car.discountNote) && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-2 text-xs text-slate-700 dark:text-zinc-300">
            {car.priceLastUpdated && (
              <p className="text-slate-500 dark:text-zinc-400">
                Price Updated:{' '}
                <span className="font-mono text-slate-900 dark:text-zinc-200">
                  {formatReadableDate(car.priceLastUpdated)}
                </span>
              </p>
            )}
            {car.priceExplanation && <p className="leading-relaxed">{car.priceExplanation}</p>}
            {car.marketComparisonNote && (
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">Market Context: {car.marketComparisonNote}</p>
            )}
            {car.discountNote && (
              <p className="text-emerald-700 dark:text-emerald-300">{car.discountNote}</p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onChangeFormMode('offer');
            setSubmittedMode(null);
            formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
          className="w-full py-3 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <BadgeIndianRupee className="w-4 h-4" />
          <span>Make an Offer</span>
        </button>

        {/* 15. Dual Primary Showroom CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onChangeFormMode('test-drive');
              setSubmittedMode(null);
              formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            className="py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Book Test Drive</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onChangeFormMode('inspection');
              setSubmittedMode(null);
              formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            className="py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
            <span>Book Inspection</span>
          </button>
        </div>
      </div>

      {/* 14. Seller Information */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              {car.sellerType}
            </p>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white mt-0.5">{car.sellerName}</h2>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>{car.location}</span>
            </p>
          </div>
          <ShieldCheck className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0" />
        </div>

        {car.sellerProfile && (
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">{car.sellerProfile}</p>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
          <a
            href={`tel:${car.sellerPhone.replace(/\s+/g, '')}`}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white text-xs font-semibold transition-colors"
          >
            <Phone className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>Call Seller</span>
          </a>
        </div>

        {sellerOtherCars.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07] space-y-2.5">
            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Other Listings from {car.sellerName}</p>
            <div className="space-y-2">
              {sellerOtherCars.map((other) => (
                <Link
                  key={other.id}
                  to={`/cars/${other.id}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.06] hover:border-blue-400 dark:hover:border-blue-500/50 transition-colors text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                    {other.year} {other.brand} {other.model}
                  </span>
                  <span className="font-mono text-blue-700 dark:text-blue-400 shrink-0 tabular-nums">
                    {formatINRCompact(other.priceInr)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 15. Interactive Booking / Inspection / Offer Form */}
      <div
        ref={formContainerRef}
        className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-4"
      >
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08]">
          {[
            { id: 'test-drive', label: 'Test Drive' },
            { id: 'inspection', label: 'Inspection' },
            { id: 'offer', label: 'Make Offer' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onChangeFormMode(tab.id as 'test-drive' | 'inspection' | 'offer');
                setSubmittedMode(null);
              }}
              className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeFormMode === tab.id
                  ? 'bg-blue-700 dark:bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            {activeFormMode === 'offer'
              ? 'Submit a Confidential Price Offer'
              : activeFormMode === 'inspection'
              ? 'Request Physical Car Inspection'
              : 'Schedule a Private Test Drive'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
            {activeFormMode === 'offer'
              ? 'Your offer is sent directly to our acquisition and sales desk.'
              : 'Book a slot at our gallery or request an inspector-accompanied viewing.'}
          </p>
        </div>

        {submittedMode ? (() => {
          const isWaDelivered =
            submittedData?.whatsappDelivery?.status === 'sent' &&
            submittedData?.whatsappDelivery?.success === true;
          const isWaPending = submittedData?.whatsappDelivery?.status === 'pending_credentials';
          const cleanCustPhone = submittedData?.phone.replace(/\D/g, '') || '';
          const custWaPhone =
            cleanCustPhone.startsWith('91') && cleanCustPhone.length > 10
              ? cleanCustPhone
              : `91${cleanCustPhone.slice(-10)}`;
          const waDirectHref = `https://wa.me/${custWaPhone}?text=${encodeURIComponent(
            `★ WONDER CARS ★ Booking Confirmation\n\nDear ${submittedData?.name || 'Customer'},\nYour booking request for the ${car.year} ${car.brand} ${car.model} (${car.listingCode}) has been confirmed.\n\n📄 210-Point Inspection Brochure: ${typeof window !== 'undefined' ? window.location.origin : ''}/api/cars/${car.id}/brochure\n\nShowroom: Shop No.-3, Rajkamal Sadan, Preet Vihar, Delhi-92\nConcierge: Naman Jain (+91 83840 68347)`
          )}`;

          return (
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 space-y-4">
              <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isWaDelivered
                    ? `PDF & Car Details Sent to +91 ${submittedData?.phone}!`
                    : 'Test Drive Scheduled Confirmed!'}
                </span>
              </div>

              <div className="text-xs text-slate-700 dark:text-zinc-300 space-y-1.5 leading-relaxed">
                <p>
                  Namaste <strong className="text-slate-900 dark:text-white">{submittedData?.name || 'Customer'}</strong> ji! Aapki <strong className="text-slate-900 dark:text-white">{car.year} {car.brand} {car.model}</strong> ki request confirm ho chuki hai.
                </p>
                {isWaDelivered ? (
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                    📲 Car ki complete details aur printable 210-Point Inspection PDF Brochure aapke WhatsApp number <strong>+91 {submittedData?.phone}</strong> par automatically dispatch kar di gayi hai.
                  </p>
                ) : (
                  <p className="text-slate-600 dark:text-zinc-300">
                    Aapki enquiry record kar li gayi hai aur showroom team ko email alert bhej diya gaya hai. Aap direct WhatsApp button se bhi instant brochure access kar sakte hain.
                  </p>
                )}
                {submittedData?.preferredDate && (
                  <p className="text-blue-700 dark:text-blue-400 font-medium">
                    📅 Slot: {submittedData.preferredDate} ({submittedData.preferredTime || '11:00 AM'}) at Preet Vihar Gallery
                  </p>
                )}
              </div>

              {/* Verified Delivery Status */}
              <div className="p-3.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-2.5 text-xs">
                {isWaDelivered ? (
                  <div className="flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        WhatsApp Document Attachment Sent
                      </p>
                      <p className="text-[11px] font-normal text-slate-600 dark:text-zinc-300 mt-0.5">
                        The official 210-Point Inspection PDF has been automatically delivered as a document to customer WhatsApp number <strong className="text-slate-900 dark:text-white">+91 {submittedData?.phone}</strong> (ID: {submittedData?.whatsappDelivery?.messageId}).
                      </p>
                    </div>
                  </div>
                ) : isWaPending ? (
                  <div className="flex items-start gap-2.5 text-amber-700 dark:text-amber-400 font-semibold">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        WhatsApp Auto-Delivery Pending API Setup
                      </p>
                      <p className="text-[11px] font-normal text-slate-600 dark:text-zinc-300 mt-0.5">
                        Booking details saved. Meta WhatsApp Cloud API credentials (<code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code>) are pending in backend <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">.env</code>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-rose-700 dark:text-rose-400 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        WhatsApp Cloud Delivery Unconfirmed
                      </p>
                      <p className="text-[11px] font-normal text-slate-600 dark:text-zinc-300 mt-0.5">
                        {submittedData?.whatsappDelivery?.error || 'Message was not accepted by Meta WhatsApp API.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Showroom Owner Notified
                    </p>
                    <p className="text-[11px] font-normal text-slate-600 dark:text-zinc-300 mt-0.5">
                      Email sent to <strong className="text-slate-900 dark:text-white">vickybhelave25@navgurukl.org</strong> with subject <em>"New Car Booking Received"</em> and the PDF attached.
                    </p>
                  </div>
                </div>

                {submittedData?.preferredDate && (
                  <div className="flex items-start gap-2.5 text-blue-700 dark:text-blue-400 font-medium">
                    <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <p className="text-[11px]">
                      Viewing Slot: <strong>{submittedData.preferredDate} ({submittedData.preferredTime || '11:00 AM'})</strong> at Preet Vihar Showroom
                    </p>
                  </div>
                )}
              </div>

              {/* 1-Click WhatsApp Button (direct fallback for customer or showroom agent) */}
              <a
                href={waDirectHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>💬 Open Details on WhatsApp (+91 {submittedData?.phone})</span>
              </a>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                <a
                  href={`/api/cars/${car.id}/brochure`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📄 View / Download Local Copy</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedMode(null);
                    setSubmittedData(null);
                  }}
                  className="font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Book another test drive
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] text-[11px] text-slate-500 dark:text-zinc-400">
                Showroom Concierge: <strong className="text-slate-800 dark:text-zinc-200">+91 83840 68347</strong> (Preet Vihar, Delhi)
              </div>
            </div>
          );
        })() : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeFormMode === 'offer' && (
              <div>
                <label htmlFor="sh-offer" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Your Offer Price (INR) *
                </label>
                <input
                  id="sh-offer"
                  type="number"
                  required
                  min={100000}
                  value={offerPriceInr}
                  onChange={(e) => setOfferPriceInr(e.target.value)}
                  placeholder={`Asking: ${car.priceInr}`}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="sh-name" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Customer Name *
              </label>
              <input
                id="sh-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="sh-phone" className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
                    Phone Number *
                  </label>
                  {phone.length > 0 && phone.length < 10 && (
                    <span className="text-[10px] text-amber-500 font-mono">
                      {10 - phone.length} more needed
                    </span>
                  )}
                  {phone.length === 10 && (
                    <span className="text-[10px] text-emerald-500 font-medium">
                      ✓ 10 digits
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-slate-500 dark:text-zinc-400 select-none pointer-events-none">
                    +91
                  </span>
                  <input
                    id="sh-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, '');
                      if (digits.length > 10 && digits.startsWith('91')) {
                        digits = digits.slice(2);
                      }
                      setPhone(digits.slice(0, 10));
                    }}
                    placeholder="98XXXXXXXX"
                    className="w-full h-10 pl-11 pr-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white font-mono tabular-nums tracking-wide focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sh-email" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                  Email (Optional)
                </label>
                <input
                  id="sh-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>
            </div>

            {activeFormMode !== 'offer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sh-date" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Preferred Date
                  </label>
                  <input
                    id="sh-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="sh-time" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                    Preferred Time
                  </label>
                  <select
                    id="sh-time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  >
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="sh-loc" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Location
              </label>
              <input
                id="sh-loc"
                type="text"
                value={locationChoice}
                onChange={(e) => setLocationChoice(e.target.value)}
                placeholder="Showroom or City"
                className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sh-msg" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">
                Additional Message
              </label>
              <textarea
                id="sh-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any specific inspection request, financing query, or timing preference..."
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
              />
            </div>

            {formError && <p className="text-xs text-rose-700 dark:text-red-400">{formError}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold shadow-md shadow-blue-700/20 hover:shadow-blue-700/30 transition-all cursor-pointer mt-2"
            >
              {submitting
                ? 'Submitting...'
                : activeFormMode === 'offer'
                ? 'Send Offer Enquiry'
                : activeFormMode === 'inspection'
                ? 'Book Physical Inspection'
                : 'Confirm Test Drive Request'}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
