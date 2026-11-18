import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type { Car, CarFilters } from '../types/car';
import { fetchCars } from '../utils/api';
import { useWishlist } from '../context/WishlistContext';
import { CarCard } from '../components/CarCard';
import { EmiFilterPanel } from '../components/EmiFilterPanel';
import { SeoHead } from '../components/SeoHead';
import {
  BRAND_CATALOG,
  matchesBrandFilter,
  resolveBrandDisplayName,
  toBrandSlug,
} from '../data/brands';
import { DEFAULT_EMI_CONFIG } from '../utils/emi';
import { formatINRCompact } from '../utils/format';

const BRAND_MODELS: Record<string, string[]> = {
  Porsche: ['911 Carrera S', '911 Carrera', 'Cayenne', 'Taycan'],
  BMW: ['M4 Competition', 'M5 Competition', 'X7'],
  'Mercedes-AMG': ['G63', 'G63 Magno', 'GT 63'],
  'Mercedes-Benz': ['G63', 'G63 Magno', 'GT 63', 'S-Class', 'E-Class'],
  Audi: ['RS e-tron GT', 'RS Q8', 'R8'],
  'Range Rover': ['Autobiography LWB', 'SV'],
  'Aston Martin': ['DBS Superleggera', 'Vantage', 'DB11'],
};

const inputCls =
  'w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#09090B]';

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [allCarsForOptions, setAllCarsForOptions] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { wishlistIds } = useWishlist();
  const isSavedOnly = searchParams.get('saved') === 'true';

  const filters: CarFilters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      brand: searchParams.get('brand') || 'All',
      model: searchParams.get('model') || 'All',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      minEmi: searchParams.get('minEmi') || '',
      maxEmi: searchParams.get('maxEmi') || '',
      downPaymentPercent: searchParams.get('downPaymentPercent') || '',
      interestRate: searchParams.get('interestRate') || '',
      tenureMonths: searchParams.get('tenureMonths') || '',
      year: searchParams.get('year') || 'All',
      fuelType: searchParams.get('fuelType') || 'All',
      transmission: searchParams.get('transmission') || 'All',
      maxKm: searchParams.get('maxKm') || '',
      status: searchParams.get('status') || 'All',
      sort: searchParams.get('sort') || 'newest',
    }),
    [searchParams]
  );

  const emiConfig = useMemo(
    () => ({
      downPaymentPercent: filters.downPaymentPercent
        ? Number(filters.downPaymentPercent)
        : DEFAULT_EMI_CONFIG.downPaymentPercent,
      annualInterestRate: filters.interestRate
        ? Number(filters.interestRate)
        : DEFAULT_EMI_CONFIG.annualInterestRate,
      tenureMonths: filters.tenureMonths
        ? Number(filters.tenureMonths)
        : DEFAULT_EMI_CONFIG.tenureMonths,
    }),
    [filters.downPaymentPercent, filters.interestRate, filters.tenureMonths]
  );

  useEffect(() => {
    fetchCars({})
      .then((list) => setAllCarsForOptions(list))
      .catch(() => {});
  }, []);

  const loadFiltered = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCars(filters);
      setCars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load vehicle inventory.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFiltered();
  }, [loadFiltered]);

  const displayedCars = useMemo(() => {
    if (!isSavedOnly) return cars;
    return cars.filter((c) => wishlistIds.includes(c.id));
  }, [cars, isSavedOnly, wishlistIds]);

  const knownBrands = useMemo(
    () => allCarsForOptions.map((c) => c.brand),
    [allCarsForOptions]
  );

  const selectedBrandDisplay = useMemo(() => {
    if (!filters.brand || filters.brand === 'All') return 'All';
    return resolveBrandDisplayName(filters.brand, knownBrands);
  }, [filters.brand, knownBrands]);

  const brands = useMemo(() => {
    const set = new Set<string>([
      ...BRAND_CATALOG.map((b) => b.name),
      ...Object.keys(BRAND_MODELS),
      ...knownBrands,
    ]);
    return ['All', ...Array.from(set).sort()];
  }, [knownBrands]);

  const models = useMemo(() => {
    const set = new Set<string>();
    if (filters.brand && filters.brand !== 'All') {
      (BRAND_MODELS[selectedBrandDisplay] || []).forEach((m) => set.add(m));
      allCarsForOptions
        .filter((c) => matchesBrandFilter(c.brand, filters.brand || ''))
        .forEach((c) => set.add(c.model));
    } else {
      allCarsForOptions.forEach((c) => set.add(c.model));
    }
    return ['All', ...Array.from(set).sort()];
  }, [allCarsForOptions, filters.brand, selectedBrandDisplay]);

  const years = useMemo(() => {
    const set = new Set<number>([2024, 2023, 2022, 2021, 2020]);
    allCarsForOptions.forEach((c) => set.add(c.year));
    return ['All', ...Array.from(set).sort((a, b) => b - a).map(String)];
  }, [allCarsForOptions]);

  function updateFilter(key: keyof CarFilters, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      next.delete(key);
    } else if (key === 'brand') {
      next.set(key, toBrandSlug(value));
    } else {
      next.set(key, value);
    }
    if (key === 'brand') {
      next.delete('model');
    }
    setSearchParams(next);
  }

  function clearBrandFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete('brand');
    next.delete('model');
    setSearchParams(next);
  }

  function applyEmiFilter(nextEmi: {
    minEmi: string;
    maxEmi: string;
    downPaymentPercent: number;
    annualInterestRate: number;
    tenureMonths: number;
  }) {
    const next = new URLSearchParams(searchParams);
    if (nextEmi.minEmi) next.set('minEmi', nextEmi.minEmi);
    else next.delete('minEmi');

    if (nextEmi.maxEmi) next.set('maxEmi', nextEmi.maxEmi);
    else next.delete('maxEmi');

    if (nextEmi.downPaymentPercent !== DEFAULT_EMI_CONFIG.downPaymentPercent) {
      next.set('downPaymentPercent', String(nextEmi.downPaymentPercent));
    } else {
      next.delete('downPaymentPercent');
    }

    if (nextEmi.annualInterestRate !== DEFAULT_EMI_CONFIG.annualInterestRate) {
      next.set('interestRate', String(nextEmi.annualInterestRate));
    } else {
      next.delete('interestRate');
    }

    if (nextEmi.tenureMonths !== DEFAULT_EMI_CONFIG.tenureMonths) {
      next.set('tenureMonths', String(nextEmi.tenureMonths));
    } else {
      next.delete('tenureMonths');
    }

    setSearchParams(next);
  }

  function clearEmiFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete('minEmi');
    next.delete('maxEmi');
    next.delete('downPaymentPercent');
    next.delete('interestRate');
    next.delete('tenureMonths');
    setSearchParams(next);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

  const hasEmiFilter = Boolean(filters.minEmi || filters.maxEmi);

  const activeFilterCount = [
    filters.search,
    filters.brand !== 'All' ? filters.brand : '',
    filters.model !== 'All' ? filters.model : '',
    filters.minPrice,
    filters.maxPrice,
    hasEmiFilter ? 'emi' : '',
    filters.year !== 'All' ? filters.year : '',
    filters.fuelType !== 'All' ? filters.fuelType : '',
    filters.transmission !== 'All' ? filters.transmission : '',
    filters.maxKm,
    filters.status !== 'All' ? filters.status : '',
  ].filter(Boolean).length;

  const filterFormContent = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">Filter Vehicles</h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ({activeFilterCount})</span>
          </button>
        )}
      </div>

      <div>
        <label htmlFor="f-search" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
          Keyword / City
        </label>
        <input
          id="f-search"
          type="text"
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Model, colour, city..."
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="f-brand" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
          Brand
        </label>
        <select
          id="f-brand"
          value={selectedBrandDisplay}
          onChange={(e) => updateFilter('brand', e.target.value)}
          className={inputCls}
        >
          {brands.map((b) => (
            <option key={b} value={b}>
              {b === 'All' ? 'All Brands' : b}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="f-model" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
          Model
        </label>
        <select
          id="f-model"
          value={filters.model || 'All'}
          onChange={(e) => updateFilter('model', e.target.value)}
          className={inputCls}
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m === 'All' ? 'All Models' : m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-min-price" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Min Price (₹)
          </label>
          <input
            id="f-min-price"
            type="number"
            min={0}
            step={500000}
            value={filters.minPrice || ''}
            onChange={(e) => updateFilter('minPrice', e.target.value)}
            placeholder="e.g. 10000000"
            className={`${inputCls} font-mono tabular-nums`}
          />
        </div>
        <div>
          <label htmlFor="f-max-price" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Max Price (₹)
          </label>
          <input
            id="f-max-price"
            type="number"
            min={0}
            step={500000}
            value={filters.maxPrice || ''}
            onChange={(e) => updateFilter('maxPrice', e.target.value)}
            placeholder="e.g. 30000000"
            className={`${inputCls} font-mono tabular-nums`}
          />
        </div>
      </div>

      {/* Monthly EMI Filter */}
      <EmiFilterPanel
        appliedMinEmi={filters.minEmi || ''}
        appliedMaxEmi={filters.maxEmi || ''}
        appliedDownPaymentPercent={emiConfig.downPaymentPercent}
        appliedInterestRate={emiConfig.annualInterestRate}
        appliedTenureMonths={emiConfig.tenureMonths}
        onApply={applyEmiFilter}
        onClear={clearEmiFilter}
      />

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
        <div>
          <label htmlFor="f-year" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Year
          </label>
          <select
            id="f-year"
            value={filters.year || 'All'}
            onChange={(e) => updateFilter('year', e.target.value)}
            className={inputCls}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y === 'All' ? 'Any Year' : y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="f-fuel" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Fuel Type
          </label>
          <select
            id="f-fuel"
            value={filters.fuelType || 'All'}
            onChange={(e) => updateFilter('fuelType', e.target.value)}
            className={inputCls}
          >
            <option value="All">All</option>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Electric">Electric</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="f-trans" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Transmission
          </label>
          <select
            id="f-trans"
            value={filters.transmission || 'All'}
            onChange={(e) => updateFilter('transmission', e.target.value)}
            className={inputCls}
          >
            <option value="All">All</option>
            <option value="Automatic">Automatic</option>
            <option value="PDK">PDK</option>
            <option value="DCT">DCT</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div>
          <label htmlFor="f-km" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
            Max Kilometres
          </label>
          <select
            id="f-km"
            value={filters.maxKm || ''}
            onChange={(e) => updateFilter('maxKm', e.target.value)}
            className={inputCls}
          >
            <option value="">Any Distance</option>
            <option value="10000">Under 10,000 km</option>
            <option value="20000">Under 20,000 km</option>
            <option value="35000">Under 35,000 km</option>
            <option value="60000">Under 60,000 km</option>
          </select>
        </div>
      </div>

      <div>
        <span className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
          Availability Status
        </span>
        <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08]">
          {['All', 'Available', 'Reserved', 'Sold'].map((st) => {
            const active = (filters.status || 'All') === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => updateFilter('status', st)}
                className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-200">
      <SeoHead
        title={
          selectedBrandDisplay !== 'All'
            ? `${selectedBrandDisplay} Cars`
            : 'Browse Certified Pre-Owned Inventory'
        }
        description="Explore verified luxury and performance pre-owned cars with transparent INR pricing across Mumbai, New Delhi, and Bengaluru."
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="pb-8 border-b border-slate-200 dark:border-white/[0.08] flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
              {selectedBrandDisplay !== 'All' ? `Brand Collection · ${selectedBrandDisplay}` : 'Showroom Inventory'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              {selectedBrandDisplay !== 'All'
                ? `${selectedBrandDisplay} Cars`
                : 'Curated Pre-Owned Collection'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Showing <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">{displayedCars.length}</span>{' '}
                {displayedCars.length === 1 ? 'available car' : 'available cars'}
              </p>
              {isSavedOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('saved');
                    setSearchParams(next);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/40 text-xs font-medium text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Liked Only ({displayedCars.length})</span>
                  <X className="w-3.5 h-3.5" />
                  <span className="sr-only">Clear liked filter</span>
                </button>
              )}
              {selectedBrandDisplay !== 'All' && (
                <button
                  type="button"
                  onClick={clearBrandFilter}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>Brand: {selectedBrandDisplay}</span>
                  <X className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span className="sr-only">Clear brand filter</span>
                </button>
              )}
              {hasEmiFilter && (
                <button
                  type="button"
                  onClick={clearEmiFilter}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-700 dark:text-zinc-200 font-mono tabular-nums transition-colors cursor-pointer"
                >
                  <span>
                    EMI: {filters.minEmi ? formatINRCompact(Number(filters.minEmi)) : '₹0'} –{' '}
                    {filters.maxEmi ? `${formatINRCompact(Number(filters.maxEmi))}/mo` : 'Any'}
                  </span>
                  <X className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span className="sr-only">Clear EMI filter</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm font-medium text-slate-900 dark:text-white hover:border-blue-500 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                Sort by
              </label>
              <select
                id="sort-select"
                value={filters.sort || 'newest'}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="emi_asc">Monthly EMI: Low to High</option>
                <option value="emi_desc">Monthly EMI: High to Low</option>
                <option value="km_asc">Lowest Kilometres</option>
                <option value="year_desc">Latest Year</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                if (isSavedOnly) {
                  next.delete('saved');
                } else {
                  next.set('saved', 'true');
                }
                setSearchParams(next);
              }}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isSavedOnly
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/30'
                  : 'bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-500/40'
              }`}
              title={isSavedOnly ? 'Show all cars' : 'Show liked cars only'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSavedOnly || wishlistIds.length > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>Liked ({wishlistIds.length})</span>
            </button>
          </div>
        </div>

        <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block lg:col-span-3 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto shadow-sm dark:shadow-none">
            {filterFormContent}
          </aside>

          {/* Main Inventory Grid */}
          <div className="lg:col-span-9">
            {error ? (
              <div className="p-8 rounded-xl bg-rose-50 dark:bg-[#121215] border border-rose-200 dark:border-red-500/30 text-center space-y-3">
                <p className="text-sm text-rose-700 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={loadFiltered}
                  className="px-4 py-2 rounded-lg bg-blue-700 dark:bg-blue-600 text-white text-sm font-semibold cursor-pointer"
                >
                  Retry Loading
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-96 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.06] animate-pulse" />
                ))}
              </div>
            ) : displayedCars.length === 0 ? (
              <div className="p-12 rounded-xl bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {isSavedOnly
                    ? 'No Liked Vehicles Yet'
                    : selectedBrandDisplay !== 'All'
                    ? 'No cars currently available for this brand.'
                    : 'No Matching Vehicles Found'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto">
                  {isSavedOnly
                    ? 'You have not liked any vehicles yet. Click the heart icon on any vehicle card to add it to your favorites!'
                    : selectedBrandDisplay !== 'All'
                    ? `We don't currently have active ${selectedBrandDisplay} listings in our galleries. Clear the brand filter to view all available vehicles.`
                    : 'Adjust your price ceiling, marque, or powertrain filters to view additional curated vehicles in our galleries.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (isSavedOnly) {
                      const next = new URLSearchParams(searchParams);
                      next.delete('saved');
                      setSearchParams(next);
                    } else {
                      resetFilters();
                    }
                  }}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {isSavedOnly ? 'Explore All Cars' : 'Clear Filter'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedCars.map((car, idx) => (
                  <CarCard key={car.id} car={car} index={idx} emiConfig={emiConfig} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/75 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#121215] border-l border-slate-200 dark:border-white/[0.1] h-full overflow-y-auto p-6 ml-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
              <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">Search Filters</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterFormContent}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm cursor-pointer"
            >
              Show {cars.length} Vehicles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
