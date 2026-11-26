import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, QrCode, X, Download } from 'lucide-react';
import type { BusinessLocationSettings } from '../types/car';
import { fetchBusinessLocation } from '../utils/api';
import { buildWhatsAppUrl } from '../utils/format';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.59 5.95L0 24l6.33-1.66a11.87 11.87 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.98 1-3.66-.23-.37a9.88 9.88 0 0 1-1.52-5.26c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.47-4.44 9.9-9.89 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function Footer() {
  const [loc, setLoc] = useState<Partial<BusinessLocationSettings>>({});
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!qrOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQrOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [qrOpen]);

  useEffect(() => {
    let active = true;
    fetchBusinessLocation()
      .then((res) => {
        if (active && res.location) {
          setLoc(res.location);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const displayPhone = loc.phone?.trim() || '+91 83840 68347';
  const displayEmail = loc.email?.trim() || 'amanjain.nj784@gmail.com';
  const displayWhatsapp = loc.whatsapp?.trim() || '918384068347';
  const displayHours = loc.openingHours?.trim() || 'Monday – Sunday: 10:00 AM – 8:00 PM';

  const whatsappHref = buildWhatsAppUrl(
    displayWhatsapp,
    'Hello Wonder Cars, I would like to speak with a vehicle specialist.'
  );
  const instagramUrl = loc.instagramUrl?.trim() || 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D';
  const facebookUrl = loc.facebookUrl?.trim() || 'https://www.facebook.com/amanjain.nj784?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AMqRrq1Si%2F%3Fmibextid%3DwwXIfr#';
  const youtubeUrl = loc.youtubeUrl?.trim() || 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5';

  return (
    <footer className="bg-slate-50 dark:bg-[#09090B] border-t border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 text-center lg:text-left">
          {/* Brand Column */}
          <div className="space-y-4 flex flex-col items-center lg:items-start">
            <Link to="/" className="inline-flex items-center justify-center lg:justify-start group" aria-label="Used Car Nearby (UsedCarNearby.com) by Wonder Cars Home">
              <img
                src="/assets/wonder-cars-logo.png"
                alt="Used Car Nearby — Wonder Cars"
                className="h-16 sm:h-20 w-auto object-contain dark:hidden transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <img
                src="/assets/wonder-cars-logo-dark.png"
                alt="Used Car Nearby — Wonder Cars"
                className="h-16 sm:h-20 w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </Link>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Used Car Nearby <span className="font-normal text-slate-500 dark:text-zinc-400">(UsedCarNearby.com)</span>
              </p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400 max-w-sm lg:max-w-none">
                Online pre-owned car showcase by <strong className="font-medium text-slate-900 dark:text-zinc-200">Wonder Cars</strong>, Preet Vihar, Delhi — 210-point inspected luxury and performance vehicles.
              </p>
            </div>
          </div>

          {/* Marketplace Links */}
          <div className="flex flex-col items-center lg:items-start">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Marketplace</h3>
            <ul className="space-y-2.5 text-sm flex flex-col items-center lg:items-start">
              <li>
                <Link to="/cars" className="hover:text-blue-700 dark:hover:text-white transition-colors">
                  Browse Inventory
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-blue-700 dark:hover:text-white transition-colors">
                  About Wonder Cars
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-blue-700 dark:hover:text-white transition-colors">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-blue-700 dark:hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="inline-flex items-center gap-1.5 hover:text-blue-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
                  <span>Scan QR</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Location Showroom */}
          <div className="flex flex-col items-center lg:items-start">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Location Showroom</h3>
            <ul className="space-y-3 text-sm flex flex-col items-center lg:items-start">
              <li>
                <a
                  href={loc.googleMapsUrl || 'https://maps.google.com/?q=Shop+No.-3,+Rajkamal+Sadan,+Preet+Vihar,+Commercial+Complex,+Delhi-92'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-center lg:justify-start gap-2.5 hover:text-blue-700 dark:hover:text-white transition-colors group text-center lg:text-left"
                >
                  <MapPin className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="leading-relaxed">Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Direct Contact & Social Icons */}
          <div className="flex flex-col items-center lg:items-start">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Concierge</h3>
            <ul className="space-y-2.5 text-sm flex flex-col items-center lg:items-start">
              <li>
                <a
                  href={`tel:${displayPhone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center justify-center lg:justify-start gap-2 hover:text-blue-700 dark:hover:text-white transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>{displayPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${displayEmail}`}
                  className="inline-flex items-center justify-center lg:justify-start gap-2 hover:text-blue-700 dark:hover:text-white transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>{displayEmail}</span>
                </a>
              </li>
              <li className="pt-1 text-xs text-slate-500 dark:text-zinc-500 text-center lg:text-left">{displayHours}</li>
            </ul>

            {/* Social & Direct Icons: Instagram, Facebook, WhatsApp, YouTube, Email */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-2xs dark:shadow-none"
              >
                <InstagramIcon />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-2xs dark:shadow-none"
              >
                <FacebookIcon />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] text-[#15803D] dark:text-[#25D366] hover:border-[#25D366] hover:text-white hover:bg-[#25D366] flex items-center justify-center transition-colors shadow-2xs dark:shadow-none"
              >
                <WhatsAppIcon />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="YouTube"
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-2xs dark:shadow-none"
              >
                <YoutubeIcon />
              </a>
              <a
                href={`mailto:${displayEmail}`}
                aria-label="Email Us"
                title="Email Us"
                className="w-9 h-9 rounded-lg bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-2xs dark:shadow-none"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {qrOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Wonder Cars QR Code"
          onClick={() => setQrOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.12] shadow-2xl p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrOpen(false)}
              aria-label="Close QR popup"
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h4 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Scan QR Code
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Used Car Nearby — Wonder Cars
              </p>
            </div>

            <div className="mx-auto w-fit p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <img
                src="/assets/wonder-cars-qr.jpg"
                alt="Used Car Nearby Wonder Cars QR Code"
                className="w-60 sm:w-64 h-60 sm:h-64 object-contain rounded-lg"
              />
            </div>

            <a
              href="/assets/wonder-cars-qr.jpg"
              download="WonderCars-QR.jpg"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white text-sm font-semibold shadow-md transition-all"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Download QR</span>
            </a>
          </div>
        </div>
      )}
    </footer>
  );
}
