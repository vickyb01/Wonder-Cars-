import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { ArrowRight, Search, ShieldCheck, X, Sparkles, Car, ChevronRight } from 'lucide-react';
import type { Car as CarType, HomepageSettings, TestimonialItem } from '../types/car';
import { fetchCars, fetchHomepageSettings, fetchTestimonials } from '../utils/api';
import { CarCard } from '../components/CarCard';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';
import { BrandSelectionSection } from '../components/BrandSelectionSection';
import { ContactSection } from '../components/ContactSection';
import { BRAND_CATALOG, toBrandSlug, matchesBrandFilter } from '../data/brands';
import { formatINRCompact, formatKm } from '../utils/format';

const HERO_SLIDES = [
  {
    src: '/src/assets/images/hero_luxury_coupe_1794898128860.jpg',
    alt: 'Luxury satin charcoal grand tourer inside Strada Motors showroom',
  },
  {
    src: '/src/assets/images/car_porsche_911_1794898129646.jpg',
    alt: 'Porsche 911 Carrera S in architectural showroom lighting',
  },
  {
    src: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
    alt: 'Audi RS e-tron GT inside Strada Motors flagship gallery',
  },
];

const HERO_BRAND_OPTIONS = Array.from(
  new Set([
    ...BRAND_CATALOG.map((b) => b.name),
    'Porsche',
    'Range Rover',
    'Aston Martin',
  ])
);

const WHY_CHOOSE_PILLARS = [
  {
    index: '01',
    title: '210-Point Forensic Inspection',
    description:
      'Every vehicle undergoes mechanical diagnostics, paint thickness metering across every panel, and chassis geometry verification prior to listing.',
  },
  {
    index: '02',
    title: '6 Months to 2 Years Guarantee',
    description:
      'Every certified vehicle includes comprehensive warranty protection—available in 6 Months, 1 Year, and 2 Years plans covering engine, gearbox, and electronics.',
  },
  {
    index: '03',
    title: 'Transparent INR Pricing',
    description:
      'Upfront pricing with zero hidden dealership surcharges, assisted RC transfer across states, and tailored luxury auto finance options.',
  },
  {
    index: '04',
    title: 'Enclosed Pan-India Delivery',
    description:
      'Private doorstep test drives in Mumbai, Delhi NCR, and Bengaluru, plus insured flatbed enclosed transport to any city in India.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Acquired a 2022 Porsche 911 Carrera S from the Worli gallery. Paint meter readings and Porsche Centre service records were shared upfront before I even flew in from Ahmedabad.',
    name: 'Aarav Mehta',
    role: 'Managing Director, Mehta Precision Forgings · Ahmedabad',
  },
  {
    quote:
      'Strada handled both the valuation of my Range Rover Sport and my upgrade to an AMG G63 within five business days, including seamless state RC transfer.',
    name: 'Neha Singhania',
    role: 'Principal Architect, Studio N+S · New Delhi',
  },
  {
    quote:
      'No pushy brokers, zero inflated listing prices. The RS e-tron GT arrived in Bengaluru in enclosed transport looking genuinely factory-fresh.',
    name: 'Karthik Subramanian',
    role: 'Founder, Veloce Cloud Systems · Bengaluru',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);

  const [allCars, setAllCars] = useState<CarType[]>([]);
  const [featuredCars, setFeaturedCars] = useState<CarType[]>([]);
  const [latestCars, setLatestCars] = useState<CarType[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);
  const [dynamicTestimonials, setDynamicTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero 3-image auto carousel state
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  // Hero quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [fuelType, setFuelType] = useState('All');

  // Interactive Live Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const modalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => modalInputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Real-time matching cars for search modal
  const modalMatchingCars = allCars.filter((car) => {
    if (selectedTag !== 'All') {
      if (selectedTag === 'Electric') {
        if (car.fuelType !== 'Electric') return false;
      } else if (selectedTag === 'Diesel') {
        if (car.fuelType !== 'Diesel') return false;
      } else if (selectedTag === 'Petrol') {
        if (car.fuelType !== 'Petrol') return false;
      } else if (selectedTag === 'Under ₹50 Lakh') {
        if (car.priceInr > 5000000) return false;
      } else if (selectedTag === 'Under ₹2 Cr') {
        if (car.priceInr > 20000000) return false;
      } else {
        if (!car.brand.toLowerCase().includes(selectedTag.toLowerCase())) return false;
      }
    }

    if (!modalSearchQuery.trim()) return true;

    const q = modalSearchQuery.toLowerCase().trim();
    const fullName = `${car.year} ${car.brand} ${car.model} ${car.variant || ''}`.toLowerCase();
    const brand = car.brand.toLowerCase();
    const model = car.model.toLowerCase();
    const variant = (car.variant || '').toLowerCase();
    const location = (car.location || '').toLowerCase();
    const fuel = (car.fuelType || '').toLowerCase();
    const transmission = (car.transmission || '').toLowerCase();
    const listingCode = (car.listingCode || '').toLowerCase();

    return (
      fullName.includes(q) ||
      brand.includes(q) ||
      model.includes(q) ||
      variant.includes(q) ||
      location.includes(q) ||
      fuel.includes(q) ||
      transmission.includes(q) ||
      listingCode.includes(q)
    );
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [heroSlideIndex]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [all, homeSet, tests] = await Promise.all([
          fetchCars({ status: 'Available', sort: 'newest' }).catch(() => []),
          fetchHomepageSettings().catch(() => null),
          fetchTestimonials().catch(() => []),
        ]);
        if (!active) return;
        setAllCars(all);
        setFeaturedCars(all.filter((c) => c.featured).slice(0, 3));
        setLatestCars(all.slice(0, 6));
        if (homeSet) setHomepageSettings(homeSet);
        if (tests && tests.length > 0) setDynamicTestimonials(tests);
      } catch {
        // Keep empty gracefully
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  function handleHeroSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();

    // If user selected hero dropdown options, pre-fill modal filter
    if (selectedBrand !== 'All') {
      setSelectedTag(selectedBrand);
      setModalSearchQuery(selectedBrand);
    } else if (fuelType !== 'All') {
      setSelectedTag(fuelType);
      setModalSearchQuery(fuelType);
    } else {
      setSelectedTag('All');
      setModalSearchQuery('');
    }

    setIsSearchOpen(true);
  }

  const heroSlides =
    homepageSettings?.heroSlides && homepageSettings.heroSlides.length > 0
      ? homepageSettings.heroSlides
      : HERO_SLIDES;

  // Comprehensive brand options combining admin settings, current inventory brands, and catalog
  const brandOptionsList = useMemo<string[]>(() => {
    const configured = homepageSettings?.brandOptions && homepageSettings.brandOptions.length > 0
      ? homepageSettings.brandOptions
      : [];
    const fromInventory = allCars.map((c) => c.brand).filter(Boolean);
    const catalogBrands = BRAND_CATALOG.map((b) => b.name);
    return Array.from(new Set([...configured, ...fromInventory, ...catalogBrands])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [homepageSettings?.brandOptions, allCars]);

  const budgetOptions =
    homepageSettings?.budgetOptions && homepageSettings.budgetOptions.length > 0
      ? homepageSettings.budgetOptions
      : [
          { label: 'Up to ₹25 Lakh', value: '2500000' },
          { label: 'Up to ₹50 Lakh', value: '5000000' },
          { label: 'Up to ₹75 Lakh', value: '7500000' },
          { label: 'Up to ₹1.00 Cr', value: '10000000' },
          { label: 'Up to ₹1.50 Cr', value: '15000000' },
          { label: 'Up to ₹2.00 Cr', value: '20000000' },
          { label: 'Up to ₹3.00 Cr', value: '30000000' },
          { label: 'Up to ₹4.00 Cr', value: '40000000' },
        ];

  const fuelOptions =
    homepageSettings?.fuelOptions && homepageSettings.fuelOptions.length > 0
      ? homepageSettings.fuelOptions
      : ['Petrol', 'Diesel', 'Electric', 'Hybrid'];

  // Check if any hero search filter is active
  const isFiltered = selectedBrand !== 'All' || Boolean(maxPrice) || fuelType !== 'All';

  // Real-time matching cars based on the 3 hero search controls
  const heroFilteredCars = useMemo<CarType[]>(() => {
    if (!isFiltered) return allCars;
    return allCars.filter((car) => {
      // 1. Marque / Brand match
      if (selectedBrand !== 'All' && !matchesBrandFilter(car.brand, selectedBrand)) {
        return false;
      }
      // 2. Max Budget match
      if (maxPrice && Number(maxPrice) > 0 && car.priceInr > Number(maxPrice)) {
        return false;
      }
      // 3. Powertrain / Fuel match
      if (fuelType !== 'All' && car.fuelType.toLowerCase() !== fuelType.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allCars, isFiltered, selectedBrand, maxPrice, fuelType]);

  return (
    <div className="bg-white dark:bg-[#09090B] text-slate-900 dark:text-[#FAFAFA] transition-colors duration-200">
      <SeoHead
        title="Find Your Perfect Drive"
        description="Discover quality pre-owned luxury and performance cars at the right price. Certified 210-point inspected inventory across India."
      />

      {/* 1. Full-Screen Hero Section (dark contrast scrim preserved over photography in both modes) */}
      <section ref={heroRef} className="relative min-h-[92vh] pt-24 pb-4 sm:pb-5 flex flex-col justify-between overflow-hidden bg-slate-950">
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 z-0 will-change-transform">
          {heroSlides.map((slide, idx) => {
            const isActive = idx === heroSlideIndex;
            return (
              <div
                key={slide.src || idx}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-all duration-[1200ms] ease-out ${
                  isActive ? 'opacity-100 scale-105' : 'opacity-0 scale-110'
                }`}
              >
                <VehicleImage
                  src={slide.src}
                  alt={slide.alt || 'Luxury automobile in Wonder Cars showroom'}
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            );
          })}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/30 dark:from-[#09090B] dark:via-[#09090B]/75 dark:to-[#09090B]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/50 dark:from-[#09090B] dark:via-transparent dark:to-[#09090B]/50" />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 my-auto pt-8 pb-10">
          <div className="max-w-xl space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] bg-gradient-to-r from-[#FFF176] via-[#FFB300] to-[#FF7043] bg-clip-text text-transparent"
            >
              {homepageSettings?.heroHeading || 'Used Cars Nearby'}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2 max-w-lg"
            >
              <p className="text-base sm:text-lg font-semibold text-amber-400 dark:text-amber-300 tracking-normal">
                {homepageSettings?.heroSubheadline
                  ? homepageSettings.heroSubheadline.startsWith('—')
                    ? homepageSettings.heroSubheadline
                    : `— ${homepageSettings.heroSubheadline}`
                  : '— Delhi-NCR’s Most Trusted Pre-Owned Car Destination!'}
              </p>

              <p className="text-sm sm:text-base text-slate-200 dark:text-zinc-300 leading-relaxed">
                {homepageSettings?.heroTagline ||
                  'Looking for a reliable car in top-notch condition? Every vehicle is 100% certified, professionally detailed, and backed by a 6-month warranty for complete peace of mind.'}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-row items-center gap-3 pt-2"
            >
              <Link
                to={homepageSettings?.ctaExploreLink || '/cars'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold text-sm transition-all duration-150 active:scale-[0.98] whitespace-nowrap shadow-md shadow-amber-600/25"
              >
                <span>{homepageSettings?.ctaExploreText || 'Explore Cars'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* 2. Slide Indicators + Advanced Car Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 space-y-2.5 translate-y-2 sm:translate-y-4"
        >
          <div className="flex items-center justify-end gap-2 pr-1" role="tablist" aria-label="Hero showcase slides">
            {heroSlides.map((slide, idx) => {
              const active = idx === heroSlideIndex;
              return (
                <button
                  key={slide.src || idx}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show slide ${idx + 1}`}
                  onClick={() => setHeroSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    active ? 'w-7 bg-amber-400 shadow-xs shadow-amber-400/50' : 'w-2.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>

          <form
            onSubmit={handleHeroSearch}
            className="bg-black/30 dark:bg-black/35 backdrop-blur-2xl border border-white/20 dark:border-white/15 rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] ring-1 ring-white/10"
          >
            <div>
              <label htmlFor="hero-brand" className="block text-xs font-semibold text-zinc-200 mb-1.5 drop-shadow-xs">
                {homepageSettings?.brandLabel || 'Marque / Brand'}
              </label>
              <select
                id="hero-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white/10 dark:bg-white/[0.08] hover:bg-white/15 dark:hover:bg-white/[0.12] focus:bg-white/20 dark:focus:bg-white/[0.15] backdrop-blur-md border border-white/20 dark:border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23E5E7EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_14px_center] bg-no-repeat pr-8 cursor-pointer"
              >
                <option value="All" className="bg-[#121215] text-white">
                  {homepageSettings?.brandDefaultText || 'All Brands'}
                </option>
                {brandOptionsList.map((brandName: string) => (
                  <option key={brandName} value={brandName} className="bg-[#121215] text-white">
                    {brandName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hero-budget" className="block text-xs font-semibold text-zinc-200 mb-1.5 drop-shadow-xs">
                {homepageSettings?.budgetLabel || 'Max Budget (INR)'}
              </label>
              <select
                id="hero-budget"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white/10 dark:bg-white/[0.08] hover:bg-white/15 dark:hover:bg-white/[0.12] focus:bg-white/20 dark:focus:bg-white/[0.15] backdrop-blur-md border border-white/20 dark:border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23E5E7EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_14px_center] bg-no-repeat pr-8 cursor-pointer"
              >
                <option value="" className="bg-[#121215] text-white">
                  {homepageSettings?.budgetDefaultText || 'Any Budget'}
                </option>
                {budgetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#121215] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hero-fuel" className="block text-xs font-semibold text-zinc-200 mb-1.5 drop-shadow-xs">
                {homepageSettings?.fuelLabel || 'Powertrain'}
              </label>
              <select
                id="hero-fuel"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-white/10 dark:bg-white/[0.08] hover:bg-white/15 dark:hover:bg-white/[0.12] focus:bg-white/20 dark:focus:bg-white/[0.15] backdrop-blur-md border border-white/20 dark:border-white/15 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23E5E7EB%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_14px_center] bg-no-repeat pr-8 cursor-pointer"
              >
                <option value="All" className="bg-[#121215] text-white">
                  {homepageSettings?.fuelDefaultText || 'All Fuel Types'}
                </option>
                {fuelOptions.map((fuel) => (
                  <option key={fuel} value={fuel} className="bg-[#121215] text-white">
                    {fuel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleHeroSearch}
              className="w-full h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-600/30"
            >
              <Search className="w-4 h-4" />
              <span>{homepageSettings?.searchButtonText || 'Search Cars'}</span>
            </button>
          </form>
        </motion.div>
      </section>

      {/* Real-time Hero Filtered Results on Homepage */}
      {isFiltered && (
        <section id="hero-filtered-results" className="max-w-7xl mx-auto px-5 sm:px-8 py-12 border-b border-slate-200 dark:border-white/[0.06] bg-amber-500/[0.03]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Live Search Results
                </p>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Matching Cars ({heroFilteredCars.length})
              </h2>
            </div>

            {/* Active Filters Pill Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedBrand !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 text-xs font-medium">
                  Brand: <strong className="font-semibold">{selectedBrand}</strong>
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('All')}
                    className="hover:text-amber-950 dark:hover:text-white cursor-pointer ml-0.5"
                    title="Remove Brand filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {Boolean(maxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 text-xs font-medium">
                  Budget: <strong className="font-semibold">{budgetOptions.find((b) => b.value === maxPrice)?.label || `Up to ₹${Number(maxPrice).toLocaleString('en-IN')}`}</strong>
                  <button
                    type="button"
                    onClick={() => setMaxPrice('')}
                    className="hover:text-amber-950 dark:hover:text-white cursor-pointer ml-0.5"
                    title="Remove Budget filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {fuelType !== 'All' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 text-xs font-medium">
                  Powertrain: <strong className="font-semibold">{fuelType}</strong>
                  <button
                    type="button"
                    onClick={() => setFuelType('All')}
                    className="hover:text-amber-950 dark:hover:text-white cursor-pointer ml-0.5"
                    title="Remove Fuel filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('All');
                  setMaxPrice('');
                  setFuelType('All');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 underline cursor-pointer ml-1"
              >
                Clear All
              </button>
            </div>
          </div>

          {heroFilteredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroFilteredCars.map((car: CarType, index: number) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#121215]">
              <Car className="w-10 h-10 text-slate-400 dark:text-zinc-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                No vehicles found matching these filters
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mb-4">
                Try loosening your filters or resetting to view all available cars in inventory.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('All');
                  setMaxPrice('');
                  setFuelType('All');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </section>
      )}

      {/* 3. Featured Collection */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 border-t border-slate-200 dark:border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Featured Portfolio</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Hand-Picked Collector Automobiles
            </h2>
          </div>
          <Link
            to="/cars"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            <span>View All Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((skeleton) => (
              <div key={skeleton} className="bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Interactive Car Brand Selection Section */}
      <BrandSelectionSection cars={allCars} />

      {/* 5. Latest Arrivals */}
      <section className="bg-slate-50 dark:bg-[#0D0D10] border-b border-slate-200 dark:border-white/[0.06] py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">Freshly Inspected</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Latest Arrivals
              </h2>
            </div>
            <Link
              to="/cars?sort=newest"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
            >
              <span>See Latest Listings</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestCars.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Us + Adjacent Verified Testimonials */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">The Wonder Cars Standard</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                Why Discerning Collectors Choose Wonder Cars
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {WHY_CHOOSE_PILLARS.map((pillar) => (
                <div
                  key={pillar.index}
                  className="p-6 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] space-y-3"
                >
                  <span className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    {pillar.index}.
                  </span>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Adjacent Client Proof / Testimonials */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Verified Client Acquisitions</span>
            </div>

            <div className="space-y-4">
              {(dynamicTestimonials.length > 0
                ? dynamicTestimonials.slice(0, 3).map((item) => ({
                    quote: item.review,
                    name: item.customerName || item.name || 'Verified Customer',
                    role: `${item.carPurchased} • ${item.city}`,
                  }))
                : TESTIMONIALS
              ).map((item) => (
                <blockquote
                  key={item.name}
                  className="p-6 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-4"
                >
                  <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                  <footer className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Full Contact & Showroom Location Section */}
      <ContactSection />

      {/* ─────────────────────────────────────────────────────────────
          FULL INTERACTIVE CAR SEARCH MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-4 sm:pt-16 md:pt-20 px-2.5 sm:px-4"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: -10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -10, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Search Input & Prominent Wrong/Close Button */}
              <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02]">
                <Search className="w-5 h-5 text-amber-500 shrink-0" />
                <input
                  ref={modalInputRef}
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsSearchOpen(false);
                      setSearchQuery(modalSearchQuery);
                      navigate(`/cars${modalSearchQuery.trim() ? `?search=${encodeURIComponent(modalSearchQuery.trim())}` : ''}`);
                    }
                  }}
                  placeholder="Search car name, model, brand (e.g. Scorpio, Mahindra, Diesel, Porsche)..."
                  className="w-full text-base sm:text-lg bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none font-medium"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    title="Clear text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {/* Prominent Cross / Wrong Close Button */}
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-red-500 hover:text-white dark:bg-white/10 dark:hover:bg-red-500 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-all cursor-pointer border border-slate-200 dark:border-white/10 shrink-0 shadow-xs group"
                  title="Close Search (Esc)"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
                </button>
              </div>

              {/* Popular Tags / Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 px-4 sm:px-6 bg-slate-100/60 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06] text-xs shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Popular:</span>
                </span>
                {['All', 'Mahindra', 'Diesel', 'Audi', 'BMW', 'Mercedes-Benz', 'Porsche', 'Range Rover', 'Electric', 'Under ₹50 Lakh', 'Under ₹2 Cr'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSelectedTag(tag);
                      if (tag !== 'All' && tag !== 'Electric' && tag !== 'Diesel' && tag !== 'Under ₹50 Lakh' && tag !== 'Under ₹2 Cr') {
                        setModalSearchQuery(tag);
                      } else {
                        setModalSearchQuery('');
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.08]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Matching Cars List */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[62vh] flex-1">
                <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-zinc-400 mb-1">
                  <span>
                    {modalSearchQuery.trim()
                      ? `Results for "${modalSearchQuery}"`
                      : 'Available Showroom Inventory'}
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {modalMatchingCars.length} {modalMatchingCars.length === 1 ? 'Car' : 'Cars'} Available
                  </span>
                </div>

                {modalMatchingCars.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Car className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                        No cars found matching "{modalSearchQuery}"
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Try searching by brand (e.g. Mahindra, BMW, Porsche) or explore all showroom cars.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate('/cars');
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Browse All Inventory</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  modalMatchingCars.map((car) => (
                    <div
                      key={car.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery(`${car.brand} ${car.model}`);
                        navigate(`/cars/${car.id}`);
                      }}
                      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-white dark:bg-[#18181b]/60 hover:bg-amber-50/70 dark:hover:bg-amber-500/10 border border-slate-200/80 dark:border-white/[0.06] hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all cursor-pointer gap-3 sm:gap-5"
                    >
                      {/* Car Thumbnail */}
                      <div className="w-20 h-14 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-black border border-slate-200 dark:border-white/[0.08]">
                        <VehicleImage
                          src={car.images?.[0]}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                        />
                      </div>

                      {/* Title & Specs */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-base sm:text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                            {car.year} {car.brand} {car.model}
                          </h4>
                          {car.variant && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 font-medium">
                              {car.variant}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-medium">
                            {car.fuelType}
                          </span>
                          <span>{car.transmission}</span>
                          <span>•</span>
                          <span>{formatKm(car.kilometres)}</span>
                          <span>•</span>
                          <span>{car.location || 'Delhi NCR'}</span>
                        </div>
                      </div>

                      {/* Price & Action */}
                      <div className="text-right shrink-0">
                        <p className="font-display font-extrabold text-amber-600 dark:text-amber-400 text-base sm:text-xl">
                          {formatINRCompact(car.priceInr)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors mt-0.5">
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
                <span className="hidden sm:inline">
                  Tip: Type model or brand name & press Enter • Esc to close
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Close (बंद करें)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery(modalSearchQuery);
                      navigate(`/cars${modalSearchQuery.trim() ? `?search=${encodeURIComponent(modalSearchQuery.trim())}` : ''}`);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <span>View All Results in Cars Inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
