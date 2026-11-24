import { useLocation } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function FloatingWhatsAppButton() {
  const { pathname } = useLocation();
  const { openCart, cartCount } = useCart();
  const isCarDetail = pathname.startsWith('/cars/') && pathname !== '/cars/';
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin || isCarDetail) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open enquiry cart (${cartCount} items)`}
      title="Open enquiry cart"
      className={`fixed right-4 sm:right-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg shadow-amber-900/25 dark:shadow-black/50 flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
        isCarDetail ? 'bottom-20 lg:bottom-6' : 'bottom-5 sm:bottom-6'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <ShoppingCart className="w-6 h-6" aria-hidden="true" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none flex items-center justify-center border border-white/40">
            {cartCount > 99 ? '99+' : cartCount}
          </span>
        )}
      </div>
    </button>
  );
}
