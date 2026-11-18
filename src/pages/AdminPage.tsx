import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  Plus,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import type {
  AdminOverview,
  BusinessLocationSettings,
  Car,
  CarStatus,
  Enquiry,
  EnquiryStatus,
  SellRequest,
  SellRequestStatus,
} from '../types/car';
import {
  adminLogin,
  clearAdminToken,
  deleteCar,
  deleteEnquiry,
  deleteSellRequest,
  fetchAdminEnquiries,
  fetchAdminOverview,
  fetchAdminSellRequests,
  fetchBusinessLocation,
  fetchCars,
  geocodeLocationServer,
  getAdminToken,
  setAdminToken,
  updateBusinessLocation,
  updateCar,
  updateEnquiryStatus,
  updateSellRequestStatus,
  verifyAdminSession,
} from '../utils/api';
import { EMPTY_LOCATION_SETTINGS, buildDirectionsUrl, formatFullAddress, parseCoordinates } from '../utils/location';
import { buildWhatsAppUrl, formatINR, formatINRCompact, formatKm } from '../utils/format';
import { AdminCarModal } from '../components/AdminCarModal';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';

type AdminTab = 'inventory' | 'enquiries' | 'sell-requests' | 'location';

const inputCls =
  'w-full h-11 px-3.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[#09090B]';

export function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState('admin@stradamotors.in');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('inventory');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<'All' | CarStatus>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [locationForm, setLocationForm] = useState<BusinessLocationSettings>(EMPTY_LOCATION_SETTINGS);
  const [savingLocation, setSavingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoadingData(true);
    try {
      const [ov, carList, enqList, sellList, locRes] = await Promise.all([
        fetchAdminOverview(),
        fetchCars({ sort: 'newest', includeDrafts: 'true' }),
        fetchAdminEnquiries(),
        fetchAdminSellRequests(),
        fetchBusinessLocation(),
      ]);
      setOverview(ov);
      setCars(carList);
      setEnquiries(enqList);
      setSellRequests(sellList);
      setLocationForm(locRes.location || EMPTY_LOCATION_SETTINGS);
    } catch {
      clearAdminToken();
      setAdminEmail(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    verifyAdminSession()
      .then((res) => {
        setAdminEmail(res.email);
        loadDashboard();
      })
      .catch(() => {
        clearAdminToken();
        setAdminEmail(null);
      })
      .finally(() => setAuthChecked(true));
  }, [loadDashboard]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminLogin(emailInput.trim(), passwordInput);
      setAdminToken(res.token);
      setAdminEmail(res.email);
      setPasswordInput('');
      await loadDashboard();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAdminEmail(null);
  }

  async function handleStatusChange(car: Car, nextStatus: CarStatus) {
    const updated = await updateCar(car.id, { status: nextStatus });
    setCars((prev) => prev.map((c) => (c.id === car.id ? updated : c)));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleToggleFeatured(car: Car) {
    const updated = await updateCar(car.id, { featured: !car.featured });
    setCars((prev) => prev.map((c) => (c.id === car.id ? updated : c)));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleSaveInlinePrice(carId: string) {
    const nextPrice = Number(priceDraft);
    if (!nextPrice || nextPrice <= 0) return;
    const updated = await updateCar(carId, { priceInr: nextPrice });
    setCars((prev) => prev.map((c) => (c.id === carId ? updated : c)));
    setEditingPriceId(null);
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleConfirmDeleteCar() {
    if (!deleteTargetId) return;
    await deleteCar(deleteTargetId);
    setCars((prev) => prev.filter((c) => c.id !== deleteTargetId));
    setDeleteTargetId(null);
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleEnquiryStatus(id: string, status: EnquiryStatus) {
    const updated = await updateEnquiryStatus(id, status);
    setEnquiries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleDeleteEnquiry(id: string) {
    await deleteEnquiry(id);
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleSellRequestStatus(id: string, status: SellRequestStatus) {
    const updated = await updateSellRequestStatus(id, status);
    setSellRequests((prev) => prev.map((s) => (s.id === id ? updated : s)));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleDeleteSellRequest(id: string) {
    await deleteSellRequest(id);
    setSellRequests((prev) => prev.filter((s) => s.id !== id));
    fetchAdminOverview().then(setOverview).catch(() => {});
  }

  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    setLocationFeedback(null);
    setSavingLocation(true);
    try {
      const saved = await updateBusinessLocation(locationForm);
      setLocationForm(saved);
      setLocationFeedback({
        type: 'success',
        message: 'Showroom location and contact settings saved. Live on Contact Us page.',
      });
    } catch (err) {
      setLocationFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to save location settings.',
      });
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleLookupCoordinates() {
    setLocationFeedback(null);
    const query = formatFullAddress(locationForm);
    if (!query || query.length < 4) {
      setLocationFeedback({
        type: 'error',
        message: 'Please enter the showroom address and city first before looking up coordinates.',
      });
      return;
    }
    setGeocoding(true);
    try {
      const geo = await geocodeLocationServer(query);
      setLocationForm((prev) => ({
        ...prev,
        latitude: geo.latitude,
        longitude: geo.longitude,
      }));
      setLocationFeedback({
        type: 'success',
        message: `Coordinates found for "${geo.formattedAddress}". Click Save Location Settings to publish.`,
      });
    } catch (err) {
      setLocationFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unable to geocode address. Enter Latitude and Longitude manually.',
      });
    } finally {
      setGeocoding(false);
    }
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-white dark:bg-[#09090B]" />;
  }

  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] pt-28 pb-20 px-5 flex items-center justify-center transition-colors duration-200">
        <SeoHead title="Admin Sign In" />
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] p-8 space-y-6 shadow-sm dark:shadow-none">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Dealer Admin Portal</h1>
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Sign in to manage Strada Motors inventory, inspection reports, gallery photos, and enquiries.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter admin password"
                className={inputCls}
              />
            </div>

            {loginError && <p className="text-xs font-medium text-rose-700 dark:text-red-400">{loginError}</p>}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.06] text-xs text-slate-600 dark:text-zinc-400 space-y-1">
            <p className="font-medium text-slate-800 dark:text-zinc-300">Default Demo Credentials</p>
            <p className="font-mono">Email: admin@stradamotors.in</p>
            <p className="font-mono">Pass: StradaAdmin@2026</p>
          </div>
        </div>
      </div>
    );
  }

  const visibleCars = cars.filter((c) => inventoryFilter === 'All' || c.status === inventoryFilter);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-200">
      <SeoHead title="Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.08]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
              Gallery Management
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Strada Admin Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Signed in as {adminEmail}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setEditingCar(null);
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Car</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2] text-slate-700 dark:text-zinc-300 text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {overview && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Available / Total Fleet</p>
              <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {overview.availableCars} <span className="text-sm font-normal text-slate-500 dark:text-zinc-500">/ {overview.totalCars}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {overview.reservedCars} reserved · {overview.soldCars} sold · {overview.draftCars} draft
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Available Stock Value</p>
              <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {formatINRCompact(overview.totalInventoryValueInr)}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">{formatINR(overview.totalInventoryValueInr)}</p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Customer Enquiries &amp; Offers</p>
              <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {overview.totalEnquiriesCount}
              </p>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-1">
                {overview.newEnquiriesCount} awaiting response
              </p>
            </div>
            <div className="p-5 rounded-xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Sell-Your-Car Leads</p>
              <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {sellRequests.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">{overview.pendingSellRequestsCount} pending review</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
            {[
              { id: 'inventory', label: `Inventory (${cars.length})` },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'sell-requests', label: `Sell Requests (${sellRequests.length})` },
              { id: 'location', label: 'Location Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-700 dark:bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'inventory' && (
            <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none">
              {(['All', 'Available', 'Reserved', 'Sold', 'Draft'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setInventoryFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    inventoryFilter === status
                      ? 'bg-slate-900 dark:bg-white/[0.12] text-white'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {loadingData ? (
          <div className="h-64 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] animate-pulse" />
        ) : activeTab === 'inventory' ? (
          <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-xs dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#18181B] text-xs font-medium text-slate-600 dark:text-zinc-400">
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Specs &amp; Photos</th>
                    <th className="py-3.5 px-4">Price (INR)</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Featured</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-sm">
                  {visibleCars.map((car) => (
                    <tr key={car.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-[#18181B] shrink-0">
                            <VehicleImage src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {car.year} {car.brand} {car.model}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {car.variant} · <span className="font-mono">{car.listingCode}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-600 dark:text-zinc-400 tabular-nums">
                        <p>{formatKm(car.kilometres)} · {car.fuelType} · {car.transmission}</p>
                        <p className="text-slate-500 mt-0.5">
                          {car.location} · {car.gallery?.length || car.images.length} photo(s)
                        </p>
                      </td>

                      <td className="py-4 px-4 font-mono tabular-nums">
                        {editingPriceId === car.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={priceDraft}
                              onChange={(e) => setPriceDraft(e.target.value)}
                              className="w-32 h-8 px-2 rounded bg-slate-50 dark:bg-[#09090B] border border-blue-600 dark:border-blue-500 text-xs text-slate-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveInlinePrice(car.id)}
                              className="p-1.5 rounded bg-blue-700 dark:bg-blue-600 text-white cursor-pointer"
                              title="Save price"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceId(car.id);
                              setPriceDraft(String(car.priceInr));
                            }}
                            className="text-left group cursor-pointer"
                            title="Click to update price"
                          >
                            <p className="text-slate-900 dark:text-white font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-400">
                              {formatINR(car.priceInr)}
                            </p>
                            <p className="text-[11px] text-slate-500">{car.priceType} · Edit</p>
                          </button>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={car.status}
                          onChange={(e) => handleStatusChange(car, e.target.value as CarStatus)}
                          className="h-8 px-2.5 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.12] text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                        >
                          <option value="Available">Available</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Sold">Sold</option>
                          <option value="Draft">Draft</option>
                        </select>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(car)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                            car.featured
                              ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400'
                              : 'bg-slate-50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" fill={car.featured ? 'currentColor' : 'none'} />
                          <span>{car.featured ? 'Featured' : 'Standard'}</span>
                        </button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {car.status !== 'Draft' && (
                            <Link
                              to={`/cars/${car.id}`}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300"
                              title="View showroom page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCar(car);
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-300 cursor-pointer"
                            title="Edit full showroom dossier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(car.id)}
                            className="p-2 rounded-lg bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-700 dark:text-red-400 cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'enquiries' ? (
          <div className="space-y-4">
            {enquiries.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-center text-sm text-slate-500 dark:text-zinc-400">
                No customer enquiries received yet.
              </div>
            ) : (
              enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-blue-700 dark:text-blue-400 uppercase">{enq.type}</span>
                      {enq.carTitle && (
                        <>
                          <span>·</span>
                          <span className="text-slate-900 dark:text-white font-medium">{enq.carTitle}</span>
                        </>
                      )}
                      {enq.offerPriceInr && (
                        <>
                          <span>·</span>
                          <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300 tabular-nums">
                            Offer: {formatINR(enq.offerPriceInr)}
                          </span>
                        </>
                      )}
                      {enq.preferredDate && (
                        <>
                          <span>·</span>
                          <span className="font-mono">
                            Slot: {enq.preferredDate} {enq.preferredTime || ''}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{enq.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                      {enq.phone} · {enq.email} {enq.city ? `· ${enq.city}` : ''}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-zinc-300 pt-1">{enq.message}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <select
                      value={enq.status}
                      onChange={(e) => handleEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                      className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value="New">Status: New</option>
                      <option value="Contacted">Status: Contacted</option>
                      <option value="Scheduled">Status: Scheduled</option>
                      <option value="Closed">Status: Closed</option>
                    </select>

                    <a
                      href={buildWhatsAppUrl(
                        enq.phone,
                        `Hello ${enq.name}, following up from Strada Motors regarding your ${enq.type} request.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-medium text-slate-800 dark:text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteEnquiry(enq.id)}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-700 dark:text-red-400 cursor-pointer"
                      aria-label="Delete enquiry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'sell-requests' ? (
          <div className="space-y-4">
            {sellRequests.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-center text-sm text-slate-500 dark:text-zinc-400">
                No Sell-Your-Car valuation requests yet.
              </div>
            ) : (
              sellRequests.map((reqItem) => (
                <div
                  key={reqItem.id}
                  className="p-6 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-xs dark:shadow-none flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {reqItem.year} {reqItem.brand} {reqItem.model} · {formatKm(reqItem.kilometres)} · {reqItem.ownership}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                      {reqItem.ownerName} ({reqItem.city})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
                      Expected: {reqItem.expectedPriceInr > 0 ? formatINR(reqItem.expectedPriceInr) : 'Open to Valuation'} ·{' '}
                      {reqItem.ownerPhone} · {reqItem.ownerEmail}
                    </p>
                    {reqItem.notes && <p className="text-sm text-slate-700 dark:text-zinc-300 pt-1">{reqItem.notes}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <select
                      value={reqItem.status}
                      onChange={(e) => handleSellRequestStatus(reqItem.id, e.target.value as SellRequestStatus)}
                      className="h-9 px-3 rounded-lg bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.1] text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Inspection Booked">Inspection Booked</option>
                      <option value="Offer Sent">Offer Sent</option>
                      <option value="Closed">Closed</option>
                    </select>

                    <a
                      href={buildWhatsAppUrl(
                        reqItem.ownerPhone,
                        `Hello ${reqItem.ownerName}, Strada Motors Acquisition Desk here regarding your ${reqItem.year} ${reqItem.brand} ${reqItem.model}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-medium text-slate-800 dark:text-white"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteSellRequest(reqItem.id)}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-red-500/10 hover:bg-rose-100 dark:hover:bg-red-500/20 text-rose-700 dark:text-red-400 cursor-pointer"
                      aria-label="Delete sell request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form
            onSubmit={handleSaveLocation}
            className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-xs dark:shadow-none"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.08]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Showroom Contact &amp; Google Maps Configuration</span>
                </p>
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Business Location Settings
                </h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  Configure your live showroom address, contact buttons, and map coordinates shown on the Contact Us page.
                </p>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-xs font-semibold text-slate-900 dark:text-white shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>Preview Contact Page</span>
              </Link>
            </div>

            {locationFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-medium ${
                  locationFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/30 text-rose-700 dark:text-red-300'
                }`}
              >
                {locationFeedback.message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="loc-name" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Business / Showroom Name
                </label>
                <input
                  id="loc-name"
                  type="text"
                  value={locationForm.businessName}
                  onChange={(e) => setLocationForm((p) => ({ ...p, businessName: e.target.value }))}
                  placeholder="e.g. Strada Motors Flagship Showroom"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-hours" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Business Opening Hours
                </label>
                <input
                  id="loc-hours"
                  type="text"
                  value={locationForm.openingHours}
                  onChange={(e) => setLocationForm((p) => ({ ...p, openingHours: e.target.value }))}
                  placeholder="e.g. Mon – Sun · 10:00 AM – 8:00 PM"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-phone" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Business Phone Number
                </label>
                <input
                  id="loc-phone"
                  type="tel"
                  value={locationForm.phone}
                  onChange={(e) => setLocationForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98XXX XXXXX"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-whatsapp" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  WhatsApp Contact Number
                </label>
                <input
                  id="loc-whatsapp"
                  type="tel"
                  value={locationForm.whatsapp}
                  onChange={(e) => setLocationForm((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+91 98XXX XXXXX"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="loc-email" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Official Email Address
                </label>
                <input
                  id="loc-email"
                  type="email"
                  value={locationForm.email}
                  onChange={(e) => setLocationForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="showroom@yourdomain.com"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="loc-address" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Complete Street Address
                </label>
                <input
                  id="loc-address"
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Building / Plot, Street Name, Locality"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-city" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  City
                </label>
                <input
                  id="loc-city"
                  type="text"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="City"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loc-state" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                    State
                  </label>
                  <input
                    id="loc-state"
                    type="text"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm((p) => ({ ...p, state: e.target.value }))}
                    placeholder="State"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="loc-pin" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    id="loc-pin"
                    type="text"
                    value={locationForm.postalCode}
                    onChange={(e) => setLocationForm((p) => ({ ...p, postalCode: e.target.value }))}
                    placeholder="PIN / ZIP"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="loc-landmarks" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Nearby Landmarks (Optional)
                </label>
                <input
                  id="loc-landmarks"
                  type="text"
                  value={locationForm.nearbyLandmarks}
                  onChange={(e) => setLocationForm((p) => ({ ...p, nearbyLandmarks: e.target.value }))}
                  placeholder="e.g. Opposite Central Metro Station, Gate 2"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-ig" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Instagram Profile URL (Optional)
                </label>
                <input
                  id="loc-ig"
                  type="url"
                  value={locationForm.instagramUrl || ''}
                  onChange={(e) => setLocationForm((p) => ({ ...p, instagramUrl: e.target.value }))}
                  placeholder="https://www.instagram.com/yourhandle"
                  className={inputCls}
                />
              </div>

              <div>
                <label htmlFor="loc-fb" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Facebook Page URL (Optional)
                </label>
                <input
                  id="loc-fb"
                  type="url"
                  value={locationForm.facebookUrl || ''}
                  onChange={(e) => setLocationForm((p) => ({ ...p, facebookUrl: e.target.value }))}
                  placeholder="https://www.facebook.com/yourpage"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="loc-yt" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  YouTube Channel URL (Optional)
                </label>
                <input
                  id="loc-yt"
                  type="url"
                  value={locationForm.youtubeUrl || ''}
                  onChange={(e) => setLocationForm((p) => ({ ...p, youtubeUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/@yourchannel"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#09090B] border border-slate-200 dark:border-white/[0.08] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Exact Map Pin Coordinates</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Enter Latitude and Longitude directly or use the address lookup button.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLookupCoordinates}
                  disabled={geocoding}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.14] border border-slate-200 dark:border-transparent disabled:opacity-60 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer shrink-0"
                >
                  {geocoding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  )}
                  <span>{geocoding ? 'Looking Up...' : 'Lookup Coordinates from Address'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="loc-lat" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                    Latitude
                  </label>
                  <input
                    id="loc-lat"
                    type="text"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm((p) => ({ ...p, latitude: e.target.value }))}
                    placeholder="e.g. 19.0176"
                    className="w-full h-11 px-3.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="loc-lng" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                    Longitude
                  </label>
                  <input
                    id="loc-lng"
                    type="text"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm((p) => ({ ...p, longitude: e.target.value }))}
                    placeholder="e.g. 72.8162"
                    className="w-full h-11 px-3.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="loc-url" className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1.5">
                  Direct Google Maps URL (Optional)
                </label>
                <input
                  id="loc-url"
                  type="url"
                  value={locationForm.googleMapsUrl}
                  onChange={(e) => setLocationForm((p) => ({ ...p, googleMapsUrl: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full h-11 px-3.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-500"
                />
              </div>

              {parseCoordinates(locationForm) && buildDirectionsUrl(locationForm) && (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Valid coordinates active. Directions link ready for Google Maps navigation.
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={savingLocation}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {savingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingLocation ? 'Saving Settings...' : 'Save Location Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <AdminCarModal
        car={editingCar}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(saved) => {
          setCars((prev) => {
            const exists = prev.some((c) => c.id === saved.id);
            return exists ? prev.map((c) => (c.id === saved.id ? saved : c)) : [saved, ...prev];
          });
          fetchAdminOverview().then(setOverview).catch(() => {});
        }}
      />

      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.1] p-6 space-y-4 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Delete Vehicle Listing?</h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              This will permanently remove the vehicle from the marketplace and cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium text-slate-700 dark:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCar}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
