import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { CompareProvider } from './context/CompareContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { InventoryPage } from './pages/InventoryPage';
import { CarDetailPage } from './pages/CarDetailPage';
import { ComparePage } from './pages/ComparePage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { AdminPage } from './pages/AdminPage';
import { initGA, trackPageView } from './utils/analytics';

function RouteTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Only track non-admin customer pages in GA4 to keep customer analytics accurate
    if (!pathname.startsWith('/admin')) {
      const fullPath = `${pathname}${search}`;
      trackPageView(fullPath);
    }
  }, [pathname, search]);

  return null;
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 120);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function AppLayout({ mapsQuotaExceeded }: { mapsQuotaExceeded: boolean }) {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090B] text-slate-900 dark:text-[#FAFAFA] transition-colors duration-200">
      {mapsQuotaExceeded && !isAdminRoute && (
        <div className="bg-amber-50 dark:bg-amber-950/90 border-b border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-100 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-[60] shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 dark:text-white hover:opacity-80"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<InventoryPage />} />
          <Route path="/cars/:id" element={<CarDetailPage />} />
          <Route path="/compare" element={<Navigate to="/cars" replace />} />
          <Route path="/sell" element={<Navigate to="/cars" replace />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/gallery" element={<Navigate to="/about#gallery" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <FloatingWhatsAppButton />}
    </div>
  );
}

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    initGA();
    const handleQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <BrowserRouter>
          <RouteTracker />
          <ScrollToTop />
          <CompareProvider>
            <WishlistProvider>
              <CartProvider>
                <AppLayout mapsQuotaExceeded={mapsQuotaExceeded} />
                <CartDrawer />
              </CartProvider>
            </WishlistProvider>
          </CompareProvider>
        </BrowserRouter>
      </ThemeProvider>
    </MotionConfig>
  );
}
