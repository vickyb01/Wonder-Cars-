import fs from 'fs';
import path from 'path';
import { DATA_DIR, DB_PATH } from '../config/index.ts';
import { hashPassword } from './auth.service.ts';
import { normalizeCarRecord } from '../utils/carDefaults.ts';
import type {
  AboutSettings,
  ActivityLogItem,
  AdminUser,
  BrandItem,
  BusinessLocationSettings,
  Car,
  CategoryItem,
  Enquiry,
  HomepageSettings,
  NotificationItem,
  SellRequest,
  TestimonialItem,
  WebsiteSettings,
} from '../models/types.ts';

export interface DatabaseState {
  cars: Car[];
  enquiries: Enquiry[];
  sellRequests: SellRequest[];
  locationSettings: BusinessLocationSettings;
  adminUsers: AdminUser[];
  categories: CategoryItem[];
  brands: BrandItem[];
  homepageSettings: HomepageSettings;
  aboutSettings: AboutSettings;
  testimonials: TestimonialItem[];
  websiteSettings: WebsiteSettings;
  notifications: NotificationItem[];
  activityLogs: ActivityLogItem[];
  visitorCount?: number;
}

export const SEED_ADMIN_USERS: AdminUser[] = [
  {
    id: 'user-admin-1',
    name: 'Naman Jain (Owner & Principal)',
    email: 'admin@wondercars.in',
    passwordHash: hashPassword('WonderCars@2026'),
    role: 'admin',
    permissions: ['cars', 'enquiries', 'homepage', 'about', 'testimonials', 'settings', 'users', 'media'],
    active: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'user-admin-2',
    name: 'Strada Executive Admin',
    email: 'admin@stradamotors.in',
    passwordHash: hashPassword('StradaAdmin@2026'),
    role: 'admin',
    permissions: ['cars', 'enquiries', 'homepage', 'about', 'testimonials', 'settings', 'users', 'media'],
    active: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'user-staff-1',
    name: 'Showroom Concierge',
    email: 'staff@wondercars.in',
    passwordHash: hashPassword('Staff@2026'),
    role: 'staff',
    permissions: ['cars', 'enquiries', 'testimonials'],
    active: true,
    lastLogin: undefined,
    createdAt: '2026-11-15T12:00:00.000Z',
  },
];

export const SEED_CATEGORIES: CategoryItem[] = [
  { id: 'cat-suv', name: 'SUV', slug: 'suv', description: 'Luxury and performance sport utility vehicles' },
  { id: 'cat-sedan', name: 'Sedan', slug: 'sedan', description: 'Executive, luxury, and touring sedans' },
  { id: 'cat-coupe', name: 'Coupe', slug: 'coupe', description: 'High-performance and grand touring 2-door coupes' },
  { id: 'cat-hatchback', name: 'Hatchback', slug: 'hatchback', description: 'Compact and hot hatchbacks' },
  { id: 'cat-luxury', name: 'Luxury Cars', slug: 'luxury-cars', description: 'Flagship luxury vehicles with top tier comfort' },
  { id: 'cat-electric', name: 'Electric Cars', slug: 'electric-cars', description: 'Zero emission high-performance electric vehicles' },
  { id: 'cat-automatic', name: 'Automatic Cars', slug: 'automatic-cars', description: 'Smooth dual-clutch and torque converter transmissions' },
  { id: 'cat-manual', name: 'Manual Cars', slug: 'manual-cars', description: 'Purist stick-shift performance automobiles' },
  { id: 'cat-petrol', name: 'Petrol', slug: 'petrol', description: 'Naturally aspirated and turbocharged petrol powertrains' },
  { id: 'cat-diesel', name: 'Diesel', slug: 'diesel', description: 'High torque, long-range diesel engines' },
  { id: 'cat-cng', name: 'CNG', slug: 'cng', description: 'Economical alternative fuel options' },
  { id: 'cat-budget', name: 'Budget Cars', slug: 'budget-cars', description: 'Certified vehicles under ₹1 Crore' },
  { id: 'cat-premium', name: 'Premium Cars', slug: 'premium-cars', description: 'Exotic and ultra-luxury collector inventory' },
];

export const SEED_BRANDS: BrandItem[] = [
  { id: 'brand-audi', name: 'Audi', slug: 'audi', origin: 'Germany', description: 'RS and e-tron luxury models' },
  { id: 'brand-bmw', name: 'BMW', slug: 'bmw', origin: 'Germany', description: 'The Ultimate Driving Machine — M Performance series' },
  { id: 'brand-mercedes', name: 'Mercedes-Benz', slug: 'mercedes-benz', origin: 'Germany', description: 'AMG and Maybach flagship line' },
  { id: 'brand-porsche', name: 'Porsche', slug: 'porsche', origin: 'Germany', description: 'Precision engineered sports cars from Stuttgart' },
  { id: 'brand-landrover', name: 'Range Rover', slug: 'range-rover', origin: 'United Kingdom', description: 'Peerless all-terrain luxury and British refinement' },
  { id: 'brand-astonmartin', name: 'Aston Martin', slug: 'aston-martin', origin: 'United Kingdom', description: 'Handcrafted British grand tourers and supercars' },
  { id: 'brand-jaguar', name: 'Jaguar', slug: 'jaguar', origin: 'United Kingdom', description: 'Grace, space and pace performance vehicles' },
  { id: 'brand-volvo', name: 'Volvo', slug: 'volvo', origin: 'Sweden', description: 'Scandinavian luxury with pioneering safety' },
];

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroHeading: 'Used Cars Nearby',
  heroSubheadline: 'Delhi-NCR’s Most Trusted Pre-Owned Car Destination!',
  heroTagline: 'Looking for a reliable car in top-notch condition? Every vehicle is 100% certified, professionally detailed, and backed by a 6-month warranty for complete peace of mind.',
  heroBadge: 'Delhi-NCR Certified',
  heroSlides: [
    {
      src: '/src/assets/images/hero_luxury_coupe_1794898128860.jpg',
      alt: 'Luxury satin charcoal grand tourer inside Wonder Cars showroom',
    },
    {
      src: '/src/assets/images/car_porsche_911_1794898129646.jpg',
      alt: 'Porsche 911 Carrera S in architectural showroom lighting',
    },
    {
      src: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
      alt: 'Audi RS e-tron GT inside Wonder Cars flagship gallery',
    },
  ],
  promotionalBannerText: '',
  promotionalBannerActive: false,
  featuredCarIds: ['car-911-carrera-s-2022', 'car-audi-rs-etron-gt-2023', 'car-bmw-m4-comp-2023'],
  ctaExploreText: 'Explore Cars',
  ctaExploreLink: '/cars',
  ctaCompareText: 'Compare Cars',
  whyChooseHeading: 'Why Discerning Collectors Choose Wonder Cars',
  whyChooseSubheading: 'Built on forensic technical diligence, upfront INR pricing, and lasting client relationships across Delhi-NCR.',
  searchLabel: 'Search Model or City',
  searchPlaceholder: 'e.g. 911, G63, Mumbai',
  brandLabel: 'Marque / Brand',
  brandDefaultText: 'All Brands',
  budgetLabel: 'Max Budget (INR)',
  budgetDefaultText: 'Any Budget',
  budgetOptions: [
    { label: 'Up to ₹1.50 Cr', value: '15000000' },
    { label: 'Up to ₹2.00 Cr', value: '20000000' },
    { label: 'Up to ₹3.00 Cr', value: '30000000' },
    { label: 'Up to ₹4.00 Cr', value: '40000000' },
  ],
  fuelLabel: 'Powertrain',
  fuelDefaultText: 'All Fuel Types',
  fuelOptions: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
  searchButtonText: 'Search Cars',
};

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  heroBadge: 'Welcome to Wonder Cars',
  headline: 'More Than Cars, We Build Trust.',
  subheadline: 'Wonder Cars is Delhi-NCR’s premier destination for curated, certified pre-owned luxury and performance automobiles. Founded with an uncompromising commitment to vehicle provenance, forensic quality audits, and transparent customer relationships.',
  heroStats: [
    { number: '10+', label: 'Years Serving Delhi-NCR' },
    { number: '2,500+', label: 'Delighted Clients' },
    { number: '210-Point', label: 'Forensic Quality Check' },
    { number: '4.9 ★', label: 'Average Client Rating' },
  ],
  ownerName: 'Naman Jain',
  ownerDesignation: 'Founder & Managing Director',
  ownerTagline: 'Curating Delhi-NCR’s finest certified automobiles with forensic mechanical standards and genuine client care.',
  ownerExperience: '10+ Years in Luxury Automotive Curation',
  ownerBio: [
    'With over a decade of deep immersion in India’s pre-owned luxury automotive space, Naman Jain established Wonder Cars in East Delhi with a single uncompromising principle: to eradicate the uncertainty and lack of transparency traditionally associated with pre-owned vehicle purchases.',
    'Under Naman’s leadership, every automobile that enters the Wonder Cars showroom undergoes a non-negotiable 210-point mechanical, electrical, and forensic chassis audit. Only vehicles with clean documentation, zero structural repairs, and verified authorized service records earn the Wonder Cars certified seal.',
    'Beyond numbers and transactions, Naman is renowned among Delhi-NCR car collectors and everyday buyers alike for his client-first ethos: transparent, zero-mark-up advisory, end-to-end RTO handling, and assured post-delivery warranty support.',
  ],
  ownerPhilosophy: '"A car is not just a mode of transport—it represents your hard work, your aspirations, and your family’s safety. When you purchase from Wonder Cars, you aren’t just buying an automobile; you are gaining a lifetime partner on the road."',
  ownerSignature: 'Naman Jain',
  ownerImage: '/assets/naman-jain-owner.jpg',
  galleryBadge: 'Our Flagship Showroom',
  galleryTitle: 'Experience Wonder Cars in Person',
  galleryDescription: 'Step into our climate-controlled East Delhi showroom gallery. Explore our hand-picked fleet under architectural lighting.',
  galleryItems: [
    {
      id: 'gallery-1',
      title: 'Flagship Showroom Floor',
      caption: 'Main display floor hosting certified performance coupes and luxury SUVs.',
      image: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
      category: 'Showroom',
    },
    {
      id: 'gallery-2',
      title: 'Worli & East Delhi Fleet Bay',
      caption: 'Client inspection bays with forensic lighting and paint-depth inspection tools.',
      image: '/src/assets/images/hero_luxury_coupe_1794898128860.jpg',
      category: 'Showroom',
    },
    {
      id: 'gallery-3',
      title: 'Delivery Lounge',
      caption: 'Private delivery suite celebrating new vehicle handovers with paperwork concierge.',
      image: '/src/assets/images/car_interior_cockpit_1794898131578.jpg',
      category: 'Showroom',
    },
  ],
  videosBadge: 'Watch Our Journey',
  videosTitle: 'Vehicle Walkthroughs & Showroom Stories',
  videosDescription: 'Catch detailed video walk-arounds, exhaust sound clips, and buyer inspection guides on our official YouTube channel.',
  videoItems: [
    {
      id: 'video-1',
      title: '2023 Audi RS e-tron GT Full Walkthrough & Inspection',
      description: 'Complete battery state-of-health test, launch control demonstration, and interior features overview.',
      youtubeId: 'dQw4w9WgXcQ',
      category: 'Walkthrough',
      autoPlayLive: false,
    },
  ],
};

export const SEED_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-1',
    customerName: 'Rohit Malhotra',
    carPurchased: '2022 BMW M340i xDrive',
    city: 'South Delhi',
    rating: 5,
    review: 'Naman ji and the Wonder Cars team made the entire purchase remarkably smooth. The car was detailed like brand new, every service record was authentic, and RC transfer happened in just 4 days.',
    customerImage: '/src/assets/images/car_interior_cockpit_1794898131578.jpg',
    published: true,
    date: 'October 2026',
  },
  {
    id: 'test-2',
    customerName: 'Dr. Priya Aggarwal',
    carPurchased: '2021 Mercedes-Benz E-Class E200',
    city: 'Noida, NCR',
    rating: 5,
    review: 'Wonder Cars is truly Delhi’s most trustworthy car destination. Transparent pricing, zero hidden dealer cuts, and their 6-month assured warranty gave me complete confidence.',
    customerImage: '/src/assets/images/car_mercedes_g63_1794898130781.jpg',
    published: true,
    date: 'September 2026',
  },
  {
    id: 'test-3',
    customerName: 'Kunal Sharma',
    carPurchased: '2023 Audi RS e-tron GT',
    city: 'East Delhi',
    rating: 5,
    review: 'Exceptional EV battery telemetry report and comprehensive 210-point audit provided upfront. If you are looking for genuine second-hand cars in top-notch condition, this is the place.',
    customerImage: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
    published: true,
    date: 'November 2026',
  },
];

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettings = {
  websiteName: 'Wonder Cars',
  tagline: 'Delhi-NCR’s Most Trusted Pre-Owned Car Destination',
  logoLight: '/assets/wonder-cars-logo.png',
  logoDark: '/assets/wonder-cars-logo-dark.png',
  faviconUrl: '/favicon.ico',
  primaryPhone: '+91 83840 68347',
  whatsappNumber: '918384068347',
  supportEmail: 'amanjain.nj784@gmail.com',
  showroomAddress: 'Preet Vihar, East Delhi, Delhi NCR, 110092',
  openingHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
  googleMapsUrl: 'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg',
  instagramUrl: 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D',
  facebookUrl: 'https://www.facebook.com/amanjain.nj784?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AMqRrq1Si%2F%3Fmibextid%3DwwXIfr#',
  youtubeUrl: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
  seoTitle: 'Wonder Cars — Certified Pre-Owned Luxury & Performance Automobiles in Delhi-NCR',
  seoDescription: 'Find certified pre-owned luxury cars with 210-point inspection, transparent pricing, and comprehensive warranty. Visit our East Delhi showroom today.',
  seoKeywords: 'used cars delhi, luxury pre-owned cars, wonder cars, certified second hand cars, buy car delhi ncr',
  googleAnalyticsId: 'G-WONDERCARS2026',
  whatsappFloatingEnabled: true,
  footerAboutText: 'Wonder Cars is Delhi-NCR’s premier automotive dealership specializing in inspected, verified luxury and performance pre-owned automobiles with transparent pricing and warranty support.',
  copyrightText: '© 2026 Wonder Cars. All rights reserved. Designed with automotive excellence.',
};

export const DEFAULT_SHOWROOM_LOCATION_SETTINGS: BusinessLocationSettings = {
  businessName: 'Wonder Cars Flagship Showroom',
  phone: '+91 83840 68347',
  email: 'amanjain.nj784@gmail.com',
  whatsapp: '918384068347',
  address: 'Preet Vihar',
  city: 'East Delhi',
  state: 'Delhi NCR',
  postalCode: '110092',
  latitude: '28.6396915',
  longitude: '77.2936307',
  googleMapsUrl: 'https://www.google.com/maps/place/Wonder+cars/@28.6396962,77.2910558,17z/data=!3m1!4b1!4m6!3m5!1s0x390cfbb6c71185b3:0x518ca5e40932dc6d!8m2!3d28.6396915!4d77.2936307!16s%2Fg%2F11z4164dfg',
  openingHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
  nearbyLandmarks: 'Near Preet Vihar Metro Station',
  instagramUrl: 'https://www.instagram.com/usedcarsnearby?fqnt=MWdxdjZndW4zNHkwNQ%3D%3D',
  facebookUrl: 'https://www.facebook.com/amanjain.nj784?mibextid=wwXIfr&rdid=PxDsB5WikY8FmiYB&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AMqRrq1Si%2F%3Fmibextid%3DwwXIfr#',
  youtubeUrl: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
  updatedAt: '',
};

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Customer Test Drive Enquiry',
    message: 'Rohit Verma submitted a test-drive request for Porsche 911 Carrera S.',
    type: 'enquiry',
    read: false,
    link: '/admin?tab=enquiries',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'New Sell Car Valuation Request',
    message: 'Aman Deep requested a doorstep valuation for 2022 BMW M4 Competition.',
    type: 'lead',
    read: false,
    link: '/admin?tab=sell-requests',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

export const SEED_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act-1',
    userEmail: 'admin@wondercars.in',
    action: 'System Initialized',
    details: 'Wonder Cars professional administration suite activated.',
    timestamp: new Date().toISOString(),
  },
];

export function normalizeLocationSettings(
  raw?: Partial<BusinessLocationSettings> | null
): BusinessLocationSettings {
  const input = raw || {};
  return {
    businessName: typeof input.businessName === 'string' ? input.businessName.trim() : '',
    phone: typeof input.phone === 'string' ? input.phone.trim() : '',
    email: typeof input.email === 'string' ? input.email.trim() : '',
    whatsapp: typeof input.whatsapp === 'string' ? input.whatsapp.trim() : '',
    address: typeof input.address === 'string' ? input.address.trim() : '',
    city: typeof input.city === 'string' ? input.city.trim() : '',
    state: typeof input.state === 'string' ? input.state.trim() : '',
    postalCode: typeof input.postalCode === 'string' ? input.postalCode.trim() : '',
    latitude: input.latitude !== undefined && input.latitude !== null ? String(input.latitude).trim() : '',
    longitude: input.longitude !== undefined && input.longitude !== null ? String(input.longitude).trim() : '',
    googleMapsUrl: typeof input.googleMapsUrl === 'string' ? input.googleMapsUrl.trim() : '',
    openingHours: typeof input.openingHours === 'string' ? input.openingHours.trim() : '',
    nearbyLandmarks: typeof input.nearbyLandmarks === 'string' ? input.nearbyLandmarks.trim() : '',
    instagramUrl: typeof input.instagramUrl === 'string' ? input.instagramUrl.trim() : '',
    facebookUrl: typeof input.facebookUrl === 'string' ? input.facebookUrl.trim() : '',
    youtubeUrl: typeof input.youtubeUrl === 'string' ? input.youtubeUrl.trim() : '',
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt.trim() : '',
  };
}

export function ensureInitialized(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initial: DatabaseState = {
      cars: [],
      enquiries: [],
      sellRequests: [],
      locationSettings: { ...DEFAULT_SHOWROOM_LOCATION_SETTINGS },
      adminUsers: SEED_ADMIN_USERS,
      categories: SEED_CATEGORIES,
      brands: SEED_BRANDS,
      homepageSettings: { ...DEFAULT_HOMEPAGE_SETTINGS },
      aboutSettings: { ...DEFAULT_ABOUT_SETTINGS },
      testimonials: SEED_TESTIMONIALS,
      websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
      notifications: SEED_NOTIFICATIONS,
      activityLogs: SEED_ACTIVITY_LOGS,
      visitorCount: 14280,
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseState>;
    const rawCars = Array.isArray(parsed.cars) ? parsed.cars : [];
    const cars = rawCars.map((c) => normalizeCarRecord(c));
    const rawLoc = parsed.locationSettings;
    const isUnconfigured =
      !rawLoc ||
      (!rawLoc.updatedAt && !rawLoc.address && !rawLoc.latitude && !rawLoc.phone && !rawLoc.email);
    const locationSettings = isUnconfigured
      ? { ...DEFAULT_SHOWROOM_LOCATION_SETTINGS }
      : {
          ...DEFAULT_SHOWROOM_LOCATION_SETTINGS,
          ...normalizeLocationSettings(rawLoc),
        };

    const state: DatabaseState = {
      cars,
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      sellRequests: Array.isArray(parsed.sellRequests) ? parsed.sellRequests : [],
      locationSettings,
      adminUsers: Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0 ? parsed.adminUsers : SEED_ADMIN_USERS,
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories : SEED_CATEGORIES,
      brands: Array.isArray(parsed.brands) && parsed.brands.length > 0 ? parsed.brands : SEED_BRANDS,
      homepageSettings: parsed.homepageSettings ? { ...DEFAULT_HOMEPAGE_SETTINGS, ...parsed.homepageSettings } : { ...DEFAULT_HOMEPAGE_SETTINGS },
      aboutSettings: parsed.aboutSettings ? { ...DEFAULT_ABOUT_SETTINGS, ...parsed.aboutSettings } : { ...DEFAULT_ABOUT_SETTINGS },
      testimonials: Array.isArray(parsed.testimonials) && parsed.testimonials.length > 0 ? parsed.testimonials : SEED_TESTIMONIALS,
      websiteSettings: parsed.websiteSettings ? { ...DEFAULT_WEBSITE_SETTINGS, ...parsed.websiteSettings } : { ...DEFAULT_WEBSITE_SETTINGS },
      notifications: Array.isArray(parsed.notifications) && parsed.notifications.length > 0 ? parsed.notifications : SEED_NOTIFICATIONS,
      activityLogs: Array.isArray(parsed.activityLogs) && parsed.activityLogs.length > 0 ? parsed.activityLogs : SEED_ACTIVITY_LOGS,
      visitorCount: typeof parsed.visitorCount === 'number' ? parsed.visitorCount : 14280,
    };
    return state;
  } catch (err) {
    console.error('Error parsing db.json, returning minimal fallback:', err);
    return {
      cars: [],
      enquiries: [],
      sellRequests: [],
      locationSettings: { ...DEFAULT_SHOWROOM_LOCATION_SETTINGS },
      adminUsers: SEED_ADMIN_USERS,
      categories: SEED_CATEGORIES,
      brands: SEED_BRANDS,
      homepageSettings: { ...DEFAULT_HOMEPAGE_SETTINGS },
      aboutSettings: { ...DEFAULT_ABOUT_SETTINGS },
      testimonials: SEED_TESTIMONIALS,
      websiteSettings: { ...DEFAULT_WEBSITE_SETTINGS },
      notifications: SEED_NOTIFICATIONS,
      activityLogs: SEED_ACTIVITY_LOGS,
      visitorCount: 14280,
    };
  }
}

export function readDb(): DatabaseState {
  return ensureInitialized();
}

export function writeDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function logActivity(userEmail: string, action: string, details: string): void {
  try {
    const db = readDb();
    const entry: ActivityLogItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    db.activityLogs.unshift(entry);
    if (db.activityLogs.length > 100) {
      db.activityLogs = db.activityLogs.slice(0, 100);
    }
    writeDb(db);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

