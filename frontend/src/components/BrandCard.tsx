import type { BrandItem } from '../data/brands';
import { BrandLogo } from './BrandLogo';

interface BrandCardProps {
  brand: BrandItem;
  availableCount?: number;
  isDuplicate?: boolean;
  isSelected?: boolean;
  onSelect?: (brand: BrandItem) => void;
}

export function BrandCard({
  brand,
  availableCount,
  isDuplicate = false,
  isSelected = false,
  onSelect,
}: BrandCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(brand)}
      tabIndex={isDuplicate ? -1 : undefined}
      aria-label={`Select ${brand.name} cars`}
      className={`group relative shrink-0 flex flex-col items-center justify-center w-[144px] sm:w-[162px] h-[88px] sm:h-[96px] px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer select-none text-center ${
        isSelected
          ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/50 shadow-md shadow-amber-500/20 dark:bg-amber-500/20 dark:border-amber-400'
          : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none hover:border-amber-500 dark:hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-[#18181C] hover:shadow-md'
      }`}
    >
      {/* Subtle inner spotlight on hover / active */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-200 ${
          isSelected
            ? 'opacity-100 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.18),transparent_72%)]'
            : 'opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_40%,rgba(245,158,11,0.08),transparent_72%)]'
        }`}
      />

      {typeof availableCount === 'number' && availableCount > 0 && (
        <span
          title={`${availableCount} available`}
          className={`absolute top-2.5 right-2.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full font-mono text-[10px] font-bold tabular-nums transition-colors ${
            isSelected
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
          }`}
        >
          {availableCount}
        </span>
      )}

      <div className="relative z-10 flex items-center justify-center h-9 w-full transition-transform duration-200 ease-out group-hover:scale-110">
        <BrandLogo brandId={brand.id} />
      </div>

      <span
        className={`relative z-10 mt-1.5 font-display text-xs font-semibold tracking-tight transition-colors whitespace-nowrap ${
          isSelected
            ? 'text-amber-700 dark:text-amber-300 font-bold'
            : 'text-slate-700 dark:text-zinc-300 group-hover:text-slate-950 dark:group-hover:text-white'
        }`}
      >
        {brand.name}
      </span>
    </button>
  );
}
