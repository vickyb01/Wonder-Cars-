import { useMemo } from 'react';
import { BRAND_CATALOG, matchesBrandFilter, type BrandItem } from '../data/brands';
import type { Car } from '../types/car';
import { BrandCard } from './BrandCard';

interface BrandSelectionSectionProps {
  cars?: Car[];
}

function BrandMarqueeStrip({
  brands,
  direction,
  brandCounts,
}: {
  brands: BrandItem[];
  direction: 'ltr' | 'rtl';
  brandCounts: Record<string, number>;
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandSelectionSection({ cars = [] }: BrandSelectionSectionProps) {
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    BRAND_CATALOG.forEach((brand) => {
      counts[brand.id] = cars.filter(
        (car) => car.status !== 'Sold' && matchesBrandFilter(car.brand, brand.slug)
      ).length;
    });
    return counts;
  }, [cars]);

  const topStripBrands = BRAND_CATALOG.slice(0, 8);
  const bottomStripBrands = BRAND_CATALOG.slice(8, 16);

  return (
    <section
      aria-labelledby="brand-selection-heading"
      className="bg-slate-50 dark:bg-[#0D0D10] text-slate-900 dark:text-[#FAFAFA] border-t border-slate-200 dark:border-white/[0.06] py-16 sm:py-20 overflow-hidden transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-9">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
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
            Select any marque to filter matching vehicles instantly.
          </p>
        </div>
      </div>

      {/* 2 Compact Continuous Horizontal Brand Strips */}
      <div className="max-w-[1440px] mx-auto space-y-3.5">
        <BrandMarqueeStrip
          brands={topStripBrands}
          direction="ltr"
          brandCounts={brandCounts}
        />
        <BrandMarqueeStrip
          brands={bottomStripBrands}
          direction="rtl"
          brandCounts={brandCounts}
        />
      </div>
    </section>
  );
}
