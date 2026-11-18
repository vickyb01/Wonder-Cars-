import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getWishlistIds, toggleWishlistId } from '../utils/api';

interface WishlistContextValue {
  wishlistIds: string[];
  wishlistCount: number;
  isWishlisted: (id: string) => boolean;
  toggleWishlist: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getWishlistIds());

  useEffect(() => {
    const handleUpdate = () => {
      setWishlistIds(getWishlistIds());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('strada_wishlist_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('strada_wishlist_updated', handleUpdate);
    };
  }, []);

  const isWishlisted = useCallback(
    (id: string) => wishlistIds.includes(id),
    [wishlistIds]
  );

  const toggleWishlist = useCallback((id: string) => {
    const { ids, saved } = toggleWishlistId(id);
    setWishlistIds(ids);
    window.dispatchEvent(new Event('strada_wishlist_updated'));
    return saved;
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isWishlisted,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}

