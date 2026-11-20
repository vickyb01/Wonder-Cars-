import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Car, MessageCircle, X } from 'lucide-react';
import { BRAND_CATALOG, matchesBrandFilter, type BrandItem } from '../data/brands';
import type { Car as CarType } from '../types/car';
import { BrandCard } from './BrandCard';
import { BrandLogo } from './BrandLogo';
import { CarCard } from './CarCard';

interface BrandSelectionSectionProps {
  cars?: CarType[];
}

function BrandMarqueeStrip({
  brands,
  direction,
  brandCounts,
  selectedBrandId,
  onSelectBrand,
}: {
  brands: BrandItem[];
  direction: 'ltr' | 'rtl';
  brandCounts: Record<string, number>;
  selectedBrandId?: string;
  onSelectBrand: (brand: BrandItem) => void;
}) {
  const halfTrack = [...brands, ...brands];

  return (
    <div className="brand-marquee-group relative w-full overflow-hidden py-1.5">
      {/* Edge fade masks matching Light/Dark section surface */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-24 bg-gradient-to-r from-slate-50 dark:from-[#0D0D10] to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-24 bg-gradient-to-l from-slate-50 dark:from-[#0D0D10] to-transparent"
      />

      <div
        className={`flex w-max will-change-transform ${
          direction === 'ltr' ? 'animate-brand-ltr' : 'animate-brand-rtl'
        }`}
      >
        <div className="flex shrink-0 items-center gap-3.5 pr-3.5">
          {halfTrack.map((brand, idx) => (
            <BrandCard
              key={`a-${brand.id}-${idx}`}
              brand={brand}
              availableCount={brandCounts[brand.id]}
              isDuplicate={idx >= brands.length}
              isSelected={selectedBrandId === brand.id}
              onSelect={onSelectBrand}
            />
          ))}
        </div>

        <div aria-hidden="true" className="flex shrink-0 items-center gap-3.5 pr-3.5">
          {halfTrack.map((brand, idx) => (
            <BrandCard
              key={`b-${brand.id}-${idx}`}
              brand={brand}
              availableCount={brandCounts[brand.id]}
              isDuplicate
              isSelected={selectedBrandId === brand.id}
              onSelect={onSelectBrand}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandSelectionSection({ cars = [] }: BrandSelectionSectionProps) {
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BRAND_CATALOG.forEach((brand) => {
      counts[brand.id] = cars.filter(
        (car) => car.status !== 'Sold' && matchesBrandFilter(car.brand, brand.slug)
      ).length;
    });
    return counts;
  }, [cars]);

  function handleSelectBrand(brand: BrandItem) {
    if (selectedBrand?.id === brand.id) {
      setSelectedBrand(null);
    } else {
      setSelectedBrand(brand);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  const matchingCars = useMemo(() => {
    if (!selectedBrand) return [];
    return cars.filter(
      (car) => car.status !== 'Sold' && matchesBrandFilter(car.brand, selectedBrand.slug)
    );
  }, [cars, selectedBrand]);

  const mid = Math.ceil(BRAND_CATALOG.length / 2);
  const topStripBrands = BRAND_CATALOG.slice(0, mid);
  const bottomStripBrands = BRAND_CATALOG.slice(mid);

  return (
    <section
      aria-labelledby="brand-selection-heading"
      className="bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-[#FAFAFA] border-t border-slate-200 dark:border-white/[0.06] py-16 sm:py-20 overflow-hidden transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-9">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              Browse by Manufacturer
            </p>
            <h2
              id="brand-selection-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight"
            >
              Explore Popular Car Brands
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Click any logo to view matching certified cars immediately.
          </p>
        </div>
      </div>

      {/* 2 Compact Continuous Horizontal Brand Strips */}
      <div className="max-w-[1440px] mx-auto space-y-3.5">
        <BrandMarqueeStrip
          brands={topStripBrands}
          direction="ltr"
          brandCounts={brandCounts}
          selectedBrandId={selectedBrand?.id}
          onSelectBrand={handleSelectBrand}
        />
        <BrandMarqueeStrip
          brands={bottomStripBrands}
          direction="rtl"
          brandCounts={brandCounts}
          selectedBrandId={selectedBrand?.id}
          onSelectBrand={handleSelectBrand}
        />
      </div>

      {/* Dynamic Brand Cars Showcase when a Brand Logo is Clicked */}
      <div ref={resultsRef}>
        <AnimatePresence>
          {selectedBrand && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto px-5 sm:px-8 mt-10 pt-10 border-t border-slate-200 dark:border-white/[0.08]"
            >
              {/* Selected Brand Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121215] border border-amber-500/30 dark:border-amber-500/20 shadow-sm mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.1] p-2.5 flex items-center justify-center shadow-xs shrink-0">
                    <BrandLogo brandId={selectedBrand.id} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedBrand.name} Collection
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          matchingCars.length > 0
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {matchingCars.length} {matchingCars.length === 1 ? 'Car' : 'Cars'} Available
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                      Origin: {selectedBrand.country} · Forensic 210-point certified inventory
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <Link
                    to={`/cars?brand=${selectedBrand.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-xs"
                  >
                    <span>View All in Inventory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setSelectedBrand(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
                    title="Close brand view"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Cars Grid for Selected Brand */}
              {matchingCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {matchingCars.map((car, idx) => (
                    <CarCard key={car.id} car={car} index={idx} />
                  ))}
                </div>
              ) : (
                /* Empty state when 0 cars in stock for selected brand */
                <div className="p-8 sm:p-14 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                    <Car className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      No {selectedBrand.name} Cars Currently in Showroom
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
                      Wonder Cars inspects fewer than 10% of vehicles offered. Currently no {selectedBrand.name} is in our Preet Vihar gallery, but our sourcing team can procure a certified one on demand.
                    </p>
                  </div>

                  <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={`https://wa.me/918384068347?text=${encodeURIComponent(
                        `Hello Wonder Cars, I am interested in purchasing a certified pre-owned ${selectedBrand.name}. Please notify me when available.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Request {selectedBrand.name} on WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedBrand(null)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Browse Other Brands</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
