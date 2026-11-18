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
export type EnquiryStatus = 'New' | 'Contacted' | 'Scheduled' | 'Closed';

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
  createdAt: string;
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

