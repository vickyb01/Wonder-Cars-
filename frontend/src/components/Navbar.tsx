import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled
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

        {/* Mobile inline nav (single-row layout) */}
        <nav className="lg:hidden flex items-center justify-center gap-2 xs:gap-3 flex-1 min-w-0" aria-label="Mobile navigation">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `px-2 xs:px-2.5 py-1.5 rounded-lg text-[13px] xs:text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            About
          </NavLink>
          <Link
            to="/cars?saved=true"
            className={`px-2 xs:px-2.5 py-1.5 rounded-lg text-[13px] xs:text-sm font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1 ${
              location.pathname === '/cars' && location.search.includes('saved=true')
                ? 'bg-slate-100 dark:bg-white/[0.08] text-rose-600 dark:text-rose-400'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
            <span>Like</span>
          </Link>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `px-2 xs:px-2.5 py-1.5 rounded-lg text-[13px] xs:text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                  : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>

        {/* Zone 2: Rounded Transparent Blurred Floating Navigation Capsule */}
        <nav
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100/60 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.1] shadow-xs select-none"
          aria-label="Primary navigation"
        >
          {/* 1. About */}
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

          {/* 2. Like */}
          <Link
            to="/cars?saved=true"
            className={`relative px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 inline-flex items-center gap-1.5 ${
              location.pathname === '/cars' && location.search.includes('saved=true')
                ? 'bg-white dark:bg-white/10 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/60 dark:border-white/[0.08]'
                : 'text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/50 dark:hover:bg-white/[0.05]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} aria-hidden="true" />
            <span>Like</span>
          </Link>

          {/* 3. Contact */}
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

        <div className="shrink-0" aria-hidden="true" />
      </div>
    </header>
  );
}
