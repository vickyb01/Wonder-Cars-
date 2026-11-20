import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  Phone,
  Plus,
  RotateCcw,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';

interface CartDrawerProps {
  showroomPhone?: string;
}

export function CartDrawer({ showroomPhone = '+919810023456' }: CartDrawerProps) {
  const { cartItems, cartCount, isCartOpen, closeCart, removeFromCart, clearCart } = useCart();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const getFormTypeBadge = (type: string, offerPriceInr?: number) => {
    switch (type) {
      case 'test-drive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            🏎️ Test Drive Booked
          </span>
        );
      case 'inspection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            🔍 Physical Inspection
          </span>
        );
      case 'offer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            💰 Price Offer {offerPriceInr ? `(${formatINR(offerPriceInr)})` : ''}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            📋 Car Enquiry Submitted
          </span>
        );
    }
  };

  const buildCartWhatsAppUrl = (item: (typeof cartItems)[0]) => {
    const text = encodeURIComponent(
      `Hello Wonder Cars! I recently submitted a request on your website for:\n\n` +
        `🚗 *Car:* ${item.carTitle}\n` +
        (item.listingCode ? `🔖 *Listing Code:* ${item.listingCode}\n` : '') +
        `📌 *Request Type:* ${item.formType.toUpperCase()}\n` +
        (item.offerPriceInr ? `💰 *Offered Price:* ${formatINR(item.offerPriceInr)}\n` : '') +
        (item.preferredDate ? `📅 *Date:* ${item.preferredDate} ${item.preferredTime || ''}\n` : '') +
        `👤 *My Name:* ${item.customerName}\n` +
        `📞 *Phone:* ${item.customerPhone}\n\n` +
        `Could you please share the latest update and next steps? Thank you!`
    );
    return `https://wa.me/${showroomPhone.replace(/[^0-9]/g, '')}?text=${text}`;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md sm:max-w-lg bg-white dark:bg-[#0B1528] text-slate-900 dark:text-white shadow-2xl flex flex-col h-full z-10 border-l border-slate-200 dark:border-white/10"
            role="dialog"
            aria-modal="true"
            aria-label="Enquiry & Booking Cart"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Enquiry & Booking Cart
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                      {cartCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cars you requested for test drive, inspection or offer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCart}
                className="w-9 h-9 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Your Enquiry Cart is Empty
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Whenever you submit a Test Drive, Inspection, or Price Offer form for any car,
                      it will instantly appear here so you can track it anytime.
                    </p>
                  </div>
                  <Link
                    to="/cars"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                  >
                    <span>Browse Certified Inventory</span>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-100 dark:border-white/5">
                    <span>{cartItems.length} vehicle request(s) submitted</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear your enquiry cart?')) {
                          clearCart();
                        }
                      }}
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-amber-500/40 dark:hover:border-amber-400/40 transition-all space-y-3 shadow-xs"
                      >
                        {/* Top: Image + Info (Clickable Link to Car) + Remove */}
                        <div className="flex gap-3 items-start relative">
                          <Link
                            to={item.carId ? `/cars/${item.carId}` : '/cars'}
                            onClick={closeCart}
                            className="flex gap-3 items-start flex-1 min-w-0 group cursor-pointer"
                            title={`View ${item.carTitle}`}
                          >
                            {item.carImage ? (
                              <img
                                src={item.carImage}
                                alt={item.carTitle}
                                className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0 group-hover:scale-[1.03] group-hover:border-blue-500/50 dark:group-hover:border-blue-400/50 transition-all duration-200"
                              />
                            ) : (
                              <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-white/15 transition-colors">
                                <Tag className="w-6 h-6" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0 pr-1">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                {item.carTitle}
                              </h4>

                              {item.listingCode && (
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {item.listingCode}
                                </p>
                              )}

                              {item.priceInr && item.priceInr > 0 && (
                                <p className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                                  {formatINR(item.priceInr)}
                                </p>
                              )}

                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {getFormTypeBadge(item.formType, item.offerPriceInr)}
                              </div>
                            </div>
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer shrink-0"
                            title="Remove request"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Middle: Submitted Details */}
                        <div className="p-2.5 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Applicant: {item.customerName}
                            </span>
                            <span className="font-mono text-slate-500">📞 {item.customerPhone}</span>
                          </div>

                          {(item.preferredDate || item.preferredTime) && (
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Scheduled: {item.preferredDate} {item.preferredTime ? `at ${item.preferredTime}` : ''}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Received by Showroom
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.submittedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Bottom: Action buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {item.carId ? (
                            <Link
                              to={`/cars/${item.carId}`}
                              onClick={closeCart}
                              className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 text-xs font-semibold transition-colors text-center"
                            >
                              <span>View Car</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <div />
                          )}

                          <a
                            href={buildCartWhatsAppUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors text-center cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <span className="text-base leading-none">⚡</span>
                  <p className="leading-tight">
                    Our sales advisor will call you shortly on your registered number to confirm the
                    slot & documents.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${showroomPhone.replace(/[^0-9+]/g, '')}`}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-white/15 hover:bg-slate-200/60 dark:hover:bg-white/10 text-slate-800 dark:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Call Showroom</span>
                  </a>

                  <Link
                    to="/cars"
                    onClick={closeCart}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add More Cars</span>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

