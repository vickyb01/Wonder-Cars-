import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface CartEnquiryItem {
  id: string; // unique ID
  carId?: string;
  carTitle: string;
  carImage?: string;
  listingCode?: string;
  priceInr?: number;
  formType: 'test-drive' | 'inspection' | 'offer' | 'car-enquiry' | 'general' | string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  preferredDate?: string;
  preferredTime?: string;
  offerPriceInr?: number;
  notes?: string;
  submittedAt: string; // ISO string
  status: 'Received' | 'Contacted' | 'Confirmed';
}

interface CartContextValue {
  cartItems: CartEnquiryItem[];
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartEnquiryItem, 'id' | 'submittedAt' | 'status'>) => CartEnquiryItem;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'wonder_cars_enquiry_cart';

function loadStoredCart(): CartEnquiryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse cart items from storage:', err);
    return [];
  }
}

function saveStoredCart(items: CartEnquiryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save cart items to storage:', err);
  }
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartEnquiryItem[]>(() => loadStoredCart());
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCartItems(loadStoredCart());
      }
    };
    const handleCustomUpdate = () => {
      setCartItems(loadStoredCart());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('wonder_cart_updated', handleCustomUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wonder_cart_updated', handleCustomUpdate);
    };
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartEnquiryItem, 'id' | 'submittedAt' | 'status'>): CartEnquiryItem => {
      const newItem: CartEnquiryItem = {
        ...item,
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        submittedAt: new Date().toISOString(),
        status: 'Received',
      };

      setCartItems((prev) => {
        // Prepend new submission so latest is on top
        const updated = [newItem, ...prev];
        saveStoredCart(updated);
        return updated;
      });

      // Dispatch event for other components / tabs
      window.dispatchEvent(new Event('wonder_cart_updated'));

      return newItem;
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveStoredCart(updated);
      return updated;
    });
    window.dispatchEvent(new Event('wonder_cart_updated'));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    saveStoredCart([]);
    window.dispatchEvent(new Event('wonder_cart_updated'));
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount: cartItems.length,
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      clearCart,
    }),
    [cartItems, isCartOpen, openCart, closeCart, addToCart, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

