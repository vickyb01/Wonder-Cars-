import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, Scale, X } from 'lucide-react';
import type { Car } from '../types/car';
import { fetchCars } from '../utils/api';
import { formatINRCompact } from '../utils/format';
import { VehicleImage } from '../components/VehicleImage';

const COMPARE_STORAGE_KEY = 'strada_compare_cars';
export const MAX_COMPARE_CARS = 3;

interface ToggleResult {
  added: boolean;
  removed: boolean;
  limitReached: boolean;
}

interface CompareContextValue {
  compareCars: Car[];
  compareCount: number;
  maxCompareCount: number;
  limitNotice: string | null;
  dismissLimitNotice: () => void;
  isCompared: (carId: string) => boolean;
  addToCompare: (car: Car) => { added: boolean; limitReached: boolean };
  removeFromCompare: (carId: string) => void;
  toggleCompare: (car: Car) => ToggleResult;
  clearCompare: () => void;
  refreshComparedCars: () => Promise<void>;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadStoredCars(): Car[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Car => Boolean(item && typeof item === 'object' && typeof item.id === 'string'))
      .slice(0, MAX_COMPARE_CARS);
  } catch {
    return [];
  }
}

function persistCars(cars: Car[]): void {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(cars.slice(0, MAX_COMPARE_CARS)));
  } catch {
    // Ignore storage quota errors
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareCars, setCompareCars] = useState<Car[]>(() => loadStoredCars());
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    persistCars(compareCars);
  }, [compareCars]);

  useEffect(() => {
    if (!limitNotice) return;
    const timer = window.setTimeout(() => setLimitNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [limitNotice]);

  const dismissLimitNotice = useCallback(() => {
    setLimitNotice(null);
  }, []);

  const isCompared = useCallback(
    (carId: string) => compareCars.some((item) => item.id === carId),
    [compareCars]
  );

  const addToCompare = useCallback(
    (car: Car): { added: boolean; limitReached: boolean } => {
      if (compareCars.some((item) => item.id === car.id)) {
        return { added: false, limitReached: false };
      }
      if (compareCars.length >= MAX_COMPARE_CARS) {
        setLimitNotice('You can compare up to 3 vehicles at once. Remove one or open the Compare page.');
        return { added: false, limitReached: true };
      }
      setCompareCars((prev) => {
        if (prev.some((item) => item.id === car.id) || prev.length >= MAX_COMPARE_CARS) {
          return prev;
        }
        return [...prev, car];
      });
      setLimitNotice(null);
      return { added: true, limitReached: false };
    },
    [compareCars]
  );

  const removeFromCompare = useCallback((carId: string) => {
    setCompareCars((prev) => prev.filter((item) => item.id !== carId));
    setLimitNotice(null);
  }, []);

  const toggleCompare = useCallback(
    (car: Car): ToggleResult => {
      if (compareCars.some((item) => item.id === car.id)) {
        setCompareCars((prev) => prev.filter((item) => item.id !== car.id));
        setLimitNotice(null);
        return { added: false, removed: true, limitReached: false };
      }
      if (compareCars.length >= MAX_COMPARE_CARS) {
        setLimitNotice('Maximum 3 vehicles can be compared side by side. Remove a car to add another.');
        return { added: false, removed: false, limitReached: true };
      }
      setCompareCars((prev) => {
        if (prev.some((item) => item.id === car.id) || prev.length >= MAX_COMPARE_CARS) {
          return prev;
        }
        return [...prev, car];
      });
      setLimitNotice(null);
      return { added: true, removed: false, limitReached: false };
    },
    [compareCars]
  );

  const clearCompare = useCallback(() => {
    setCompareCars([]);
    setLimitNotice(null);
  }, []);

  const refreshComparedCars = useCallback(async () => {
    if (compareCars.length === 0) return;
    try {
      const liveCars = await fetchCars({});
      const byId = new Map(liveCars.map((c) => [c.id, c]));
      setCompareCars((prev) => prev.map((item) => byId.get(item.id) || item));
    } catch {
      // Keep cached comparison records if refresh fails
    }
  }, [compareCars.length]);

  const value = useMemo<CompareContextValue>(
    () => ({
      compareCars,
      compareCount: compareCars.length,
      maxCompareCount: MAX_COMPARE_CARS,
      limitNotice,
      dismissLimitNotice,
      isCompared,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearCompare,
      refreshComparedCars,
    }),
    [
      compareCars,
      limitNotice,
      dismissLimitNotice,
      isCompared,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearCompare,
      refreshComparedCars,
    ]
  );

  const showFloatingTray =
    compareCars.length > 0 &&
    pathname !== '/compare' &&
    !pathname.startsWith('/admin') &&
    pathname !== '/contact';

  return (
    <CompareContext.Provider value={value}>
      {children}

      {/* Non-blocking Limit Toast */}
      {limitNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.12] shadow-xl rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm space-y-2">
            <p className="font-medium text-slate-900 dark:text-white leading-snug">{limitNotice}</p>
            <div className="flex items-center gap-3">
              <Link
                to="/compare"
                onClick={dismissLimitNotice}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              >
                <span>Open Compare ({compareCars.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={dismissLimitNotice}
                className="text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissLimitNotice}
            aria-label="Dismiss notification"
            className="p-1 text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-white rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Desktop Bottom-Left Compare Tray (leaves bottom-right clear for FloatingWhatsAppButton) */}
      {showFloatingTray && (
        <aside
          aria-label="Selected vehicles for comparison"
          className="fixed bottom-5 left-5 z-40 hidden md:flex items-center gap-3 bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.14] rounded-2xl px-3.5 py-2.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 max-w-xl"
        >
          <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-white/[0.1]">
            {compareCars.map((car) => (
              <div
                key={car.id}
                className="flex items-center gap-2 bg-slate-50 dark:bg-[#1B1B20] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-1.5 pr-2 py-1"
              >
                <div className="w-10 h-7 rounded-md overflow-hidden bg-slate-200 dark:bg-zinc-900 shrink-0">
                  <VehicleImage
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="max-w-[100px]">
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white truncate">{car.model}</p>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 tabular-nums">
                    {formatINRCompact(car.priceInr)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCompare(car.id)}
                  aria-label={`Remove ${car.brand} ${car.model} from comparison`}
                  className="p-0.5 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/compare"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare ({compareCars.length})</span>
            </Link>
            <button
              type="button"
              onClick={clearCompare}
              className="px-2 py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </aside>
      )}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return ctx;
}
