import fs from 'fs';
import path from 'path';
import { DATA_DIR, DB_PATH } from '../config/index.ts';
import { hashPassword } from './auth.service.ts';
import { normalizeCarRecord } from '../utils/carDefaults.ts';
import {
  bulkUpsertCarsInMongo,
  connectMongo,
  deleteCarInMongo,
  isMongoConnected,
  loadAppStateFromMongo,
  loadCarsFromMongo,
  saveAppStateToMongo,
  seedCarsToMongoIfEmpty,
  upsertCarInMongo,
} from './mongo.service.ts';
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
  carsSeeded?: boolean;
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
      mobileSrc: '/assets/hero_luxury_coupe_mobile.webp',
      alt: 'Luxury satin charcoal grand tourer inside Wonder Cars showroom',
    },
    {
      src: '/src/assets/images/car_porsche_911_1794898129646.jpg',
      mobileSrc: '/assets/car_porsche_911_mobile.jpg',
      alt: 'Porsche 911 Carrera S in architectural showroom lighting',
    },
    {
      src: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
      mobileSrc: '/assets/car_audi_rs_etron_mobile.jpg',
      alt: 'Audi RS e-tron GT inside Wonder Cars flagship gallery',
    },
  ],
  promotionalBannerText: '',
  promotionalBannerActive: false,
  featuredCarIds: ['car-911-carrera-s-2022', 'car-audi-rs-etron-gt-2023', 'car-bmw-m4-comp-2023'],
  ctaExploreText: 'Explore Cars',
  ctaExploreLink: '/cars',
  ctaCompareText: 'View Photos',
  whyChooseHeading: 'Why Discerning Collectors Choose Wonder Cars',
  whyChooseSubheading: 'Built on forensic technical diligence, upfront INR pricing, and lasting client relationships across Delhi-NCR.',
  searchLabel: 'Search Model or City',
  searchPlaceholder: 'e.g. 911, G63, Mumbai',
  brandLabel: 'Marque / Brand',
  brandDefaultText: 'All Brands',
  brandOptions: [
    'Porsche',
    'Range Rover',
    'Aston Martin',
    'Mercedes-Benz',
    'BMW',
    'Audi',
    'Bentley',
    'Jaguar',
    'Land Rover',
    'Rolls-Royce',
    'Ferrari',
    'Lamborghini',
  ],
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
  heroBgImage: '/assets/about-hero-bg.jpg',
  heroCarImage: '/src/assets/images/car_audi_rs_etron_1794898131413.jpg',
  heroCarTitle: 'Wonder Cars Delhi',
  heroCarSubtitle: 'East Delhi Showroom Gallery',
  heroCarRating: '★ 4.9 Rating',
  heroStats: [
    { number: '100%', label: 'Certified Pre-Owned' },
    { number: '210-Point', label: 'Forensic Quality Audit' },
    { number: '6-Month', label: 'Assured Warranty' },
    { number: '1000+', label: 'Delighted Car Owners' },
  ],
  ownerName: 'Naman Jain',
  ownerDesignation: 'Founder & Dealership Principal',
  ownerTagline: 'Passionate Automotive Specialist & Curator of Delhi-NCR’s Finest Pre-Owned Cars',
  ownerExperience: '10+ Years in Automotive Curation',
  ownerBio: [
    'Welcome to Wonder Cars. When I set out to establish this dealership, my goal was clear: transform the pre-owned automobile buying experience into one characterized by total transparency, genuine excitement, and lasting trust.',
    'Having been an automotive enthusiast and collector for over a decade, I understand the anxiety that often accompanies buying a second-hand car. That is why at Wonder Cars, every single car in our inventory is hand-picked, non-accidental, meter-verified, and subjected to a comprehensive 210-point mechanical and cosmetic audit before it ever touches our showroom floor.',
    'When you step into our Preet Vihar gallery, you are not just purchasing a vehicle—you are welcoming our dealership into your automotive journey. We look forward to handing you the keys to your dream car.',
  ],
  ownerPhilosophy: '“A reputation takes decades to build and seconds to compromise. That is why we treat every client like family and every car like our own.”',
  ownerSignature: 'Naman Jain',
  ownerImage: '/assets/wonder-cars-emblem-clean.png',

  // Why Choose Us
  whyChooseBadge: 'The Wonder Advantage',
  whyChooseTitle: 'Why Discerning Buyers Choose Wonder Cars',
  whyChooseDescription: 'From forensic mechanical diagnostics to seamless state-wide RC transfers, see what makes our buying experience second to none.',
  whyChooseItems: [
    {
      id: 'w1',
      title: 'Quality Checked Vehicles',
      highlight: '210-Point Forensic Audit',
      description: 'Digital paint depth measurement, OBD diagnostic scans, suspension health checks, and engine compression telemetry on every car.',
      badge: 'Inspected & Certified',
      iconName: 'CheckCircle2',
    },
    {
      id: 'w2',
      title: 'Transparent Pricing',
      highlight: 'Zero Hidden Charges',
      description: 'Direct INR price quotes with complete breakdown of taxes, registration transfer, and warranty package. What you see is what you pay.',
      badge: '100% Fixed INR Quotes',
      iconName: 'Scale',
    },
    {
      id: 'w3',
      title: 'Verified Documentation',
      highlight: 'Clear Title Guarantee',
      description: 'Full legal provenance review: NCRP clearance, single-owner history verification, insurance claim scrutiny, and seamless state RC transfer.',
      badge: 'NOC & RC Cleared',
      iconName: 'FileCheck',
    },
    {
      id: 'w4',
      title: 'Customer-Focused Service',
      highlight: 'Private Concierge Care',
      description: 'Private showroom viewings, doorstep test drives across Delhi-NCR, custom financing options, and tailored vehicle handover ceremonies.',
      badge: 'Doorstep Test Drive',
      iconName: 'UserCheck',
    },
    {
      id: 'w5',
      title: 'Wide Range of Pre-Owned Cars',
      highlight: 'Curated Fleet Portfolio',
      description: 'From sporty sedans and executive grand tourers to high-performance SUVs and luxury electric vehicles, our fleet caters to all driving desires.',
      badge: 'Multibrand Excellence',
      iconName: 'Car',
    },
    {
      id: 'w6',
      title: 'Trusted Buying Experience',
      highlight: '6-Month Assured Warranty',
      description: 'Every vehicle is protected by our comprehensive 6-month engine and transmission coverage, offering total peace of mind on the road.',
      badge: '6-Month Assured Warranty',
      iconName: 'ShieldAlert',
    },
  ],

  // Certificates
  certificatesBadge: 'Verified & Certified',
  certificatesTitle: 'Dealership Certifications & Credentials',
  certificatesDescription: 'Wonder Cars operates under strict automotive industry compliance, certified inspection standards, and authorized business registration.',
  certificatesItems: [
    {
      id: 'c1',
      title: 'Droom Certificate of Excellence · Winner 2024–25',
      authority: 'Droom Technology · Sandeep Aggarwal (Founder & CEO)',
      date: 'Winner 2024–25 · Rated 4.3 ★',
      description: 'Awarded to WONDER CARS for outstanding pre-owned automobile sales excellence, verified pricing transparency, and superior customer rating of 4.3 based on Droom proprietary methodology.',
      badge: 'Droom Excellence Winner',
      image: '/assets/certificates/droom-excellence-certificate.jpg',
    },
    {
      id: 'c2',
      title: 'CarDekho Certificate of Association',
      authority: 'CarDekho Certified Automotive Dealer Network',
      date: 'Authorized Partner Dealer',
      description: 'Official Certificate of Association recognizing WONDER CARS as an accredited CarDekho Partner Dealer meeting rigorous customer trust and multi-point vehicle standards.',
      badge: 'CarDekho Partner Dealer',
      image: '/assets/certificates/cardekho-partner-certificate.jpg',
    },
    {
      id: 'c3',
      title: 'OLX Autos Certificate of Recognition',
      authority: 'OLX Auto India · Amit Kumar (Head - OLX Auto India)',
      date: 'Valuable Dealer Partner',
      description: 'Awarded to WONDER CARS for being a Valuable Dealer Partner at OLX Autos, recognizing leadership and excellence in the certified used car marketplace.',
      badge: 'OLX Autos Partner',
      image: '/assets/certificates/olx-autos-recognition-certificate.jpg',
    },
  ],

  // Gallery
  galleryBadge: 'Our Atmosphere',
  galleryTitle: 'Showroom, Fleet & Delivery Moments',
  galleryDescription: 'Take a visual tour inside our East Delhi gallery, inspect our pristine pre-owned fleet, and witness unforgettable vehicle delivery celebrations.',
  galleryItems: [
    {
      id: 'g1',
      title: 'Showroom Showcase & Vehicle Display',
      category: 'Showroom',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.12.29%20AM.jpeg',
      caption: 'Premium vehicle showcase and architectural display at our East Delhi showroom.',
    },
    {
      id: 'g2',
      title: 'Certified Pre-Owned Fleet Lineup',
      category: 'Premium Fleet',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.12.46%20AM.jpeg',
      caption: 'Curated selection of verified second-hand luxury vehicles ready for inspection.',
    },
    {
      id: 'g3',
      title: 'Showroom Floor & Presentation Zone',
      category: 'Showroom',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.13.08%20AM.jpeg',
      caption: 'Pristine detailing and lighting inside our climate-controlled showroom.',
    },
    {
      id: 'g4',
      title: 'Customer Vehicle Delivery Moment',
      category: 'Deliveries',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.13.27%20AM.jpeg',
      caption: 'Key handover celebration with verified documents and celebratory ceremony.',
    },
    {
      id: 'g5',
      title: 'Luxury Fleet Inspection & Detailing',
      category: 'Premium Fleet',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.14.13%20AM.jpeg',
      caption: 'Forensic evaluation and multi-point quality check of incoming vehicles.',
    },
    {
      id: 'g6',
      title: 'Dealership Atmosphere & Customer Lounge',
      category: 'Showroom',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.16.23%20AM.jpeg',
      caption: 'Transparent consultation space and customer relationship lounge.',
    },
    {
      id: 'g7',
      title: 'Happy Family Vehicle Delivery',
      category: 'Deliveries',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.17.09%20AM.jpeg',
      caption: 'Milestone delivery ceremony celebrating another happy car owner.',
    },
    {
      id: 'g8',
      title: 'Second-Hand Luxury Car Collection',
      category: 'Premium Fleet',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-18%20at%2010.21.08%20AM.jpeg',
      caption: 'Handpicked certified luxury cars prepared for their next long journey.',
    },
    {
      id: 'g9',
      title: 'Delighted Customer Car Delivery & Celebration',
      category: 'Deliveries',
      image: '/assets/Showroom,%20Fleet%20&%20Delivery%20Moments/WhatsApp%20Image%202026-11-19%20at%202.44.20%20PM.jpeg',
      caption: 'Celebrating another proud car owner taking delivery from Wonder Cars.',
    },
  ],

  // Videos
  videosBadge: 'Watch Our Journey',
  videosTitle: 'Experience Wonder Cars in Motion',
  videosDescription: 'Watch our comprehensive showroom tours, detailed car inspections, client vehicle deliveries, and automotive highlights.',
  videoItems: [
    {
      id: 'v1',
      title: 'Mahindra Scorpio 2021 😱😱 — Price, Specs & Walkaround',
      description: 'Detailed walkthrough, condition inspection, price breakdown and features of Mahindra Scorpio 2021 by Used Cars Nearby.',
      youtubeId: 'lBqEQDq77ow',
      duration: 'Walkaround',
      category: 'Featured Walkaround',
      thumbnailUrl: 'https://img.youtube.com/vi/lBqEQDq77ow/hqdefault.jpg',
      autoPlayLive: true,
    },
    {
      id: 'v2',
      title: 'Mahindra Thar 2020 😱 || Thar Modified — Best Used Cars in Delhi',
      description: 'Modified Mahindra Thar walkaround, condition review, pricing and off-road highlights by Used Cars Nearby.',
      youtubeId: 'jRXJxQMl4TM',
      duration: 'In-Depth Review',
      category: 'SUV Spotlight',
      thumbnailUrl: 'https://img.youtube.com/vi/jRXJxQMl4TM/hqdefault.jpg',
      autoPlayLive: true,
    },
    {
      id: 'v3',
      title: 'Best Luxury SUV Under Budget? | BMW X1 Detailed Review & Price',
      description: 'Complete condition walkthrough, luxury features, inspection telemetry, and price breakdown by Used Cars Nearby.',
      youtubeId: 'lgfRr3RF2IY',
      duration: 'Buyer Guide',
      category: 'Buyer Guide',
      thumbnailUrl: 'https://img.youtube.com/vi/lgfRr3RF2IY/hqdefault.jpg',
      autoPlayLive: true,
    },
  ],

  // Social Channels
  instagramUrl: 'https://www.instagram.com/usedcarsnearby/',
  instagramHandle: '@usedcarsnearby',
  instagramBio: 'Delhi-NCR’s Certified Pre-Owned Luxury Cars. 210-Point Forensic Audits, Transparent Pricing & 6-Month Assured Warranty.',
  facebookUrl: 'https://www.facebook.com/usedcarsnearby/',
  facebookPageName: 'Used Cars Nearby',
  facebookBio: 'Official Facebook community for Wonder Cars & Used Cars Nearby. Verified inventory updates and client celebrations.',
  youtubeUrl: 'https://youtube.com/@usedcarsnearby?si=rLhUh-H6HIdMfBQ5',
  youtubeChannelName: 'Used Cars Nearby',
  youtubeBio: 'Comprehensive car walkarounds, mechanical condition reports, delivery celebrations, and automotive advice.',

  // Showroom Info
  showroomName: 'Wonder Cars Flagship Showroom',
  showroomAddress: 'Shop No.-3, Rajkamal Sadan, Preet Vihar, Commercial Complex, Delhi-92.',
  showroomLandmark: 'Near Preet Vihar Metro Station',
  showroomCity: 'Delhi',
  showroomState: 'Delhi',
  showroomPincode: '110092',
  showroomPhone: '+91 83840 68347',
  showroomEmail: 'amanjain.nj784@gmail.com',
  showroomWhatsapp: '918384068347',
  showroomOpeningHours: 'Monday – Sunday: 10:00 AM – 8:00 PM',
  googleMapsDirectionsUrl: 'https://maps.google.com/?q=Wonder+Cars+Preet+Vihar+Delhi',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14006.182417772396!2d77.291771!3d28.643387!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb5c00000001%3A0x89abcdef12345678!2sPreet%20Vihar%2C%20Delhi!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
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
  faviconUrl: '/favicon.png',
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

let memoryState: DatabaseState | null = null;

function writeLocalDbFile(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

export function readDb(): DatabaseState {
  if (memoryState) {
    return memoryState;
  }
  memoryState = ensureInitialized();
  return memoryState;
}

export function writeDb(state: DatabaseState): void {
  memoryState = state;
  writeLocalDbFile(state);
  if (isMongoConnected()) {
    const { cars: _cars, ...stateWithoutCars } = state;
    saveAppStateToMongo(stateWithoutCars as unknown as Record<string, unknown>).catch((err) => {
      console.error('Background MongoDB app_state sync error:', err);
    });
  }
}

export async function initPersistence(): Promise<void> {
  const localState = ensureInitialized();
  memoryState = localState;

  const db = await connectMongo();
  if (!db) return;

  try {
    // Load or seed app_state
    const remoteState = await loadAppStateFromMongo();
    if (remoteState) {
      memoryState = {
        ...localState,
        ...(remoteState as Partial<DatabaseState>),
        cars: localState.cars,
      };
    } else {
      const { cars: _cars, ...stateWithoutCars } = localState;
      await saveAppStateToMongo(stateWithoutCars as unknown as Record<string, unknown>);
    }

    // Load or seed cars collection (seed only once so deleted cars stay deleted)
    const remoteCars = await loadCarsFromMongo();
    const alreadySeeded = Boolean((remoteState as Partial<DatabaseState> | null)?.carsSeeded);
    if (remoteCars && (remoteCars.length > 0 || alreadySeeded)) {
      memoryState.cars = remoteCars.map((c) => normalizeCarRecord(c));
      if (!alreadySeeded) {
        memoryState.carsSeeded = true;
        const { cars: _cars, ...stateWithoutCars } = memoryState;
        await saveAppStateToMongo(stateWithoutCars as unknown as Record<string, unknown>);
      }
    } else if (localState.cars.length > 0 && !alreadySeeded) {
      await seedCarsToMongoIfEmpty(localState.cars);
      memoryState.carsSeeded = true;
      const { cars: _cars, ...stateWithoutCars } = memoryState;
      await saveAppStateToMongo(stateWithoutCars as unknown as Record<string, unknown>);
    }

    writeLocalDbFile(memoryState);
  } catch (err) {
    console.error('Failed to hydrate state from MongoDB:', err);
  }
}

export async function persistCarCreate(car: Car, state: DatabaseState): Promise<void> {
  if (isMongoConnected()) {
    await upsertCarInMongo(car);
  }
  writeDb(state);
}

export async function persistCarUpdate(car: Car, state: DatabaseState): Promise<void> {
  if (isMongoConnected()) {
    await upsertCarInMongo(car);
  }
  writeDb(state);
}

export async function persistCarDelete(carId: string, state: DatabaseState): Promise<void> {
  if (isMongoConnected()) {
    await deleteCarInMongo(carId);
  }
  writeDb(state);
}

export async function persistCarsBatch(cars: Car[], state: DatabaseState): Promise<void> {
  if (isMongoConnected() && cars.length > 0) {
    await bulkUpsertCarsInMongo(cars);
  }
  writeDb(state);
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

