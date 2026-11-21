import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import type { BusinessLocationSettings } from '../types/car';
import { fetchBusinessLocation, submitEnquiry } from '../utils/api';
import { useCart } from '../context/CartContext';
import { buildWhatsAppUrl } from '../utils/format';
import { EMPTY_LOCATION_SETTINGS, formatFullAddress, buildOpenMapsUrl } from '../utils/location';
import { ShowroomGoogleMap } from './ShowroomGoogleMap';

const FALLBACK_CONTACT: BusinessLocationSettings = {
  ...EMPTY_LOCATION_SETTINGS,
  businessName: 'Wonder Cars Flagship Showroom',
  phone: '+91 83840 68347',
  email: 'amanjain.nj784@gmail.com',
  whatsapp: '918384068347',
  address: 'Preet Vihar',
  city: 'East Delhi',
  state: 'Delhi NCR',
  postalCode: '110092',
  latitude: '28.6396915',
  longitude: '77.2936307',
  googleMapsUrl:
    'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg',
  openingHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
  nearbyLandmarks: 'Near Preet Vihar Metro Station',
  instagramUrl: 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D',
  facebookUrl: 'https://www.facebook.com/amanjain.nj784?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AMqRrq1Si%2F%3Fmibextid%3DwwXIfr#',
  youtubeUrl: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
};

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.59 5.95L0 24l6.33-1.66a11.87 11.87 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.98 1-3.66-.23-.37a9.88 9.88 0 0 1-1.52-5.26c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.47-4.44 9.9-9.89 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

const inputCls =
  'w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0D10] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-[#09090B] transition-colors';

interface ContactSectionProps {
  isMainHeading?: boolean;
  showMap?: boolean;
}

export function ContactSection({ isMainHeading = false, showMap = true }: ContactSectionProps) {
  const [location, setLocation] = useState<BusinessLocationSettings>(FALLBACK_CONTACT);
  const [mapsApiKey, setMapsApiKey] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { addToCart, openCart } = useCart();

  useEffect(() => {
    let active = true;
    fetchBusinessLocation()
      .then((res) => {
        if (!active) return;
        const loc = res.location;
        if (loc) {
          setLocation({
            ...FALLBACK_CONTACT,
            ...Object.fromEntries(
              Object.entries(loc).filter(([, val]) => typeof val === 'string' && val.trim() !== '')
            ),
          });
          if (loc.city) setCity(loc.city);
        }
        setMapsApiKey(res.mapsApiKey || '');
      })
      .catch(() => {
        // Keep clean fallback showroom details
      });
    return () => {
      active = false;
    };
  }, []);

  const displayEmail = location.email || FALLBACK_CONTACT.email;
  const displayPhone = location.phone || FALLBACK_CONTACT.phone;
  const displayWhatsapp = location.whatsapp || FALLBACK_CONTACT.whatsapp;
  const displayAddress = formatFullAddress(location) || formatFullAddress(FALLBACK_CONTACT);

  const telUrl = `tel:${displayPhone.replace(/\s+/g, '')}`;
  const mailUrl = `mailto:${displayEmail}`;
  const whatsappUrl = buildWhatsAppUrl(
    displayWhatsapp,
    'Hello Wonder Cars, I would like to enquire about a vehicle at your showroom.'
  );
  const instagramUrl = location.instagramUrl || FALLBACK_CONTACT.instagramUrl;
  const facebookUrl = location.facebookUrl || FALLBACK_CONTACT.facebookUrl;
  const youtubeUrl = location.youtubeUrl || FALLBACK_CONTACT.youtubeUrl;
  const mapsUrl = buildOpenMapsUrl(location) || location.googleMapsUrl || FALLBACK_CONTACT.googleMapsUrl;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (message.trim().length < 3) {
      setError('Please include a short message.');
      return;
    }
    setSubmitting(true);
    try {
      await submitEnquiry({
        type: 'general',
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim() || undefined,
        message: message.trim(),
      });
      addToCart({
        carTitle: 'General Showroom Enquiry',
        formType: 'general',
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerEmail: email.trim(),
        notes: message.trim(),
      });
      openCart();
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  }

  const HeadingTag = isMainHeading ? 'h1' : 'h2';

  return (
    <div>
      {/* Contact Section: Top Header + Left Showroom Cards & Right Message Form Aligned */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <section
          aria-labelledby="enquiry-form-heading"
          className="bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-none"
        >
          {/* Section Header Row */}
          <div className="space-y-2.5 mb-8 sm:mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-400">
              Schedule a Visit or Ask a Question
            </p>
            <HeadingTag
              id="enquiry-form-heading"
              className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight"
            >
              Send Us a Direct Message
            </HeadingTag>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Looking for vehicle inspection sheets, test drive slots, trade-in quotes, or EMI financing options? Reach out directly or send us a quick message.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* LEFT SIDE — Showroom Cards + Social Icons */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Direct Dealership & Showroom Information Cards */}
              <div className="space-y-3.5">
                {/* 1. Showroom Address */}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] hover:border-amber-500 dark:hover:border-amber-400 shadow-xs dark:shadow-none transition-colors group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                    <MapPin className="w-5 h-5 fill-rose-500/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Showroom Address
                      </h3>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                        Open Map ↗
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      Preet Vihar, East Delhi, Delhi NCR 110092
                    </p>
                  </div>
                </a>

                {/* 2. Dealership Contact — Naman Jain */}
                <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                    <Phone className="w-5 h-5 fill-rose-500/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Dealership Contact — Naman Jain
                    </h3>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                      {displayPhone}
                    </p>
                  </div>
                </div>

                {/* 3. Showroom Timings */}
                <div className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-zinc-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Showroom Timings
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 mt-0.5 leading-relaxed">
                      {location.openingHours || 'Monday – Sunday: 10:00 AM – 8:00 PM'}
                    </p>
                  </div>
                </div>

                {/* 4. Email Address */}
                <a
                  href={mailUrl}
                  className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] hover:border-blue-500 dark:hover:border-blue-500/60 shadow-xs dark:shadow-none transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 group-hover:bg-blue-700 dark:group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      Email Address
                    </h3>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-300 mt-0.5 break-all">
                      {displayEmail}
                    </p>
                  </div>
                </a>
              </div>

              {/* Social & Direct Channel Icons: Instagram, Facebook, YouTube, Email, WhatsApp */}
              <div className="pt-1 space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Connect With Us
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    title="Instagram"
                    className="w-11 h-11 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-xs dark:shadow-none"
                  >
                    <InstagramIcon />
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    title="Facebook"
                    className="w-11 h-11 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-xs dark:shadow-none"
                  >
                    <FacebookIcon />
                  </a>
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    title="YouTube"
                    className="w-11 h-11 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-xs dark:shadow-none"
                  >
                    <YoutubeIcon />
                  </a>
                  <a
                    href={mailUrl}
                    aria-label="Email Us"
                    title="Email Us"
                    className="w-11 h-11 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors shadow-xs dark:shadow-none"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                    className="w-11 h-11 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08] text-[#15803D] dark:text-[#25D366] hover:border-[#25D366] hover:text-white hover:bg-[#25D366] flex items-center justify-center transition-colors shadow-xs dark:shadow-none"
                  >
                    <WhatsAppIcon />
                  </a>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE — Contact Form */}
            <div className="lg:col-span-7 bg-white dark:bg-[#18181B]/80 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-none flex flex-col justify-between">
              {sent ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Message Received</h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                    Thank you for reaching out. Our showroom concierge will follow up with you shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Send Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-name" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                          Full Name *
                        </label>
                        <input
                          id="c-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="c-phone" className="block text-xs font-medium text-slate-600 dark:text-zinc-400">
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
                            id="c-phone"
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
                            className={`${inputCls} pl-11`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-email" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          id="c-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label htmlFor="c-city" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                          Your City
                        </label>
                        <input
                          id="c-city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. East Delhi"
                          className={inputCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-msg" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                        Message *
                      </label>
                      <textarea
                        id="c-msg"
                        rows={5}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about the car you are interested in or when you plan to visit..."
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0D10] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-[#09090B] transition-colors"
                      />
                    </div>

                    {error && (
                      <p className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-lg px-3 py-2">
                        {error}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-md shadow-amber-600/25 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Full-Width Interactive Google Map Section Only */}
      {showMap && (
        <section aria-label="Showroom Location Map" className="w-full mt-6">
          <ShowroomGoogleMap
            apiKey={mapsApiKey}
            location={location}
            heightClass="h-[360px] sm:h-[440px]"
            roundedClassName="rounded-2xl"
            zoom={17}
            title="Wonder Cars Showroom Map"
          />
        </section>
      )}
    </div>
  );
}
