export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type TransmissionType = 'Automatic' | 'PDK' | 'DCT' | 'Manual';
export type CarStatus = 'Available' | 'Reserved' | 'Sold' | 'Draft';
export type PriceType = 'Negotiable' | 'Fixed';

export type PhotoCategory =
  | 'Exterior'
  | 'Interior'
  | 'Engine & Mechanical'
  | 'Underbody & Storage';

export interface CarPhoto {
  id: string;
  url: string;
  category: PhotoCategory;
  angleLabel: string;
  caption?: string;
  order: number;
}

export type InspectionCondition =
  | 'Excellent'
  | 'Good'
  | 'Average'
  | 'Needs Attention'
  | 'Not Inspected';

export interface InspectionItem {
  component: string;
  status: InspectionCondition;
  notes?: string;
  photoUrl?: string;
}

export interface TyreDetail {
  position: string;
  brand?: string;
  treadCondition: string;
  replacementNote?: string;
}

export interface BatteryDetails {
  brand?: string;
  age?: string;
  condition: string;
  replacementHistory?: string;
}

export type AccidentStatus =
  | 'No Known Issues (Seller Declared)'
  | 'Issues Disclosed'
  | 'Not Disclosed'
  | 'Unknown'
  | 'Independently Verified';

export interface AccidentHistory {
  overallStatus: AccidentStatus;
  majorAccidents: string;
  minorAccidents: string;
  repaintedPanels: string;
  replacedParts: string;
  floodDamage: string;
  structuralDamage: string;
  insuranceClaims: string;
  majorMechanicalRepairs: string;
  otherRepairNotes?: string;
  evidenceNote?: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  odometerKm?: number;
  serviceCenter: string;
  summary: string;
  receiptNote?: string;
}

export interface ServiceHistory {
  lastServiceDate?: string;
  lastServiceOdometerKm?: number;
  records: ServiceRecord[];
}

export type DocumentStatus =
  | 'Verified'
  | 'Seller Provided'
  | 'Not Verified'
  | 'Expired'
  | 'Not Available';

export interface DocumentItem {
  key: string;
  label: string;
  status: DocumentStatus;
  note?: string;
}

export interface CategorizedFeatures {
  comfort: string[];
  entertainment: string[];
  safety: string[];
  exterior: string[];
}

export interface UsageHistory {
  previousOwnersCount?: number;
  usageType: 'Personal' | 'Commercial' | 'Corporate' | 'Not Disclosed';
  drivingPattern: 'City & Highway' | 'Mostly Highway' | 'Mostly City' | 'Not Disclosed';
  reasonForSelling?: string;
  registrationHistoryNote?: string;
  recordVerification: 'Verified Service Records' | 'Seller Provided' | 'Verification Pending';
}

export interface Car {
  id: string;
  listingCode: string;
  slug: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  registrationYear?: number;
  registrationDate?: string;
  priceInr: number;
  priceType: PriceType;
  priceLastUpdated?: string;
  priceExplanation?: string;
  discountNote?: string;
  marketComparisonNote?: string;
  kilometres: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  ownership: string;
  location: string;
  status: CarStatus;
  featured: boolean;
  featuredOrder?: number;
  category: string;
  bodyType: string;
  color: string;
  interiorColor?: string;
  seatingCapacity?: number;
  doors?: number;
  engineCc?: string;
  engine: string;
  cylinders?: string;
  power: string;
  torque: string;
  drivetrain: string;
  claimedMileage?: string;
  emissionStandard?: string;
  registrationState: string;
  insuranceValidUntil: string;
  warrantyPeriod?: string;
  warrantyDetails?: string;
  images: string[];
  gallery: CarPhoto[];
  videoWalkthroughUrl?: string;
  description: string;
  highlights: string[];
  features: CategorizedFeatures;
  usageHistory: UsageHistory;
  exteriorReport: InspectionItem[];
  interiorReport: InspectionItem[];
  mechanicalReport: InspectionItem[];
  tyreDetails: TyreDetail[];
  batteryDetails: BatteryDetails;
  accidentHistory: AccidentHistory;
  serviceHistory: ServiceHistory;
  documents: DocumentItem[];
  sellerName: string;
  sellerType: 'Certified Gallery' | 'Verified Partner Dealer' | 'Private Consignment';
  sellerProfile?: string;
  sellerPhone: string;
  sellerWhatsapp: string;
  createdAt: string;
}

export type EnquiryType = 'test-drive' | 'inspection' | 'offer' | 'car-enquiry' | 'general';
export type EnquiryStatus = 'New' | 'Contacted' | 'Follow-up' | 'Interested' | 'Converted' | 'Closed' | 'Scheduled';

export interface WhatsappDeliveryResult {
  success: boolean;
  status: 'sent' | 'pending_credentials' | 'failed' | 'logged';
  messageId?: string;
  error?: string;
  provider?: 'whatsapp_business_cloud_api' | 'twilio' | 'simulation_logged';
}

export interface Enquiry {
  id: string;
  type: EnquiryType;
  carId?: string;
  carTitle?: string;
  name: string;
  email: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  city?: string;
  offerPriceInr?: number;
  message: string;
  status: EnquiryStatus;
  notes?: string;
  followUpDate?: string;
  source?: string;
  assignedTo?: string;
  createdAt: string;
  whatsappDelivery?: WhatsappDeliveryResult;
}

export type SellRequestStatus = 'Pending Review' | 'Inspection Booked' | 'Offer Sent' | 'Closed';

export interface SellRequest {
  id: string;
  brand: string;
  model: string;
  year: number;
  kilometres: number;
  fuelType: string;
  transmission: string;
  ownership: string;
  city: string;
  expectedPriceInr: number;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  notes: string;
  status: SellRequestStatus;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'staff';
  permissions?: string[];
  active: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface BrandItem {
  id: string;
  name: string;
  slug: string;
  origin?: string;
  description?: string;
  logo?: string;
}

export interface BudgetOption {
  label: string;
  value: string;
}

export interface HomepageSettings {
  heroHeading: string;
  heroSubheadline: string;
  heroTagline: string;
  heroBadge: string;
  heroSlides: Array<{ src: string; mobileSrc?: string; alt: string }>;
  promotionalBannerText: string;
  promotionalBannerActive: boolean;
  featuredCarIds: string[];
  ctaExploreText: string;
  ctaExploreLink?: string;
  ctaCompareText: string;
  whyChooseHeading: string;
  whyChooseSubheading: string;

  // Search Filter Bar Settings
  searchLabel?: string;
  searchPlaceholder?: string;
  brandLabel?: string;
  brandDefaultText?: string;
  brandOptions?: string[];
  budgetLabel?: string;
  budgetDefaultText?: string;
  budgetOptions?: BudgetOption[];
  fuelLabel?: string;
  fuelDefaultText?: string;
  fuelOptions?: string[];
  searchButtonText?: string;
}

export interface AboutSettings {
  heroBadge: string;
  headline: string;
  subheadline: string;
  heroBgImage?: string;
  heroCarImage?: string;
  heroCarTitle?: string;
  heroCarSubtitle?: string;
  heroCarRating?: string;
  heroStats: Array<{ number: string; label: string }>;
  ownerName: string;
  ownerDesignation: string;
  ownerTagline: string;
  ownerExperience: string;
  ownerBio: string[];
  ownerPhilosophy: string;
  ownerSignature: string;
  ownerImage: string;

  // Why Choose Us
  whyChooseBadge?: string;
  whyChooseTitle?: string;
  whyChooseDescription?: string;
  whyChooseItems?: Array<{ id: string; title: string; highlight: string; description: string; badge: string; iconName: string }>;

  // Certifications
  certificatesBadge?: string;
  certificatesTitle?: string;
  certificatesDescription?: string;
  certificatesItems?: Array<{ id: string; title: string; authority: string; date: string; description: string; badge: string; image: string }>;

  // Showroom & Car Gallery
  galleryBadge: string;
  galleryTitle: string;
  galleryDescription: string;
  galleryItems: Array<{ id: string; title: string; caption: string; image: string; category: string }>;

  // YouTube Videos
  videosBadge: string;
  videosTitle: string;
  videosDescription: string;
  videoItems: Array<{ id: string; title: string; description: string; youtubeId: string; duration?: string; category: string; thumbnailUrl?: string; autoPlayLive?: boolean }>;

  // Social Channels
  instagramUrl?: string;
  instagramHandle?: string;
  instagramBio?: string;
  facebookUrl?: string;
  facebookPageName?: string;
  facebookBio?: string;
  youtubeUrl?: string;
  youtubeChannelName?: string;
  youtubeBio?: string;

  // Showroom Contact & Location Info
  showroomName?: string;
  showroomAddress?: string;
  showroomLandmark?: string;
  showroomCity?: string;
  showroomState?: string;
  showroomPincode?: string;
  showroomPhone?: string;
  showroomEmail?: string;
  showroomWhatsapp?: string;
  showroomOpeningHours?: string;
  googleMapsDirectionsUrl?: string;
  googleMapsEmbedUrl?: string;
}

export interface TestimonialItem {
  id: string;
  name?: string;
  customerName: string;
  carPurchased: string;
  city: string;
  rating: number;
  review: string;
  customerImage?: string;
  published: boolean;
  date: string;
}

export interface WebsiteSettings {
  websiteName: string;
  tagline: string;
  logoLight: string;
  logoDark: string;
  faviconUrl: string;
  primaryPhone: string;
  whatsappNumber: string;
  supportEmail: string;
  showroomAddress: string;
  openingHours: string;
  googleMapsUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  googleAnalyticsId: string;
  whatsappFloatingEnabled: boolean;
  footerAboutText: string;
  copyrightText: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'enquiry' | 'car' | 'system' | 'lead';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminOverview {
  totalCars: number;
  availableCars: number;
  reservedCars: number;
  soldCars: number;
  draftCars: number;
  featuredCars: number;
  totalInventoryValueInr: number;
  newEnquiriesCount: number;
  totalEnquiriesCount: number;
  pendingSellRequestsCount: number;
  totalVisitors: number;
  monthlyListings: Array<{ month: string; count: number }>;
  monthlyEnquiries: Array<{ month: string; count: number }>;
  recentCars: Car[];
  recentSoldCars: Car[];
  recentlySold?: Car[];
  recentEnquiries: Enquiry[];
  recentActivity?: ActivityLogItem[];
}

export interface CarFilters {
  search?: string;
  brand?: string;
  model?: string;
  minPrice?: string;
  maxPrice?: string;
  minEmi?: string;
  maxEmi?: string;
  downPaymentPercent?: string;
  interestRate?: string;
  tenureMonths?: string;
  year?: string;
  fuelType?: string;
  transmission?: string;
  maxKm?: string;
  status?: string;
  featured?: string;
  sort?: string;
  includeDrafts?: string;
}

export interface BusinessLocationSettings {
  businessName: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  openingHours: string;
  nearbyLandmarks: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  updatedAt?: string;
}

export interface LocationApiResponse {
  location: BusinessLocationSettings;
  mapsApiKey: string;
}

