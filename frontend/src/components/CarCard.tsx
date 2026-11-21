import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRight, Check, Heart, ShieldCheck } from 'lucide-react';
import type { Car } from '../types/car';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { estimateCarEmiWithConfig, type EmiConfig } from '../utils/emi';
import { formatINR, formatINRCompact, formatKm } from '../utils/format';
import { VehicleImage } from './VehicleImage';

interface CarCardProps {
  car: Car;
  index?: number;
  emiConfig?: Partial<EmiConfig>;
}

export function CarCard({ car, index = 0, emiConfig }: CarCardProps) {
  const isSold = car.status === 'Sold';
  const estimatedEmi = estimateCarEmiWithConfig(car.priceInr, emiConfig);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const saved = isWishlisted(car.id);
  const { cartItems } = useCart();
  const isInCart = cartItems.some((item) => item.carId === car.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-white/[0.16]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-[#18181B] block">
        <Link to={`/cars/${car.id}`} className="block w-full h-full">
          <VehicleImage
            src={car.images[0]}
            alt={`${car.year} ${car.brand} ${car.model}`}
            className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] ${
              isSold ? 'opacity-60 grayscale-[35%]' : ''
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Clean explicit status label over dark photo scrim */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-xs pointer-events-none">
            <span
              className={`font-medium tracking-wide ${
                car.status === 'Sold'
                  ? 'text-rose-300'
                  : car.status === 'Reserved'
                  ? 'text-amber-300'
                  : 'text-white'
              }`}
            >
              {car.status === 'Sold'
                ? 'Status: Sold'
                : car.status === 'Reserved'
                ? 'Status: Reserved'
                : 'Certified Available'}
            </span>
            <span className="text-zinc-200 font-mono tabular-nums">{car.location}</span>
          </div>
        </Link>

        {/* In-Cart Status Badge */}
        {isInCart && (
          <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[11px] font-semibold backdrop-blur-md shadow-md">
            <Check className="w-3 h-3 stroke-[2.5]" />
            <span>In Cart</span>
          </div>
        )}

        {/* Dil (Heart) Like / Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(car.id);
          }}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          title={saved ? 'Liked (Click to unlike)' : 'Like this car (Add to wishlist)'}
          className={`absolute top-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-md ${
            saved
              ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/40 scale-105'
              : 'bg-black/45 hover:bg-black/70 text-white/90 hover:text-white border border-white/20 hover:scale-110'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${saved ? 'scale-110' : ''}`}
            fill={saved ? 'currentColor' : 'none'}
            strokeWidth={saved ? 2 : 2.2}
          />
        </button>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5 sm:gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span className="font-semibold text-blue-700 dark:text-blue-400">{car.brand}</span>
            <span className="truncate">{car.variant}</span>
          </div>

          <Link to={`/cars/${car.id}`} className="block">
            <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {car.year} {car.model}
            </h3>
          </Link>

          {/* Zero-pill unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-zinc-400 tabular-nums">
            <span>{formatKm(car.kilometres)}</span>
            <span aria-hidden="true">·</span>
            <span>{car.fuelType}</span>
            <span aria-hidden="true">·</span>
            <span>{car.transmission}</span>
            <span aria-hidden="true">·</span>
            <span>{car.ownership}</span>
          </div>

          {car.warrantyPeriod && car.warrantyPeriod !== 'No Warranty' && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{car.warrantyPeriod} Warranty Included</span>
            </div>
          )}
        </div>

        <div className="pt-3.5 sm:pt-4 border-t border-slate-200/80 dark:border-white/[0.07] space-y-2.5 sm:space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {formatINR(car.priceInr)}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono tabular-nums text-right">
              {formatINRCompact(car.priceInr)}
              {!isSold && estimatedEmi > 0 && (
                <span> · {formatINR(estimatedEmi)}/mo</span>
              )}
            </p>
          </div>

          <div className="mt-1">
            {isInCart ? (
              <Link
                to={`/cars/${car.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-all py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm shadow-emerald-600/30 whitespace-nowrap"
                title="Enquiry Already Submitted for this Car"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Already In Enquiry</span>
              </Link>
            ) : (
              <Link
                to={`/cars/${car.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white transition-colors py-2.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
