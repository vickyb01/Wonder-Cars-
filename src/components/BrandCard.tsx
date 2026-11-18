import { Link } from 'react-router-dom';
import type { BrandItem } from '../data/brands';
import { BrandLogo } from './BrandLogo';

interface BrandCardProps {
  brand: BrandItem;
  availableCount?: number;
  isDuplicate?: boolean;
}

export function BrandCard({ brand, availableCount, isDuplicate = false }: BrandCardProps) {
  return (
    <Link
      to={`/cars?brand=${brand.slug}`}
      tabIndex={isDuplicate ? -1 : undefined}
      aria-label={`Browse ${brand.name} cars`}
      className="group relative shrink-0 flex flex-col items-center justify-center w-[144px] sm:w-[162px] h-[88px] sm:h-[96px] px-3.5 py-3 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none transition-all duration-200 hover:border-blue-600 dark:hover:border-blue-500/70 hover:bg-blue-50/40 dark:hover:bg-[#18181C] hover:shadow-[0_12px_28px_-12px_rgba(29,78,216,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      {/* Subtle inner spotlight on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[radial-gradient(circle_at_50%_40%,rgba(29,78,216,0.08),transparent_72%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.12),transparent_72%)]"
      />

      {typeof availableCount === 'number' && availableCount > 0 && (
        <span
          title={`${availableCount} available`}
          className="absolute top-2.5 right-2.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 font-mono text-[10px] font-bold tabular-nums"
        >
          {availableCount}
        </span>
      )}

      <div className="relative z-10 flex items-center justify-center h-9 w-full transition-transform duration-200 ease-out group-hover:scale-110">
        <BrandLogo brandId={brand.id} />
      </div>

      <span className="relative z-10 mt-1.5 font-display text-xs font-semibold text-slate-700 dark:text-zinc-300 group-hover:text-slate-950 dark:group-hover:text-white tracking-tight transition-colors whitespace-nowrap">
        {brand.name}
      </span>
    </Link>
  );
}
