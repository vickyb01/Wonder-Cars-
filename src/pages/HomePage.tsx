import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import type { Car } from '../types/car';
import { fetchCars } from '../utils/api';
import { CarCard } from '../components/CarCard';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';
import { BrandSelectionSection } from '../components/BrandSelectionSection';
import { ContactSection } from '../components/ContactSection';
import { BRAND_CATALOG, toBrandSlug } from '../data/brands';

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

  const [allCars, setAllCars] = useState<Car[]>([]);
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [latestCars, setLatestCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero 3-image auto carousel state
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  // Hero quick search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [fuelType, setFuelType] = useState('All');

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
        const all = await fetchCars({ status: 'Available', sort: 'newest' });
        if (!active) return;
        setAllCars(all);
        setFeaturedCars(all.filter((c) => c.featured).slice(0, 3));
        setLatestCars(all.slice(0, 6));
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

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (selectedBrand !== 'All') params.set('brand', toBrandSlug(selectedBrand));
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (fuelType !== 'All') params.set('fuelType', fuelType);
    navigate(`/cars${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div className="bg-white dark:bg-[#09090B] text-slate-900 dark:text-[#FAFAFA] transition-colors duration-200">
      <SeoHead
        title="Find Your Perfect Drive"
        description="Discover quality pre-owned luxury and performance cars at the right price. Certified 210-point inspected inventory across India."
      />

      {/* 1. Full-Screen Hero Section (dark contrast scrim preserved over photography in both modes) */}
      <section ref={heroRef} className="relative min-h-[92vh] pt-24 pb-12 flex flex-col justify-between overflow-hidden bg-slate-950">
        <motion.div style={{ y: heroImageY }} className="absolute inset-0 z-0 will-change-transform">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === heroSlideIndex;
            return (
              <div
                key={slide.src}
                aria-hidden={!isActive}
                className={`absolute inset-0 transition-all duration-[1200ms] ease-out ${isActive ? 'opacity-100 scale-105' : 'opacity-0 scale-110'
                  }`}
              >
                <VehicleImage
                  src={slide.src}
                  alt={slide.alt}
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
          <div className="max-w-2xl space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-blue-400"
            >
              Curated Pre-Owned Luxury &amp; Performance Galleries
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-tight text-white leading-[1.06] [text-wrap:balance]"
            >
              Used Cars Nearby
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-slate-200 dark:text-zinc-300 leading-relaxed max-w-xl"
            >
              Discover quality pre-owned cars at the right price. Every automobile is forensically inspected, provenance-verified, and backed by transparent INR pricing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/cars"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm transition-all duration-150 active:scale-[0.98] whitespace-nowrap shadow-sm"
              >
                <span>Explore Cars</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-sm transition-all duration-150 active:scale-[0.98] whitespace-nowrap"
              >
                <span>Compare Cars</span>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* 2. Slide Indicators + Advanced Car Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 space-y-3"
        >
          <div className="flex items-center justify-end gap-2 pr-1" role="tablist" aria-label="Hero showcase slides">
            {HERO_SLIDES.map((slide, idx) => {
              const active = idx === heroSlideIndex;
              return (
                <button
                  key={slide.src}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show slide ${idx + 1}`}
                  onClick={() => setHeroSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${active ? 'w-7 bg-blue-500' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                />
              );
            })}
          </div>

          <form
            onSubmit={handleHeroSearch}
            className="bg-white/15 dark:bg-[#121215]/90 backdrop-blur-xl border border-white/25 dark:border-white/[0.1] rounded-xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end shadow-2xl dark:shadow-none"
          >
            <div>
              <label htmlFor="hero-search" className="block text-xs font-medium text-white/85 dark:text-zinc-400 mb-1.5">
                Search Model or City
              </label>
              <input
                id="hero-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. 911, G63, Mumbai"
                className="w-full h-11 px-3.5 rounded-lg bg-white/15 dark:bg-[#09090B]/90 border border-white/25 dark:border-white/[0.1] text-sm text-white placeholder:text-white/65 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white/25 dark:focus:bg-[#09090B] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="hero-brand" className="block text-xs font-medium text-white/85 dark:text-zinc-400 mb-1.5">
                Marque / Brand
              </label>
              <select
                id="hero-brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white/15 dark:bg-[#09090B]/90 border border-white/25 dark:border-white/[0.1] text-sm text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white/25 dark:focus:bg-[#09090B] transition-colors"
              >
                <option value="All" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">All Brands</option>
                {HERO_BRAND_OPTIONS.map((brandName) => (
                  <option key={brandName} value={brandName} className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">
                    {brandName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hero-budget" className="block text-xs font-medium text-white/85 dark:text-zinc-400 mb-1.5">
                Max Budget (INR)
              </label>
              <select
                id="hero-budget"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white/15 dark:bg-[#09090B]/90 border border-white/25 dark:border-white/[0.1] text-sm text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white/25 dark:focus:bg-[#09090B] transition-colors"
              >
                <option value="" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Any Budget</option>
                <option value="15000000" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Up to ₹1.50 Cr</option>
                <option value="20000000" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Up to ₹2.00 Cr</option>
                <option value="30000000" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Up to ₹3.00 Cr</option>
                <option value="40000000" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Up to ₹4.00 Cr</option>
              </select>
            </div>

            <div>
              <label htmlFor="hero-fuel" className="block text-xs font-medium text-white/85 dark:text-zinc-400 mb-1.5">
                Powertrain
              </label>
              <select
                id="hero-fuel"
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg bg-white/15 dark:bg-[#09090B]/90 border border-white/25 dark:border-white/[0.1] text-sm text-white focus:outline-none focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white/25 dark:focus:bg-[#09090B] transition-colors"
              >
                <option value="All" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">All Fuel Types</option>
                <option value="Petrol" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Petrol</option>
                <option value="Diesel" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Diesel</option>
                <option value="Electric" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Electric</option>
                <option value="Hybrid" className="bg-white text-slate-900 dark:bg-[#121215] dark:text-white">Hybrid</option>
              </select>
            </div>

            <button
              type="submit"
              className="h-11 px-5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Search Cars</span>
            </button>
          </form>
        </motion.div>
      </section>

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
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">The Strada Standard</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
                Why Discerning Collectors Choose Strada Motors
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
              {TESTIMONIALS.map((item) => (
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
    </div>
  );
}
