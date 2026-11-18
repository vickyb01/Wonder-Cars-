import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Check, ChevronDown, Heart, Menu, Monitor, Moon, Scale, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCompare } from '../context/CompareContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

const NAV_ITEMS = [
  { label: 'Inventory', to: '/cars' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Admin', to: '/admin' },
];

const THEME_OPTIONS: {
  id: ThemePreference;
  label: string;
  shortLabel: string;
  Icon: typeof Sun;
}[] = [
  { id: 'light', label: 'Light Mode', shortLabel: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark Mode', shortLabel: 'Dark', Icon: Moon },
  { id: 'system', label: 'System Default', shortLabel: 'System', Icon: Monitor },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { compareCount } = useCompare();
  const { wishlistCount } = useWishlist();
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
    setThemeMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!themeMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setThemeMenuOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [themeMenuOpen]);

  const activeThemeOption = THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[2];
  const ActiveThemeIcon = activeThemeOption.Icon;

  function cycleMobileTheme() {
    const order: ThemePreference[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-200 ${
        scrolled || mobileOpen
          ? 'bg-white/95 dark:bg-[#09090B]/92 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none'
          : 'bg-white/90 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-slate-200/70 dark:border-white/[0.06]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 md:h-[72px] flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm"
        >
          STRADA <span className="text-blue-700 dark:text-blue-500">MOTORS</span>
        </Link>

        {/* Zone 2: Concise single-line text links including Compare (N) */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary navigation">
          {NAV_ITEMS.slice(0, 1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-blue-700 dark:bg-blue-500 transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}

          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `relative py-1 inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : compareCount > 0
                  ? 'text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Scale className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Compare ({compareCount})</span>
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-blue-700 dark:bg-blue-500 transition-transform duration-200 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>

          <NavLink
            to="/cars?saved=true"
            className={({ isActive }) =>
              `relative py-1 inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap shrink-0 tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                location.search.includes('saved=true')
                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                  : wishlistCount > 0
                  ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            {() => (
              <>
                <Heart
                  className={`w-3.5 h-3.5 ${
                    wishlistCount > 0 || location.search.includes('saved=true')
                      ? 'fill-rose-500 text-rose-500'
                      : ''
                  }`}
                  aria-hidden="true"
                />
                <span>Saved ({wishlistCount})</span>
                <span
                  className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-rose-600 dark:bg-rose-500 transition-transform duration-200 origin-left ${
                    location.search.includes('saved=true') ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </>
            )}
          </NavLink>

          {NAV_ITEMS.slice(1).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative py-1 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-sm ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{item.label}</span>
                  <span
                    className={`absolute left-0 right-0 -bottom-0.5 h-[2px] bg-blue-700 dark:bg-blue-500 transition-transform duration-200 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Theme Switcher + Explore Cars CTA (+ compact mobile controls) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Theme Dropdown */}
          <div ref={themeMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={themeMenuOpen}
              aria-label={`Theme mode: ${activeThemeOption.label}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200/80 dark:hover:bg-white/[0.11] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-zinc-100 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ActiveThemeIcon className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" aria-hidden="true" />
              <span>{activeThemeOption.shortLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 transition-transform duration-150 ${
                  themeMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <AnimatePresence>
              {themeMenuOpen && (
                <motion.div
                  role="menu"
                  aria-label="Select colour theme"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.12] shadow-xl shadow-slate-900/10 dark:shadow-black/60 p-1.5 z-50"
                >
                  {THEME_OPTIONS.map(({ id, label, Icon }) => {
                    const selected = theme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          setTheme(id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{label}</span>
                        </span>
                        {selected && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      </button>
                    );
                  })}
                  {theme === 'system' && (
                    <p className="px-3 pt-1.5 pb-1 text-[11px] text-slate-500 dark:text-zinc-500 border-t border-slate-100 dark:border-white/[0.06] mt-1">
                      Device is in {resolvedTheme} mode
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Quick Theme Toggle */}
          <button
            type="button"
            onClick={cycleMobileTheme}
            aria-label={`Switch theme (currently ${activeThemeOption.label})`}
            title={`Theme: ${activeThemeOption.label}`}
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.1] text-slate-800 dark:text-zinc-100 transition-colors cursor-pointer"
          >
            <ActiveThemeIcon className="w-4 h-4 text-blue-700 dark:text-blue-400" aria-hidden="true" />
          </button>

          <Link
            to="/compare"
            className={`lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 transition-colors ${
              compareCount > 0
                ? 'bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                : 'bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Compare ({compareCount})</span>
          </Link>

          <Link
            to="/cars"
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Explore Cars
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
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
            className="lg:hidden bg-white/98 dark:bg-[#09090B]/96 backdrop-blur-xl border-b border-slate-200 dark:border-white/[0.08] px-5 pb-6 pt-3 space-y-4"
          >
            {/* Mobile Segmented Theme Control */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Appearance
              </p>
              <div
                role="radiogroup"
                aria-label="Theme preference"
                className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08]"
              >
                {THEME_OPTIONS.map(({ id, shortLabel, Icon }) => {
                  const selected = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTheme(id)}
                      className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link
                to="/cars"
                className="mt-3 flex items-center justify-center w-full py-3 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
              >
                Explore Cars
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
