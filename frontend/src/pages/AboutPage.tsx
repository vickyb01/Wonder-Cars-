import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Award,
  Car,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  FileCheck,
  HeartHandshake,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';
import { fetchAboutSettings } from '../utils/api';
import type { AboutSettings } from '../types/car';
import {
  ABOUT_DATA,
  type CertificateItem,
  type GalleryPhotoItem,
  type YouTubeVideoItem,
} from '../data/aboutConfig';
import aboutHeroBg from '../assets/images/about-hero-bg.jpg';

// Inline verified SVGs for social brands
function InstagramIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.59 5.95L0 24l6.33-1.66a11.87 11.87 0 0 0 5.73 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.42ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.98 1-3.66-.23-.37a9.88 9.88 0 0 1-1.52-5.26c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.47-4.44 9.9-9.89 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function getWhyIcon(iconName: string) {
  switch (iconName) {
    case 'CheckCircle2':
      return <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
    case 'Scale':
      return <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    case 'FileCheck':
      return <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    case 'UserCheck':
      return <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
    case 'Car':
      return <Car className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
    case 'ShieldAlert':
    default:
      return <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
  }
}

export function AboutPage() {
  // Live About Settings from Backend
  const [liveSettings, setLiveSettings] = useState<AboutSettings | null>(null);

  useEffect(() => {
    let active = true;
    fetchAboutSettings()
      .then((data) => {
        if (active && data) setLiveSettings(data);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#gallery') {
      const timer = setTimeout(() => {
        const el = document.getElementById('gallery');
        if (el) {
          const yOffset = -80;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash, liveSettings]);

  // Gallery Lightbox Modal State
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number | null>(null);
  const [galleryZoom, setGalleryZoom] = useState<number>(1);

  // Certificate Lightbox Modal State
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [certZoom, setCertZoom] = useState<number>(1);

  // YouTube Video Modal State
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideoItem | null>(null);

  // Instagram embeds auto-processor
  useEffect(() => {
    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).instgrm?.Embeds) {
      (window as any).instgrm.Embeds.process();
    }
  }, []);

  // Dynamic Content with Graceful Fallbacks to ABOUT_DATA
  const heroBadge = liveSettings?.heroBadge || ABOUT_DATA.hero.badge;
  const headline = liveSettings?.headline;
  const subheadline = liveSettings?.subheadline || ABOUT_DATA.hero.subheadline;
  const heroBg = liveSettings?.heroBgImage || aboutHeroBg;
  const heroCarImage = liveSettings?.heroCarImage || '/src/assets/images/car_audi_rs_etron_1794898131413.jpg';
  const heroCarTitle = liveSettings?.heroCarTitle || 'Wonder Cars Delhi';
  const heroCarSubtitle = liveSettings?.heroCarSubtitle || 'East Delhi Showroom Gallery';
  const heroCarRating = liveSettings?.heroCarRating || '★ 4.9 Rating';
  const heroStats =
    liveSettings?.heroStats && liveSettings.heroStats.length > 0
      ? liveSettings.heroStats
      : ABOUT_DATA.hero.stats;

  const ownerName = liveSettings?.ownerName || ABOUT_DATA.owner.name;
  const ownerDesignation = liveSettings?.ownerDesignation || ABOUT_DATA.owner.designation;
  const ownerTagline = liveSettings?.ownerTagline || ABOUT_DATA.owner.tagline;
  const ownerImage = liveSettings?.ownerImage || ABOUT_DATA.owner.image;
  const ownerExperience = liveSettings?.ownerExperience || ABOUT_DATA.owner.experienceYears;
  const ownerBio =
    liveSettings?.ownerBio && liveSettings.ownerBio.length > 0
      ? liveSettings.ownerBio
      : ABOUT_DATA.owner.bioParagraphs;
  const ownerPhilosophy = liveSettings?.ownerPhilosophy || ABOUT_DATA.owner.philosophy;
  const ownerSignature = liveSettings?.ownerSignature || ABOUT_DATA.owner.signatureText;

  const whyChooseBadge = liveSettings?.whyChooseBadge || ABOUT_DATA.whyChooseUs.badge;
  const whyChooseTitle = liveSettings?.whyChooseTitle || ABOUT_DATA.whyChooseUs.title;
  const whyChooseDesc = liveSettings?.whyChooseDescription || ABOUT_DATA.whyChooseUs.description;
  const whyChooseItems =
    liveSettings?.whyChooseItems && liveSettings.whyChooseItems.length > 0
      ? (liveSettings.whyChooseItems as any)
      : ABOUT_DATA.whyChooseUs.items;

  const certsBadge = liveSettings?.certificatesBadge || ABOUT_DATA.certificates.badge;
  const certsTitle = liveSettings?.certificatesTitle || ABOUT_DATA.certificates.title;
  const certsDesc = liveSettings?.certificatesDescription || ABOUT_DATA.certificates.description;
  const certsItems =
    liveSettings?.certificatesItems && liveSettings.certificatesItems.length > 0
      ? (liveSettings.certificatesItems as any)
      : ABOUT_DATA.certificates.items;

  const galleryBadge = liveSettings?.galleryBadge || ABOUT_DATA.gallery.badge;
  const galleryTitle = liveSettings?.galleryTitle || ABOUT_DATA.gallery.title;
  const galleryDesc = liveSettings?.galleryDescription || ABOUT_DATA.gallery.description;
  const filteredGallery =
    liveSettings?.galleryItems && liveSettings.galleryItems.length > 0
      ? (liveSettings.galleryItems as any)
      : ABOUT_DATA.gallery.items;

  const videosBadge = liveSettings?.videosBadge || ABOUT_DATA.videos.badge;
  const videosTitle = liveSettings?.videosTitle || ABOUT_DATA.videos.title;
  const videosDesc = liveSettings?.videosDescription || ABOUT_DATA.videos.description;
  const videoItems =
    liveSettings?.videoItems && liveSettings.videoItems.length > 0
      ? (liveSettings.videoItems as any)
      : ABOUT_DATA.videos.items;

  const instagramUrl = liveSettings?.instagramUrl || ABOUT_DATA.social.instagram.url;
  const instagramHandle = liveSettings?.instagramHandle || ABOUT_DATA.social.instagram.handle;
  const instagramBio = liveSettings?.instagramBio || ABOUT_DATA.social.instagram.bio;

  const facebookUrl = liveSettings?.facebookUrl || ABOUT_DATA.social.facebook.url;
  const facebookPageName = liveSettings?.facebookPageName || ABOUT_DATA.social.facebook.pageName;
  const facebookBio = liveSettings?.facebookBio || ABOUT_DATA.social.facebook.bio;

  const youtubeUrl = liveSettings?.youtubeUrl || ABOUT_DATA.social.youtube.url;
  const youtubeChannelName = liveSettings?.youtubeChannelName || ABOUT_DATA.social.youtube.channelName;
  const youtubeBio = liveSettings?.youtubeBio || ABOUT_DATA.social.youtube.bio;

  const showroomName = liveSettings?.showroomName || ABOUT_DATA.showroom.name;
  const showroomAddress = liveSettings?.showroomAddress || ABOUT_DATA.showroom.address;
  const showroomLandmark = liveSettings?.showroomLandmark || ABOUT_DATA.showroom.landmark;
  const showroomCity = liveSettings?.showroomCity || ABOUT_DATA.showroom.city;
  const showroomState = liveSettings?.showroomState || ABOUT_DATA.showroom.state;
  const showroomPincode = liveSettings?.showroomPincode || ABOUT_DATA.showroom.pincode;
  const showroomPhone = liveSettings?.showroomPhone || ABOUT_DATA.showroom.phone;
  const showroomEmail = liveSettings?.showroomEmail || ABOUT_DATA.showroom.email;
  const showroomWhatsapp = liveSettings?.showroomWhatsapp || ABOUT_DATA.showroom.whatsapp;
  const showroomOpeningHours = liveSettings?.showroomOpeningHours || ABOUT_DATA.showroom.openingHours;
  const showroomDirectionsUrl = liveSettings?.googleMapsDirectionsUrl || ABOUT_DATA.showroom.googleMapsDirectionsUrl;
  const showroomEmbedUrl = liveSettings?.googleMapsEmbedUrl || ABOUT_DATA.showroom.googleMapsEmbedUrl;

  // Keyboard navigation for gallery lightbox
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedGalleryIndex !== null) {
        if (e.key === 'ArrowRight') {
          setSelectedGalleryIndex((prev) => (prev !== null ? (prev + 1) % filteredGallery.length : 0));
          setGalleryZoom(1);
        } else if (e.key === 'ArrowLeft') {
          setSelectedGalleryIndex((prev) =>
            prev !== null ? (prev - 1 + filteredGallery.length) % filteredGallery.length : 0
          );
          setGalleryZoom(1);
        } else if (e.key === 'Escape') {
          setSelectedGalleryIndex(null);
          setGalleryZoom(1);
        }
      }
      if (selectedCert !== null && e.key === 'Escape') {
        setSelectedCert(null);
        setCertZoom(1);
      }
      if (selectedVideo !== null && e.key === 'Escape') {
        setSelectedVideo(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGalleryIndex, selectedCert, selectedVideo, filteredGallery.length]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-[#FAFAFA] transition-colors duration-200">
      <SeoHead
        title="About Us"
        description="Wonder Cars is Delhi-NCR's premier destination for certified pre-owned luxury and performance cars. Founded by Naman Jain on trust, forensic quality audits, and clear title transparency."
      />

      {/* ─────────────────────────────────────────────────────────────
          1. ABOUT HERO SECTION (CINEMATIC LUXURY NIGHT DRIVE)
      ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-black border-b border-white/[0.08]">
        {/* Cinematic Night Road Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src={heroBg}
            alt="Wonder Cars Luxury Night Drive"
            className="w-full h-full object-cover object-center"
          />
          {/* Moody luxury overlays matching reference design */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-transparent to-black/40" />
        </div>

        {/* Ambient amber warmth reflecting road illumination */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Heading, Subhead, CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{heroBadge}</span>
              </div>

              {/* Main Headline */}
              {headline ? (
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                  {headline}
                </h1>
              ) : (
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]">
                  More Than Cars, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">
                    We Build Trust.
                  </span>
                </h1>
              )}

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
                {subheadline}
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#why-choose"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/25 hover:shadow-lg transition-all duration-200"
                >
                  <span>Why Wonder Cars</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <Link
                  to="/cars"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold text-sm border border-white/[0.12] backdrop-blur-sm transition-colors duration-200"
                >
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>Browse Fleet</span>
                </Link>

                <a
                  href={`https://wa.me/${showroomWhatsapp}?text=${encodeURIComponent(
                    'Hello Wonder Cars, I would like to learn more about your pre-owned inventory.'
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-sm font-semibold backdrop-blur-sm transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </motion.div>

            {/* Right Column: Hero Visual Feature Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.12] shadow-2xl bg-transparent group">
                <VehicleImage
                  src={heroCarImage}
                  alt={heroCarTitle}
                  loading="eager"
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Floating Bottom Card - Truly Transparent Glass with Frosted Blur */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 sm:p-4 rounded-xl bg-black/15 backdrop-blur-md border border-white/20 shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {heroCarTitle}
                      </p>
                      <p className="text-sm font-bold text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                        {heroCarSubtitle}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-amber-300 border border-amber-400/40 shrink-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {heroCarRating}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 pt-10 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {heroStats.map((stat, idx) => (
              <motion.div
                key={stat.label || idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.08] shadow-sm hover:border-amber-500/30 transition-all duration-300"
              >
                <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tabular-nums">
                  {stat.number}
                </p>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. OWNER INTRODUCTION SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="owner" className="py-20 md:py-28 bg-white dark:bg-[#09090B] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Owner Visual Layout */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-5 space-y-4"
            >
              <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/20 dark:border-amber-500/30 shadow-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#18181B] dark:to-[#121215] p-6 text-center">
                {/* Visual Emblem / Portrait Frame */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full overflow-hidden border-4 border-amber-500/30 shadow-inner bg-white dark:bg-black p-4 flex items-center justify-center">
                  <img
                    src={ownerImage}
                    alt={ownerName}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="mt-6 space-y-1">
                  <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {ownerName}
                  </h3>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {ownerDesignation}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {ownerExperience}
                  </p>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium border border-amber-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Curator & Principal</span>
                </div>
              </div>
            </motion.div>

            {/* Owner Message & Philosophy */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 text-xs font-semibold tracking-wide uppercase">
                <span>Meet The Founder</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                "Our Word Is Our Strongest Bond."
              </h2>

              <p className="text-base text-amber-700 dark:text-amber-400 font-medium">
                {ownerTagline}
              </p>

              {/* Bio Paragraphs */}
              <div className="space-y-4 text-slate-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed">
                {ownerBio.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Philosophy Quote Box */}
              <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/[0.06] border-l-4 border-amber-500 dark:border-amber-400 text-slate-800 dark:text-zinc-200 italic text-sm sm:text-base font-serif">
                {ownerPhilosophy}
              </div>

              {/* Signature Block */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                <div>
                  <p className="font-['Dancing_Script',cursive] text-3xl sm:text-4xl text-amber-600 dark:text-amber-400 font-bold select-none">
                    {ownerSignature}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 uppercase tracking-wider font-semibold">
                    {ownerName} · {ownerDesignation}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">Verified Dealership</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          4. WHY CHOOSE WONDER CARS
      ───────────────────────────────────────────────────────────── */}
      <section id="why-choose" className="py-20 md:py-28 bg-white dark:bg-[#09090B] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{whyChooseBadge}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              {whyChooseTitle}
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              {whyChooseDesc}
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {whyChooseItems.map((item: any, idx: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="p-7 rounded-2xl bg-slate-50/70 dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center shadow-xs">
                    {getWhyIcon(item.iconName)}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                    {item.badge}
                  </span>
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {item.highlight}
                </p>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CERTIFICATIONS & ACHIEVEMENTS
      ───────────────────────────────────────────────────────────── */}
      <section id="certifications" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0c0c0f] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{certsBadge}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              {certsTitle}
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              {certsDesc}
            </p>
          </div>

          {/* Certificate Cards (Single Row 3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {certsItems.map((cert: any) => (
              <div
                key={cert.id}
                onClick={() => {
                  setSelectedCert(cert);
                  setCertZoom(1);
                }}
                className="group p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Framed Certificate Document Image Preview */}
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-slate-950/80 border border-slate-200 dark:border-white/10 flex items-center justify-center p-2.5 group-hover:border-amber-500/40 transition-colors">
                    <img
                      src={cert.image}
                      alt={cert.title}
                      className="max-h-full max-w-full object-contain rounded-sm transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-bold shadow-lg">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Click to Enlarge</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{cert.badge}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      {cert.date}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {cert.title}
                    </h3>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                      Issuing Authority: {cert.authority}
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                    {cert.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-zinc-500">
                    Official Verification Document
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCert(cert);
                      setCertZoom(1);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. OUR SHOWROOM & CAR GALLERY
      ───────────────────────────────────────────────────────────── */}
      <section id="gallery" className="py-20 md:py-28 bg-white dark:bg-[#09090B] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{galleryBadge}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              {galleryTitle}
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              {galleryDesc}
            </p>
          </div>

          {/* Photo Gallery Grid (3 Images Per Row, Uniform Box Sizes & Visible Footers) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredGallery.map((photo: any, index: number) => (
              <div
                key={photo.id}
                onClick={() => {
                  setSelectedGalleryIndex(index);
                  setGalleryZoom(1);
                }}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Uniform Image Container (Exact Same Size For All 9 Boxes) */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <VehicleImage
                    src={photo.image}
                    alt={photo.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle Dark Gradient at bottom of image for sleek depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

                  {/* Quick Expand Icon on Hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-8 h-8 rounded-full bg-black/75 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  </div>
                </div>

                {/* Visible Card Footer: Clean Photo Title & Description */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-white dark:bg-[#121215] border-t border-slate-100 dark:border-white/[0.06]">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-1 leading-relaxed">
                      {photo.caption}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. YOUTUBE VIDEO GALLERY ("WATCH OUR JOURNEY")
      ───────────────────────────────────────────────────────────── */}
      <section id="videos" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0c0c0f] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold tracking-wide uppercase">
              <YoutubeIcon className="w-4 h-4 text-red-600" />
              <span>{videosBadge}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              {videosTitle}
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              {videosDesc}
            </p>
          </div>

          {/* Video Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {videoItems.map((video: any) => (
              <div
                key={video.id}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Thumbnail / Live Player Container */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden">
                  {video.autoPlayLive ? (
                    <div className="relative w-full h-full">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${video.youtubeId}&playsinline=1&controls=1&modestbranding=1&rel=0`}
                        title={video.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                      {/* Top Action Bar for Live Player */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                        <div className="px-2.5 py-1 rounded-md text-xs font-semibold bg-black/80 text-amber-300 backdrop-blur-sm flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>{video.category}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVideo(video)}
                          title="Open in Fullscreen Theater Modal"
                          className="pointer-events-auto p-1.5 rounded-md bg-black/80 hover:bg-black text-white hover:text-amber-400 backdrop-blur-sm transition-colors shadow-sm cursor-pointer"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setSelectedVideo(video)}
                      className="relative w-full h-full cursor-pointer group"
                    >
                      <VehicleImage
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-transform duration-200">
                          <Play className="w-6 h-6 fill-white translate-x-0.5" />
                        </div>
                      </div>

                      {/* Duration Badge */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-black/80 text-white backdrop-blur-sm">
                        {video.duration}
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-black/70 text-amber-300 backdrop-blur-sm">
                        {video.category}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  onClick={() => setSelectedVideo(video)}
                  className="p-5 space-y-2 cursor-pointer flex-1 flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {video.description}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-medium text-red-600 dark:text-red-400">
                    <span className="inline-flex items-center gap-1 hover:underline">
                      Watch Video
                      <ExternalLink className="w-3 h-3" />
                    </span>
                    <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
                      @usedcarsnearby
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              LATEST INSTAGRAM REELS (LIVE EMBEDDED)
          ───────────────────────────────────────────────────────────── */}
          <div className="mt-20 pt-16 border-t border-slate-200/80 dark:border-white/[0.08]">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-semibold tracking-wide uppercase">
                <InstagramIcon className="w-4 h-4 text-pink-600" />
                <span>{ABOUT_DATA.instagramReels.badge}</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {ABOUT_DATA.instagramReels.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                {ABOUT_DATA.instagramReels.description}
              </p>
            </div>

            {/* Instagram Reels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {ABOUT_DATA.instagramReels.items.map((reel) => (
                <div
                  key={reel.id}
                  className="rounded-2xl overflow-hidden bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Top Bar */}
                  <div className="p-3.5 px-4 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[1.5px] flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                          <InstagramIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">@usedcarsnearby</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20">
                      Live Reel
                    </span>
                  </div>

                  {/* Instagram Iframe Container */}
                  <div className="relative w-full h-[480px] sm:h-[500px] bg-slate-950 overflow-hidden flex items-center justify-center">
                    <iframe
                      src={`https://www.instagram.com/p/${reel.shortcode}/embed/`}
                      title={reel.title}
                      loading="lazy"
                      className="w-full h-full border-0"
                      scrolling="no"
                      allowTransparency={true}
                      allow="encrypted-media; autoplay"
                    />
                  </div>

                  {/* Reel Card Footer */}
                  <div className="p-4 bg-white dark:bg-[#121215] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300 truncate">
                      {reel.title}
                    </p>
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-medium transition-all shadow-xs"
                    >
                      <span>Watch</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────
          9. INSTAGRAM & FACEBOOK INTEGRATION
      ───────────────────────────────────────────────────────────── */}
      <section id="social" className="py-20 md:py-28 bg-slate-50 dark:bg-[#0c0c0f] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 text-pink-700 dark:text-pink-300 text-xs font-semibold tracking-wide uppercase">
              <InstagramIcon className="w-4 h-4 text-pink-600" />
              <span>Connect With Us</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Follow Our Journey Across Channels
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              Stay up to date with new car arrivals, delivery celebrations, and automotive advice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Instagram Card */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <InstagramIcon className="w-6 h-6" />
                  </div>
                  {/* Large Profile Avatar */}
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Follow ${instagramHandle} on Instagram`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-pink-500/60 dark:border-pink-500/80 shadow-md p-0.5 bg-slate-950 hover:scale-105 transition-transform shrink-0 cursor-pointer"
                  >
                    <img
                      src="/assets/usedcarsnearby-avatar.png"
                      alt="Used Cars Nearby Instagram Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </a>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Instagram
                  </h3>
                  <p className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                    {instagramHandle}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  {instagramBio}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 hover:from-pink-700 hover:to-amber-600 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <InstagramIcon className="w-4 h-4" />
                  <span>Follow on Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Facebook Card */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <FacebookIcon className="w-6 h-6" />
                  </div>
                  {/* Large Profile Avatar */}
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`Join ${facebookPageName} on Facebook`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-blue-500/60 dark:border-blue-500/80 shadow-md p-0.5 bg-slate-950 hover:scale-105 transition-transform shrink-0 cursor-pointer"
                  >
                    <img
                      src="/assets/usedcarsnearby-avatar.png"
                      alt="Used Cars Nearby Facebook Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </a>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Facebook
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {facebookPageName}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  {facebookBio}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <FacebookIcon className="w-4 h-4" />
                  <span>Join Us on Facebook</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* YouTube Card */}
            <div className="p-7 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <YoutubeIcon className="w-6 h-6" />
                  </div>
                  {/* Large Profile Avatar */}
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={`${youtubeChannelName} YouTube Channel`}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-red-500/60 dark:border-red-500/80 shadow-md p-0.5 bg-slate-950 hover:scale-105 transition-transform shrink-0 cursor-pointer"
                  >
                    <img
                      src="/assets/usedcarsnearby-avatar.png"
                      alt="Used Cars Nearby Channel Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </a>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    YouTube
                  </h3>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {youtubeChannelName}
                  </p>
                </div>
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  {youtubeBio}
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <YoutubeIcon className="w-4 h-4" />
                  <span>Subscribe to Channel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. VISIT OUR SHOWROOM – LOCATION & MAP
      ───────────────────────────────────────────────────────────── */}
      <section id="location" className="py-20 md:py-28 bg-white dark:bg-[#09090B] border-b border-slate-200/80 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Flagship Gallery</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
              Visit Wonder Cars Showroom
            </h2>
            <p className="text-base text-slate-600 dark:text-zinc-400 leading-relaxed">
              We warmly invite you to inspect our certified collection in person, discuss customized finance options, and experience private test drives.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Showroom Details & Contact */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-50 dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {showroomName}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                    {showroomCity}, {showroomState}
                  </p>
                </div>

                {/* Info List */}
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Address</p>
                      <p className="text-slate-600 dark:text-zinc-400">
                        {showroomAddress}, {showroomCity}, {showroomState} {showroomPincode}
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                        Landmark: {showroomLandmark}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Showroom Timings</p>
                      <p className="text-slate-600 dark:text-zinc-400">
                        {showroomOpeningHours}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Direct Line</p>
                      <p className="text-slate-600 dark:text-zinc-400">
                        {showroomPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Official Email</p>
                      <p className="text-slate-600 dark:text-zinc-400">
                        {showroomEmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-200 dark:border-white/[0.08] flex flex-wrap gap-3">
                <a
                  href={showroomDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Get Directions</span>
                </a>

                <a
                  href={`tel:${showroomPhone}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-200 dark:bg-white/[0.08] text-slate-900 dark:text-white font-semibold text-xs hover:bg-slate-300 dark:hover:bg-white/[0.14] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Now</span>
                </a>

                <a
                  href={`https://wa.me/${showroomWhatsapp}?text=${encodeURIComponent(
                    'Hello Naman ji, I want to visit Wonder Cars showroom today.'
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Interactive Responsive Map Embed */}
            <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] shadow-md min-h-[380px] lg:min-h-full relative bg-slate-100 dark:bg-[#121215]">
              <iframe
                title="Wonder Cars Location Map"
                src={showroomEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '380px' }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover"
              />
              {/* Floating Quick Action Overlay */}
              <div className="absolute top-4 right-4 z-10">
                <a
                  href={showroomDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Start Live Navigation</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX MODAL: PHOTO GALLERY
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedGalleryIndex !== null && filteredGallery[selectedGalleryIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
            onClick={() => {
              setSelectedGalleryIndex(null);
              setGalleryZoom(1);
            }}
          >
            {/* Top Toolbar */}
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold bg-white/10 px-3 py-1 rounded-full">
                  {selectedGalleryIndex + 1} / {filteredGallery.length}
                </span>
                <span className="text-xs sm:text-sm text-zinc-300 hidden sm:inline">
                  {filteredGallery[selectedGalleryIndex].title}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setGalleryZoom((z) => Math.max(0.75, z - 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setGalleryZoom((z) => Math.min(2.5, z + 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Reset Zoom"
                  onClick={() => setGalleryZoom(1)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Close (Esc)"
                  onClick={() => {
                    setSelectedGalleryIndex(null);
                    setGalleryZoom(1);
                  }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Left / Right Nav Arrows */}
            {filteredGallery.length > 1 && (
              <>
                <button
                  type="button"
                  title="Previous (Left Arrow)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIndex((prev) =>
                      prev !== null ? (prev - 1 + filteredGallery.length) % filteredGallery.length : 0
                    );
                    setGalleryZoom(1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  type="button"
                  title="Next (Right Arrow)"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGalleryIndex((prev) =>
                      prev !== null ? (prev + 1) % filteredGallery.length : 0
                    );
                    setGalleryZoom(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div
              className="max-w-5xl max-h-[82vh] overflow-hidden flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={filteredGallery[selectedGalleryIndex].image}
                alt={filteredGallery[selectedGalleryIndex].title}
                style={{ transform: `scale(${galleryZoom})` }}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl transition-transform duration-200 select-none shadow-2xl"
              />
              <div className="mt-3 text-center text-white max-w-2xl px-4">
                <p className="font-semibold text-sm sm:text-base">
                  {filteredGallery[selectedGalleryIndex].title}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {filteredGallery[selectedGalleryIndex].caption}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          LIGHTBOX MODAL: CERTIFICATE PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCert !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
            onClick={() => {
              setSelectedCert(null);
              setCertZoom(1);
            }}
          >
            {/* Top Toolbar */}
            <div
              className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
                  {selectedCert.badge}
                </span>
                <span className="text-xs sm:text-sm text-zinc-300 hidden sm:inline">
                  {selectedCert.title}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setCertZoom((z) => Math.max(0.75, z - 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setCertZoom((z) => Math.min(2.5, z + 0.25))}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Reset Zoom"
                  onClick={() => setCertZoom(1)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Close (Esc)"
                  onClick={() => {
                    setSelectedCert(null);
                    setCertZoom(1);
                  }}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Container */}
            <div
              className="max-w-3xl w-full bg-white dark:bg-[#121215] text-slate-900 dark:text-white rounded-3xl p-5 sm:p-7 border border-amber-500/30 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-2 shrink-0">
                    <img
                      src="/assets/wonder-cars-emblem-clean.png"
                      alt="Wonder Cars Emblem"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Verified Document · Wonder Cars Showroom
                    </span>
                    <h3 className="font-display text-base sm:text-lg font-bold">
                      {selectedCert.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCertZoom((z) => Math.max(0.75, +(z - 0.25).toFixed(2)))}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertZoom(1)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    title="Reset Zoom"
                    aria-label="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scanned / Framed High-Res Certificate Image */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 p-2 sm:p-4 border border-slate-200 dark:border-white/10 flex items-center justify-center min-h-[360px] max-h-[62vh] overflow-auto">
                <div
                  style={{ transform: `scale(${certZoom})` }}
                  className="transition-transform duration-200 flex items-center justify-center max-w-full"
                >
                  <img
                    src={selectedCert.image}
                    alt={selectedCert.title}
                    className="max-h-[58vh] w-auto max-w-full rounded-md shadow-2xl object-contain mx-auto"
                  />
                </div>
              </div>

              {/* Description & Authority */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-white/[0.04] space-y-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-900 dark:text-white">
                  <span>Issuing Authority: {selectedCert.authority}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-xs">{selectedCert.date}</span>
                </div>
                <p>{selectedCert.description}</p>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">
                  Official Verification ID: {selectedCert.id.toUpperCase()}-WND-2026
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCert(null);
                    setCertZoom(1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:bg-slate-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Close Document
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          YOUTUBE VIDEO PLAYER MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedVideo !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="max-w-4xl w-full bg-slate-950 rounded-3xl overflow-hidden border border-white/[0.1] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.08] text-white">
                <div>
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">
                    {selectedVideo.category}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-bold line-clamp-1">
                    {selectedVideo.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVideo(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* YouTube Iframe Player */}
              <div className="relative aspect-video w-full bg-black">
                <iframe
                  title={selectedVideo.title}
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&loop=1&playlist=${selectedVideo.youtubeId}`}
                  width="100%"
                  height="100%"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                <p className="max-w-xl line-clamp-1">{selectedVideo.description}</p>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold"
                >
                  <span>Visit YouTube Channel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}