import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { Car } from '../types/car';
import { fetchCarDetail, getWishlistIds, toggleWishlistId } from '../utils/api';
import {
  buildWhatsAppUrl,
  calculateVehicleAge,
  formatINR,
  formatINRCompact,
  formatKm,
  formatReadableDate,
} from '../utils/format';
import { CarCard } from '../components/CarCard';
import { SeoHead } from '../components/SeoHead';
import { ShowroomGallery } from '../components/showroom/ShowroomGallery';
import { InspectionReportsSection } from '../components/showroom/InspectionReportsSection';
import { HistoryAndLegalSection } from '../components/showroom/HistoryAndLegalSection';
import { ShowroomEnquirySidebar } from '../components/showroom/ShowroomEnquirySidebar';
import { EmiCalculatorSection } from '../components/showroom/EmiCalculatorSection';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import { estimateCarEmiWithConfig } from '../utils/emi';

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [similar, setSimilar] = useState<Car[]>([]);
  const [sellerOtherCars, setSellerOtherCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = car ? isWishlisted(car.id) : false;
  const [shareFeedback, setShareFeedback] = useState('');
  const [activeFormMode, setActiveFormMode] = useState<'test-drive' | 'inspection' | 'offer'>('test-drive');
  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const { isCompared, toggleCompare, compareCount } = useCompare();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    let active = true;
    setLoading(true);
    setError('');

    fetchCarDetail(id)
      .then((res) => {
        if (!active) return;
        setCar(res.car);
        setSimilar(res.similar);
        setSellerOtherCars(res.sellerOtherCars);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load vehicle details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  function handleWishlistToggle() {
    if (!car) return;
    toggleWishlist(car.id);
  }

  async function handleShare() {
    if (!car) return;
    const shareUrl = window.location.href;
    const title = `${car.year} ${car.brand} ${car.model} — Strada Motors`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied');
        setTimeout(() => setShareFeedback(''), 2500);
      }
    } catch {
      // User cancelled share dialog
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090B] pt-28 pb-20 max-w-7xl mx-auto px-5 sm:px-8 space-y-6">
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-[#121215] animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 h-[460px] rounded-2xl bg-slate-100 dark:bg-[#121215] animate-pulse" />
          <div className="lg:col-span-4 h-[460px] rounded-2xl bg-slate-100 dark:bg-[#121215] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090B] pt-32 pb-20 max-w-2xl mx-auto px-5 text-center space-y-5">
        <SeoHead title="Vehicle Not Found" />
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Vehicle Unavailable</h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm">
          {error || 'This listing may have been removed or is currently in draft.'}
        </p>
        <Link
          to="/cars"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Browse Cars</span>
        </Link>
      </div>
    );
  }

  const carTitle = `${car.year} ${car.brand} ${car.model} ${car.variant}`;
  const age = calculateVehicleAge(car.registrationDate, car.registrationYear || car.year);
  const insuranceDoc = car.documents.find((d) => d.key === 'insurance');

  const basicSpecs = [
    { label: 'Brand', value: car.brand },
    { label: 'Model', value: car.model },
    { label: 'Variant', value: car.variant },
    { label: 'Manufacturing Year', value: String(car.year) },
    { label: 'Registration Year', value: car.registrationYear ? String(car.registrationYear) : 'Not Provided' },
    { label: 'Registration Date', value: formatReadableDate(car.registrationDate) },
    { label: 'Vehicle Category', value: car.category || 'Not Provided' },
    { label: 'Body Type', value: car.bodyType || 'Not Provided' },
    { label: 'Exterior Colour', value: car.color || 'Not Provided' },
    { label: 'Interior Colour', value: car.interiorColor || 'Not Provided' },
    { label: 'Seating Capacity', value: car.seatingCapacity ? `${car.seatingCapacity} Seats` : 'Not Provided' },
    { label: 'Number of Doors', value: car.doors ? `${car.doors} Doors` : 'Not Provided' },
    { label: 'Warranty & Guarantee', value: car.warrantyPeriod || '1 Year' },
  ];

  const engineSpecs = [
    { label: 'Engine Capacity', value: car.engineCc || 'Not Provided' },
    { label: 'Engine Type', value: car.engine || 'Not Provided' },
    { label: 'Cylinders', value: car.cylinders || 'Not Provided' },
    { label: 'Maximum Power', value: car.power || 'Not Provided' },
    { label: 'Maximum Torque', value: car.torque || 'Not Provided' },
    { label: 'Fuel Type', value: car.fuelType },
    { label: 'Transmission', value: car.transmission },
    { label: 'Drivetrain', value: car.drivetrain || 'Not Provided' },
    { label: 'Claimed Mileage / Range', value: car.claimedMileage || 'Not Provided' },
    { label: 'Emission Standard', value: car.emissionStandard || 'Not Provided' },
  ];

  const featureCategories = [
    { title: 'Comfort & Convenience', items: car.features.comfort },
    { title: 'Entertainment & Infotainment', items: car.features.entertainment },
    { title: 'Safety & Driver Assistance', items: car.features.safety },
    { title: 'Exterior Equipment', items: car.features.exterior },
  ].filter((group) => group.items.length > 0);

  const statusTone =
    car.status === 'Sold'
      ? 'text-rose-700 dark:text-rose-400'
      : car.status === 'Reserved'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-emerald-700 dark:text-emerald-400';

  const whatsappQuickHref = buildWhatsAppUrl(
    car.sellerWhatsapp || '919820451090',
    `Hello ${car.sellerName}, I am enquiring about ${carTitle} (Listing ${car.listingCode}).`
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-[72px] pb-28 lg:pb-20 transition-colors duration-200">
      <SeoHead
        title={carTitle}
        description={`${carTitle} · ${formatKm(car.kilometres)} · ${car.fuelType} · ${car.transmission} · ${formatINR(car.priceInr)}`}
      />

      {/* Full-Screen Car Photo Gallery Showcase */}
      <ShowroomGallery
        carTitle={carTitle}
        gallery={car.gallery}
        videoWalkthroughUrl={car.videoWalkthroughUrl}
        fullScreenHero
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 space-y-8">
        {/* 1. Premium Car Details Page Header (below the full-screen image) */}
        <header className="pb-6 border-b border-slate-200 dark:border-white/[0.08] space-y-5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-blue-700 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/cars" className="hover:text-blue-700 dark:hover:text-white transition-colors">
              Browse Cars
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-slate-800 dark:text-zinc-200 font-medium truncate">
              {car.year} {car.brand} {car.model}
            </span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className={`font-semibold ${statusTone}`}>Status: {car.status}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">·</span>
                <span className="font-mono text-slate-500 dark:text-zinc-400">Listing ID: {car.listingCode}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">·</span>
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>{car.location}</span>
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {car.year} {car.brand} {car.model} <span className="text-slate-500 dark:text-zinc-400 font-medium">{car.variant}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600 dark:text-zinc-300 tabular-nums">
                <span>{car.year} Model</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                <span>Reg. {car.registrationYear || car.year}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                <span>{formatKm(car.kilometres)} Driven</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                <span>{car.fuelType}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                <span>{car.transmission}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                <span>{car.ownership}</span>
                {car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && (
                  <>
                    <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{car.warrantyPeriod} Guarantee Included</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 shrink-0">
              <div className="lg:text-right">
                <p className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatINR(car.priceInr)}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold">
                  {car.priceType === 'Fixed' ? 'Fixed Price' : 'Negotiable'} · {formatINRCompact(car.priceInr)}
                </p>
                <a
                  href="#emi-calculator"
                  className="inline-block mt-1 text-xs font-mono text-slate-500 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-white underline-offset-2 hover:underline tabular-nums transition-colors"
                >
                  Est. EMI from {formatINR(estimateCarEmiWithConfig(car.priceInr))}/mo →
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    wishlisted
                      ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-[#121215] border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-white/[0.25]'
                  }`}
                  aria-pressed={wishlisted}
                >
                  <Heart className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} />
                  <span>{wishlisted ? 'Saved' : 'Save'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompare(car)}
                  aria-pressed={isCompared(car.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    isCompared(car.id)
                      ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-600 dark:border-blue-500 text-blue-700 dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-[#121215] border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-white/[0.25]'
                  }`}
                >
                  {isCompared(car.id) ? <Check className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                  <span>{isCompared(car.id) ? 'In Compare' : 'Compare'}</span>
                </button>

                {compareCount > 0 && (
                  <Link
                    to="/compare"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <span>Compare ({compareCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] hover:border-blue-400 dark:hover:border-white/[0.25] text-xs font-semibold text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{shareFeedback || 'Share'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* All Information & Sticky Sidebar Below the Full-Screen Car Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 8 Columns: Overview + Specs + History + Inspection + Features + Summary */}
          <div className="lg:col-span-8 space-y-8">

            {/* Vehicle Description & Key Highlights */}
            <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Showroom Overview</p>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">About This Vehicle</h2>
              </div>
              <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed">
                {car.description || 'Detailed vehicle overview not provided.'}
              </p>

              {car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && (
                <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        {car.warrantyPeriod} Strada Guarantee &amp; Warranty Included
                      </p>
                      <p className="text-xs text-emerald-800/85 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                        {car.warrantyDetails || 'Comprehensive coverage for Engine, Transmission, Drivetrain & Electrical Systems.'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                    Plans: 6 Months · 1 Year · 2 Years
                  </div>
                </div>
              )}

              {car.highlights.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07]">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Key Equipment Highlights</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {car.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-300">
                        <Check className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Interactive Monthly EMI Calculator */}
            <EmiCalculatorSection carPriceInr={car.priceInr} carTitle={carTitle} />

            {/* 3. Complete Vehicle Specifications */}
            <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Factory Data</p>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Complete Technical Specifications
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-3">Basic Information</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                    {basicSpecs.map((spec) => (
                      <div key={spec.label} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                        <dt className="text-slate-500 dark:text-zinc-400">{spec.label}</dt>
                        <dd className="text-slate-900 dark:text-white font-medium text-right font-mono tabular-nums">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-3">Engine &amp; Drivetrain</h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
                    {engineSpecs.map((spec) => (
                      <div key={spec.label} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                        <dt className="text-slate-500 dark:text-zinc-400">{spec.label}</dt>
                        <dd className="text-slate-900 dark:text-white font-medium text-right font-mono tabular-nums">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </section>

            {/* 4, 9, 10, 11. Usage History, Accident Disclosure, Service Timeline, Legal Docs */}
            <HistoryAndLegalSection car={car} />

            {/* 5, 6, 7, 8. Exterior, Interior, Mechanical & Tyre/Battery Inspection Reports */}
            <InspectionReportsSection
              exteriorReport={car.exteriorReport}
              interiorReport={car.interiorReport}
              mechanicalReport={car.mechanicalReport}
              tyreDetails={car.tyreDetails}
              batteryDetails={car.batteryDetails}
            />

            {/* 12. Categorized Vehicle Features */}
            {featureCategories.length > 0 && (
              <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                    Installed Equipment
                  </p>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    Vehicle Features by Category
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {featureCategories.map((group) => (
                    <div key={group.title} className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.07] space-y-3">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{group.title}</h3>
                      <ul className="space-y-2">
                        {group.items.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                            <Check className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 16. Complete Price & Vehicle Summary */}
            <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Dossier Recap</p>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  Complete Price &amp; Vehicle Summary
                </h2>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {[
                  { label: 'Vehicle Model', value: `${car.year} ${car.brand} ${car.model} (${car.variant})` },
                  { label: 'Vehicle Age', value: age.label },
                  { label: 'Total Kilometres', value: formatKm(car.kilometres) },
                  { label: 'Ownership Count', value: car.ownership },
                  { label: 'Fuel & Transmission', value: `${car.fuelType} · ${car.transmission}` },
                  {
                    label: 'Overall Condition',
                    value: `${car.exteriorReport.filter((i) => i.status === 'Excellent' || i.status === 'Good').length}/${car.exteriorReport.length} Exterior Checked Good+`,
                  },
                  { label: 'Insurance Status', value: insuranceDoc ? `${insuranceDoc.status} (${car.insuranceValidUntil})` : car.insuranceValidUntil },
                  {
                    label: 'Service History',
                    value: car.serviceHistory.records.length > 0
                      ? `${car.serviceHistory.records.length} Log(s) · Last ${formatReadableDate(car.serviceHistory.lastServiceDate)}`
                      : 'Verification Pending',
                  },
                  { label: 'Accident Disclosure', value: car.accidentHistory.overallStatus },
                  {
                    label: 'Warranty & Guarantee',
                    value: car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty'
                      ? `${car.warrantyPeriod} Included`
                      : 'Inspection Verified',
                  },
                  { label: 'Asking Price', value: `${formatINR(car.priceInr)} (${car.priceType})` },
                  { label: 'Seller', value: `${car.sellerName} · ${car.location}` },
                  { label: 'Availability', value: car.status },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                    <dt className="text-slate-500 dark:text-zinc-400">{row.label}</dt>
                    <dd className="text-slate-900 dark:text-white font-medium text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          {/* Right 4 Columns: Sticky Price, Seller & Booking Sidebar */}
          <div className="lg:col-span-4">
            <ShowroomEnquirySidebar
              car={car}
              sellerOtherCars={sellerOtherCars}
              activeFormMode={activeFormMode}
              onChangeFormMode={setActiveFormMode}
              formContainerRef={formContainerRef}
            />
          </div>
        </div>

        {/* 17. Similar Available Vehicles */}
        {similar.length > 0 && (
          <section className="pt-12 border-t border-slate-200 dark:border-white/[0.08]">
            <div className="flex items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Comparable Stock</p>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Similar Available Vehicles</h2>
              </div>
              <Link to="/cars" className="text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400">
                Browse Full Inventory
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((item, idx) => (
                <CarCard key={item.id} car={item} index={idx} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fixed Bottom Contact Bar on Mobile (compact ≤64px) */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.1] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums truncate">
            {formatINR(car.priceInr)}
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 truncate">{car.priceType}</p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <a
            href={`tel:${car.sellerPhone.replace(/\s+/g, '')}`}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-blue-700 dark:text-blue-400"
            aria-label="Call seller"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={whatsappQuickHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 dark:bg-emerald-600/25 border border-emerald-300 dark:border-emerald-500/35 flex items-center justify-center text-emerald-700 dark:text-emerald-300"
            aria-label="WhatsApp seller"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              setActiveFormMode('test-drive');
              formContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-2.5 sm:px-4 h-9 sm:h-10 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            Book Test Drive
          </button>
        </div>
      </div>
    </div>
  );
}
