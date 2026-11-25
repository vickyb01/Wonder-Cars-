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
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { Car } from '../types/car';
import { fetchCarDetail, getWishlistIds, toggleWishlistId, subscribeToInventoryUpdates } from '../utils/api';
import { trackClickCall, trackClickWhatsApp, trackViewCar } from '../utils/analytics';
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
import { useWishlist } from '../context/WishlistContext';
import { estimateCarEmiWithConfig } from '../utils/emi';

function isMeaningful(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  if (!s) return false;
  const lower = s.toLowerCase();
  return (
    lower !== 'not provided' &&
    lower !== 'not disclosed' &&
    lower !== 'not available' &&
    lower !== 'not inspected' &&
    lower !== 'verification pending' &&
    lower !== 'none'
  );
}

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
  const similarScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    let active = true;
    setLoading(true);
    setError('');

    const loadCar = () => {
      fetchCarDetail(id)
        .then((res) => {
          if (!active) return;
          setCar(res.car);
          setSimilar(res.similar);
          setSellerOtherCars(res.sellerOtherCars);
          setError('');
          trackViewCar({
            id: res.car.id,
            brand: res.car.brand,
            model: res.car.model,
            year: res.car.year,
            priceInr: res.car.priceInr,
          });
        })
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : 'Unable to load vehicle details.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    loadCar();

    const unsubscribe = subscribeToInventoryUpdates((data) => {
      if (
        data?.car &&
        (data.car.id === id || data.car.slug === id || data.car.listingCode?.toLowerCase() === id.toLowerCase())
      ) {
        setCar(data.car);
        setError('');
      } else {
        loadCar();
      }
    });

    return () => {
      active = false;
      unsubscribe();
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
        <SeoHead title="Vehicle Not Found" robots="noindex, nofollow" noCanonical />
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
    { label: 'Manufacturing Year', value: car.year ? String(car.year) : '' },
    { label: 'Registration Year', value: car.registrationYear ? String(car.registrationYear) : '' },
    { label: 'Registration Date', value: formatReadableDate(car.registrationDate) },
    { label: 'Vehicle Category', value: car.category },
    { label: 'Body Type', value: car.bodyType },
    { label: 'Exterior Colour', value: car.color },
    { label: 'Interior Colour', value: car.interiorColor },
    { label: 'Seating Capacity', value: car.seatingCapacity ? `${car.seatingCapacity} Seats` : '' },
    { label: 'Number of Doors', value: car.doors ? `${car.doors} Doors` : '' },
    { label: 'Registration State / RTO', value: car.registrationState },
    { label: 'Warranty & Guarantee', value: car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' ? car.warrantyPeriod : '' },
  ].filter((s) => isMeaningful(s.value));

  const engineSpecs = [
    { label: 'Engine Capacity', value: car.engineCc },
    { label: 'Engine Type', value: car.engine },
    { label: 'Cylinders', value: car.cylinders },
    { label: 'Maximum Power', value: car.power },
    { label: 'Maximum Torque', value: car.torque },
    { label: 'Fuel Type', value: car.fuelType },
    { label: 'Transmission', value: car.transmission },
    { label: 'Drivetrain', value: car.drivetrain },
    { label: 'Claimed Mileage / Range', value: car.claimedMileage },
    { label: 'Emission Standard', value: car.emissionStandard },
  ].filter((s) => isMeaningful(s.value));

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
    car.sellerWhatsapp || '918384068347',
    `Hello ${car.sellerName}, I am enquiring about ${carTitle} (Listing ${car.listingCode}).`
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-16 md:pt-[72px] pb-28 lg:pb-20 transition-colors duration-200">
      <SeoHead
        title={carTitle}
        description={`${carTitle} · ${formatKm(car.kilometres)} · ${car.fuelType} · ${car.transmission} · ${formatINR(car.priceInr)} at Wonder Cars, Preet Vihar, Delhi.`}
        canonicalPath={`/cars/${car.id}`}
        ogImage={car.images?.[0]}
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

              {(() => {
                const headerBadges: React.ReactNode[] = [];
                if (car.year) headerBadges.push(<span key="year">{car.year} Model</span>);
                if (car.registrationYear) headerBadges.push(<span key="regyear">Reg. {car.registrationYear}</span>);
                if (car.kilometres !== undefined && car.kilometres !== null && car.kilometres > 0) {
                  headerBadges.push(<span key="km">{formatKm(car.kilometres)} Driven</span>);
                }
                if (car.fuelType && isMeaningful(car.fuelType)) headerBadges.push(<span key="fuel">{car.fuelType}</span>);
                if (car.transmission && isMeaningful(car.transmission)) headerBadges.push(<span key="trans">{car.transmission}</span>);
                if (car.ownership && isMeaningful(car.ownership)) headerBadges.push(<span key="owner">{car.ownership}</span>);
                if (car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && isMeaningful(car.warrantyPeriod)) {
                  headerBadges.push(
                    <span key="warranty" className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{car.warrantyPeriod} Guarantee Included</span>
                    </span>
                  );
                }

                if (headerBadges.length === 0) return null;

                return (
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-600 dark:text-zinc-300 tabular-nums">
                    {headerBadges.map((badge, idx) => (
                      <span key={idx} className="flex items-center gap-x-2.5">
                        {idx > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-zinc-600">|</span>}
                        {badge}
                      </span>
                    ))}
                  </div>
                );
              })()}
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
            {(isMeaningful(car.description) || (car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && isMeaningful(car.warrantyPeriod)) || (car.highlights && car.highlights.filter((h) => isMeaningful(h)).length > 0)) && (
              <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Showroom Overview</p>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">About This Vehicle</h2>
                </div>
                {isMeaningful(car.description) && (
                  <p className="text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed">
                    {car.description}
                  </p>
                )}

                {car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && isMeaningful(car.warrantyPeriod) && (
                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                          {car.warrantyPeriod} Strada Guarantee &amp; Warranty Included
                        </p>
                        {isMeaningful(car.warrantyDetails) && (
                          <p className="text-xs text-emerald-800/85 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                            {car.warrantyDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {car.highlights && car.highlights.filter((h) => isMeaningful(h)).length > 0 && (
                  <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07]">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Key Equipment Highlights</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {car.highlights.filter((h) => isMeaningful(h)).map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-slate-700 dark:text-zinc-300">
                          <Check className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            {/* Interactive Monthly EMI Calculator */}
            <EmiCalculatorSection carPriceInr={car.priceInr} carTitle={carTitle} />

            {/* 3. Complete Vehicle Specifications */}
            {(basicSpecs.length > 0 || engineSpecs.length > 0) && (
              <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Factory Data</p>
                  <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                    Complete Technical Specifications
                  </h2>
                </div>

                <div className="space-y-6">
                  {basicSpecs.length > 0 && (
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
                  )}

                  {engineSpecs.length > 0 && (
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
                  )}
                </div>
              </section>
            )}

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
            {(() => {
              const summaryRows = [
                { label: 'Vehicle Model', value: `${car.year} ${car.brand} ${car.model} (${car.variant})` },
                { label: 'Vehicle Age', value: age.label },
                { label: 'Total Kilometres', value: car.kilometres > 0 ? formatKm(car.kilometres) : '' },
                { label: 'Ownership Count', value: car.ownership },
                { label: 'Fuel & Transmission', value: [car.fuelType, car.transmission].filter((x) => isMeaningful(x)).join(' · ') },
                {
                  label: 'Overall Condition',
                  value: (car.exteriorReport && car.exteriorReport.filter((i) => i.status === 'Excellent' || i.status === 'Good').length > 0)
                    ? `${car.exteriorReport.filter((i) => i.status === 'Excellent' || i.status === 'Good').length}/${car.exteriorReport.filter((i) => i.status !== 'Not Inspected').length} Exterior Checked Good+`
                    : '',
                },
                {
                  label: 'Insurance Status',
                  value: isMeaningful(car.insuranceValidUntil)
                    ? (insuranceDoc?.note || car.insuranceValidUntil)
                    : (insuranceDoc?.note || ''),
                },
                {
                  label: 'Service History',
                  value: car.serviceHistory?.records?.length > 0
                    ? `${car.serviceHistory.records.length} Log(s) · Last ${formatReadableDate(car.serviceHistory.lastServiceDate)}`
                    : (isMeaningful(car.serviceHistory?.lastServiceDate) ? `Last ${formatReadableDate(car.serviceHistory.lastServiceDate)}` : ''),
                },
                {
                  label: 'Accident Disclosure',
                  value: isMeaningful(car.accidentHistory?.overallStatus) ? car.accidentHistory.overallStatus : '',
                },
                {
                  label: 'Warranty & Guarantee',
                  value: car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && isMeaningful(car.warrantyPeriod)
                    ? `${car.warrantyPeriod} Included`
                    : '',
                },
                { label: 'Asking Price', value: car.priceInr > 0 ? `${formatINR(car.priceInr)} (${car.priceType})` : '' },
                { label: 'Seller', value: [car.sellerName, car.location].filter((x) => isMeaningful(x)).join(' · ') },
                { label: 'Availability', value: car.status },
              ].filter((row) => isMeaningful(row.value));

              if (summaryRows.length === 0) return null;

              return (
                <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Dossier Recap</p>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
                      Complete Price &amp; Vehicle Summary
                    </h2>
                  </div>

                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/[0.06]">
                        <dt className="text-slate-500 dark:text-zinc-400">{row.label}</dt>
                        <dd className="text-slate-900 dark:text-white font-medium text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              );
            })()}
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
            <div className="mb-6 sm:mb-8">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white whitespace-nowrap">
                Similar Related Vehicles
              </h2>
            </div>

            {/* Desktop UI: EXACTLY SAME (NOT CHANGED) */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-6">
              {similar.slice(0, 3).map((item, idx) => (
                <CarCard key={item.id} car={item} index={idx} />
              ))}
            </div>

            {/* Mobile & Tablet: Horizontal Swipe Slider (Baaju me sarka ke slide) */}
            <div className="lg:hidden">
              <div
                ref={similarScrollRef}
                className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {similar.map((item, idx) => (
                  <div
                    key={item.id}
                    className="w-[84vw] max-w-[340px] shrink-0 snap-start"
                  >
                    <CarCard car={item} index={idx} />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 text-center mt-2">
                ← Swipe sideways to see more vehicles →
              </p>
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
            onClick={() => trackClickCall(car.sellerPhone, `/cars/${car.id}`, `${car.year} ${car.brand} ${car.model}`)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 dark:bg-white/[0.08] border border-slate-200 dark:border-white/[0.1] flex items-center justify-center text-blue-700 dark:text-blue-400"
            aria-label="Call seller"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href={whatsappQuickHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClickWhatsApp(car.sellerWhatsapp || '918384068347', `/cars/${car.id}`, `${car.year} ${car.brand} ${car.model}`)}
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
