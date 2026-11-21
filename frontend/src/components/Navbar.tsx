import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart, Menu, Scale, ShoppingCart, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { compareCount } = useCompare();
  const { wishlistCount } = useWishlist();
  const { cartCount, openCart } = useCart();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileOpen
          ? 'bg-white/95 dark:bg-[#09090B]/92 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none'
          : 'bg-white/90 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-slate-200/70 dark:border-white/[0.06]'
      }`}
    >
      {/* Top Ambient Amber Backlight / Luxury Warm Glow (Matches Reference Screenshot) */}
      <div
        className="absolute inset-x-0 top-0 h-10 sm:h-12 pointer-events-none bg-gradient-to-b from-amber-500/22 via-amber-600/10 to-transparent dark:from-amber-500/25 dark:via-amber-600/10 dark:to-transparent z-0"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 md:h-[72px] flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 relative z-10">
        {/* Zone 1: Wonder Cars Brand Logo */}
        <Link
          to="/"
          className="flex items-center shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg py-1 select-none"
          aria-label="Wonder Cars Home"
        >
          {/* Light Theme Logo */}
          <img
            src="/assets/wonder-cars-logo.png"
            alt="Wonder Cars"
            className="h-8 xs:h-9 sm:h-11 md:h-12 w-auto max-w-[125px] xs:max-w-[160px] sm:max-w-none object-contain dark:hidden transition-transform duration-300 group-hover:scale-105"
            loading="eager"
          />
          {/* Dark Theme Logo */}
          <img
            src="/assets/wonder-cars-logo-dark.png"
            alt="Wonder Cars"
            className="h-8 xs:h-9 sm:h-11 md:h-12 w-auto max-w-[125px] xs:max-w-[160px] sm:max-w-none object-contain hidden dark:block transition-transform duration-300 group-hover:scale-105"
            loading="eager"
          />
        </Link>

        {/* Zone 2: Rounded Transparent Blurred Floating Navigation Capsule */}
        <nav
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100/60 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.1] shadow-xs select-none"
          aria-label="Primary navigation"
        >
          {/* 1. Inventory */}
          <NavLink
            to="/cars"
            className={({ isActive }) =>
              `relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
              }`
            }
          >
            Inventory
          </NavLink>

          {/* 2. About */}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
              }`
            }
          >
            About
          </NavLink>

          {/* 3. Compare */}
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 tabular-nums transition-all duration-200 inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                  : compareCount > 0
                  ? 'text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
              }`
            }
          >
            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare ({compareCount})</span>
          </NavLink>

          {/* 4. Saved */}
          <NavLink
            to="/cars?saved=true"
            className={({ isActive }) =>
              `relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 tabular-nums transition-all duration-200 inline-flex items-center gap-1.5 ${
                location.search.includes('saved=true')
                  ? 'bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                  : wishlistCount > 0
                  ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
              }`
            }
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                wishlistCount > 0 || location.search.includes('saved=true')
                  ? 'fill-rose-500 text-rose-500'
                  : ''
              }`}
              aria-hidden="true"
            />
            <span>Saved ({wishlistCount})</span>
          </NavLink>

          {/* 5. Contact */}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.05]'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: Compare + Cart CTA + Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/compare"
            className={`hidden xs:inline-flex lg:hidden items-center gap-1.5 px-2.5 xs:px-3 py-2 rounded-lg text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors ${
              compareCount > 0
                ? 'bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare ({compareCount})</span>
          </Link>

          {/* Cart Icon Button (Replaces Explore Cars CTA) */}
          <button
            type="button"
            onClick={openCart}
            aria-label={`Enquiry Cart: ${cartCount} items`}
            className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm transition-all duration-150 whitespace-nowrap shrink-0 shadow-xs shadow-amber-600/25 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <div className="relative flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -top-2.5 -right-3 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-amber-600 shadow-sm animate-pulse">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden md:inline font-bold">Cart</span>
            {cartCount > 0 && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-black/25 text-white text-[11px] font-bold rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 xs:w-10 xs:h-10 rounded-lg text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer shrink-0"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-white/98 dark:bg-[#09090B]/96 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] px-4 xs:px-5 pb-6 pt-3 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/cars"
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                Inventory
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                Contact
              </NavLink>
              <NavLink
                to="/compare"
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium tabular-nums flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <span>Compare Cars</span>
                <span className="text-sm font-mono text-blue-700 dark:text-blue-400">({compareCount})</span>
              </NavLink>
              <NavLink
                to="/cars?saved=true"
                className={() =>
                  `px-3 py-3 rounded-lg text-base font-medium tabular-nums flex items-center justify-between transition-colors ${
                    location.search.includes('saved=true')
                      ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-semibold'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <span className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>Saved Cars</span>
                </span>
                <span className="text-sm font-mono text-rose-600 dark:text-rose-400">({wishlistCount})</span>
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  openCart();
                }}
                className="mt-3 flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-semibold text-sm transition-all shadow-xs shadow-amber-600/25 cursor-pointer"
              >
                <div className="relative flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 min-w-[16px] h-[16px] px-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span>View Enquiry Cart ({cartCount})</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
