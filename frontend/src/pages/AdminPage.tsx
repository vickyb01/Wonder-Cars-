import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Calendar,
  Camera,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Globe,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  UploadCloud,
  User,
  UserCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import type {
  AboutSettings,
  ActivityLogItem,
  AdminOverview,
  AdminUser,
  BrandItem,
  BusinessLocationSettings,
  Car as CarType,
  CarStatus,
  CategoryItem,
  Enquiry,
  EnquiryStatus,
  HomepageSettings,
  NotificationItem,
  SellRequest,
  SellRequestStatus,
  TestimonialItem,
  WebsiteSettings,
} from '../types/car';
import {
  adminForgotPassword,
  adminLogin,
  adminResetPassword,
  clearAdminToken,
  createAdminUser,
  createBrand,
  createCategory,
  createTestimonial,
  deleteAdminUser,
  deleteBrand,
  deleteCar,
  deleteCategory,
  deleteEnquiry,
  deleteMediaFile,
  deleteSellRequest,
  deleteTestimonial,
  downloadEnquiriesCsv,
  duplicateCar,
  fetchAboutSettings,
  fetchActivityLogs,
  fetchAdminEnquiries,
  fetchAdminOverview,
  fetchAdminProfile,
  fetchAdminSellRequests,
  fetchAdminTestimonials,
  fetchAdminUsers,
  fetchBrands,
  fetchBusinessLocation,
  fetchCars,
  fetchCategories,
  fetchHomepageSettings,
  fetchMediaLibrary,
  fetchNotifications,
  fetchWebsiteSettings,
  geocodeLocationServer,
  getAdminToken,
  markAllNotificationsRead,
  markNotificationRead,
  patchCarFeatured,
  patchCarStatus,
  setAdminToken,
  updateAboutSettings,
  updateAdminProfile,
  updateAdminUser,
  updateBrand,
  updateBusinessLocation,
  updateCar,
  updateCategory,
  updateEnquiry,
  updateHomepageSettings,
  updateSellRequestStatus,
  updateTestimonial,
  updateWebsiteSettings,
  uploadCarImages,
  verifyAdminSession,
} from '../utils/api';
import { EMPTY_LOCATION_SETTINGS, buildDirectionsUrl, formatFullAddress } from '../utils/location';
import { buildWhatsAppUrl, formatINR, formatINRCompact, formatKm } from '../utils/format';
import { AdminCarModal } from '../components/AdminCarModal';
import { SeoHead } from '../components/SeoHead';
import { VehicleImage } from '../components/VehicleImage';

export type AdminTab =
  | 'dashboard'
  | 'cars'
  | 'add-car'
  | 'categories-brands'
  | 'enquiries'
  | 'contact-messages'
  | 'homepage'
  | 'about'
  | 'testimonials'
  | 'media'
  | 'users'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'profile';

const inputCls =
  'w-full h-10 px-3 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all';

const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

export function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name?: string; email: string; role?: string; avatar?: string } | null>(null);

  // Authentication states
  const [emailInput, setEmailInput] = useState('admin@wondercars.in');
  const [passwordInput, setPasswordInput] = useState('WonderCars@2026');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetStage, setResetStage] = useState<'request' | 'reset'>('request');

  // Active Tab & Dashboard State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loadingData, setLoadingData] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Core Data
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [cars, setCars] = useState<CarType[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [sellRequests, setSellRequests] = useState<SellRequest[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null);
  const [aboutSettings, setAboutSettings] = useState<AboutSettings | null>(null);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [locationForm, setLocationForm] = useState<BusinessLocationSettings>(EMPTY_LOCATION_SETTINGS);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mediaFiles, setMediaFiles] = useState<Array<{ filename: string; url: string; size: number; createdAt: string }>>([]);

  // UI Modals & Actions
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileCurrentPw, setProfileCurrentPw] = useState('');
  const [profileNewPw, setProfileNewPw] = useState('');
  const [profileConfirmPw, setProfileConfirmPw] = useState('');

  // Car Management State
  const [carModalOpen, setCarModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);
  const [carSearch, setCarSearch] = useState('');
  const [carBrandFilter, setCarBrandFilter] = useState('All');
  const [carStatusFilter, setCarStatusFilter] = useState<'All' | CarStatus>('All');
  const [deleteConfirmCar, setDeleteConfirmCar] = useState<CarType | null>(null);

  // Enquiries CRM State
  const [enquiryFilter, setEnquiryFilter] = useState<'All' | EnquiryStatus>('All');
  const [enquirySearch, setEnquirySearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [enquiryNotesDraft, setEnquiryNotesDraft] = useState('');
  const [enquiryFollowUpDraft, setEnquiryFollowUpDraft] = useState('');

  // Forms saving states & feedbacks
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // User Management Form State
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'staff'>('staff');

  // Testimonial Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testName, setTestName] = useState('');
  const [testCar, setTestCar] = useState('');
  const [testCity, setTestCity] = useState('');
  const [testRating, setTestRating] = useState(5);
  const [testReview, setTestReview] = useState('');
  const [testImage, setTestImage] = useState('');
  const [testPublished, setTestPublished] = useState(true);

  // Category & Brand Modal State
  const [newCatName, setNewCatName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandOrigin, setNewBrandOrigin] = useState('');

  const unreadNotifsCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Load entire admin ecosystem
  const loadDashboardData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [
        ov,
        carList,
        enqList,
        sellList,
        locRes,
        catList,
        brandList,
        homeSet,
        aboutSet,
        testList,
        webSet,
        userList,
        logList,
        notifList,
        mediaList,
      ] = await Promise.all([
        fetchAdminOverview().catch(() => null),
        fetchCars({ includeDrafts: 'true', sort: 'newest' }).catch(() => []),
        fetchAdminEnquiries().catch(() => []),
        fetchAdminSellRequests().catch(() => []),
        fetchBusinessLocation().catch(() => ({ location: EMPTY_LOCATION_SETTINGS, mapsApiKey: '' })),
        fetchCategories().catch(() => []),
        fetchBrands().catch(() => []),
        fetchHomepageSettings().catch(() => null),
        fetchAboutSettings().catch(() => null),
        fetchAdminTestimonials().catch(() => []),
        fetchWebsiteSettings().catch(() => null),
        fetchAdminUsers().catch(() => []),
        fetchActivityLogs().catch(() => []),
        fetchNotifications().catch(() => []),
        fetchMediaLibrary().catch(() => []),
      ]);

      if (ov) setOverview(ov);
      setCars(carList);
      setEnquiries(enqList);
      setSellRequests(sellList);
      setLocationForm(locRes.location || EMPTY_LOCATION_SETTINGS);
      setCategories(catList);
      setBrands(brandList);
      if (homeSet) setHomepageSettings(homeSet);
      if (aboutSet) setAboutSettings(aboutSet);
      setTestimonials(testList);
      if (webSet) setWebsiteSettings(webSet);
      setAdminUsers(userList);
      setActivityLogs(logList);
      setNotifications(notifList);
      setMediaFiles(mediaList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Check auth on load
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setAuthChecked(true);
      return;
    }
    verifyAdminSession()
      .then((user) => {
        setCurrentUser(user);
        setProfileName(user.name || '');
        loadDashboardData();
      })
      .catch(() => {
        clearAdminToken();
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, [loadDashboardData]);

  // Handle Login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await adminLogin(emailInput.trim(), passwordInput);
      setAdminToken(res.token);
      const userObj = res.user || { email: res.email, name: res.email.split('@')[0], role: 'admin' };
      setCurrentUser(userObj);
      setProfileName(userObj.name || '');
      await loadDashboardData();
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    } finally {
      setLoggingIn(false);
    }
  }

  // Handle Logout
  function handleLogout() {
    clearAdminToken();
    setCurrentUser(null);
    setLogoutModalOpen(false);
  }

  // Quick Notification Click
  async function handleNotificationClick(notif: NotificationItem) {
    if (!notif.read) {
      try {
        await markNotificationRead(notif.id);
        setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link?.includes('enquiries')) {
      setActiveTab('enquiries');
    } else if (notif.link?.includes('sell-requests')) {
      setActiveTab('contact-messages');
    }
    setNotifDropdownOpen(false);
  }

  // Filtered Cars
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (carBrandFilter !== 'All' && car.brand !== carBrandFilter) return false;
      if (carStatusFilter !== 'All' && car.status !== carStatusFilter) return false;
      if (carSearch.trim()) {
        const q = carSearch.toLowerCase().trim();
        const text = `${car.year} ${car.brand} ${car.model} ${car.variant || ''} ${car.listingCode || ''}`.toLowerCase();
        return text.includes(q);
      }
      return true;
    });
  }, [cars, carBrandFilter, carStatusFilter, carSearch]);

  // Filtered Enquiries
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((e) => {
      if (enquiryFilter !== 'All' && e.status !== enquiryFilter) return false;
      if (enquirySearch.trim()) {
        const q = enquirySearch.toLowerCase().trim();
        const str = `${e.name} ${e.phone} ${e.email} ${e.carTitle || ''} ${e.city || ''}`.toLowerCase();
        return str.includes(q);
      }
      return true;
    });
  }, [enquiries, enquiryFilter, enquirySearch]);

  // Car Actions
  async function handleToggleStatus(carId: string, currentStatus: CarStatus) {
    const nextStatus: CarStatus = currentStatus === 'Available' ? 'Sold' : currentStatus === 'Sold' ? 'Reserved' : 'Available';
    try {
      const updated = await patchCarStatus(carId, nextStatus);
      setCars((prev) => prev.map((c) => (c.id === carId ? updated : c)));
      setSaveFeedback({ type: 'success', text: `Car status changed to ${nextStatus}.` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update status.' });
    }
  }

  async function handleToggleFeatured(carId: string, featured: boolean) {
    try {
      const updated = await patchCarFeatured(carId, !featured);
      setCars((prev) => prev.map((c) => (c.id === carId ? updated : c)));
      setSaveFeedback({ type: 'success', text: `Featured status updated to ${!featured}.` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update featured flag.' });
    }
  }

  async function handleDuplicate(carId: string) {
    try {
      const duplicated = await duplicateCar(carId);
      setCars((prev) => [duplicated, ...prev]);
      setSaveFeedback({ type: 'success', text: `Duplicated car created (${duplicated.listingCode}).` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to duplicate car.' });
    }
  }

  async function handleDeleteCarConfirmed() {
    if (!deleteConfirmCar) return;
    try {
      await deleteCar(deleteConfirmCar.id);
      setCars((prev) => prev.filter((c) => c.id !== deleteConfirmCar.id));
      setDeleteConfirmCar(null);
      setSaveFeedback({ type: 'success', text: 'Car listing deleted successfully.' });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete car.' });
    }
  }

  // Enquiry Update
  async function handleUpdateEnquiryStatus(enqId: string, status: EnquiryStatus) {
    try {
      const updated = await updateEnquiry(enqId, { status });
      setEnquiries((prev) => prev.map((e) => (e.id === enqId ? updated : e)));
      if (selectedEnquiry?.id === enqId) setSelectedEnquiry(updated);
      setSaveFeedback({ type: 'success', text: `Enquiry status updated to ${status}.` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update enquiry.' });
    }
  }

  async function handleSaveEnquiryNotes() {
    if (!selectedEnquiry) return;
    try {
      const updated = await updateEnquiry(selectedEnquiry.id, {
        notes: enquiryNotesDraft,
        followUpDate: enquiryFollowUpDraft,
      });
      setEnquiries((prev) => prev.map((e) => (e.id === selectedEnquiry.id ? updated : e)));
      setSelectedEnquiry(updated);
      setSaveFeedback({ type: 'success', text: 'Enquiry notes & follow-up saved.' });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save notes.' });
    }
  }

  // Location Geocoding & Saving
  async function handleGeocode() {
    if (!locationForm.address) return;
    setGeocoding(true);
    try {
      const query = `${locationForm.address}, ${locationForm.city || ''} ${locationForm.postalCode || ''}`;
      const res = await geocodeLocationServer(query);
      setLocationForm((prev) => ({
        ...prev,
        latitude: res.latitude,
        longitude: res.longitude,
      }));
      setSaveFeedback({ type: 'success', text: `Resolved coordinates: ${res.latitude}, ${res.longitude}` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Geocoding failed. Enter manually.' });
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSaveLocation(e: React.FormEvent) {
    e.preventDefault();
    setSavingLocation(true);
    try {
      const res = await updateBusinessLocation(locationForm);
      setLocationForm(res);
      setSaveFeedback({ type: 'success', text: 'Showroom location details updated.' });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save location.' });
    } finally {
      setSavingLocation(false);
    }
  }

  // Multi Media Upload
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    try {
      const urls = await uploadCarImages(Array.from(files));
      const refetched = await fetchMediaLibrary();
      setMediaFiles(refetched);
      setSaveFeedback({ type: 'success', text: `Uploaded ${urls.length} media files.` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to upload media.' });
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  }

  async function handleDeleteMedia(filename: string) {
    try {
      await deleteMediaFile(filename);
      setMediaFiles((prev) => prev.filter((m) => m.filename !== filename));
      setSaveFeedback({ type: 'success', text: `Deleted ${filename}` });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete file.' });
    }
  }

  // Copy helper
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  }

  // Profile Update
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (profileNewPw && profileNewPw !== profileConfirmPw) {
      setSaveFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    try {
      const res = await updateAdminProfile({
        name: profileName,
        currentPassword: profileCurrentPw || undefined,
        newPassword: profileNewPw || undefined,
      });
      if (res.user) setCurrentUser(res.user);
      setProfileModalOpen(false);
      setProfileCurrentPw('');
      setProfileNewPw('');
      setProfileConfirmPw('');
      setSaveFeedback({ type: 'success', text: 'Admin profile updated successfully.' });
    } catch (err: unknown) {
      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile.' });
    }
  }

  // 16 Sidebar Items strictly defined
  const sidebarNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cars', label: 'Cars Management', icon: Car, badge: cars.length },
    { id: 'add-car', label: 'Add New Car', icon: Plus, isButton: true },
    { id: 'categories-brands', label: 'Categories & Brands', icon: Layers },
    { id: 'enquiries', label: 'Customer Enquiries (CRM)', icon: MessageSquare, badge: enquiries.filter((e) => e.status === 'New').length },
    { id: 'contact-messages', label: 'Contact Messages', icon: Mail, badge: sellRequests.filter((s) => s.status === 'Pending Review').length },
    { id: 'homepage', label: 'Homepage Management', icon: Home },
    { id: 'about', label: 'About Us Management', icon: UserCheck },
    { id: 'testimonials', label: 'Testimonials & Reviews', icon: Star, badge: testimonials.length },
    { id: 'media', label: 'Media Library', icon: Camera, badge: mediaFiles.length },
    { id: 'users', label: 'Users & Permissions', icon: Users, badge: adminUsers.length },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'logout', label: 'Logout', icon: LogOut, isAction: true },
  ] as const;

  // Unauthenticated: Premium White & Navy Login View
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0B1528] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Authenticating Wonder Cars Suite...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
        <SeoHead title="Admin Login — Wonder Cars" description="Secure authentication gateway for Wonder Cars showroom administration." />

        <div className="w-full max-w-md">
          {/* Logo Card Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0F203C] border border-blue-900/50 shadow-xl mb-4">
              <img src="/assets/wonder-cars-logo-dark.png" alt="Wonder Cars" className="h-10 w-auto object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Showroom Control Panel</h1>
            <p className="text-xs text-slate-400 mt-1">Authorized personnel only. Secure 256-bit PBKDF2 session authentication.</p>
          </div>

          {/* Login Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#0B1528] mb-1">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-500 mb-6">Enter your administrative credentials to continue.</p>

            {loginError && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelCls}>Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    placeholder="admin@wondercars.in"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(emailInput);
                      setForgotModalOpen(true);
                      setForgotMsg(null);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full mt-2 h-11 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-60"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Panel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Need help?</span>
              <a href="mailto:support@wondercars.in" className="text-blue-600 hover:underline font-medium">
                Contact Concierge
              </a>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
              <span>← Back to Wonder Cars Public Showroom</span>
            </Link>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 text-base">Reset Admin Password</h3>
                <button type="button" onClick={() => setForgotModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {forgotMsg && (
                <div
                  className={`p-3 rounded-lg text-xs mb-4 ${
                    forgotMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {forgotMsg.text}
                </div>
              )}

              {resetStage === 'request' ? (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter the registered administrator email. A secure verification reset code will be generated.
                  </p>
                  <div>
                    <label className={labelCls}>Administrator Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputCls}
                      placeholder="admin@wondercars.in"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!forgotEmail) return;
                      try {
                        const res = await adminForgotPassword(forgotEmail);
                        setForgotMsg({ type: 'success', text: `Verification Code: ${res.resetCode}` });
                        setResetCodeInput(res.resetCode || '');
                        setResetStage('reset');
                      } catch (err: unknown) {
                        setForgotMsg({ type: 'error', text: err instanceof Error ? err.message : 'Error generating code.' });
                      }
                    }}
                    className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                  >
                    Generate Verification Code
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Reset Verification Code</label>
                    <input
                      type="text"
                      value={resetCodeInput}
                      onChange={(e) => setResetCodeInput(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>New Secure Password</label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className={inputCls}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newPasswordInput) return;
                      try {
                        await adminResetPassword(forgotEmail, newPasswordInput);
                        setForgotMsg({ type: 'success', text: 'Password reset successful! Please log in.' });
                        setTimeout(() => {
                          setForgotModalOpen(false);
                          setResetStage('request');
                        }, 1500);
                      } catch (err: unknown) {
                        setForgotMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to reset password.' });
                      }
                    }}
                    className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                  >
                    Update Password & Finish
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Authenticated State: Premium Modern White and Navy-Blue Layout
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      <SeoHead title="Admin Dashboard — Wonder Cars" description="Wonder Cars professional showroom management dashboard." />

      {/* TOP HEADER BAR (Clean White with Navy Accents) */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-xs">
        {/* Left: Mobile Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Sliders className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/assets/wonder-cars-logo.png" alt="Wonder Cars" className="h-8 w-auto object-contain hidden sm:block" />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <span className="font-bold text-sm text-[#0B1528] tracking-tight">Admin Suite</span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Showroom Connected
            </span>
          </div>
        </div>

        {/* Right: Actions, Public Website Link, Notifications & User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Live Public Website */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
            title="Open public website in new tab"
          >
            <span>View Website</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {/* Quick Refresh Data */}
          <button
            type="button"
            onClick={() => loadDashboardData()}
            disabled={loadingData}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh database state"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifDropdownOpen((prev) => !prev)}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                  <span className="text-xs font-bold text-slate-900">Notifications ({unreadNotifsCount} unread)</span>
                  {unreadNotifsCount > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await markAllNotificationsRead();
                        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                          n.read ? 'bg-slate-50 text-slate-600' : 'bg-blue-50/70 text-slate-900 font-medium border border-blue-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Quick Edit */}
          <div
            onClick={() => {
              setActiveTab('profile');
              setProfileModalOpen(true);
            }}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Manage profile & password"
          >
            <div className="w-7 h-7 rounded-full bg-[#0B1528] text-white flex items-center justify-center font-bold text-xs">
              {currentUser.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#0B1528] leading-tight truncate max-w-[120px]">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-semibold">{currentUser.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* WORKSPACE LAYOUT (Navy Sidebar + White Content) */}
      <div className="flex-1 flex overflow-hidden">
        {/* PROFESSIONAL LEFT SIDEBAR (Navy Blue #0B1528) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0B1528] border-r border-[#1E293B] flex flex-col justify-between transition-transform duration-300 shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Scrollable Navigation Items */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Admin Navigation
            </div>

            {sidebarNavItems.map((item, idx) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              // Logout Action
              if ('isAction' in item && item.isAction) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLogoutModalOpen(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-all cursor-pointer mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-red-400" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              }

              // Special "Add New Car" Action Button
              if ('isButton' in item && item.isButton) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEditingCar(null);
                      setCarModalOpen(true);
                      setActiveTab('cars');
                      setSidebarOpen(false);
                    }}
                    className="w-full my-2 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus className="w-4 h-4 text-white" />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white uppercase font-bold">New</span>
                  </button>
                );
              }

              // Standard Nav Link
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setSidebarOpen(false);
                    setSaveFeedback(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? 'bg-[#1E3A8A] text-white font-bold shadow-sm border-l-4 border-blue-500 pl-2.5'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                        active ? 'bg-white text-blue-900' : 'bg-blue-900/60 text-blue-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3.5 border-t border-[#1E293B] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Wonder Cars Pro</span>
            <span className="text-emerald-400 font-mono text-[10px]">v2.6 Stable</span>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Global Alert Notification */}
          {saveFeedback && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
                saveFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {saveFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{saveFeedback.text}</span>
              </div>
              <button type="button" onClick={() => setSaveFeedback(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Showroom Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-1">Live telemetry across vehicle inventory, CRM enquiries, and showroom traffic.</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCar(null);
                      setCarModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Car</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadEnquiriesCsv()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CRM</span>
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><Car className="w-4 h-4" /></span>
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-extrabold text-[#0B1528]">{cars.length}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                      <span>{cars.filter((c) => c.status === 'Available').length} Available</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{cars.filter((c) => c.status === 'Sold').length} Sold</span>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enquiries</span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><MessageSquare className="w-4 h-4" /></span>
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-extrabold text-[#0B1528]">{enquiries.length}</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      {enquiries.filter((e) => e.status === 'New').length} New Pending Action
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sell Car Leads</span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Tag className="w-4 h-4" /></span>
                  </div>
                  <div className="mt-3">
                    <p className="text-3xl font-extrabold text-[#0B1528]">{sellRequests.length}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {sellRequests.filter((s) => s.status === 'Pending Review').length} Awaiting Valuation
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Value</span>
                    <span className="p-2 rounded-xl bg-purple-50 text-purple-600"><DollarSign className="w-4 h-4" /></span>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-[#0B1528]">
                      {formatINRCompact(cars.filter((c) => c.status === 'Available').reduce((sum, c) => sum + c.priceInr, 0))}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Available Fleet Valuation</p>
                  </div>
                </div>
              </div>

              {/* 2 Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Car Listings Influx */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-[#0B1528]">Monthly Car Listings</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Inventory onboarding over last 6 months</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">Fleet Telemetry</span>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                    {overview?.monthlyListings.map((item) => {
                      const heightPercent = Math.min(100, Math.max(15, (item.count / 10) * 100));
                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-700">{item.count}</span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[40px] bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-lg transition-all duration-300 hover:brightness-110"
                          />
                          <span className="text-xs text-slate-500 font-medium">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly CRM Inquiries */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-sm text-[#0B1528]">Monthly Client Enquiries</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Test-drives and inspection requests</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">Client CRM</span>
                  </div>
                  <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                    {overview?.monthlyEnquiries.map((item) => {
                      const heightPercent = Math.min(100, Math.max(15, (item.count / 16) * 100));
                      return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[10px] font-bold text-slate-700">{item.count}</span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[40px] bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg transition-all duration-300 hover:brightness-110"
                          />
                          <span className="text-xs text-slate-500 font-medium">{item.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Cars & Recent CRM Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Added Cars */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#0B1528]">Recently Added Vehicles</h3>
                    <button type="button" onClick={() => setActiveTab('cars')} className="text-xs text-blue-600 hover:underline font-semibold">
                      View All Fleet →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {cars.slice(0, 5).map((car) => (
                      <div key={car.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                            {car.images?.[0] ? (
                              <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Car className="w-4 h-4" /></div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{car.year} {car.brand} {car.model}</p>
                            <p className="text-[11px] text-slate-500">{car.listingCode} • {formatINRCompact(car.priceInr)}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            car.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {car.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent CRM Enquiries */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#0B1528]">Recent Customer Enquiries</h3>
                    <button type="button" onClick={() => setActiveTab('enquiries')} className="text-xs text-blue-600 hover:underline font-semibold">
                      View All CRM →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {enquiries.slice(0, 5).map((enq) => (
                      <div key={enq.id} className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{enq.name}</p>
                          <p className="text-[11px] text-slate-500">{enq.carTitle || 'General Enquiry'} • {enq.phone}</p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            enq.status === 'New'
                              ? 'bg-amber-100 text-amber-800'
                              : enq.status === 'Converted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {enq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CARS MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'cars' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Car Fleet Management</h1>
                  <p className="text-xs text-slate-500 mt-1">Add, edit, duplicate, set pricing, photos, and live availability of inventory.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCar(null);
                    setCarModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Car</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={carSearch}
                    onChange={(e) => setCarSearch(e.target.value)}
                    placeholder="Search model, variant, code..."
                    className={`${inputCls} pl-10`}
                  />
                </div>
                <select
                  value={carBrandFilter}
                  onChange={(e) => setCarBrandFilter(e.target.value)}
                  className={inputCls}
                >
                  <option value="All">All Brands ({cars.length})</option>
                  {Array.from(new Set(cars.map((c) => c.brand))).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <select
                  value={carStatusFilter}
                  onChange={(e) => setCarStatusFilter(e.target.value as 'All' | CarStatus)}
                  className={inputCls}
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Sold">Sold</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              {/* Cars Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Car Details</th>
                        <th className="py-3 px-4">Price (INR)</th>
                        <th className="py-3 px-4">KM & Fuel</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Featured</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCars.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No vehicles found matching current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCars.map((car) => (
                          <tr key={car.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                  {car.images?.[0] ? (
                                    <img src={car.images[0]} alt={car.model} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Car className="w-4 h-4" /></div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{car.year} {car.brand} {car.model}</p>
                                  <p className="text-[11px] text-slate-500">{car.variant || 'Standard'} • <span className="font-mono text-blue-700">{car.listingCode}</span></p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {formatINR(car.priceInr)}
                              {car.discountNote && <span className="block text-[10px] text-emerald-600 font-normal">{car.discountNote}</span>}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <p>{formatKm(car.kilometres)}</p>
                              <p className="text-[11px] text-slate-400">{car.fuelType} • {car.transmission}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(car.id, car.status)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                                  car.status === 'Available'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : car.status === 'Sold'
                                    ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                                    : car.status === 'Reserved'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {car.status}
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => handleToggleFeatured(car.id, car.featured)}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                  car.featured ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-slate-500'
                                }`}
                                title={car.featured ? 'Featured on Homepage' : 'Not Featured'}
                              >
                                <Star className={`w-4 h-4 ${car.featured ? 'fill-amber-400' : ''}`} />
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  to={`/cars/${car.slug || car.id}`}
                                  target="_blank"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                  title="View on Live Site"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleDuplicate(car.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Duplicate Listing"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCar(car);
                                    setCarModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                                  title="Edit Vehicle"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmCar(car)}
                                  className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Listing"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ADD NEW CAR (Direct Entry) */}
          {/* ========================================================================= */}
          {activeTab === 'add-car' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center max-w-xl mx-auto my-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <Plus className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#0B1528]">Create New Car Listing</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Launch the complete vehicle listing dossier to configure brand, variant, pricing, specs, multi-angle photos, and 210-point mechanical inspection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingCar(null);
                  setCarModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                Launch Vehicle Creation Form
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CATEGORIES & BRANDS */}
          {/* ========================================================================= */}
          {activeTab === 'categories-brands' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Categories & Brands Management</h1>
                <p className="text-xs text-slate-500 mt-1">Manage automotive segments (SUV, Sedan, Electric) and luxury brand catalogs.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categories */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0B1528]">Vehicle Categories ({categories.length})</h3>
                  </div>
                  {/* Add Category Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Convertible, Luxury EV"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCatName.trim()) return;
                        try {
                          const res = await createCategory({ name: newCatName.trim() });
                          setCategories((prev) => [...prev, res]);
                          setNewCatName('');
                          setSaveFeedback({ type: 'success', text: `Added category: ${res.name}` });
                        } catch (err: unknown) {
                          setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add category' });
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {/* Categories List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">slug: {cat.slug}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteCategory(cat.id);
                              setCategories((prev) => prev.filter((c) => c.id !== cat.id));
                              setSaveFeedback({ type: 'success', text: `Deleted category: ${cat.name}` });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0B1528]">Automotive Brands ({brands.length})</h3>
                  </div>
                  {/* Add Brand Form */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="Brand Name (e.g. Ferrari)"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={newBrandOrigin}
                      onChange={(e) => setNewBrandOrigin(e.target.value)}
                      placeholder="Origin (e.g. Italy)"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newBrandName.trim()) return;
                      try {
                        const res = await createBrand({ name: newBrandName.trim(), origin: newBrandOrigin.trim() });
                        setBrands((prev) => [...prev, res]);
                        setNewBrandName('');
                        setNewBrandOrigin('');
                        setSaveFeedback({ type: 'success', text: `Added brand: ${res.name}` });
                      } catch (err: unknown) {
                        setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add brand' });
                      }
                    }}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                  >
                    Add Brand
                  </button>
                  {/* Brands List */}
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {brands.map((brand) => (
                      <div key={brand.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{brand.name}</p>
                          <p className="text-[10px] text-slate-400">{brand.origin || 'Import'} • slug: {brand.slug}</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await deleteBrand(brand.id);
                              setBrands((prev) => prev.filter((b) => b.id !== brand.id));
                              setSaveFeedback({ type: 'success', text: `Deleted brand: ${brand.name}` });
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CUSTOMER ENQUIRIES (CRM) */}
          {/* ========================================================================= */}
          {activeTab === 'enquiries' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Customer Enquiries CRM</h1>
                  <p className="text-xs text-slate-500 mt-1">Manage buyer leads, inspection schedules, price offers, and follow-ups.</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadEnquiriesCsv()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Enquiries CSV</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={enquirySearch}
                  onChange={(e) => setEnquirySearch(e.target.value)}
                  placeholder="Search buyer name, phone, email, car..."
                  className={inputCls}
                />
                <select
                  value={enquiryFilter}
                  onChange={(e) => setEnquiryFilter(e.target.value as 'All' | EnquiryStatus)}
                  className={inputCls}
                >
                  <option value="All">All Statuses ({enquiries.length})</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Interested">Interested</option>
                  <option value="Converted">Converted</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Enquiries Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  {filteredEnquiries.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs">
                      No customer enquiries found matching current filters.
                    </div>
                  ) : (
                    filteredEnquiries.map((enq) => (
                      <div
                        key={enq.id}
                        onClick={() => {
                          setSelectedEnquiry(enq);
                          setEnquiryNotesDraft(enq.notes || '');
                          setEnquiryFollowUpDraft(enq.followUpDate || '');
                        }}
                        className={`bg-white rounded-2xl border p-4 shadow-xs transition-all cursor-pointer ${
                          selectedEnquiry?.id === enq.id ? 'border-blue-600 ring-2 ring-blue-600/10' : 'border-slate-200/90 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#0B1528]">{enq.name}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-700">
                                {enq.type}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-blue-700 mt-0.5">{enq.carTitle || 'General Showroom Inquiry'}</p>
                            <p className="text-xs text-slate-500 mt-1">{enq.phone} • {enq.email} • {enq.city || 'Delhi NCR'}</p>
                          </div>
                          <select
                            value={enq.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateEnquiryStatus(enq.id, e.target.value as EnquiryStatus)}
                            className="text-xs font-bold rounded-lg px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Interested">Interested</option>
                            <option value="Converted">Converted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mt-3 italic">
                          "{enq.message}"
                        </p>
                        {enq.offerPriceInr && (
                          <p className="text-xs font-semibold text-emerald-700 mt-2">
                            Offer Price: {formatINR(enq.offerPriceInr)}
                          </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{new Date(enq.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${enq.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                            <a
                              href={buildWhatsAppUrl(enq.phone, `Hi ${enq.name}, following up regarding your enquiry for ${enq.carTitle || 'car'} at Wonder Cars.`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Enquiry Notes Drawer */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs h-fit space-y-4">
                  <h3 className="font-bold text-sm text-[#0B1528]">Lead Follow-up Notes</h3>
                  {selectedEnquiry ? (
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 font-medium">Selected Lead:</span>
                        <p className="text-sm font-bold text-slate-900">{selectedEnquiry.name}</p>
                        <p className="text-xs text-slate-600">{selectedEnquiry.phone}</p>
                      </div>
                      <div>
                        <label className={labelCls}>Next Follow-up Reminder Date</label>
                        <input
                          type="date"
                          value={enquiryFollowUpDraft}
                          onChange={(e) => setEnquiryFollowUpDraft(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Internal Staff Notes</label>
                        <textarea
                          rows={4}
                          value={enquiryNotesDraft}
                          onChange={(e) => setEnquiryNotesDraft(e.target.value)}
                          placeholder="Client interested in financing, offered ₹1.80 Cr, requested test drive on Sunday..."
                          className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveEnquiryNotes}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                      >
                        Save Notes & Reminder
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Select any enquiry card from the left to view and add internal follow-up notes.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: CONTACT MESSAGES & VALUATION REQUESTS */}
          {/* ========================================================================= */}
          {activeTab === 'contact-messages' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Sell Car Requests & Messages</h1>
                <p className="text-xs text-slate-500 mt-1">Doorstep car inspection requests, seller details, and customer valuations.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-3 px-4">Owner Name</th>
                        <th className="py-3 px-4">Vehicle Details</th>
                        <th className="py-3 px-4">Expected Price</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sellRequests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No sell car valuation requests submitted yet.
                          </td>
                        </tr>
                      ) : (
                        sellRequests.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{s.ownerName}</p>
                              <p className="text-slate-500 text-[11px]">{s.ownerPhone} • {s.ownerEmail}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{s.year} {s.brand} {s.model}</p>
                              <p className="text-slate-500 text-[11px]">{formatKm(s.kilometres)} • {s.fuelType} • {s.ownership}</p>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-700">
                              {formatINR(s.expectedPriceInr)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={s.status}
                                onChange={async (e) => {
                                  const updated = await updateSellRequestStatus(s.id, e.target.value as SellRequestStatus);
                                  setSellRequests((prev) => prev.map((item) => (item.id === s.id ? updated : item)));
                                }}
                                className="text-xs font-semibold rounded-lg px-2 py-1 bg-slate-100 border border-slate-200"
                              >
                                <option value="Pending Review">Pending Review</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Inspected">Inspected</option>
                                <option value="Deal Closed">Deal Closed</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <a
                                  href={`tel:${s.ownerPhone}`}
                                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                                  title="Call Owner"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                                <a
                                  href={buildWhatsAppUrl(s.ownerPhone, `Hello ${s.ownerName}, regarding your ${s.year} ${s.brand} ${s.model} valuation on Wonder Cars.`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                  title="WhatsApp Owner"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await deleteSellRequest(s.id);
                                    setSellRequests((prev) => prev.filter((item) => item.id !== s.id));
                                  }}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                                  title="Delete Request"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: HOMEPAGE MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'homepage' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Homepage Management</h1>
                <p className="text-xs text-slate-500 mt-1">Configure hero headlines, festive promotional banner, and featured car highlights.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                <h3 className="font-bold text-sm text-[#0B1528] pb-2 border-b border-slate-100">Hero Section Banners & Text</h3>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Hero Main Heading</label>
                    <input
                      type="text"
                      value={homepageSettings?.heroHeading || ''}
                      onChange={(e) =>
                        setHomepageSettings((prev) => (prev ? { ...prev, heroHeading: e.target.value } : null))
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Hero Subheadline</label>
                    <input
                      type="text"
                      value={homepageSettings?.heroSubheadline || ''}
                      onChange={(e) =>
                        setHomepageSettings((prev) => (prev ? { ...prev, heroSubheadline: e.target.value } : null))
                      }
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Hero Tagline Description</label>
                    <textarea
                      rows={3}
                      value={homepageSettings?.heroTagline || ''}
                      onChange={(e) =>
                        setHomepageSettings((prev) => (prev ? { ...prev, heroTagline: e.target.value } : null))
                      }
                      className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  {/* Promotional Banner */}
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        Festive Promotional Top Announcement Bar
                      </span>
                      <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(homepageSettings?.promotionalBannerActive)}
                          onChange={(e) =>
                            setHomepageSettings((prev) =>
                              prev ? { ...prev, promotionalBannerActive: e.target.checked } : null
                            )
                          }
                          className="rounded text-amber-600"
                        />
                        <span>Active</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={homepageSettings?.promotionalBannerText || ''}
                      onChange={(e) =>
                        setHomepageSettings((prev) =>
                          prev ? { ...prev, promotionalBannerText: e.target.value } : null
                        )
                      }
                      placeholder="Special Festive Offer: 0% Processing Fee on Luxury Auto Loans..."
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!homepageSettings) return;
                    try {
                      await updateHomepageSettings(homepageSettings);
                      setSaveFeedback({ type: 'success', text: 'Homepage settings updated successfully.' });
                    } catch (err: unknown) {
                      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update homepage settings' });
                    }
                  }}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Save Homepage Configuration
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: ABOUT US MANAGEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">About Us & Owner Profile</h1>
                <p className="text-xs text-slate-500 mt-1">Manage founder Naman Jain’s biography, showroom story, and YouTube video gallery.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-[#0B1528] pb-2 border-b border-slate-100">Owner Details & Bio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Founder / Owner Name</label>
                    <input
                      type="text"
                      value={aboutSettings?.ownerName || ''}
                      onChange={(e) =>
                        setAboutSettings((prev) => (prev ? { ...prev, ownerName: e.target.value } : null))
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Designation</label>
                    <input
                      type="text"
                      value={aboutSettings?.ownerDesignation || ''}
                      onChange={(e) =>
                        setAboutSettings((prev) => (prev ? { ...prev, ownerDesignation: e.target.value } : null))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Owner Philosophy Quote</label>
                  <textarea
                    rows={2}
                    value={aboutSettings?.ownerPhilosophy || ''}
                    onChange={(e) =>
                      setAboutSettings((prev) => (prev ? { ...prev, ownerPhilosophy: e.target.value } : null))
                    }
                    className="w-full p-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!aboutSettings) return;
                    try {
                      await updateAboutSettings(aboutSettings);
                      setSaveFeedback({ type: 'success', text: 'About Us settings saved successfully.' });
                    } catch (err: unknown) {
                      setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update About settings' });
                    }
                  }}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Save About Us Changes
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 9: TESTIMONIALS & REVIEWS */}
          {/* ========================================================================= */}
          {activeTab === 'testimonials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Testimonials & Reviews</h1>
                  <p className="text-xs text-slate-500 mt-1">Publish verified customer delivery feedback, ratings, and vehicle purchase stories.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTestimonial(null);
                    setTestName('');
                    setTestCar('');
                    setTestCity('');
                    setTestRating(5);
                    setTestReview('');
                    setTestModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Review</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((test) => (
                  <div key={test.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#0B1528]">{test.customerName || test.name}</span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: test.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-blue-700 mt-0.5">{test.carPurchased}</p>
                      <p className="text-[11px] text-slate-400">{test.city || 'Delhi NCR'} • {test.date || 'Recent'}</p>
                      <p className="text-xs text-slate-600 mt-3 italic leading-relaxed">"{test.review}"</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${test.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {test.published ? 'Published' : 'Hidden'}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteTestimonial(test.id);
                          setTestimonials((prev) => prev.filter((t) => t.id !== test.id));
                          setSaveFeedback({ type: 'success', text: 'Review deleted.' });
                        }}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit Review Modal */}
              {testModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">Add Verified Customer Review</h3>
                      <button type="button" onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div>
                      <label className={labelCls}>Customer Name</label>
                      <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} className={inputCls} placeholder="e.g. Dr. Priya Aggarwal" />
                    </div>
                    <div>
                      <label className={labelCls}>Vehicle Purchased</label>
                      <input type="text" value={testCar} onChange={(e) => setTestCar(e.target.value)} className={inputCls} placeholder="e.g. 2021 Mercedes-Benz E-Class" />
                    </div>
                    <div>
                      <label className={labelCls}>Rating (1 to 5 Stars)</label>
                      <select value={testRating} onChange={(e) => setTestRating(Number(e.target.value))} className={inputCls}>
                        <option value={5}>5 Stars ★★★★★</option>
                        <option value={4}>4 Stars ★★★★☆</option>
                        <option value={3}>3 Stars ★★★☆☆</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Review Text</label>
                      <textarea rows={3} value={testReview} onChange={(e) => setTestReview(e.target.value)} className="w-full p-2.5 rounded-lg border text-xs" />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!testName.trim() || !testReview.trim()) return;
                        try {
                          const res = await createTestimonial({
                            name: testName.trim(),
                            carPurchased: testCar.trim(),
                            rating: testRating,
                            review: testReview.trim(),
                            published: testPublished,
                          });
                          setTestimonials((prev) => [res, ...prev]);
                          setTestModalOpen(false);
                          setSaveFeedback({ type: 'success', text: 'Testimonial added successfully.' });
                        } catch (err: unknown) {
                          setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to add review' });
                        }
                      }}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Publish Review
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 10: MEDIA LIBRARY */}
          {/* ========================================================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Showroom Media Library</h1>
                  <p className="text-xs text-slate-500 mt-1">Upload and manage vehicle photos, exterior angles, dashboard and interior assets.</p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer">
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingMedia ? 'Uploading...' : 'Upload Photos (Up to 35)'}</span>
                  <input type="file" multiple accept="image/*" onChange={handleMediaUpload} className="hidden" disabled={uploadingMedia} />
                </label>
              </div>

              {/* Media Grid */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                {mediaFiles.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No media files uploaded yet. Click above to upload vehicle photos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {mediaFiles.map((m) => (
                      <div key={m.filename} className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex flex-col justify-between">
                        <div className="aspect-4/3 w-full overflow-hidden">
                          <img src={m.url} alt={m.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-2 bg-white flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[80px]">{m.filename}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(m.url)}
                              className="p-1 rounded text-slate-400 hover:text-slate-800"
                              title="Copy Image URL"
                            >
                              {copiedUrl === m.url ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(m.filename)}
                              className="p-1 rounded text-red-500 hover:bg-red-50"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 11: USERS & PERMISSIONS */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Admin Users & Permissions</h1>
                  <p className="text-xs text-slate-500 mt-1">Manage showroom administrators and staff roles with granular permissions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewUserModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Admin User</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Name & Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-slate-500 text-[11px]">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${u.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {u.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await deleteAdminUser(u.id);
                                setAdminUsers((prev) => prev.filter((item) => item.id !== u.id));
                                setSaveFeedback({ type: 'success', text: `Removed user ${u.name}` });
                              } catch (err: unknown) {
                                setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Cannot delete user' });
                              }
                            }}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add User Modal */}
              {newUserModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">Add New Administrator</h3>
                      <button type="button" onClick={() => setNewUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} className={inputCls} placeholder="e.g. Rajesh Sharma" />
                    </div>
                    <div>
                      <label className={labelCls}>Email Address</label>
                      <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className={inputCls} placeholder="rajesh@wondercars.in" />
                    </div>
                    <div>
                      <label className={labelCls}>Initial Password</label>
                      <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className={inputCls} placeholder="Minimum 6 characters" />
                    </div>
                    <div>
                      <label className={labelCls}>Role Access</label>
                      <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'staff')} className={inputCls}>
                        <option value="admin">Administrator (Full Access)</option>
                        <option value="staff">Showroom Staff (Cars & Leads only)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newUserName || !newUserEmail || !newUserPassword) return;
                        try {
                          await createAdminUser({
                            name: newUserName,
                            email: newUserEmail,
                            password: newUserPassword,
                            role: newUserRole,
                          });
                          const refetched = await fetchAdminUsers();
                          setAdminUsers(refetched);
                          setNewUserModalOpen(false);
                          setSaveFeedback({ type: 'success', text: `Created admin account for ${newUserName}.` });
                        } catch (err: unknown) {
                          setSaveFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Failed to create user' });
                        }
                      }}
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 12: REPORTS & ANALYTICS */}
          {/* ========================================================================= */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Showroom Reports & Analytics</h1>
                <p className="text-xs text-slate-500 mt-1">Deep analytics on vehicle turnover, fuel type distribution, and visitor telemetry.</p>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Average Vehicle Price</span>
                  <p className="text-2xl font-bold text-[#0B1528] mt-2">
                    {formatINRCompact(
                      cars.length > 0 ? cars.reduce((s, c) => s + c.priceInr, 0) / cars.length : 0
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Across active inventory</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Lead Conversion Rate</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-2">
                    {enquiries.length > 0
                      ? `${Math.round((enquiries.filter((e) => e.status === 'Converted').length / enquiries.length) * 100)}%`
                      : '0%'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Inquiries to car sales closed</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Visitors</span>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{overview?.totalVisitors || 14280}</p>
                  <p className="text-xs text-slate-400 mt-1">Digital showroom visits</p>
                </div>
              </div>

              {/* Fuel Type Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                <h3 className="font-bold text-sm text-[#0B1528] mb-4">Inventory Fuel Type Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((fuel) => {
                    const count = cars.filter((c) => c.fuelType.toLowerCase() === fuel.toLowerCase()).length;
                    const percent = cars.length > 0 ? Math.round((count / cars.length) * 100) : 0;
                    return (
                      <div key={fuel} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-700">{fuel}</p>
                        <p className="text-2xl font-bold text-[#0B1528] mt-1">{count} <span className="text-xs font-normal text-slate-500">cars</span></p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div style={{ width: `${percent}%` }} className="bg-blue-600 h-full rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 13: NOTIFICATIONS */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">System & Lead Notifications</h1>
                  <p className="text-xs text-slate-500 mt-1">Real-time alerts for customer inquiries, valuation requests, and updates.</p>
                </div>
                {unreadNotifsCount > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await markAllNotificationsRead();
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      setSaveFeedback({ type: 'success', text: 'All notifications marked as read.' });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs transition-colors"
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${n.read ? 'bg-white' : 'bg-blue-50/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{n.title}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={async () => {
                          await markNotificationRead(n.id);
                          setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
                        }}
                        className="text-xs text-blue-600 hover:underline font-semibold shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 14: WEBSITE SETTINGS */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Website & Showroom Settings</h1>
                <p className="text-xs text-slate-500 mt-1">Showroom phone, WhatsApp, Google Maps coordinates, SEO metadata, and social media.</p>
              </div>

              {/* Showroom Location Form */}
              <form onSubmit={handleSaveLocation} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-sm text-[#0B1528] pb-2 border-b border-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Showroom Location & Contact Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Showroom Name</label>
                    <input
                      type="text"
                      value={locationForm.businessName}
                      onChange={(e) => setLocationForm({ ...locationForm, businessName: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Official Phone</label>
                    <input
                      type="text"
                      value={locationForm.phone}
                      onChange={(e) => setLocationForm({ ...locationForm, phone: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>WhatsApp Number</label>
                    <input
                      type="text"
                      value={locationForm.whatsapp}
                      onChange={(e) => setLocationForm({ ...locationForm, whatsapp: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Official Email</label>
                    <input
                      type="email"
                      value={locationForm.email}
                      onChange={(e) => setLocationForm({ ...locationForm, email: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Showroom Address (Street & Locality)</label>
                  <input
                    type="text"
                    value={locationForm.address}
                    onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Preet Vihar, East Delhi"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>City</label>
                    <input
                      type="text"
                      value={locationForm.city}
                      onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>State / Region</label>
                    <input
                      type="text"
                      value={locationForm.state}
                      onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Postal Code (PIN)</label>
                    <input
                      type="text"
                      value={locationForm.postalCode}
                      onChange={(e) => setLocationForm({ ...locationForm, postalCode: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Coordinates & Geocode */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Map Coordinates (Latitude & Longitude)</span>
                    <button
                      type="button"
                      onClick={handleGeocode}
                      disabled={geocoding}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{geocoding ? 'Resolving...' : 'Auto-Detect via Geocoding'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={locationForm.latitude}
                      onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                      placeholder="Latitude (e.g. 28.6396915)"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={locationForm.longitude}
                      onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                      placeholder="Longitude (e.g. 77.2936307)"
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingLocation}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {savingLocation ? 'Saving Details...' : 'Save Location Settings'}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 15: PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-xl">
              <div>
                <h1 className="text-2xl font-bold text-[#0B1528] tracking-tight">Admin Profile & Security</h1>
                <p className="text-xs text-slate-500 mt-1">Manage your administrator account credentials and password.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-14 h-14 rounded-full bg-[#0B1528] text-white flex items-center justify-center font-bold text-xl">
                    {currentUser.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500">{currentUser.email}</p>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 mt-1 inline-block">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Display Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Change Password (Leave blank to keep current)</h4>
                  <div>
                    <label className={labelCls}>Current Password</label>
                    <input
                      type="password"
                      value={profileCurrentPw}
                      onChange={(e) => setProfileCurrentPw(e.target.value)}
                      placeholder="Required only if changing password"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>New Password</label>
                      <input
                        type="password"
                        value={profileNewPw}
                        onChange={(e) => setProfileNewPw(e.target.value)}
                        placeholder="At least 6 characters"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Confirm New Password</label>
                      <input
                        type="password"
                        value={profileConfirmPw}
                        onChange={(e) => setProfileConfirmPw(e.target.value)}
                        placeholder="Repeat new password"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm cursor-pointer"
                >
                  Update Profile & Password
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Car Modal (CRUD) */}
      <AdminCarModal
        car={editingCar}
        open={carModalOpen}
        onClose={() => setCarModalOpen(false)}
        onSaved={(savedCar) => {
          setCars((prev) => {
            const exists = prev.some((c) => c.id === savedCar.id);
            if (exists) return prev.map((c) => (c.id === savedCar.id ? savedCar : c));
            return [savedCar, ...prev];
          });
          setCarModalOpen(false);
          setSaveFeedback({ type: 'success', text: `Car "${savedCar.model}" saved successfully.` });
        }}
      />

      {/* Delete Car Confirmation Modal */}
      {deleteConfirmCar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Delete Vehicle Listing?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{deleteConfirmCar.year} {deleteConfirmCar.brand} {deleteConfirmCar.model}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmCar(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCarConfirmed}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Sign Out of Admin Suite?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your current session will be safely terminated. You can log back in at any time.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
