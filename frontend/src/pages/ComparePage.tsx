import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Scale,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { Car, InspectionItem } from '../types/car';
import { useCompare } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { fetchCars, submitEnquiry } from '../utils/api';
import {
  calculateLoanEmi,
  DEFAULT_EMI_CONFIG,
  type EmiConfig,
} from '../utils/emi';
import {
  buildWhatsAppUrl,
  calculateAvgAnnualKm,
  calculateVehicleAge,
  formatINR,
  formatINRCompact,
  formatKm,
  formatReadableDate,
} from '../utils/format';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';

interface ComparisonRow {
  id: string;
  label: string;
  values: {
    text: string;
    highlight?: string;
  }[];
}

interface ComparisonCategory {
  id: string;
  title: string;
  subtitle: string;
  rows: ComparisonRow[];
}

function summarizeInspectionReport(items: InspectionItem[] | undefined): string {
  if (!items || items.length === 0) return 'Inspection Pending';
  const inspected = items.filter((item) => item.status !== 'Not Inspected');
  if (inspected.length === 0) return 'Inspection Pending';

  const excellent = inspected.filter((item) => item.status === 'Excellent').length;
  const good = inspected.filter((item) => item.status === 'Good').length;
  const needsAttention = inspected.filter((item) => item.status === 'Needs Attention').length;

  if (needsAttention > 0) {
    return `Needs Attention (${needsAttention} item${needsAttention > 1 ? 's' : ''})`;
  }
  if (excellent >= Math.ceil(inspected.length * 0.7)) {
    return `Excellent (${excellent}/${inspected.length} checks)`;
  }
  if (excellent + good >= Math.ceil(inspected.length * 0.7)) {
    return `Good (${excellent + good}/${inspected.length} checks Good+)`;
  }
  return `Average (${inspected.length} checks)`;
}

function summarizeEngineCondition(car: Car): string {
  const engineItem = car.mechanicalReport?.find((item) =>
    item.component.toLowerCase().includes('engine condition')
  );
  if (engineItem && engineItem.status !== 'Not Inspected') {
    return engineItem.status;
  }
  return summarizeInspectionReport(car.mechanicalReport);
}

function summarizeTyreCondition(car: Car): string {
  const roadTyres = (car.tyreDetails || []).filter(
    (tyre) =>
      tyre.position.toLowerCase() !== 'spare tyre' &&
      tyre.treadCondition &&
      tyre.treadCondition !== 'Not Inspected'
  );
  if (roadTyres.length > 0) {
    const first = roadTyres[0].treadCondition;
    const allSame = roadTyres.every((t) => t.treadCondition === first);
    if (allSame) return first;
    return `${roadTyres.length} Tyres Inspected (${first})`;
  }
  const tyreItem = car.mechanicalReport?.find((item) =>
    item.component.toLowerCase().includes('tyre condition')
  );
  if (tyreItem && tyreItem.status !== 'Not Inspected') {
    return tyreItem.status;
  }
  return 'Inspection Pending';
}

function summarizeServiceHistory(car: Car): string {
  const records = car.serviceHistory?.records || [];
  if (records.length > 0) {
    const lastDate = car.serviceHistory?.lastServiceDate
      ? ` · Last ${formatReadableDate(car.serviceHistory.lastServiceDate)}`
      : '';
    return `Available (${records.length} Record${records.length > 1 ? 's' : ''}${lastDate})`;
  }
  return car.usageHistory?.recordVerification || 'Verification Pending';
}

export function ComparePage() {
  const {
    compareCars,
    maxCompareCount,
    addToCompare,
    removeFromCompare,
    clearCompare,
    refreshComparedCars,
  } = useCompare();
  const { addToCart, openCart } = useCart();

  const [emiConfig, setEmiConfig] = useState<EmiConfig>({ ...DEFAULT_EMI_CONFIG });
  const [highlightDifferencesOnly, setHighlightDifferencesOnly] = useState(false);

  const [inventory, setInventory] = useState<Car[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [contactCar, setContactCar] = useState<Car | null>(null);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryEmail, setEnquiryEmail] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquirySending, setEnquirySending] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);

  useEffect(() => {
    refreshComparedCars();
  }, [refreshComparedCars]);

  useEffect(() => {
    let active = true;
    setLoadingInventory(true);
    fetchCars({})
      .then((list) => {
        if (active) setInventory(list);
      })
      .catch(() => {
        // Silently retain empty inventory picker list
      })
      .finally(() => {
        if (active) setLoadingInventory(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const comparedIds = useMemo(() => new Set(compareCars.map((c) => c.id)), [compareCars]);

  const availableToAdd = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    return inventory.filter((car) => {
      if (comparedIds.has(car.id)) return false;
      if (!query) return true;
      const haystack = `${car.year} ${car.brand} ${car.model} ${car.variant} ${car.location}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [inventory, comparedIds, pickerSearch]);

  const emiByCarId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateLoanEmi>>();
    compareCars.forEach((car) => {
      const downPaymentInr = Math.round((car.priceInr * emiConfig.downPaymentPercent) / 100);
      map.set(
        car.id,
        calculateLoanEmi({
          carPriceInr: car.priceInr,
          downPaymentInr,
          annualInterestRate: emiConfig.annualInterestRate,
          tenureMonths: emiConfig.tenureMonths,
        })
      );
    });
    return map;
  }, [compareCars, emiConfig]);

  const lowestPrice = useMemo(() => {
    if (compareCars.length < 2) return null;
    const prices = compareCars.map((c) => c.priceInr);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min !== max ? min : null;
  }, [compareCars]);

  const lowestKm = useMemo(() => {
    if (compareCars.length < 2) return null;
    const kms = compareCars.map((c) => c.kilometres);
    const min = Math.min(...kms);
    const max = Math.max(...kms);
    return min !== max ? min : null;
  }, [compareCars]);

  const categories = useMemo<ComparisonCategory[]>(() => {
    if (compareCars.length === 0) return [];

    const allCategories: ComparisonCategory[] = [
      {
        id: 'basic',
        title: 'Basic Information',
        subtitle: 'Core model identity, build year, registration & cabin format',
        rows: [
          {
            id: 'brand',
            label: 'Brand',
            values: compareCars.map((c) => ({ text: c.brand })),
          },
          {
            id: 'model',
            label: 'Model',
            values: compareCars.map((c) => ({ text: c.model })),
          },
          {
            id: 'variant',
            label: 'Variant',
            values: compareCars.map((c) => ({ text: c.variant || '—' })),
          },
          {
            id: 'mfg-year',
            label: 'Manufacturing Year',
            values: compareCars.map((c) => ({ text: String(c.year) })),
          },
          {
            id: 'reg-year',
            label: 'Registration Year',
            values: compareCars.map((c) => ({
              text: c.registrationYear ? String(c.registrationYear) : '—',
            })),
          },
          {
            id: 'vehicle-age',
            label: 'Vehicle Age',
            values: compareCars.map((c) => ({
              text: calculateVehicleAge(c.registrationDate, c.registrationYear || c.year).label,
            })),
          },
          {
            id: 'body-type',
            label: 'Body Type',
            values: compareCars.map((c) => ({ text: c.bodyType || '—' })),
          },
          {
            id: 'colour',
            label: 'Colour',
            values: compareCars.map((c) => ({ text: c.color || '—' })),
          },
          {
            id: 'seating',
            label: 'Seating Capacity',
            values: compareCars.map((c) => ({
              text: c.seatingCapacity ? `${c.seatingCapacity} Seats` : '—',
            })),
          },
        ],
      },
      {
        id: 'finance',
        title: 'Price & Finance',
        subtitle: 'Asking price, estimated monthly EMI, down payment & pricing terms',
        rows: [
          {
            id: 'asking-price',
            label: 'Asking Price',
            values: compareCars.map((c) => ({
              text: formatINR(c.priceInr),
              highlight: lowestPrice === c.priceInr ? 'Lowest Price' : undefined,
            })),
          },
          {
            id: 'estimated-emi',
            label: 'Estimated EMI',
            values: compareCars.map((c) => {
              const res = emiByCarId.get(c.id);
              return {
                text: res ? `${formatINR(res.monthlyEmi)} / mo` : 'Not Available',
                highlight: lowestPrice === c.priceInr ? 'Lowest EMI' : undefined,
              };
            }),
          },
          {
            id: 'down-payment',
            label: 'Down Payment',
            values: compareCars.map((c) => {
              const res = emiByCarId.get(c.id);
              return {
                text: res
                  ? `${formatINR(res.downPaymentInr)} (${emiConfig.downPaymentPercent}%)`
                  : 'Not Available',
              };
            }),
          },
          {
            id: 'loan-tenure',
            label: 'Loan Tenure',
            values: compareCars.map(() => ({
              text: `${emiConfig.tenureMonths} Months (${emiConfig.annualInterestRate}% p.a.)`,
            })),
          },
          {
            id: 'negotiable-status',
            label: 'Negotiable Status',
            values: compareCars.map((c) => ({ text: c.priceType || 'Fixed' })),
          },
        ],
      },
      {
        id: 'engine',
        title: 'Engine & Performance',
        subtitle: 'Powertrain configuration, displacement, efficiency & peak output',
        rows: [
          {
            id: 'fuel-type',
            label: 'Fuel Type',
            values: compareCars.map((c) => ({ text: c.fuelType })),
          },
          {
            id: 'transmission',
            label: 'Transmission',
            values: compareCars.map((c) => ({ text: c.transmission })),
          },
          {
            id: 'engine-cc',
            label: 'Engine Capacity (CC)',
            values: compareCars.map((c) => ({ text: c.engineCc || c.engine || '—' })),
          },
          {
            id: 'mileage',
            label: 'Mileage',
            values: compareCars.map((c) => ({ text: c.claimedMileage || '—' })),
          },
          {
            id: 'power',
            label: 'Power',
            values: compareCars.map((c) => ({ text: c.power || '—' })),
          },
        ],
      },
      {
        id: 'usage',
        title: 'Usage & Ownership',
        subtitle: 'Odometer reading, ownership lineage, registration zone & annual usage',
        rows: [
          {
            id: 'kilometres',
            label: 'Kilometres Driven',
            values: compareCars.map((c) => ({
              text: formatKm(c.kilometres),
              highlight: lowestKm === c.kilometres ? 'Lowest Driven' : undefined,
            })),
          },
          {
            id: 'ownership-count',
            label: 'Ownership Count',
            values: compareCars.map((c) => ({ text: c.ownership || '—' })),
          },
          {
            id: 'usage-type',
            label: 'Personal or Commercial Use',
            values: compareCars.map((c) => ({
              text: c.usageHistory?.usageType || '—',
            })),
          },
          {
            id: 'reg-location',
            label: 'Registration Location',
            values: compareCars.map((c) => ({
              text: c.registrationState || c.location || '—',
            })),
          },
          {
            id: 'avg-km-year',
            label: 'Average Kilometres Per Year',
            values: compareCars.map((c) => ({
              text: calculateAvgAnnualKm(c.kilometres, c.registrationDate),
            })),
          },
        ],
      },
      {
        id: 'condition',
        title: 'Condition & Inspection',
        subtitle: '210-point physical inspection summary, accident & service transparency',
        rows: [
          {
            id: 'exterior-condition',
            label: 'Exterior Condition',
            values: compareCars.map((c) => ({
              text: summarizeInspectionReport(c.exteriorReport),
            })),
          },
          {
            id: 'interior-condition',
            label: 'Interior Condition',
            values: compareCars.map((c) => ({
              text: summarizeInspectionReport(c.interiorReport),
            })),
          },
          {
            id: 'engine-condition',
            label: 'Engine Condition',
            values: compareCars.map((c) => ({
              text: summarizeEngineCondition(c),
            })),
          },
          {
            id: 'tyre-condition',
            label: 'Tyre Condition',
            values: compareCars.map((c) => ({
              text: summarizeTyreCondition(c),
            })),
          },
          {
            id: 'accident-history',
            label: 'Accident History Disclosure',
            values: compareCars.map((c) => ({
              text: c.accidentHistory?.overallStatus || 'Not Disclosed',
            })),
          },
          {
            id: 'service-history',
            label: 'Service History Availability',
            values: compareCars.map((c) => ({
              text: summarizeServiceHistory(c),
            })),
          },
          {
            id: 'warranty-guarantee',
            label: 'Warranty & Guarantee',
            values: compareCars.map((c) => ({
              text: c.warrantyPeriod && c.warrantyPeriod !== 'No Warranty'
                ? `${c.warrantyPeriod} Included`
                : 'Not Included',
              highlight: c.warrantyPeriod === '2 Years' || c.warrantyPeriod === '3 Years' ? 'Extended Cover' : undefined,
            })),
          },
        ],
      },
    ];

    if (!highlightDifferencesOnly || compareCars.length < 2) {
      return allCategories;
    }

    return allCategories.map((cat) => ({
      ...cat,
      rows: cat.rows.filter((row) => {
        const unique = new Set(row.values.map((v) => v.text));
        return unique.size > 1;
      }),
    }));
  }, [compareCars, emiByCarId, emiConfig, highlightDifferencesOnly, lowestKm, lowestPrice]);

  function openContactSellerModal(car: Car) {
    setContactCar(car);
    setEnquirySent(false);
    setEnquiryError('');
    setEnquiryMessage(
      `Hello ${car.sellerName}, I compared ${car.year} ${car.brand} ${car.model} (${car.listingCode}) on Strada Motors and would like to know availability and arrange an inspection.`
    );
  }

  async function handleContactSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contactCar) return;
    setEnquiryError('');

    if (enquiryName.trim().length < 2) {
      setEnquiryError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiryEmail.trim())) {
      setEnquiryError('Please enter a valid email address.');
      return;
    }
    if (enquiryPhone.replace(/\D/g, '').length < 10) {
      setEnquiryError('Please enter a valid 10-digit phone number.');
      return;
    }

    setEnquirySending(true);
    try {
      await submitEnquiry({
        type: 'car-enquiry',
        carId: contactCar.id,
        carTitle: `${contactCar.year} ${contactCar.brand} ${contactCar.model} ${contactCar.variant}`,
        name: enquiryName.trim(),
        email: enquiryEmail.trim(),
        phone: enquiryPhone.trim(),
        city: contactCar.location,
        message: enquiryMessage.trim(),
      });
      // Add to Enquiry Cart and open Cart Drawer
      addToCart({
        carId: contactCar.id,
        carTitle: `${contactCar.year} ${contactCar.brand} ${contactCar.model}`,
        carImage: contactCar.images?.[0],
        listingCode: contactCar.listingCode,
        priceInr: contactCar.priceInr,
        formType: 'car-enquiry',
        customerName: enquiryName.trim(),
        customerPhone: enquiryPhone.trim(),
        customerEmail: enquiryEmail.trim(),
        notes: enquiryMessage.trim(),
      });
      openCart();
      setEnquirySent(true);
    } catch (err) {
      setEnquiryError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    } finally {
      setEnquirySending(false);
    }
  }

  const openSlotsCount = Math.max(0, maxCompareCount - compareCars.length);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-200">
      <SeoHead
        title="Compare Cars Side by Side"
        description="Compare up to 3 pre-owned vehicles side by side across specifications, monthly EMI, ownership history, and inspection condition."
      />

      {/* Top Header Banner */}
      <section className="bg-slate-50 dark:bg-[#0D0D10] border-b border-slate-200 dark:border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <Link to="/" className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/cars" className="hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              Browse Cars
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-900 dark:text-white">Compare Cars</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
                Side-by-Side Showroom Evaluation
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Compare Pre-Owned Vehicles
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400">
                Compare up to 3 shortlisted cars across pricing, monthly EMI, mechanical specs, usage lineage, and inspection reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <span className="text-xs font-mono font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] px-3.5 py-2.5 rounded-lg tabular-nums">
                {compareCars.length} of {maxCompareCount} Selected
              </span>

              {compareCars.length >= 2 && (
                <button
                  type="button"
                  onClick={() => setHighlightDifferencesOnly((prev) => !prev)}
                  aria-pressed={highlightDifferencesOnly}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                    highlightDifferencesOnly
                      ? 'bg-blue-700 dark:bg-blue-600 border-blue-700 dark:border-blue-600 text-white'
                      : 'bg-white dark:bg-[#121215] border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-zinc-200 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-400'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{highlightDifferencesOnly ? 'Showing Differences' : 'Differences Only'}</span>
                </button>
              )}

              {compareCars.length < maxCompareCount && (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Vehicle</span>
                </button>
              )}

              {compareCars.length > 0 && (
                <button
                  type="button"
                  onClick={clearCompare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] hover:border-rose-300 dark:hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-400 text-slate-600 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 space-y-8">
        {/* Empty State */}
        {compareCars.length === 0 ? (
          <div className="space-y-10">
            <div className="bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-8 sm:p-12 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-100 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Scale className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  No vehicles in your comparison list yet
                </h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Click the Compare button on any vehicle across our homepage, Buy Cars inventory, or Car Details page — or select up to 3 vehicles right below.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <Link
                  to="/cars"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
                >
                  <span>Browse Inventory</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.1] hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Pick Cars Here</span>
                </button>
              </div>
            </div>

            {/* Quick Select Inventory Preview */}
            {inventory.length > 0 && (
              <section aria-labelledby="quick-pick-heading" className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 id="quick-pick-heading" className="font-display text-xl font-bold text-slate-900 dark:text-white">
                      Quick Add from Showroom Inventory
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                      Select up to 3 cars to start comparing side by side immediately.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {inventory.slice(0, 6).map((car) => (
                    <div
                      key={car.id}
                      className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden flex flex-col justify-between shadow-xs dark:shadow-none hover:border-blue-400 dark:hover:border-blue-500/60 transition-colors"
                    >
                      <div className="aspect-[16/10] bg-slate-100 dark:bg-[#18181B] overflow-hidden">
                        <VehicleImage
                          src={car.images[0]}
                          alt={`${car.year} ${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{car.brand}</p>
                          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                            {car.year} {car.model} {car.variant}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
                            {formatKm(car.kilometres)} · {car.fuelType} · {car.location}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {formatINR(car.priceInr)}
                          </span>
                          <button
                            type="button"
                            onClick={() => addToCompare(car)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Compare</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <>
            {/* Shared Finance Assumptions Controls */}
            <section
              aria-label="Comparison finance assumptions"
              className="bg-slate-50 dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 sm:p-5"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Shared EMI &amp; Finance Assumptions</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Adjust down payment, interest rate, or tenure to recalculate Estimated EMI &amp; Down Payment across all compared vehicles.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-auto">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-400">Down Payment</span>
                    <select
                      value={emiConfig.downPaymentPercent}
                      onChange={(e) =>
                        setEmiConfig((prev) => ({ ...prev, downPaymentPercent: Number(e.target.value) }))
                      }
                      className="h-9 px-3 rounded-lg bg-white dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    >
                      {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                        <option key={pct} value={pct}>
                          {pct}% Down Payment
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-400">Loan Tenure</span>
                    <select
                      value={emiConfig.tenureMonths}
                      onChange={(e) =>
                        setEmiConfig((prev) => ({ ...prev, tenureMonths: Number(e.target.value) }))
                      }
                      className="h-9 px-3 rounded-lg bg-white dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    >
                      {[24, 36, 48, 60, 72, 84].map((months) => (
                        <option key={months} value={months}>
                          {months} Months ({months / 12} yrs)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium text-slate-600 dark:text-zinc-400">Interest Rate (% p.a.)</span>
                    <select
                      value={emiConfig.annualInterestRate}
                      onChange={(e) =>
                        setEmiConfig((prev) => ({ ...prev, annualInterestRate: Number(e.target.value) }))
                      }
                      className="h-9 px-3 rounded-lg bg-white dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    >
                      {[8.25, 8.75, 9.25, 9.75, 10.5, 11.5, 12.5].map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}% p.a.
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* Mobile horizontal scroll indicator */}
            <div className="lg:hidden flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300">
              <span>← Swipe sideways to compare cars side-by-side →</span>
              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">Scrollable</span>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  {/* Vehicle Header Cards Row */}
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/[0.08] align-top">
                      <th
                        scope="col"
                        className="w-[140px] sm:w-[200px] lg:w-[240px] p-3 sm:p-5 bg-slate-50 dark:bg-[#18181B] border-r border-slate-200 dark:border-white/[0.08] sticky left-0 z-20 align-bottom"
                      >
                        <div className="space-y-1 sm:space-y-1.5">
                          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                            Matrix
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Vehicle Overview
                          </p>
                          <p className="text-[11px] font-normal text-slate-500 dark:text-zinc-400 hidden sm:block">
                            Scroll horizontally on smaller screens to inspect all columns.
                          </p>
                        </div>
                      </th>

                      {compareCars.map((car) => {
                        const emi = emiByCarId.get(car.id);
                        return (
                          <th
                            key={car.id}
                            scope="col"
                            className="w-[260px] sm:w-[290px] p-4 sm:p-5 bg-white dark:bg-[#121215] border-r border-slate-200 dark:border-white/[0.08] last:border-r-0 font-normal align-top"
                          >
                            <div className="space-y-3.5">
                              {/* Image + Remove Button */}
                              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.08]">
                                <Link to={`/cars/${car.id}`} className="block w-full h-full">
                                  <VehicleImage
                                    src={car.images[0]}
                                    alt={`${car.year} ${car.brand} ${car.model}`}
                                    className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300"
                                  />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => removeFromCompare(car.id)}
                                  aria-label={`Remove ${car.year} ${car.brand} ${car.model} from comparison`}
                                  title="Remove from comparison"
                                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/95 dark:bg-[#09090B]/90 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-700 dark:text-zinc-200 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-200 dark:border-white/[0.15] shadow-sm flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Brand, Model, Variant */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-semibold text-blue-700 dark:text-blue-400">{car.brand}</span>
                                  <span className="text-slate-500 dark:text-zinc-400 font-medium">{car.status}</span>
                                </div>
                                <Link to={`/cars/${car.id}`} className="block group">
                                  <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                    {car.brand} {car.model}
                                  </h2>
                                </Link>
                                <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-1">{car.variant}</p>
                              </div>

                              {/* Years + Location */}
                              <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-400 tabular-nums">
                                <p>
                                  Mfg {car.year} · Reg. {car.registrationYear || car.year}
                                </p>
                                <p className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                                  <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                                  <span className="truncate">{car.location}</span>
                                </p>
                              </div>

                              {/* Price + Est EMI */}
                              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-0.5">
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                    {formatINR(car.priceInr)}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                    {formatINRCompact(car.priceInr)}
                                  </span>
                                </div>
                                <p className="text-xs font-mono text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                                  Est. {emi ? formatINR(emi.monthlyEmi) : '—'}/mo EMI
                                </p>
                              </div>

                              {/* Actions: View Details, Contact Seller, Remove */}
                              <div className="space-y-2 pt-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <Link
                                    to={`/cars/${car.id}`}
                                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                                  >
                                    <span>View Details</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => openContactSellerModal(car)}
                                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.14] text-slate-900 dark:text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                                    <span>Contact Seller</span>
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFromCompare(car.id)}
                                  className="w-full py-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  Remove from comparison
                                </button>
                              </div>
                            </div>
                          </th>
                        );
                      })}

                      {/* Open Slots up to 3 Columns */}
                      {Array.from({ length: openSlotsCount }).map((_, idx) => (
                        <th
                          key={`empty-slot-${idx}`}
                          scope="col"
                          className="w-[240px] sm:w-[270px] p-5 bg-slate-50/60 dark:bg-[#0D0D10] border-r border-slate-200 dark:border-white/[0.08] last:border-r-0 font-normal align-middle"
                        >
                          <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="w-full h-full min-h-[260px] rounded-xl border-2 border-dashed border-slate-300 dark:border-white/[0.14] hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 p-5 flex flex-col items-center justify-center text-center gap-3 transition-colors cursor-pointer group"
                          >
                            <span className="w-11 h-11 rounded-full bg-white dark:bg-[#18181B] border border-slate-200 dark:border-white/[0.1] group-hover:border-blue-300 dark:group-hover:border-blue-500 text-blue-700 dark:text-blue-400 flex items-center justify-center shadow-xs">
                              <Plus className="w-5 h-5" />
                            </span>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                                Add Vehicle #{compareCars.length + idx + 1}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-zinc-400">
                                Select another car from inventory to compare side by side.
                              </p>
                            </div>
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* 5 Grouped Comparison Category Sections */}
                  <tbody>
                    {categories.map((category) => (
                      <FragmentCategory
                        key={category.id}
                        category={category}
                        compareCars={compareCars}
                        openSlotsCount={openSlotsCount}
                        totalCols={1 + compareCars.length + openSlotsCount}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Vehicle Picker Modal */}
      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-vehicle-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#18181B]">
              <div>
                <h2 id="add-vehicle-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Add Vehicle to Comparison ({compareCars.length}/{maxCompareCount})
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Choose any available vehicle from the showroom inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                aria-label="Close vehicle selector"
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200 dark:border-white/[0.08]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search by brand, model, variant, or city..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#09090B]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {loadingInventory ? (
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center py-10">Loading vehicles...</p>
              ) : availableToAdd.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-zinc-400 text-center py-10">
                  No additional matching vehicles found.
                </p>
              ) : (
                availableToAdd.map((car) => (
                  <div
                    key={car.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-blue-500/60 bg-white dark:bg-[#09090B] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#18181B] shrink-0">
                        <VehicleImage
                          src={car.images[0]}
                          alt={`${car.brand} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{car.brand}</p>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {car.year} {car.model} {car.variant}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 truncate tabular-nums">
                          {formatINR(car.priceInr)} · {formatKm(car.kilometres)} · {car.location}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCompare(car);
                        if (compareCars.length + 1 >= maxCompareCount) {
                          setPickerOpen(false);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Select</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {contactCar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-seller-modal-title"
          className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setContactCar(null)}
        >
          <div
            className="bg-white dark:bg-[#121215] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181B] flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400">
                  Direct Showroom Desk
                </p>
                <h2 id="contact-seller-modal-title" className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Contact Seller · {contactCar.year} {contactCar.brand} {contactCar.model}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setContactCar(null)}
                aria-label="Close contact seller dialog"
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Seller Summary + Instant Call / WhatsApp */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{contactCar.sellerName}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      {contactCar.sellerType} · {contactCar.location}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                    {formatINR(contactCar.priceInr)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${(contactCar.sellerPhone || '+919820451090').replace(/\s+/g, '')}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      contactCar.sellerWhatsapp || contactCar.sellerPhone || '919820451090',
                      `Hello ${contactCar.sellerName}, I am interested in ${contactCar.year} ${contactCar.brand} ${contactCar.model} (${contactCar.listingCode}).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {enquirySent ? (
                <div className="p-5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-7 h-7 text-blue-700 dark:text-blue-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Enquiry Sent Successfully</p>
                  <p className="text-xs text-slate-600 dark:text-zinc-300">
                    Our showroom desk will contact you shortly regarding this {contactCar.brand} {contactCar.model}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    <Mail className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Or Send a Direct Callback Request</span>
                  </div>

                  {enquiryError && (
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 rounded-lg px-3 py-2">
                      {enquiryError}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={enquiryName}
                      onChange={(e) => setEnquiryName(e.target.value)}
                      placeholder="Full Name *"
                      className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={enquiryPhone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEnquiryPhone(digits);
                      }}
                      placeholder="98XXXXXXXX"
                      className="h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                    />
                  </div>
                  <input
                    type="email"
                    value={enquiryEmail}
                    onChange={(e) => setEnquiryEmail(e.target.value)}
                    placeholder="Email Address *"
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                  <textarea
                    rows={3}
                    value={enquiryMessage}
                    onChange={(e) => setEnquiryMessage(e.target.value)}
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={enquirySending}
                    className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enquirySending ? 'Sending Request...' : 'Send Enquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FragmentCategory({
  category,
  compareCars,
  openSlotsCount,
  totalCols,
}: {
  category: ComparisonCategory;
  compareCars: Car[];
  openSlotsCount: number;
  totalCols: number;
}) {
  return (
    <>
      <tr className="bg-slate-100 dark:bg-[#18181B] border-y border-slate-200 dark:border-white/[0.08]">
        <th
          colSpan={totalCols}
          scope="colgroup"
          className="px-5 py-3.5 text-left"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="font-display text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {category.title}
            </span>
            <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">{category.subtitle}</span>
          </div>
        </th>
      </tr>

      {category.rows.length === 0 ? (
        <tr className="bg-white dark:bg-[#121215] border-b border-slate-100 dark:border-white/[0.06]">
          <td colSpan={totalCols} className="px-5 py-4 text-xs text-slate-500 dark:text-zinc-400">
            All selected vehicles share identical specifications in this category.
          </td>
        </tr>
      ) : (
        category.rows.map((row, rowIdx) => {
          const isEven = rowIdx % 2 === 0;
          const rowBg = isEven
            ? 'bg-white dark:bg-[#121215]'
            : 'bg-slate-50/70 dark:bg-[#16161A]';
          const stickyBg = isEven
            ? 'bg-white dark:bg-[#121215]'
            : 'bg-slate-50 dark:bg-[#16161A]';

          return (
            <tr key={row.id} className={`${rowBg} border-b border-slate-200/80 dark:border-white/[0.06] last:border-b-0`}>
              <th
                scope="row"
                className={`px-5 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-300 border-r border-slate-200 dark:border-white/[0.08] sticky left-0 z-10 ${stickyBg}`}
              >
                {row.label}
              </th>

              {row.values.map((val, colIdx) => (
                <td
                  key={`${row.id}-${compareCars[colIdx]?.id || colIdx}`}
                  className="px-5 py-3.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 border-r border-slate-200 dark:border-white/[0.08] last:border-r-0 tabular-nums align-middle"
                >
                  <div className="flex flex-col gap-1">
                    <span
                      className={
                        val.highlight
                          ? 'font-bold text-blue-700 dark:text-blue-400'
                          : 'font-medium text-slate-900 dark:text-zinc-100'
                      }
                    >
                      {val.text}
                    </span>
                    {val.highlight && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                        <Check className="w-3 h-3" />
                        <span>{val.highlight}</span>
                      </span>
                    )}
                  </div>
                </td>
              ))}

              {Array.from({ length: openSlotsCount }).map((_, idx) => (
                <td
                  key={`${row.id}-empty-${idx}`}
                  className="px-5 py-3.5 text-xs text-slate-400 dark:text-zinc-600 border-r border-slate-200 dark:border-white/[0.08] last:border-r-0"
                >
                  —
                </td>
              ))}
            </tr>
          );
        })
      )}
    </>
  );
}
